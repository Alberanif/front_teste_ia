import { supabase } from './supabase';

export interface Conversation {
  id: number;
  numero_conversa: string;
  nome_usuario: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  mensagem: string;
  sender: 'user' | 'bot';
  created_at: string;
}

export async function fetchConversations() {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }
  return data as Conversation[];
}

export async function fetchMessages(conversationId: number) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
  return data as Message[];
}

export async function sendMessageWebhook(mensagem: string, numero_conversa: string, nome_usuario: string) {
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
    return response.ok;
  } catch (error) {
    console.error('Error sending message:', error);
    return false;
  }
}
