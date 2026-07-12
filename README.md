# Agente de Pré-atendimento para Advogados 🤖⚖️

IA de **pré-atendimento (triagem)** por WhatsApp, pensada para a sua agência
entregar como serviço aos advogados. É **multi-tenant** (um único sistema atende
vários advogados) e **plug and play**: o advogado só escaneia um QR Code e a IA
já começa a atender por ele.

Um **único agente atende qualquer área do Direito** (previdenciário, trabalhista,
criminal, família, consumidor, etc.) — você **não** cria um bot por tese. A área é
detectada na conversa e as perguntas de triagem certas são injetadas
automaticamente. Para cobrir uma nova área, basta adicionar um item em
`src/agent/intakeTemplates.ts`.

---

## Como funciona (visão geral)

```
Lead no WhatsApp
      │
      ▼
Evolution API  ──(webhook)──►  ESTE SERVIÇO (Node/Fastify)
                                     │
                     ┌───────────────┼────────────────┐
                     ▼               ▼                ▼
                 Supabase        Claude (IA)     Evolution API
              (histórico +   (triagem + extração   (envia a
               ficha do lead)   estruturada)       resposta)
                                     │
                                     ▼
                        Lead qualificado? → avisa o advogado no WhatsApp dele
```

- **Evolution API**: gateway de WhatsApp. Cada advogado = 1 instância = 1 número.
- **Este serviço**: recebe as mensagens, orquestra a IA e responde.
- **Supabase (Postgres)**: guarda advogados (tenants), conversas, mensagens e a
  ficha estruturada de cada lead.
- **Claude**: faz a triagem, conversa naturalmente e extrai os dados do caso.
- **Fly.io**: onde este serviço roda (VPS gerenciada).

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20 + TypeScript + Fastify |
| IA | Claude (`@anthropic-ai/sdk`), modelo `claude-haiku-4-5` por padrão |
| Banco | Supabase (Postgres) |
| WhatsApp | Evolution API (self-hosted) |
| Deploy | Fly.io (Docker) |

> **Custo da IA:** o padrão é o **Claude Haiku 4.5** (barato e rápido — ideal para
> triagem em escala). Para respostas mais sofisticadas, troque `ANTHROPIC_MODEL`
> para `claude-sonnet-5` (mais caro). É só mudar a variável de ambiente.

---

## 🚀 Testar a Júria agora (2 minutos, sem WhatsApp)

A assistente se chama **Júria**. Para conversar com ela no terminal — sem
Evolution, sem Supabase, só com a chave da Claude:

```bash
npm install
cp .env.example .env       # e coloque sua ANTHROPIC_API_KEY dentro
npm run chat
```

Digite mensagens como se fosse um cliente ("oi, fui demitido sem justa causa")
e veja a Júria fazer a triagem. É o jeito mais rápido de validar a IA hoje.

---

## Passo a passo para subir (produção, com WhatsApp)

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cole e rode o conteúdo de `supabase/schema.sql`.
3. Em **Project Settings → API**, copie a `URL` e a **`service_role` key**.

### 2. Evolution API
Suba a Evolution API (Docker) em um servidor/VPS. Guarde a **URL** e a
**API key global**. Docs: <https://doc.evolution-api.com>.

