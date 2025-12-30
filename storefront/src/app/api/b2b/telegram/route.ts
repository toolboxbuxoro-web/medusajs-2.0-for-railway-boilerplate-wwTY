import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, contactName, phone, email, comment } = body

    // Validate required fields
    if (!companyName || !contactName || !phone || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const botToken = process.env.TELEGRAM_B2B_BOT_TOKEN
    const chatId = process.env.TELEGRAM_B2B_CHAT_ID

    if (!botToken || !chatId) {
      console.error("Telegram B2B bot token or B2B chat ID is missing")
      return NextResponse.json(
        { error: "B2B system configuration error" },
        { status: 500 }
      )
    }

    const text = `🏢 *B2B Заявка / B2B Application*

*Компания / Company*: ${companyName}
*Контактное лицо / Contact Person*: ${contactName}
*Телефон / Phone*: ${phone}
*Email*: ${email}
${comment ? `*Комментарий / Comment*: ${comment}` : ''}

_Source: B2B Page_`

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: "Markdown",
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Telegram API error:", errorData)
      return NextResponse.json(
        { error: "Failed to send message to Telegram" },
        { status: 502 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("B2B form error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

