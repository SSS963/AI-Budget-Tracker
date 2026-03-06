import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { CATEGORIES } from '@/types'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { description, amount } = await req.json()

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ category: 'Other' })
  }

  try {
    const OpenAI = (await import('openai')).default
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a financial transaction categorizer. Given a transaction description and amount, respond with ONLY the category name from this list: ${CATEGORIES.join(', ')}. No explanation, just the category.`,
        },
        {
          role: 'user',
          content: `Description: "${description}", Amount: $${amount}`,
        },
      ],
      max_tokens: 20,
      temperature: 0,
    })

    const suggested = completion.choices[0]?.message?.content?.trim()
    const category = CATEGORIES.find(c => c === suggested) || 'Other'
    return NextResponse.json({ category })
  } catch (error) {
    console.error('AI categorization failed:', error)
    return NextResponse.json({ category: 'Other' })
  }
}
