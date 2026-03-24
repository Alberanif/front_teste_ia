import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This route receives the message from the frontend and sends it to n8n.
// n8n responds synchronously with [{ "output": "..." }], which we save as a bot message
// and return directly to the frontend for immediate display.
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const webhookUrl = process.env.CHAT_WEBHOOK;
    if (!webhookUrl) {
      return NextResponse.json({ error: 'Webhook URL not configured' }, { status: 500 });
    }

    const numeroConversa = body['numero da conversa criada'];

    // Forward to n8n webhook and wait for the response
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error('Failed to send to n8n webhook');
    }

    // Try to parse n8n response: [{ "output": "..." }]
    // Wrapped in try/catch so parse errors never block the success response
    let botMessage: { id: number; mensagem: string; created_at: string } | null = null;
    try {
      const n8nResponse = await response.json();

      if (Array.isArray(n8nResponse) && n8nResponse.length > 0 && n8nResponse[0].output) {
        const botText: string = n8nResponse[0].output;

        // Find the most recent conversation for this phone number
        const { data: convData } = await supabase
          .from('ia_suporte_atendimentos')
          .select('id_atendimento')
          .eq('telefone_usuario', numeroConversa)
          .order('criada_em', { ascending: false })
          .limit(1)
          .single();

        if (convData) {
          const { data: savedMsg } = await supabase
            .from('ia_suporte_mensagens')
            .insert({
              id_atendimento: convData.id_atendimento,
              texto_da_mensagem: botText,
              remetente: 'bot',
            })
            .select()
            .single();

          if (savedMsg) {
            botMessage = {
              id: savedMsg.id,
              mensagem: botText,
              created_at: savedMsg.criada_em,
            };
          }
        }
      }
    } catch (parseError) {
      console.error('Error processing n8n response:', parseError);
      // Continue — message was sent successfully even if we can't parse the response
    }

    return NextResponse.json({ success: true, botMessage });
  } catch (error: any) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
