import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
  }

  // Look up real DB user by email to avoid JWT session ID mismatches
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email! },
    include: { profile: true },
  })

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found in database' }, { status: 404 })
  }

  const profile = dbUser.profile

  console.log('[ai-advisor] session.user.id:', session.user.id)
  console.log('[ai-advisor] dbUser.id:', dbUser.id)
  console.log('[ai-advisor] profile found:', !!profile)
  console.log('[ai-advisor] monthlyIncome:', profile?.monthlyIncome)

  if (!profile || !profile.monthlyIncome) {
    return NextResponse.json({ error: 'Please complete your financial profile first' }, { status: 400 })
  }

  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  const transactions = await prisma.transaction.findMany({
    where: { userId: dbUser.id, type: 'expense', date: { gte: threeMonthsAgo } },
    orderBy: { date: 'desc' },
  })

  const categoryTotals: Record<string, number> = {}
  transactions.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
  })

  const avgMonthlySpending: Record<string, number> = {}
  Object.entries(categoryTotals).forEach(([cat, total]) => {
    avgMonthlySpending[cat] = Math.round(total / 3)
  })

  const fixedExpenses = profile.fixedExpenses as Array<{ label: string; category: string; amount: number }>
  const fixedTotal = fixedExpenses.reduce((s, e) => s + e.amount, 0)
  const disposable = profile.monthlyIncome - fixedTotal
  const savingsTarget = Math.round(profile.monthlyIncome * (profile.savingsGoalPct / 100))
  const budgetableAmount = Math.max(0, disposable - savingsTarget)

  console.log('[ai-advisor] fixedTotal:', fixedTotal, 'budgetableAmount:', budgetableAmount)

  const prompt = `You are a personal finance advisor. A user wants help allocating their monthly budget.

FINANCIAL PROFILE:
- Monthly income: $${profile.monthlyIncome}
- Fixed commitments: ${fixedExpenses.map(e => `${e.label} ($${e.amount})`).join(', ') || 'None specified'}
- Total fixed: $${fixedTotal}
- Savings goal: ${profile.savingsGoalPct}% = $${savingsTarget}/month
- Remaining to budget across variable expenses: $${budgetableAmount}
- Spending priorities (in order): ${(profile.priorities as string[]).join(', ') || 'Not specified'}
- Lifestyle context: ${profile.lifestyleNote || 'Not provided'}

PAST 3-MONTH AVERAGE SPENDING (monthly):
${Object.entries(avgMonthlySpending).length > 0
  ? Object.entries(avgMonthlySpending).map(([cat, amt]) => `- ${cat}: $${amt}`).join('\n')
  : '- No transaction history yet'}

TASK:
Allocate the $${budgetableAmount} budgetable amount across spending categories.
- Only include variable expense categories (not income categories like Salary, Freelance, Investment)
- Respect their priorities — allocate more to higher-priority categories
- Use their past spending patterns as a guide, but optimize toward healthier finances
- The allocations MUST sum to exactly $${budgetableAmount}
- Include a brief 1-sentence insight for each category explaining the reasoning
- Also write a 2-sentence overall summary of the budget strategy

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "summary": "2-sentence overall strategy summary",
  "allocations": [
    { "category": "Food & Dining", "amount": 200, "insight": "Brief reasoning" },
    ...
  ]
}`

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.4,
    })

    const raw = completion.choices[0]?.message?.content || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({
      ...result,
      meta: {
        monthlyIncome: profile.monthlyIncome,
        fixedTotal,
        savingsTarget,
        budgetableAmount,
        savingsGoalPct: profile.savingsGoalPct,
      },
    })
  } catch (error) {
    console.error('AI advisor error:', error)
    return NextResponse.json({ error: 'Failed to generate budget suggestions' }, { status: 500 })
  }
}
