'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { Conversation, Message, fetchConversations, fetchMessages, createConversation } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Conversation Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newConvName, setNewConvName] = useState('');
  const [newConvNumber, setNewConvNumber] = useState('');
  const [isCreatingConv, setIsCreatingConv] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    async function load() {
      const data = await fetchConversations();
      setConversations(data);
      if (data.length > 0) {
        setActiveConversation(data[0]);
      }
      setIsLoading(false);
    }
    load();
  }, []);

  // Subscribe to new conversations and messages
  useEffect(() => {
    const chatSubscription = supabase
      .channel('public:ia_suporte_mensagens')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ia_suporte_mensagens' }, (payload) => {
        const rawMsg = payload.new as any;
        const newMessage: Message = {
          id: rawMsg.id,
          conversation_id: rawMsg.id_atendimento,
          mensagem: rawMsg.texto_da_mensagem,
          sender: 'user',
          created_at: rawMsg.criada_em
        };
        if (activeConversation && newMessage.conversation_id === activeConversation.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    const convSubscription = supabase
      .channel('public:ia_suporte_atendimentos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ia_suporte_atendimentos' }, () => {
        fetchConversations().then(setConversations);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatSubscription);
      supabase.removeChannel(convSubscription);
    };
  }, [activeConversation]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id).then(setMessages);
    }
  }, [activeConversation]);

  const handleSendMessage = (newMessage: Message) => {
    // Only local optimistic update.
    // The actual write to the DB depends on the API or Webhook response,
    // but we can trust the optimistic update for now.
    setMessages((prev) => [...prev, newMessage]);
  };

  const handleCreateConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newConvName.trim() || !newConvNumber.trim()) return;

    setIsCreatingConv(true);
    const newConv = await createConversation(newConvNumber.trim(), newConvName.trim());
    setIsCreatingConv(false);

    if (newConv) {
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);
      setIsModalOpen(false);
      setNewConvName('');
      setNewConvNumber('');
    } else {
      alert('Erro ao criar conversa.');
    }
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center bg-gray-100">Carregando...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="flex w-full max-w-6xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={setActiveConversation}
          onNewConversation={() => setIsModalOpen(true)}
        />
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            onMessageSent={handleSendMessage}
          />
        ) : (
          <div className="w-2/3 flex items-center justify-center bg-[#efeae2]">
            <p className="text-gray-500 text-lg">Selecione uma conversa para começar</p>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Nova Conversa</h3>
            <form onSubmit={handleCreateConversation}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Usuário</label>
                <input
                  type="text"
                  required
                  value={newConvName}
                  onChange={(e) => setNewConvName(e.target.value)}
                  className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="Ex: João Silva"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conversa</label>
                <input
                  type="text"
                  required
                  value={newConvNumber}
                  onChange={(e) => setNewConvNumber(e.target.value)}
                  className="w-full border border-gray-300 text-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500"
                  placeholder="Ex: 5511999999999"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingConv || !newConvName.trim() || !newConvNumber.trim()}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {isCreatingConv ? 'Criando...' : 'Criar Conversa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
