// ============================================================
// Base de conhecimento de TRIAGEM por área jurídica.
//
// Esta é a peça que permite UM ÚNICO AGENTE atender QUALQUER área
// sem precisar criar um bot por tese. O agente detecta a área pela
// conversa e injeta as perguntas certas dinamicamente.
//
// Para atender uma nova tese/área, basta adicionar um item aqui —
// nada de novo código ou novo agente.
//
// Convenção: áreas com " — " no nome são sub-teses (ex:
// "previdenciário — auxílio-doença"). O agente usa o bloco mais
// específico que combinar com o relato; se nenhum combinar, usa o
// bloco geral da área.
// ============================================================

export interface IntakeTemplate {
  area: string;
  // Perguntas-chave que qualificam o caso nesta área.
  perguntas: string[];
}

export const INTAKE_TEMPLATES: IntakeTemplate[] = [
  // ------------------------------------------------------------
  // PREVIDENCIÁRIO
  // ------------------------------------------------------------
  {
    area: 'previdenciário (geral)',
    perguntas: [
      'Qual o benefício em questão (aposentadoria, auxílio-doença, BPC/LOAS, pensão, salário-maternidade)?',
      'Já deu entrada no INSS? Foi negado? Tem o número do protocolo/NB?',
      'Há quanto tempo contribui / qual a situação de trabalho (CLT, autônomo, rural)?',
      'Existe alguma condição de saúde ou incapacidade envolvida?',
    ],
  },
  {
    area: 'previdenciário — auxílio-doença (incapacidade temporária)',
    perguntas: [
      'O benefício foi NEGADO ou foi CESSADO (cortado) pelo INSS? (ESSENCIAL — sempre pergunte)',
      'A pessoa está afastada do trabalho atualmente?',
      'Qual é a doença ou lesão? (ESSENCIAL — sempre pergunte)',
      'Tem documentos médicos — por exemplo laudo, exames, atestados? (exemplifique assim, pois muita gente não sabe o que é "laudo")',
      'Trabalha como CLT (carteira assinada), autônomo ou contribuinte individual?',
      'Quando ocorreu o afastamento?',
      'Já entrou com recurso no INSS?',
      'Ainda faz tratamento médico?',
    ],
  },
  {
    area: 'previdenciário — BPC/LOAS',
    perguntas: [
      'O benefício foi negado ou ainda não foi solicitado? (ESSENCIAL — sempre pergunte)',
      'Possui laudo médico da condição? (se envolver criança/deficiência)',
      'Qual a idade da criança ou do beneficiário?',
      'Quem mora na mesma casa? (para entender a renda por pessoa da família)',
      'Qual a renda aproximada da família?',
      'Se envolver autismo: a criança realiza terapias? Há gastos elevados com o tratamento?',
      'Já passou por perícia do INSS?',
    ],
  },
  {
    area: 'previdenciário — salário-maternidade',
    perguntas: [
      'Já teve o bebê ou ainda está gestante? (ESSENCIAL — sempre pergunte)',
      'Qual a data do parto ou a previsão?',
      'Contribuiu para o INSS recentemente?',
      'Trabalha registrada, como autônoma ou é segurada especial (rural)?',
      'Já solicitou o benefício ao INSS? Foi negado?',
      'Já recebeu esse benefício alguma outra vez?',
    ],
  },
  {
    area: 'previdenciário — auxílio-acidente',
    perguntas: [
      'O acidente foi no trabalho ou fora dele? (ESSENCIAL — sempre pergunte)',
      'Quando ocorreu o acidente?',
      'Precisou de cirurgia, prótese, pino ou parafuso?',
      'Chegou a ficar afastado recebendo pelo INSS?',
      'Ainda possui alguma limitação física por causa do acidente? (ESSENCIAL — sempre pergunte)',
      'Está trabalhando atualmente?',
      'Possui documentos médicos — por exemplo laudo, exames, atestados? (exemplifique assim para a pessoa entender)',
    ],
  },

  // ------------------------------------------------------------
  // TRABALHISTA
  // ------------------------------------------------------------
  {
    area: 'trabalhista (geral)',
    perguntas: [
      'Foi CLT registrado ou sem registro? Por quanto tempo trabalhou?',
      'Qual o problema (demissão, verbas não pagas, horas extras, assédio, acidente)?',
      'Ainda está trabalhando na empresa ou já saiu? Há quanto tempo saiu?',
      'Tem documentos (carteira, holerites, mensagens, testemunhas)?',
    ],
  },
  {
    area: 'trabalhista — verbas rescisórias não pagas',
    perguntas: [
      'Trabalhava de carteira assinada?',
      'Ainda está na empresa ou já foi demitido? Quando foi a demissão? (ESSENCIAL — sempre pergunte)',
      'Recebeu as verbas rescisórias (acerto)? (ESSENCIAL — sempre pergunte)',
      'Recebeu o FGTS? E a multa de 40%?',
      'Tem holerites ou outros documentos do trabalho?',
    ],
  },
  {
    area: 'trabalhista — rescisão indireta (empresa descumprindo obrigações)',
    perguntas: [
      'Ainda está trabalhando na empresa? (ESSENCIAL — sempre pergunte)',
      'O que está acontecendo na empresa? (ESSENCIAL — sempre pergunte)',
      'Há atraso de salários?',
      'Há assédio ou tratamento abusivo?',
      'A empresa descumpre alguma obrigação (FGTS, registro, condições de trabalho)?',
      'Há colegas que presenciam a situação (testemunhas)?',
      'Há quanto tempo isso vem acontecendo?',
    ],
  },
  {
    area: 'trabalhista — insalubridade/periculosidade',
    perguntas: [
      'Qual é a sua função na empresa? (ESSENCIAL — sempre pergunte)',
      'Trabalha exposto a agentes nocivos (produtos químicos, ruído, calor, agentes biológicos)?',
      'Recebe o adicional de insalubridade? Sabe se o percentual está correto?',
      'A empresa fornece equipamentos de proteção (EPI)?',
      'Há quanto tempo está nessa função?',
    ],
  },
  {
    area: 'trabalhista — reconhecimento de vínculo (trabalho sem registro)',
    perguntas: [
      'Trabalhou sem carteira assinada? Por quanto tempo? (ESSENCIAL — sempre pergunte)',
      'Qual era a função?',
      'Cumpria horário fixo definido pela empresa?',
      'Recebia ordens de um chefe/superior?',
      'Trabalhava só para essa empresa (exclusividade)?',
      'Como recebia o pagamento (dinheiro, Pix, conta)?',
    ],
  },

  // ------------------------------------------------------------
  // CRIMINAL
  // ------------------------------------------------------------
  {
    area: 'criminal (geral)',
    perguntas: [
      'A pessoa foi presa, intimada, indiciada ou está sendo investigada?',
      'Já existe processo, inquérito ou apenas boletim de ocorrência?',
      'Há audiência ou prazo marcado? Qual a data?',
      'A pessoa já tem advogado constituído no caso?',
    ],
  },
  {
    area: 'criminal — execução penal / progressão de regime',
    perguntas: [
      'Qual o regime atual (fechado, semiaberto, aberto)? (ESSENCIAL — sempre pergunte)',
      'Há quanto tempo a pessoa está presa? (ESSENCIAL — sempre pergunte)',
      'É réu primário?',
      'Já tem advogado acompanhando a execução?',
      'Sabe se já cumpriu o tempo necessário para progredir?',
      'O comportamento carcerário é bom (sem faltas)?',
    ],
  },

  // ------------------------------------------------------------
  // FAMÍLIA
  // ------------------------------------------------------------
  {
    area: 'família (geral)',
    perguntas: [
      'O tema é divórcio, guarda, pensão alimentícia, inventário ou união estável?',
      'Existe acordo entre as partes ou é litigioso?',
      'Há filhos menores envolvidos?',
      'Já existe processo em andamento?',
    ],
  },
  {
    area: 'família — pensão alimentícia atrasada (execução de alimentos)',
    perguntas: [
      'Já existe decisão judicial fixando a pensão? (ESSENCIAL — sempre pergunte)',
      'Há quanto tempo a pensão está atrasada? (ESSENCIAL — sempre pergunte)',
      'O devedor possui renda/trabalho conhecido?',
      'Tem comprovantes dos pagamentos (ou da falta deles)?',
      'Qual a idade do filho/da filha?',
    ],
  },

  // ------------------------------------------------------------
  // BANCÁRIO / FINANCEIRO
  // ------------------------------------------------------------
  {
    area: 'bancário / financiamentos e empréstimos (geral)',
    perguntas: [
      'O financiamento/empréstimo é de veículo, imóvel ou pessoal? Com qual banco/financeira?',
      'Há quanto tempo foi feito?',
      'Qual o valor da parcela? (ESSENCIAL — sempre pergunte)',
      'As parcelas estão em dia ou há atrasos?',
      'A pessoa tem o contrato em mãos ou consegue acessá-lo (físico ou digital)? (ESSENCIAL — sempre pergunte)',
    ],
  },
  {
    area: 'bancário — revisão de juros de veículo',
    perguntas: [
      'O veículo é financiado? Em que ano foi feito o financiamento?',
      'Quantas parcelas tem no total e quantas já foram pagas?',
      'Qual o valor da parcela? (ESSENCIAL — sempre pergunte)',
      'O financiamento ainda está ativo?',
      'O veículo está em processo de busca e apreensão?',
      'Tem o contrato em mãos ou consegue acessá-lo? (ESSENCIAL — sempre pergunte)',
    ],
  },
  {
    area: 'bancário — busca e apreensão de veículo',
    perguntas: [
      'A busca e apreensão já foi decretada / o veículo já foi apreendido? (ESSENCIAL — sempre pergunte)',
      'Recebeu alguma notificação? Tem o número do processo?',
      'Tem o contrato do financiamento?',
      'Qual o valor da parcela? (ESSENCIAL — sempre pergunte)',
      'Quantas parcelas estão atrasadas?',
    ],
  },
  {
    area: 'bancário — tarifas/descontos indevidos em conta ou benefício',
    perguntas: [
      'A pessoa recebe aposentadoria ou benefício por esse banco?',
      'Qual é o banco? (ESSENCIAL — sempre pergunte)',
      'Há quanto tempo os descontos acontecem?',
      'Sabe o nome da tarifa/desconto que aparece no extrato?',
      'Chegou a autorizar essa cobrança?',
      'Possui extrato bancário?',
      'Já procurou o banco para reclamar?',
    ],
  },
  {
    area: 'bancário — superendividamento (pessoa física / servidor público)',
    perguntas: [
      'Quanto da renda mensal está comprometida com dívidas, aproximadamente? (ESSENCIAL — sempre pergunte)',
      'Quais são as principais dívidas (cartão, consignado, financiamento)?',
      'Já tentou renegociar com os bancos?',
      'Mesmo renegociando, as parcelas continuam pesadas?',
      'Está sobrando dinheiro para as despesas básicas (alimentação, moradia)?',
      'Consegue pagar as contas em dia?',
      'Alguma dívida já está em cobrança judicial?',
    ],
  },
  {
    area: 'golpe do Pix / fraude bancária',
    perguntas: [
      'Quando o golpe aconteceu? (ESSENCIAL — sempre pergunte)',
      'Qual foi o valor perdido? (ESSENCIAL — sempre pergunte)',
      'O Pix foi enviado para quem (pessoa desconhecida, falso vendedor, falsa central)?',
      'Registrou boletim de ocorrência?',
      'Já contatou o banco? O banco respondeu algo?',
      'Qual é o banco? (ESSENCIAL — sempre pergunte)',
    ],
  },

  // ------------------------------------------------------------
  // CONSUMIDOR
  // ------------------------------------------------------------
  {
    area: 'consumidor',
    perguntas: [
      'Qual empresa/serviço gerou o problema (banco, telefonia, compra, plano de saúde)?',
      'O que aconteceu e há quanto tempo?',
      'Já tentou resolver diretamente com a empresa? Tem protocolo?',
      'Houve cobrança indevida, negativação ou prejuízo financeiro? De quanto?',
    ],
  },

  // ------------------------------------------------------------
  // CÍVEL
  // ------------------------------------------------------------
  {
    area: 'cível',
    perguntas: [
      'Qual a natureza do problema (contrato, dívida, indenização, vizinhança)?',
      'Existe documento/contrato envolvido?',
      'Qual o valor aproximado envolvido?',
      'Já houve tentativa de acordo?',
    ],
  },

  // ------------------------------------------------------------
  // IMOBILIÁRIO
  // ------------------------------------------------------------
  {
    area: 'imobiliário (geral)',
    perguntas: [
      'O tema é compra/venda, aluguel, despejo, distrato, usucapião ou leilão?',
      'Existe contrato assinado? Está em dia?',
      'Há valores em atraso ou prejuízo? De quanto?',
    ],
  },
  {
    area: 'imobiliário — usucapião',
    perguntas: [
      'Há quanto tempo mora/ocupa o imóvel? (ESSENCIAL — sempre pergunte)',
      'O imóvel tem escritura? Sabe quem é o proprietário anterior/registrado?',
      'O imóvel é urbano ou rural?',
      'Alguém contesta a posse (herdeiros, antigo dono, vizinhos)?',
      'Tem documentos que comprovem a posse (contas de luz/água, IPTU, recibos)?',
    ],
  },
  {
    area: 'imobiliário — adjudicação compulsória (vendedor não transfere o imóvel)',
    perguntas: [
      'Existe contrato de compra e venda assinado? (ESSENCIAL — sempre pergunte)',
      'O imóvel já foi totalmente pago? (ESSENCIAL — sempre pergunte)',
      'O vendedor se recusa a transferir/escriturar?',
      'O vendedor faleceu?',
      'Possui recibos e documentos do pagamento?',
    ],
  },
  {
    area: 'imobiliário — contrato de gaveta',
    perguntas: [
      'O imóvel foi adquirido por contrato particular ("de gaveta")? (ESSENCIAL — sempre pergunte)',
      'Ainda existe financiamento em nome do antigo dono?',
      'O imóvel já está quitado?',
      'Possui o contrato e os comprovantes de pagamento?',
      'Consegue localizar o vendedor?',
    ],
  },
  {
    area: 'imobiliário — distrato (desistência de imóvel comprado)',
    perguntas: [
      'Comprou na planta ou pronto? (ESSENCIAL — sempre pergunte)',
      'Ainda está pagando as parcelas?',
      'Chegou a atrasar parcelas?',
      'Quer desistir da compra ou a construtora atrasou/descumpriu algo?',
      'Já falou com a construtora? Ela respondeu?',
    ],
  },
  {
    area: 'imobiliário — leilão de imóvel',
    perguntas: [
      'O imóvel já foi leiloado ou o leilão ainda vai acontecer? (ESSENCIAL — sempre pergunte)',
      'Recebeu alguma notificação do banco/leiloeiro?',
      'Ainda existe financiamento sobre o imóvel?',
      'O imóvel é a residência da pessoa/família?',
      'Quando aconteceu (ou está marcado) o leilão?',
    ],
  },

  // ------------------------------------------------------------
  // TRIBUTÁRIO / TRÂNSITO
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // SAÚDE
  // ------------------------------------------------------------
  {
    area: 'saúde (geral)',
    perguntas: [
      'É plano de saúde, SUS ou fornecimento de medicamento?',
      'Houve negativa de cobertura/tratamento? Tem a negativa por escrito?',
      'Existe urgência médica ou prazo de tratamento?',
    ],
  },
  {
    area: 'saúde — negativa de cobertura pelo plano',
    perguntas: [
      'Qual procedimento/tratamento/medicamento foi negado? (ESSENCIAL — sempre pergunte)',
      'A negativa foi por escrito (mensagem, e-mail, protocolo)?',
      'Há urgência médica no caso? (ESSENCIAL — sempre pergunte)',
      'Tem relatório médico indicando o procedimento?',
      'Já procurou o plano para tentar resolver?',
    ],
  },
  {
    area: 'saúde — plano falso coletivo / reajuste abusivo',
    perguntas: [
      'Qual é o plano de saúde? (ESSENCIAL — sempre pergunte)',
      'O plano foi contratado como empresarial/coletivo (por CNPJ)?',
      'Quem utiliza o plano? São apenas familiares no contrato?',
      'Os reajustes aumentaram muito? De quanto foi o último aumento? (ESSENCIAL — sempre pergunte)',
      'Possui o contrato ou boletos antigos?',
      'Desde quando tem o plano?',
    ],
  },

  // ------------------------------------------------------------
  // CASO SAMARCO (rompimento da barragem — Mariana / Rio Doce)
  // Sinais: "Samarco", "barragem", "Mariana", "Rio Doce", "lama",
  // "indenização da Samarco/Vale/BHP", "atingidos".
  // ------------------------------------------------------------
  {
    area: 'caso Samarco — indenização (rompimento da barragem de Mariana / Rio Doce)',
    perguntas: [
      'Você morava em Governador Valadares (ou outra cidade atingida) em 2015? Qual cidade? (ESSENCIAL — sempre pergunte)',
      'Qual a data de nascimento da pessoa interessada em entrar com a ação? (atenção: nem sempre é quem está escrevendo — pode ser filho, pai, mãe) (ESSENCIAL — sempre pergunte)',
      '(CRITÉRIO DE ENQUADRAMENTO: a pessoa interessada precisa ter entre 10 e 20 anos de idade ATUALMENTE. Calcule pela data de nascimento usando a DATA DE HOJE informada no início destas instruções, seguindo a regra de cálculo de idade. Fora dessa faixa, normalmente não se enquadra: explique com delicadeza, sem parecer definitivo — a palavra final é do advogado — e registre qualificado=false com o motivo em observacoes.)',
      'Você ou alguém da sua família já receberam alguma indenização anteriormente por esse caso? (ESSENCIAL — sempre pergunte)',
      'Qual o número do CPF do interessado(a)? Explique de forma simples: é para confirmar se é possível dar entrada com a ação. (ESSENCIAL — sempre pergunte. EXCEÇÃO à regra de não pedir documentos: neste caso específico o advogado precisa do CPF para a análise)',
      'Possui comprovante de residência daquela época em seu nome ou em nome dos seus pais (genitores)?',
      'Se não tiver comprovante de residência: a pessoa já estava estudando na época? O comprovante de matrícula escolar daquele período pode servir como prova.',
    ],
  },

  // ------------------------------------------------------------
  // MILITAR
  // ------------------------------------------------------------
  {
    area: 'militar — revisão de desconto CPSM (pensão militar)',
    perguntas: [
      'A pessoa é da ativa, reserva, reformado ou pensionista? (ESSENCIAL — sempre pergunte)',
      'Qual a patente/graduação?',
      'Recebe acima do teto previdenciário?',
      'Aparece o desconto (CPSM/pensão militar) no contracheque?',
      'Possui contracheque recente?',
      'Desde quando o desconto acontece?',
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
  // Sub-teses ("área — tese") contam como da área declarada correspondente.
  const declaradas = areasDoTenant.map(normal);
  const ehDeclarada = (area: string) => {
    // "previdenciário — auxílio-doença" e "previdenciário (geral)" contam
    // como a área-base "previdenciário".
    const base = normal(area).split(' — ')[0].split(' (')[0].trim();
    return declaradas.some((d) => d === base || d.startsWith(base) || base.startsWith(d));
  };
  const ordenados = [...INTAKE_TEMPLATES]
    .map((t, i) => ({ t, i }))
    .sort((x, y) => {
      const xDecl = ehDeclarada(x.t.area) ? 0 : 1;
      const yDecl = ehDeclarada(y.t.area) ? 0 : 1;
      // Ordenação estável: mantém a ordem original dentro de cada grupo,
      // preservando sub-teses junto do bloco geral da área.
      return xDecl - yDecl || x.i - y.i;
    })
    .map(({ t }) => t);

  return ordenados
    .map((t) => `### ${t.area}\n` + t.perguntas.map((p) => `- ${p}`).join('\n'))
    .join('\n\n');
}
