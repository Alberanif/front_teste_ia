import React from 'react';
import { Conversation } from '@/lib/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
}

export function Sidebar({ conversations, activeConversation, onSelectConversation }: SidebarProps) {
  return (
    <div className="w-1/3 bg-white border-r border-gray-300 flex flex-col h-full">
      {/* Header */}
      <div className="bg-gray-100 p-4 border-b border-gray-300 flex justify-between items-center shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">Conversas</h2>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-gray-500">Nenhuma conversa encontrada.</div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 flex flex-col transition-colors ${
                activeConversation?.id === conv.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-gray-900 truncate">
                  {conv.nome_usuario}
                </span>
                {conv.updated_at && (
                  <span className="text-xs text-gray-500">
                    {format(new Date(conv.updated_at), 'HH:mm', { locale: ptBR })}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-600 truncate">
                Conversa #{conv.numero_conversa}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
