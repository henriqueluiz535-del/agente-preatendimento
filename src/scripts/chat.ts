// ============================================================
// Teste rápido da Júria no terminal — SEM WhatsApp/Evolution/Supabase.
// Precisa apenas de ANTHROPIC_API_KEY no .env.
//
// Rode:  npm run chat
// Digite mensagens como se fosse o cliente. Ctrl+C para sair.
// ============================================================
import 'dotenv/config';
import * as readline from 'node:readline';
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../agent/systemPrompt.js';
import { registrarLeadTool, type RegistrarLeadInput } from '../agent/tools.js';
import type { Tenant } from '../db/types.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('\n❌ Falta ANTHROPIC_API_KEY no seu .env. Preencha e rode de novo.\n');
  process.exit(1);
}

const anthropic = new Anthropic({ apiKey });
const model = process.env.ANTHROPIC_MODEL ?? 'claude-haiku-4-5';

// Advogado "de mentira" só para o teste. Mude à vontade para simular cenários.
const tenantTeste: Tenant = {
  id: 'teste',
  ativo: true,
  nome_escritorio: 'Escritório Modelo',
  nome_advogado: 'Dr. Exemplo',
  nome_assistente: 'Júria',
  areas: ['previdenciário', 'trabalhista', 'família'],
  tom: 'cordial, profissional e acolhedor',
  instrucoes_customizadas: '',
  criterios_qualificacao: '',
  horario_atendimento: 'Segunda a sexta, das 9h às 18h',
  whatsapp_advogado: null,
  evolution_instance: 'teste',
};

const system = buildSystemPrompt(tenantTeste);
const messages: Anthropic.MessageParam[] = [];

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

console.log('\n💬 Chat de teste com a Júria (Ctrl+C para sair)');
console.log('   Escreva como se fosse um cliente chegando pelo WhatsApp.\n');

function pergunta(): void {
  rl.question('Você: ', async (texto) => {
    if (!texto.trim()) return pergunta();
    messages.push({ role: 'user', content: texto });

    try {
      const reply = await responder();
      messages.push({ role: 'assistant', content: reply });
      console.log(`\nJúria: ${reply}\n`);
    } catch (err) {
      console.error('\n❌ Erro ao chamar a Claude:', err, '\n');
    }
    pergunta();
  });
}

// Mesma lógica do brain.ts: loop de tool use até a IA responder.
async function responder(): Promise<string> {
  const textos: string[] = [];
  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system,
      tools: [registrarLeadTool],
      messages,
    });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        if (block.text.trim()) textos.push(block.text.trim());
      } else if (block.type === 'tool_use' && block.name === 'registrar_lead') {
        const input = block.input as RegistrarLeadInput;
        console.log('\n   📋 [ficha do lead atualizada]', JSON.stringify(input));
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: 'ok' });
      }
    }

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }
    break;
  }
  return textos.join('\n\n').trim() || '(sem resposta)';
}

pergunta();
