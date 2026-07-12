# 🚀 Guia de deploy completo (do zero ao WhatsApp funcionando)

Feito para quem é leigo. Siga na ordem. No fim, a **Júria** estará atendendo
no WhatsApp de um advogado de verdade.

Vamos rodar **tudo num servidor só** (a Júria + a Evolution API), usando Docker.
O banco de dados da Júria fica no **Supabase** (nuvem). São 6 passos.

---

## O que você vai precisar (checklist)
- [ ] Uma conta no **Supabase** (você já tem) → o banco.
- [ ] Uma **chave da Claude** (Anthropic) → o cérebro da IA.
- [ ] Um **VPS** (servidor na nuvem) com pelo menos **2 GB de RAM** → onde tudo roda.
- [ ] Um **celular com WhatsApp** do advogado (ou um chip de teste) → pra conectar.

> 💡 O "VPS" é o tal computador na nuvem que a aula chamou de Fly. Aqui vamos
> usar **um VPS comum** (Hostinger, Contabo, DigitalOcean, etc. — a partir de
> ~US$5/mês) porque é mais simples pra rodar a Evolution junto. Se quiser usar o
> Fly só pra Júria depois, dá — mas comece assim.

---

## Passo 1 — Preparar o Supabase (5 min)
1. Entre no seu projeto em [supabase.com](https://supabase.com).
2. Menu **SQL Editor** → **New query**.
3. Abra o arquivo `supabase/schema.sql` deste projeto, copie **tudo**, cole e
   clique em **Run**.
4. Vá em **Project Settings → API** e anote dois valores:
   - **Project URL** (algo como `https://xxxx.supabase.co`)
   - **service_role key** (a chave secreta, longa — **não** a `anon`)

---

## Passo 2 — Pegar a chave da Claude (5 min)
1. Entre em [console.anthropic.com](https://console.anthropic.com) e crie a conta.
2. Adicione um pouco de crédito (**Billing** → uns US$5 já dão pra muitos testes).
3. Vá em **API Keys** → **Create Key** → copie a chave (começa com `sk-ant-...`).

---

## Passo 3 — Contratar e preparar o VPS (15 min)
1. Contrate um VPS Ubuntu (22.04 ou 24.04), mínimo **2 GB de RAM**. Anote o
   **IP** e a **senha** de root que o provedor te der.
2. Acesse o servidor pelo terminal (no Windows use o PowerShell):
   ```bash
   ssh root@SEU_IP
   ```
3. Instale o Docker (cole o comando inteiro):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
4. Instale o Git:
   ```bash
   apt-get update && apt-get install -y git
   ```

---

## Passo 4 — Subir a Júria + Evolution (10 min)
Ainda dentro do servidor (via ssh):

1. Baixe o projeto:
   ```bash
   git clone https://github.com/henriqueluiz535-del/agente-preatendimento.git
   cd agente-preatendimento
   ```
2. Crie o arquivo de configuração:
   ```bash
   cp .env.example .env
   nano .env
   ```
3. Preencha o `.env` com o que você anotou. O mínimo obrigatório:
   ```
   ADMIN_API_KEY=escolha-uma-senha-forte-qualquer
   ANTHROPIC_API_KEY=sk-ant-...           (do passo 2)
   ANTHROPIC_MODEL=claude-haiku-4-5
   SUPABASE_URL=https://xxxx.supabase.co  (do passo 1)
   SUPABASE_SERVICE_ROLE_KEY=eyJ...       (do passo 1)
   EVOLUTION_API_KEY=escolha-outra-senha-forte
   ```
   > Deixe `EVOLUTION_API_URL` e `PUBLIC_URL` como estão — o Docker cuida disso
   > sozinho. Salve no nano com **Ctrl+O**, **Enter**, e saia com **Ctrl+X**.
4. Suba tudo:
   ```bash
   docker compose up -d --build
   ```
5. Confira se a Júria subiu:
   ```bash
   docker compose logs -f juria
   ```
   Você deve ver "Agente de pré-atendimento no ar na porta 8080". Saia com **Ctrl+C**.

---

## Passo 5 — Cadastrar o advogado e conectar o WhatsApp (5 min)
Ainda no servidor, cadastre o primeiro advogado (troque os dados e a
`ADMIN_API_KEY` pela que você pôs no `.env`):

```bash
curl -X POST http://localhost:8080/admin/tenants \
  -H "Content-Type: application/json" \
  -H "x-admin-key: SUA_ADMIN_API_KEY" \
  -d '{
    "nome_escritorio": "Silva Advocacia",
    "nome_advogado": "Dra. Ana Silva",
    "nome_assistente": "Júria",
    "areas": ["previdenciário", "trabalhista"],
    "whatsapp_advogado": "5511999998888"
  }'
```

A resposta traz um **QR Code**. O jeito mais fácil de escanear:
1. Abra no navegador do seu PC: `http://SEU_IP:8081` (painel da Evolution).
2. Faça login com a `EVOLUTION_API_KEY`.
3. Ache a instância criada e mostre o **QR Code**.
4. No celular do advogado: **WhatsApp → Aparelhos conectados → Conectar
   aparelho** e escaneie.

Confirme que conectou:
```bash
curl http://localhost:8080/admin/tenants/NOME_DA_INSTANCIA/status \
  -H "x-admin-key: SUA_ADMIN_API_KEY"
```
(o `NOME_DA_INSTANCIA` vem na resposta do cadastro, campo `evolution_instance`).
Se aparecer `"state":"open"`, está conectado. ✅

---

## Passo 6 — Testar 🎉
De **outro** celular, mande uma mensagem para o número do advogado
(ex: "oi, fui demitido sem justa causa, tenho direito a algo?").

A **Júria** deve responder fazendo a triagem. Quando ela qualificar o lead, o
advogado recebe um aviso no WhatsApp dele. Você vê os leads salvos no Supabase
(tabelas `leads` e `conversations`).

---

## Deu problema?
- **Júria não responde:** `docker compose logs -f juria` mostra o erro.
- **QR não conecta:** gere um novo em `http://SEU_IP:8081` ou via
  `GET /admin/tenants/NOME/qrcode`.
- **"Sem crédito" da Claude:** adicione saldo no console da Anthropic.
- **Firewall:** libere as portas 8080 e 8081 no painel do seu provedor de VPS.

Qualquer erro, copie a mensagem do log e me manda que eu te ajudo a resolver.
