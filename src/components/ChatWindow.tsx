import React, { useState, useEffect, useRef } from 'react';
import { Message, Conversation, sendMessageWebhook } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Send } from 'lucide-react';

interface ChatWindowProps {
  conversation: Conversation;
  messages: Message[];
  onMessageSent: (newMessage: Message) => void;
}

export function ChatWindow({ conversation, messages, onMessageSent }: ChatWindowProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    const success = await sendMessageWebhook(
      inputText.trim(),
      conversation.numero_conversa,
      conversation.nome_usuario
    );

    if (success) {
      // Optimistically add message
      const optimisicMessage: Message = {
        id: Date.now(),
        conversation_id: conversation.id,
        mensagem: inputText.trim(),
        sender: 'user',
        created_at: new Date().toISOString(),
      };
      onMessageSent(optimisicMessage);
      setInputText('');
    } else {
      alert('Falha ao enviar mensagem. Tente novamente.');
    }
    setIsSending(false);
  };

  return (
    <div className="w-2/3 bg-gray-50 flex flex-col h-full bg-[#efeae2]">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-300 flex items-center shadow-sm z-10">
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-3">
          {conversation.nome_usuario.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">{conversation.nome_usuario}</h2>
          <p className="text-xs text-gray-500">#{conversation.numero_conversa}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-3">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] rounded-xl p-3 shadow-sm ${
                  isUser ? 'bg-green-100 text-gray-800 rounded-tr-none' : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm">{msg.mensagem}</p>
                <span className="text-[10px] text-gray-500 block text-right mt-1">
                  {format(new Date(msg.created_at), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-gray-100 p-4 border-t border-gray-300">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-gray-900 focus:outline-none focus:border-green-500 shadow-sm"
            placeholder="Digite uma mensagem..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="bg-green-500 text-white rounded-full p-2 h-10 w-10 flex items-center justify-center hover:bg-green-600 disabled:opacity-50 transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
