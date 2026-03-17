'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { ChatWindow } from '@/components/ChatWindow';
import { Conversation, Message, fetchConversations, fetchMessages } from '@/lib/api';
import { supabase } from '@/lib/supabase';

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        if (activeConversation && newMessage.conversation_id === activeConversation.id) {
          setMessages((prev) => [...prev, newMessage]);
        }
      })
      .subscribe();

    const convSubscription = supabase
      .channel('public:conversations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
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
    </div>
  );
}
