// ============================================================
// Base de conhecimento de TRIAGEM por área jurídica.
//
// Esta é a peça que permite UM ÚNICO AGENTE atender QUALQUER área
// sem precisar criar um bot por tese. O agente detecta a área pela
// conversa e injeta as perguntas certas dinamicamente.
//
// Para atender uma nova tese/área, basta adicionar um item aqui —
// nada de novo código ou novo agente.
// ============================================================

export interface IntakeTemplate {
  area: string;
  // Perguntas-chave que qualificam o caso nesta área.
  perguntas: string[];
}

export const INTAKE_TEMPLATES: IntakeTemplate[] = [
  {
    area: 'previdenciário',
    perguntas: [
      'Qual o benefício em questão (aposentadoria, auxílio-doença, BPC/LOAS, pensão)?',
      'Já deu entrada no INSS? Foi negado? Tem o número do protocolo/NB?',
      'Há quanto tempo contribui / qual a situação de trabalho (CLT, autônomo, rural)?',
      'Existe alguma condição de saúde ou incapacidade envolvida?',
    ],
  },
  {
    area: 'trabalhista',
    perguntas: [
      'Foi CLT registrado ou sem registro? Por quanto tempo trabalhou?',
      'Qual o problema (demissão, verbas não pagas, horas extras, assédio, acidente)?',
      'Ainda está trabalhando na empresa ou já saiu? Há quanto tempo saiu?',
      'Tem documentos (carteira, holerites, mensagens, testemunhas)?',
    ],
  },
  {
    area: 'criminal',
    perguntas: [
      'A pessoa foi presa, intimada, indiciada ou está sendo investigada?',
      'Já existe processo, inquérito ou apenas boletim de ocorrência?',
      'Há audiência ou prazo marcado? Qual a data?',
      'A pessoa já tem advogado constituído no caso?',
    ],
  },
  {
    area: 'família',
    perguntas: [
      'O tema é divórcio, guarda, pensão alimentícia, inventário ou união estável?',
      'Existe acordo entre as partes ou é litigioso?',
      'Há filhos menores envolvidos?',
      'Já existe processo em andamento?',
    ],
  },
  {
    area: 'bancário / financiamentos e empréstimos',
    perguntas: [
      'O financiamento/empréstimo é de veículo, imóvel ou pessoal? Com qual banco/financeira?',
      'Há quanto tempo foi feito e qual o valor da parcela?',
      'As parcelas estão em dia ou há atrasos?',
      'A pessoa tem o contrato em mãos ou consegue acessá-lo (físico ou digital)?',
    ],
  },
  {
    area: 'consumidor',
    perguntas: [
      'Qual empresa/serviço gerou o problema (banco, telefonia, compra, plano de saúde)?',
      'O que aconteceu e há quanto tempo?',
      'Já tentou resolver diretamente com a empresa? Tem protocolo?',
      'Houve cobrança indevida, negativação ou prejuízo financeiro? De quanto?',
    ],
  },
  {
    area: 'cível',
    perguntas: [
      'Qual a natureza do problema (contrato, dívida, indenização, vizinhança)?',
      'Existe documento/contrato envolvido?',
      'Qual o valor aproximado envolvido?',
      'Já houve tentativa de acordo?',
    ],
  },
  {
    area: 'imobiliário',
    perguntas: [
      'O tema é compra/venda, aluguel, despejo, distrato ou usucapião?',
      'Existe contrato assinado? Está em dia?',
      'Há valores em atraso ou prejuízo? De quanto?',
    ],
  },
  {
    area: 'tributário',
    perguntas: [
      'É pessoa física ou empresa? Qual o porte/regime tributário?',
      'O problema é cobrança, execução fiscal, restituição ou planejamento?',
      'Há algum prazo ou notificação em curso?',
    ],
  },
  {
    area: 'trânsito',
    perguntas: [
      'O tema é multa, suspensão da CNH, cassação ou pontuação?',
      'Já foi notificado? Qual o prazo de defesa/recurso?',
      'A CNH é usada para trabalho?',
    ],
  },
  {
    area: 'saúde',
    perguntas: [
      'É plano de saúde, SUS ou fornecimento de medicamento?',
      'Houve negativa de cobertura/tratamento? Tem a negativa por escrito?',
      'Existe urgência médica ou prazo de tratamento?',
    ],
  },
];

/** Monta um bloco de texto com as perguntas de todas as áreas, para o system prompt. */
export function templatesParaPrompt(areasDoTenant: string[]): string {
  const normal = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');

  // Se o tenant declarou áreas, priorizamos (mas mantemos todas como fallback,
  // pois o lead pode chegar com um tema diferente do esperado).
  const declaradas = new Set(areasDoTenant.map(normal));
  const ordenados = [...INTAKE_TEMPLATES].sort((a, b) => {
    const aDecl = declaradas.has(normal(a.area)) ? 0 : 1;
    const bDecl = declaradas.has(normal(b.area)) ? 0 : 1;
    return aDecl - bDecl;
  });

  return ordenados
    .map((t) => `### ${t.area}\n` + t.perguntas.map((p) => `- ${p}`).join('\n'))
    .join('\n\n');
}
