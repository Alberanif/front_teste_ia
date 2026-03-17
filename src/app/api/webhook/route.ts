import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// This endpoint receives messages FROM n8n to show in our frontend
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Assuming n8n sends these fields:
    const { mensagem, numero_conversa, nome_usuario } = body;

    if (!mensagem || !numero_conversa) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let conversationId = null;
    
    // Find or create conversation
    const { data: convData } = await supabase
      .from('conversations')
      .select('id')
      .eq('numero_conversa', numero_conversa)
      .single();
      
    if (convData) {
      conversationId = convData.id;
      // Update updated_at timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({ 
          numero_conversa, 
          nome_usuario: nome_usuario || 'Desconhecido' 
        })
        .select()
        .single();
      if (newConv) conversationId = newConv.id;
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Could not resolve conversation' }, { status: 500 });
    }

    // Save bot message
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      mensagem,
      sender: 'bot',
    });

    if (msgError) throw msgError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error processing n8n webhook:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
