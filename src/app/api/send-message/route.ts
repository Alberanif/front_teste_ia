import { NextResponse } from 'next/server';

// This route receives the message from the frontend and sends it to n8n.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const webhookUrl = process.env.CHAT_WEBHOOK;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
    }

    // Forward to n8n webhook
    // We do NOT save to the database here anymore, the n8n backend will handle EVERYTHING.
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to send to n8n webhook');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
