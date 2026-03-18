-- Migração: Modificar estrutura de `ia_suporte_atendimentos` e `ia_suporte_usuarios`
-- Remover coluna uuid anterior e adicionar nova coluna id do tipo UUID auto-gerado


-- 1. Modificar a tabela de Usuarios
-- Primeiro, vamos adicionar a nova coluna "id"
ALTER TABLE public.ia_suporte_usuarios
ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Opcional: Para manter os dados consistentes se a coluna id for obrigatoriamente NOT NULL
-- (gen_random_uuid() preenche automaticamente as linhas existentes com novos UUIDs)
ALTER TABLE public.ia_suporte_usuarios
ALTER COLUMN id SET NOT NULL;

-- Remover a coluna antiga "uuid" que era do tipo TEXT
ALTER TABLE public.ia_suporte_usuarios
DROP COLUMN uuid;


-- 2. Modificar a tabela de Atendimentos
-- Adicionar a nova coluna "id"
ALTER TABLE public.ia_suporte_atendimentos
ADD COLUMN id UUID DEFAULT gen_random_uuid();

-- Definir como NOT NULL
ALTER TABLE public.ia_suporte_atendimentos
ALTER COLUMN id SET NOT NULL;

-- Remover a coluna antiga "uuid" que era do tipo TEXT
ALTER TABLE public.ia_suporte_atendimentos
DROP COLUMN uuid;