### 3. Chave da Claude
Pegue sua `ANTHROPIC_API_KEY` no [console da Anthropic](https://console.anthropic.com).

### 4. Variáveis de ambiente
Copie `.env.example` para `.env` e preencha tudo.

### 5. Rodar local
```bash
npm install
npm run dev
```

### 6. Deploy no Fly.io
```bash
fly launch --no-deploy        # gera/ajusta o fly.toml
fly secrets set \
  ADMIN_API_KEY=... \
  ANTHROPIC_API_KEY=... \
  ANTHROPIC_MODEL=claude-haiku-4-5 \
  SUPABASE_URL=... \
  SUPABASE_SERVICE_ROLE_KEY=... \
  EVOLUTION_API_URL=... \
  EVOLUTION_API_KEY=... \
  PUBLIC_URL=https://SEU-APP.fly.dev
fly deploy
```

---

## Onboarding de um advogado (plug and play)

Com o serviço no ar, cadastre um advogado com **uma chamada HTTP**. Isso:
1. cria a instância dele no Evolution (com o webhook já apontado pra cá);
2. salva a configuração no banco;
3. devolve o **QR Code** pra ele escanear.

```bash
curl -X POST https://SEU-APP.fly.dev/admin/tenants \
  -H "Content-Type: application/json" \
  -H "x-admin-key: SUA_ADMIN_API_KEY" \
  -d '{
    "nome_escritorio": "Silva Advocacia",
    "nome_advogado": "Dra. Ana Silva",
    "areas": ["previdenciário", "trabalhista"],
    "whatsapp_advogado": "5511999998888",
    "horario_atendimento": "Seg a sex, 9h às 18h",
    "criterios_qualificacao": "Priorizar casos de aposentadoria negada pelo INSS."
  }'
```

A resposta traz o `qrcode`. O advogado abre **WhatsApp → Aparelhos conectados →
Conectar aparelho** e escaneia. Pronto: a IA já atende por ele. 🎉

Endpoints úteis:
- `GET /admin/tenants/:instance/qrcode` — reemite o QR (se expirar).
- `GET /admin/tenants/:instance/status` — vê se o WhatsApp está conectado.

> Todas as rotas `/admin/*` exigem o header `x-admin-key: <ADMIN_API_KEY>`.

---

## Personalização por advogado

Cada advogado (tenant) tem, na tabela `tenants`:

| Campo | Para quê |
|---|---|
| `areas` | Áreas de atuação (prioriza as perguntas de triagem certas). |
| `tom` | Tom de voz da IA. |
| `instrucoes_customizadas` | Instruções livres específicas do escritório. |
| `criterios_qualificacao` | O que conta como lead "quente" pra esse advogado. |
| `horario_atendimento` | Informado ao lead. |
| `whatsapp_advogado` | Número que recebe o aviso de lead qualificado. |

O **mesmo agente** se adapta a tudo isso — sem duplicar código.

---

## Guardrails já embutidos

A IA é instruída a **nunca**: dar parecer jurídico, dizer se a pessoa "tem
direito", prometer resultado/prazo, ou negociar honorários. Também respeita LGPD
(não pede documentos sensíveis no primeiro contato) e orienta a procurar
190/180 em casos de risco. Veja/edite em `src/agent/systemPrompt.ts`.

---

## Estrutura do projeto

```
src/
├── index.ts               # servidor Fastify
├── config.ts              # variáveis de ambiente
├── db/                    # Supabase: cliente, tipos e repositórios
├── evolution/             # cliente e parser do WhatsApp (Evolution API)
├── agent/
│   ├── intakeTemplates.ts # ⭐ perguntas de triagem por área (a "mágica")
│   ├── systemPrompt.ts    # personalidade + regras do agente
│   ├── tools.ts           # extração estruturada do lead
│   └── brain.ts           # loop de conversa com o Claude
├── core/conversation.ts   # orquestra: recebe → pensa → responde → notifica
├── notify/handoff.ts      # avisa o advogado do lead qualificado
└── routes/                # webhook (WhatsApp) e admin (onboarding)
```

---

## Próximos passos sugeridos (roadmap)

- **Painel web** para você/advogado ver leads e conversas (em cima do Supabase).
- **Agrupar mensagens picadas** (debounce) antes de responder.
- **Handoff humano**: comando para o advogado "assumir" a conversa (status `pausado`).
- **Follow-up automático** de leads que sumiram.
- **Áudio**: transcrever mensagens de voz (muito comum no público jurídico).
- **Métricas**: leads/dia, taxa de qualificação, por área.
