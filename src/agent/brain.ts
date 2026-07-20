import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { logger } from '../logger.js';
import type { Tenant, Message } from '../db/types.js';
import { buildSystemPrompt } from './systemPrompt.js';
import { registrarLeadTool, type RegistrarLeadInput } from './tools.js';

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

export interface BrainResult {
  reply: string;
  lead: RegistrarLeadInput;         // acúmulo de tudo que a IA extraiu neste turno
  prontoParaEncaminhar: boolean;
}

/**
 * Processa o histórico da conversa e devolve a resposta da IA + dados extraídos.
 * Roda o loop de tool use: a IA pode chamar "registrar_lead" antes de responder.
 */
export async function pensar(tenant: Tenant, history: Message[]): Promise<BrainResult> {
  const system = buildSystemPrompt(tenant);

  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const leadAcc: RegistrarLeadInput = {};
  let prontoParaEncaminhar = false;
  const textos: string[] = [];
  let usoFinal: Anthropic.Usage | null = null;

  // Loop agêntico: continua enquanto a IA pedir ferramentas.
  for (let i = 0; i < 5; i++) {
    const response = await anthropic.messages.create({
      model: config.anthropic.model,
      max_tokens: 1024,
      // cache_control no system: o prefixo (ferramentas + prompt) é idêntico em
      // toda chamada do tenant, então é servido do cache (~90% mais barato).
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      tools: [registrarLeadTool],
      messages,
    });
    usoFinal = response.usage;

    // Coleta texto e chamadas de ferramenta desta resposta
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type === 'text') {
        if (block.text.trim()) textos.push(block.text.trim());
      } else if (block.type === 'tool_use' && block.name === 'registrar_lead') {
        const input = block.input as RegistrarLeadInput;
        Object.assign(leadAcc, sanitizar(input));
        if (input.pronto_para_encaminhar) prontoParaEncaminhar = true;
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: 'Ficha do lead atualizada com sucesso.',
        });
      }
    }

    if (response.stop_reason === 'tool_use') {
      // Precisamos devolver o resultado das ferramentas e continuar o turno.
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // end_turn (ou outro): fim do turno.
    break;
  }

  const reply =
    textos.join('\n\n').trim() ||
    'Obrigado pela mensagem! Já registrei aqui e em breve retornamos. 🙏';

  logger.info(
    {
      tenant: tenant.evolution_instance,
      lead: leadAcc,
      prontoParaEncaminhar,
      cache_lido: usoFinal?.cache_read_input_tokens ?? 0,
      cache_gravado: usoFinal?.cache_creation_input_tokens ?? 0,
      tokens_sem_cache: usoFinal?.input_tokens ?? 0,
    },
    'Resposta da IA gerada',
  );
  return { reply, lead: leadAcc, prontoParaEncaminhar };
}

// Remove campos vazios/undefined para não sobrescrever dados já salvos com nulo.
function sanitizar(input: RegistrarLeadInput): RegistrarLeadInput {
  const out: RegistrarLeadInput = {};
  for (const [k, v] of Object.entries(input)) {
    if (v !== undefined && v !== null && v !== '') {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}
