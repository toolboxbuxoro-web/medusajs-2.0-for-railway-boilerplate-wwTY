import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, phone, topic, message } = body

    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID

    if (!botToken || !chatId) {
      console.error("Telegram bot token or chat ID is missing")
      return NextResponse.json(
        { error: "Support system configuration error" },
        { status: 500 }
      )
    }

    const topicLabels: Record<string, string> = {
      order_status: "Статус заказа",
      return_warranty: "Возврат / гарантия",
      product_query: "Вопрос по товару",
      other: "Другое",
    }

    const text = `🆘 *Support Request*
*Name*: ${name}
*Phone*: ${phone}
*Topic*: ${topicLabels[topic] || topic}
*Message*: ${message}

_Source: Customer Service Page_`

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
    console.error("Support form error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
