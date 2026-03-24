-- Migração: Adicionar coluna remetente à tabela ia_suporte_mensagens
-- Necessário para distinguir mensagens do usuário das respostas do bot (IA)

ALTER TABLE public.ia_suporte_mensagens
ADD COLUMN remetente TEXT NOT NULL DEFAULT 'user';
