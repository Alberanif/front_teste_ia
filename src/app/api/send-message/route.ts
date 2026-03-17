import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route receives the message from the frontend and sends it to n8n.
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mensagem, 'numero da conversa criada': numero_conversa, 'nome do usuario': nome_usuario } = body;

    const webhookUrl = process.env.CHAT_WEBHOOK;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
    }

    // First save the user message to Supabase
    // We need to find the conversation id first
    let conversationId = null;
    const { data: convData } = await supabase
      .from('conversations')
      .select('id')
      .eq('numero_conversa', numero_conversa)
      .single();
      
    if (convData) {
      conversationId = convData.id;
    } else {
      // Create conversation if it doesn't exist
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ numero_conversa, nome_usuario })
        .select()
        .single();
      if (newConv) conversationId = newConv.id;
    }

    if (conversationId) {
      await supabase.from('messages').insert({
        conversation_id: conversationId,
        mensagem,
        sender: 'user',
      });
    }

    // Forward to n8n webhook
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
