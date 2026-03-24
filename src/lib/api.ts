import { supabase } from './supabase';

export interface Conversation {
  id: string;
  numero_conversa: string;
  nome_usuario: string;
  updated_at?: string;
  created_at?: string;
}

export interface Message {
  id: number;
  conversation_id: string;
  mensagem: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export async function fetchConversations() {
  const { data, error } = await supabase
    .from('ia_suporte_atendimentos')
    .select(`
      id_atendimento,
      telefone_usuario,
      criada_em,
      ia_suporte_usuarios ( nome )
    `)
    .order('criada_em', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  return data.map((d: any) => ({
    id: d.id_atendimento,
    numero_conversa: d.telefone_usuario,
    nome_usuario: d.ia_suporte_usuarios?.nome || d.telefone_usuario,
    updated_at: d.criada_em,
    created_at: d.criada_em
  })) as Conversation[];
}

export async function createConversation(numero_conversa: string, nome_usuario: string) {
  // We no longer save to the database here.
  // The frontend will just create a local representation of the conversation.
  // When a message is sent via webhook, n8n will handle the actual DB insertion.
  const tempId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  return {
    id: tempId,
    numero_conversa: numero_conversa,
    nome_usuario: nome_usuario,
    updated_at: now,
    created_at: now
  } as Conversation;
}

export async function fetchMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('ia_suporte_mensagens')
    .select('*')
    .eq('id_atendimento', conversationId)
    .order('criada_em', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data.map((d: any) => ({
    id: d.id,
    conversation_id: d.id_atendimento,
    mensagem: d.texto_da_mensagem,
    sender: d.remetente === 'bot' ? 'bot' : 'user',
    created_at: d.criada_em
  })) as Message[];
}

export interface BotMessage {
  id: number;
  mensagem: string;
  created_at: string;
}

export async function sendMessageWebhook(mensagem: string, numero_conversa: string, nome_usuario: string): Promise<{ success: boolean; botMessage?: BotMessage }> {
  try {
    const response = await fetch('/api/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mensagem,
        "numero da conversa criada": numero_conversa,
        "nome do usuario": nome_usuario,
      }),
    });

    if (!response.ok) return { success: false };

    const data = await response.json();
    return { success: true, botMessage: data.botMessage ?? undefined };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false };
  }
}
