import { NextRequest, NextResponse } from 'next/server'
import { sendLeadEmail, sendAutoReply } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, phone, email, service_interest, message } = body

    if (!name?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: 'Name and phone are required.' }, { status: 400 })
    }

    // Send email to admin + auto-reply to customer (both non-blocking)
    await Promise.allSettled([
      sendLeadEmail({ name, phone, email, service_interest, message }),
      email ? sendAutoReply({ name, phone, email, service_interest, message }) : Promise.resolve(),
    ])

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/contact]', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
