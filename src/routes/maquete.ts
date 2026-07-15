import type { FastifyInstance } from 'fastify';

// Maquete navegável do CRM (dados fictícios) — página estática de
// demonstração/venda em /maquete-crm. Nada aqui toca o sistema real.

const HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>CRM HENRIQUECER · Maquete</title>
<style>
:root{--bg:#0d0d0d;--preto:#000;--card:#191919;--card2:#141414;--dourado:#e8b84b;--dourado2:#d1a238;
--texto:#f4f2ec;--muted:#9b968c;--linha:#2b2b2b;--ok:#3ecf8e;--erro:#ff6b5e;--azul:#6db3f2;--roxo:#b58ce6;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--texto);font-family:var(--sans);font-size:14px;line-height:1.45}
header{background:var(--preto);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;gap:10px;border-bottom:2px solid var(--dourado);position:sticky;top:0;z-index:10;flex-wrap:wrap}
.brand b{font-size:17px;font-weight:800;letter-spacing:3px}.brand b i{color:var(--dourado);font-style:normal}
.brand span{display:block;font-size:9px;letter-spacing:4px;color:var(--dourado);text-transform:uppercase}
.nav{display:flex;gap:4px;flex-wrap:wrap}
.nav button{background:none;border:none;color:var(--muted);font-weight:700;font-size:13px;padding:8px 13px;border-radius:8px;cursor:pointer;font-family:inherit}
.nav button.on{color:var(--dourado);background:rgba(232,184,75,.12)}
.nav button:focus-visible{outline:2px solid var(--dourado);outline-offset:2px}
.avatar{width:32px;height:32px;border-radius:50%;background:var(--dourado);color:#111;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:13px}
main{max-width:1100px;margin:0 auto;padding:20px 16px 70px}
section{display:none}section.on{display:block}
h2{font-weight:800;font-size:20px;margin:0}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
.chip{background:var(--card);border:1px solid var(--linha);padding:8px 13px;border-radius:9px;font-weight:700;font-size:12.5px}
.btn{background:var(--dourado);color:#171717;border:none;padding:9px 15px;border-radius:9px;font-weight:800;font-size:13px;cursor:pointer;font-family:inherit}
.btn:hover{background:var(--dourado2)}
.btn.ghost{background:transparent;border:1px solid var(--linha);color:var(--dourado)}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(148px,1fr));gap:10px}
.kpi{background:var(--card);border:1px solid var(--linha);border-radius:13px;padding:13px}
.kpi .n{font-size:25px;font-weight:900;color:var(--dourado);font-variant-numeric:tabular-nums}
.kpi .l{font-size:11px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.kpi .d{font-size:11px;color:var(--ok);margin-top:2px}
.g2{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-top:12px}
@media(max-width:820px){.g2{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--linha);border-radius:14px;padding:16px}
.card h3{margin:0 0 12px;font-size:13.5px;font-weight:800}
.card h3 small{color:var(--muted);font-weight:600}
.chart{display:flex;align-items:flex-end;gap:8px;height:120px;padding-top:14px}
.bar{flex:1;background:linear-gradient(180deg,var(--dourado),#8a6a1f);border-radius:6px 6px 2px 2px;position:relative;min-width:18px}
.bar span{position:absolute;top:-19px;left:0;right:0;text-align:center;font-size:11px;font-weight:800;color:var(--dourado)}
.bar i{position:absolute;bottom:-19px;left:0;right:0;text-align:center;font-size:10px;color:var(--muted);font-style:normal}
.chartwrap{padding-bottom:22px}
.meet{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--linha)}
.meet:last-child{border-bottom:none}
.meet .dt{background:var(--card2);border:1px solid var(--linha);border-radius:9px;padding:5px 8px;text-align:center;min-width:50px}
.meet .dt b{display:block;font-size:15px;color:var(--dourado)}
.meet .dt small{font-size:10px;color:var(--muted)}
.meet .who b{font-size:13px}
.meet .who div{font-size:11.5px;color:var(--muted)}
.meet .tag{margin-left:auto;font-size:10.5px;font-weight:800;color:var(--azul);background:rgba(109,179,242,.12);padding:3px 8px;border-radius:6px}
.pop{background:rgba(232,184,75,.1);border:1px solid rgba(232,184,75,.4);border-radius:12px;padding:11px 13px;margin:12px 0;display:flex;gap:10px;align-items:center;font-size:13px}
.pop b{color:var(--dourado)}
.hono{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}
.hono .h{background:var(--card2);border:1px solid var(--linha);border-radius:11px;padding:11px}
.hono .h .v{font-size:19px;font-weight:900;font-variant-numeric:tabular-nums}
.hono .h.gold .v{color:var(--dourado)}.hono .h.green .v{color:var(--ok)}
.hono .h .t{font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase}
.orig{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.orig .o{flex:1;min-width:90px;background:var(--card2);border:1px solid var(--linha);border-radius:10px;padding:10px;text-align:center}
.orig .o b{font-size:17px;display:block}
.orig .o small{color:var(--muted);font-size:11px}
.barra{height:8px;border-radius:5px;background:#2a2a2a;overflow:hidden;margin-top:8px}
.barra i{display:block;height:100%;background:var(--dourado);width:71%}
.mini{font-size:11px;color:var(--muted)}
.kb{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px}
.col{min-width:210px;background:var(--card2);border:1px solid var(--linha);border-radius:13px;padding:10px;flex-shrink:0}
.col h4{margin:2px 4px 10px;font-size:11.5px;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)}
.col h4 b{color:var(--texto)}.col h4 .ct{float:right;color:var(--dourado)}
.lead{background:var(--card);border:1px solid var(--linha);border-radius:11px;padding:10px;margin-bottom:9px;cursor:grab}
.lead:hover{border-color:var(--dourado)}
.lead b{font-size:13px}
.lead .a{display:inline-block;font-size:10px;font-weight:800;padding:2px 7px;border-radius:6px;margin:6px 4px 0 0}
.a.trab{background:rgba(109,179,242,.14);color:var(--azul)}
.a.prev{background:rgba(62,207,142,.14);color:var(--ok)}
.a.banc{background:rgba(232,184,75,.14);color:var(--dourado)}
.a.fam{background:rgba(181,140,230,.16);color:var(--roxo)}
.a.urg{background:rgba(255,107,94,.15);color:var(--erro)}
.lead .m{font-size:11px;color:var(--muted);margin-top:6px}
.lead .val{font-size:12px;color:var(--dourado);font-weight:800;margin-top:4px;font-variant-numeric:tabular-nums}
.lead .fu{font-size:10.5px;color:var(--dourado);margin-top:6px}
.twrap{overflow-x:auto;border:1px solid var(--linha);border-radius:14px}
table{width:100%;border-collapse:collapse;background:var(--card);min-width:720px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--linha);font-size:12.5px}
th{background:var(--card2);color:var(--muted);text-transform:uppercase;font-size:10.5px;letter-spacing:.5px}
tr:last-child td{border-bottom:none}
.st{font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:6px;white-space:nowrap}
.st.novo{background:#2a2a2a;color:#ccc}
.st.tri{background:rgba(109,179,242,.14);color:var(--azul)}
.st.reu{background:rgba(232,184,75,.16);color:var(--dourado)}
.st.neg{background:rgba(181,140,230,.16);color:var(--roxo)}
.st.fec{background:rgba(62,207,142,.16);color:var(--ok)}
.st.per{background:rgba(255,107,94,.13);color:var(--erro)}
.lk{color:var(--dourado);font-weight:700;font-size:12px;white-space:nowrap}
.sem{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
@media(max-width:820px){.sem{grid-template-columns:repeat(2,1fr)}}
.dia{background:var(--card2);border:1px solid var(--linha);border-radius:11px;padding:9px;min-height:110px}
.dia h5{margin:0 0 8px;font-size:10.5px;color:var(--muted);text-transform:uppercase}
.dia h5 b{color:var(--texto);font-size:13px;display:block}
.dia.fds{background:#101010}
.ev{background:var(--card);border-left:3px solid var(--dourado);border-radius:7px;padding:6px 8px;font-size:11px;margin-bottom:6px}
.ev b{display:block;font-size:11.5px}
.ev.fu2{border-left-color:var(--azul)}
/* seletor de visualização da agenda */
.vsw{display:inline-flex;background:var(--card);border:1px solid var(--linha);border-radius:9px;overflow:hidden}
.vsw button{background:none;border:none;color:var(--muted);font-weight:800;font-size:12.5px;padding:8px 14px;cursor:pointer;font-family:inherit}
.vsw button.on{background:rgba(232,184,75,.14);color:var(--dourado)}
/* visão MÊS */
.wkhd{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
.wkhd div{text-align:center;font-size:10.5px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;font-weight:800}
.mes{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.mdia{background:var(--card2);border:1px solid var(--linha);border-radius:9px;min-height:76px;padding:6px}
.mdia.fds{background:#101010}
.mdia.vazio{background:transparent;border-color:transparent}
.mdia.hoje{border-color:var(--dourado);box-shadow:0 0 0 1px var(--dourado)}
.mdia .num{font-size:11px;font-weight:800;color:var(--muted)}
.mdia.hoje .num{color:var(--dourado)}
.evm{display:block;font-size:9.5px;font-weight:700;border-radius:5px;padding:2px 5px;margin-top:4px;background:rgba(232,184,75,.16);color:var(--dourado);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.evm.f{background:rgba(109,179,242,.14);color:var(--azul)}
@media(max-width:700px){.mdia{min-height:56px}.evm{font-size:8.5px}}
/* visão DIA */
.diaview{max-width:560px}
.hslot{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid var(--linha)}
.hslot:last-child{border-bottom:none}
.hslot .h{width:52px;color:var(--muted);font-size:12px;font-weight:700;font-variant-numeric:tabular-nums}
.hslot .ev{flex:1;margin-bottom:0}
.hslot .livre{flex:1;color:#555;font-size:11.5px;align-self:center}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);display:none;align-items:center;justify-content:center;padding:16px;z-index:50}
.overlay.on{display:flex}
.modalmock{max-width:430px;width:100%;background:var(--card);border:1px solid var(--linha);border-radius:16px;padding:20px;max-height:92vh;overflow:auto}
.modalmock h3{margin:0 0 4px;font-size:17px;font-weight:800}
.modalmock label{display:block;font-size:12px;font-weight:700;color:#cfcabd;margin:12px 0 4px}
.modalmock .inp{background:var(--card2);border:1px solid var(--linha);border-radius:8px;padding:9px 11px;font-size:13px}
.duo{display:flex;gap:8px}.duo .inp{flex:1}
.check{font-size:12.5px;margin-top:10px}
.check span{color:var(--dourado);font-weight:800}
.orig-add{display:inline-block;border:1px dashed var(--dourado);color:var(--dourado);border-radius:8px;padding:8px 11px;font-size:12px;font-weight:700;cursor:pointer}
.aviso-mock{max-width:1100px;margin:0 auto;padding:8px 16px;background:rgba(232,184,75,.08);border-bottom:1px solid rgba(232,184,75,.25);color:#cfb877;font-size:11.5px;text-align:center}
</style>

<div class="aviso-mock">🎨 Maquete navegável — dados fictícios, nada conectado ao sistema real. Clique nas abas para passear pelas telas.</div>

<header>
  <div class="brand"><b><i>H</i>ENRIQUECER</b><span>CRM Jurídico · Júria</span></div>
  <nav class="nav">
    <button class="on" data-t="visao">Visão Geral</button>
    <button data-t="funil">Funil</button>
    <button data-t="leads">Leads</button>
    <button data-t="agenda">Agenda</button>
  </nav>
  <div class="avatar">HA</div>
</header>

<main>

<!-- VISÃO GERAL -->
<section id="visao" class="on">
  <div class="row">
    <h2>Bom dia, Dr. Henrique 👋</h2>
    <span class="chip">📅 Últimos 7 dias ▾</span>
  </div>
  <div class="pop">🔔 <div><b>2 follow-ups pendentes hoje:</b> Maria Souza (14h) e Carlos Lima (16h30) — <span style="color:var(--dourado);font-weight:700">ver agenda →</span></div></div>
  <div class="kpis">
    <div class="kpi"><div class="n">34</div><div class="l">Leads novos</div><div class="d">▲ 21% vs semana ant.</div></div>
    <div class="kpi"><div class="n">12</div><div class="l">Em triagem</div><div class="d">Júria atendendo</div></div>
    <div class="kpi"><div class="n">8</div><div class="l">Reuniões agendadas</div><div class="d">3 nesta semana</div></div>
    <div class="kpi"><div class="n">5</div><div class="l">Reuniões realizadas</div><div class="d">▲ 2 vs semana ant.</div></div>
    <div class="kpi"><div class="n">3</div><div class="l">Vendas fechadas</div><div class="d">conv. 8,8%</div></div>
    <div class="kpi"><div class="n">11min</div><div class="l">Tempo médio de triagem</div><div class="d">1º ao último contato</div></div>
  </div>
  <div class="g2">
    <div class="card chartwrap">
      <h3>Leads por dia <small>· novos contatos</small></h3>
      <div class="chart">
        <div class="bar" style="height:45%"><span>4</span><i>09/07</i></div>
        <div class="bar" style="height:66%"><span>6</span><i>10/07</i></div>
        <div class="bar" style="height:38%"><span>3</span><i>11/07</i></div>
        <div class="bar" style="height:80%"><span>7</span><i>12/07</i></div>
        <div class="bar" style="height:55%"><span>5</span><i>13/07</i></div>
        <div class="bar" style="height:100%"><span>9</span><i>14/07</i></div>
        <div class="bar" style="height:70%"><span>6</span><i>15/07</i></div>
      </div>
    </div>
    <div class="card">
      <h3>Reuniões da semana <small>· 3 pendentes</small></h3>
      <div class="meet"><div class="dt"><b>16</b><small>QUI</small></div><div class="who"><b>João Pereira</b><div>📱 (82) 99871-3344 · 10h00</div></div><div class="tag">Meet</div></div>
      <div class="meet"><div class="dt"><b>16</b><small>QUI</small></div><div class="who"><b>Ana Beatriz</b><div>📱 (82) 98765-1020 · 15h30</div></div><div class="tag">Meet</div></div>
      <div class="meet"><div class="dt"><b>18</b><small>SÁB</small></div><div class="who"><b>Carlos Lima</b><div>📱 (82) 99933-8172 · 09h00</div></div><div class="tag">Presencial</div></div>
    </div>
  </div>
  <div class="g2">
    <div class="card">
      <h3>💰 Retorno no período <small>· honorários</small></h3>
      <div class="hono">
        <div class="h green"><div class="v">R$ 7.400</div><div class="t">Iniciais recebidos</div></div>
        <div class="h gold"><div class="v">R$ 6.200</div><div class="t">A receber (parcelas)</div></div>
        <div class="h gold"><div class="v">R$ 38.000</div><div class="t">Estimativa de finais ✨</div></div>
        <div class="h"><div class="v">3</div><div class="t">Contratos fechados</div></div>
      </div>
    </div>
    <div class="card">
      <h3>Origem dos fechamentos</h3>
      <div class="orig">
        <div class="o"><b style="color:var(--dourado)">71%</b><small>📣 Anúncio</small></div>
        <div class="o"><b style="color:var(--azul)">18%</b><small>🤝 Indicação</small></div>
        <div class="o"><b style="color:var(--roxo)">11%</b><small>⭐ Parceria</small></div>
      </div>
      <div class="barra"><i></i></div>
      <p class="mini" style="margin:10px 0 0">O advogado pode cadastrar as próprias origens (parceria, evento, site...) — o CRM serve pra operação toda, não só pros leads da Júria.</p>
    </div>
  </div>
</section>

<!-- FUNIL -->
<section id="funil">
  <div class="row"><h2>Funil de atendimento</h2><div><span class="chip">⚖️ Todas as áreas ▾</span> <button class="btn">+ Novo lead manual</button></div></div>
  <div class="kb">
    <div class="col"><h4><b>Novo</b><span class="ct">3</span></h4>
      <div class="lead"><b>Roberta Nunes</b><br><span class="a prev">previdenciário</span><div class="m">🤖 Júria em triagem · há 8 min</div></div>
      <div class="lead"><b>Felipe Costa</b><br><span class="a banc">bancário</span><span class="a urg">urgente</span><div class="m">🤖 Júria em triagem · há 22 min</div></div>
      <div class="lead"><b>(sem nome ainda)</b><br><span class="a fam">família</span><div class="m">🤖 Júria em triagem · agora</div></div>
    </div>
    <div class="col"><h4><b>Qualificado</b><span class="ct">2</span></h4>
      <div class="lead"><b>Maria Souza</b><br><span class="a banc">bancário</span><div class="m">Financ. veículo · parcela R$ 890 · tem contrato ✅</div><div class="fu">🔔 follow-up hoje 14h</div></div>
      <div class="lead"><b>José Andrade</b><br><span class="a trab">trabalhista</span><div class="m">Demissão s/ justa causa · verbas em aberto</div></div>
    </div>
    <div class="col"><h4><b>Reunião agendada</b><span class="ct">3</span></h4>
      <div class="lead"><b>João Pereira</b><br><span class="a prev">previdenciário</span><div class="m">📅 qui 16/07 · 10h00 · Meet</div></div>
      <div class="lead"><b>Ana Beatriz</b><br><span class="a fam">família</span><div class="m">📅 qui 16/07 · 15h30 · Meet</div></div>
      <div class="lead"><b>Carlos Lima</b><br><span class="a banc">bancário</span><div class="m">📅 sáb 18/07 · 09h00 · presencial</div><div class="fu">🔔 confirmar véspera</div></div>
    </div>
    <div class="col"><h4><b>Proposta enviada</b><span class="ct">1</span></h4>
      <div class="lead"><b>Paulo Siqueira</b><br><span class="a trab">trabalhista</span><div class="m">Proposta enviada 13/07</div><div class="fu">🔔 follow-up amanhã 9h</div></div>
    </div>
    <div class="col"><h4><b>Negociação</b><span class="ct">1</span></h4>
      <div class="lead"><b>Luciana Prado</b><br><span class="a prev">previdenciário</span><div class="m">Pediu desconto na entrada</div></div>
    </div>
    <div class="col"><h4><b>✅ Fechado</b><span class="ct">3</span></h4>
      <div class="lead" id="abreFechamento" title="Clique para ver o registro de honorários"><b>Marcos Vieira</b><br><span class="a banc">bancário</span><div class="val">R$ 2.500 inicial + finais est. R$ 12.000</div><div class="m">origem: anúncio · <span style="color:var(--dourado)">clique aqui 👆</span></div></div>
      <div class="lead"><b>Sueli Ramos</b><br><span class="a prev">previdenciário</span><div class="val">R$ 1.900 inicial (3x)</div><div class="m">origem: indicação</div></div>
    </div>
    <div class="col"><h4><b>Perdido</b><span class="ct">2</span></h4>
      <div class="lead" style="opacity:.6"><b>Rafael T.</b><br><span class="a trab">trabalhista</span><div class="m">sem retorno após 5 contatos</div></div>
    </div>
  </div>
  <p class="mini">💡 As 2 primeiras colunas a <b style="color:var(--dourado)">Júria</b> move sozinha (sem custo — é registro no banco, não IA); do meio em diante o advogado arrasta. Clicar num card abre a conversa completa + anotações. <b style="color:var(--dourado)">Experimente clicar no card do Marcos Vieira na coluna Fechado.</b></p>
</section>

<!-- LEADS -->
<section id="leads">
  <div class="row"><h2>Todos os contatos</h2><div><span class="chip">🔎 Buscar…</span> <span class="chip">Área ▾</span> <span class="chip">Status ▾</span> <span class="chip">Origem ▾</span></div></div>
  <div class="twrap">
  <table>
    <thead><tr><th>Nome</th><th>Contato</th><th>Origem</th><th>Área</th><th>Status</th><th>Último contato</th><th></th></tr></thead>
    <tbody>
      <tr><td><b>Maria Souza</b></td><td>(82) 99123-4567</td><td>📣 Anúncio</td><td>Bancário</td><td><span class="st reu">follow-up</span></td><td>hoje, 11h02</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>João Pereira</b></td><td>(82) 99871-3344</td><td>📣 Anúncio</td><td>Previdenciário</td><td><span class="st reu">reunião agendada</span></td><td>ontem, 17h40</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Marcos Vieira</b></td><td>(82) 98456-7789</td><td>📣 Anúncio</td><td>Bancário</td><td><span class="st fec">venda fechada</span></td><td>12/07</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Sueli Ramos</b></td><td>(82) 99640-2211</td><td>🤝 Indicação</td><td>Previdenciário</td><td><span class="st fec">venda fechada</span></td><td>11/07</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Beatriz Falcão</b></td><td>(82) 99512-8890</td><td>⭐ Parceria</td><td>Família</td><td><span class="st neg">negociação</span></td><td>13/07</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Paulo Siqueira</b></td><td>(82) 98811-9034</td><td>📣 Anúncio</td><td>Trabalhista</td><td><span class="st neg">proposta enviada</span></td><td>13/07</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Roberta Nunes</b></td><td>(82) 99777-4152</td><td>📣 Anúncio</td><td>Previdenciário</td><td><span class="st tri">em triagem 🤖</span></td><td>há 8 min</td><td><span class="lk">ver conversa →</span></td></tr>
      <tr><td><b>Rafael Teixeira</b></td><td>(82) 98123-0987</td><td>📣 Anúncio</td><td>Trabalhista</td><td><span class="st per">perdido</span></td><td>08/07</td><td><span class="lk">ver conversa →</span></td></tr>
    </tbody>
  </table>
  </div>
</section>

<!-- AGENDA -->
<section id="agenda">
  <div class="row">
    <h2 id="agTitulo">Julho de 2026</h2>
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
      <div class="vsw">
        <button class="on" data-v="vMes">Mês</button>
        <button data-v="vSem">Semana</button>
        <button data-v="vDia">Dia</button>
      </div>
      <button class="btn ghost">‹</button> <button class="btn ghost">›</button>
      <button class="btn">+ Agendar</button>
    </div>
  </div>

  <!-- VISÃO MÊS (padrão) -->
  <div id="vMes">
    <div class="wkhd"><div>dom</div><div>seg</div><div>ter</div><div>qua</div><div>qui</div><div>sex</div><div>sáb</div></div>
    <div class="mes">
      <div class="mdia vazio"></div><div class="mdia vazio"></div><div class="mdia vazio"></div>
      <div class="mdia"><span class="num">1</span></div>
      <div class="mdia"><span class="num">2</span></div>
      <div class="mdia"><span class="num">3</span></div>
      <div class="mdia fds"><span class="num">4</span></div>
      <div class="mdia fds"><span class="num">5</span></div>
      <div class="mdia"><span class="num">6</span></div>
      <div class="mdia"><span class="num">7</span></div>
      <div class="mdia"><span class="num">8</span></div>
      <div class="mdia"><span class="num">9</span></div>
      <div class="mdia"><span class="num">10</span></div>
      <div class="mdia fds"><span class="num">11</span></div>
      <div class="mdia fds"><span class="num">12</span></div>
      <div class="mdia"><span class="num">13</span></div>
      <div class="mdia"><span class="num">14</span></div>
      <div class="mdia hoje"><span class="num">15 · hoje</span><span class="evm f">🔔 14h Maria</span><span class="evm f">🔔 16h30 Carlos</span></div>
      <div class="mdia"><span class="num">16</span><span class="evm">🤝 10h João</span><span class="evm">🤝 15h30 Ana</span></div>
      <div class="mdia"><span class="num">17</span><span class="evm f">🔔 9h Paulo</span></div>
      <div class="mdia fds"><span class="num">18</span><span class="evm">🤝 9h Carlos</span></div>
      <div class="mdia fds"><span class="num">19</span></div>
      <div class="mdia"><span class="num">20</span></div>
      <div class="mdia"><span class="num">21</span></div>
      <div class="mdia"><span class="num">22</span><span class="evm">🤝 11h Luciana</span></div>
      <div class="mdia"><span class="num">23</span></div>
      <div class="mdia"><span class="num">24</span></div>
      <div class="mdia fds"><span class="num">25</span></div>
      <div class="mdia fds"><span class="num">26</span><span class="evm">🤝 17h Beatriz</span></div>
      <div class="mdia"><span class="num">27</span></div>
      <div class="mdia"><span class="num">28</span></div>
      <div class="mdia"><span class="num">29</span></div>
      <div class="mdia"><span class="num">30</span></div>
      <div class="mdia"><span class="num">31</span></div>
      <div class="mdia vazio"></div>
    </div>
  </div>

  <!-- VISÃO SEMANA -->
  <div id="vSem" style="display:none">
    <div class="sem">
      <div class="dia fds"><h5>DOM<b>12/07</b></h5></div>
      <div class="dia"><h5>SEG<b>13/07</b></h5></div>
      <div class="dia"><h5>TER<b>14/07</b></h5></div>
      <div class="dia"><h5>QUA<b>15/07 · hoje</b></h5><div class="ev fu2"><b>🔔 Follow-up</b>Maria Souza · 14h</div><div class="ev fu2"><b>🔔 Follow-up</b>Carlos Lima · 16h30</div></div>
      <div class="dia"><h5>QUI<b>16/07</b></h5><div class="ev"><b>🤝 Reunião · Meet</b>João Pereira · 10h</div><div class="ev"><b>🤝 Reunião · Meet</b>Ana Beatriz · 15h30</div></div>
      <div class="dia"><h5>SEX<b>17/07</b></h5><div class="ev fu2"><b>🔔 Follow-up</b>Paulo Siqueira · 9h</div></div>
      <div class="dia fds"><h5>SÁB<b>18/07</b></h5><div class="ev"><b>🤝 Reunião · presencial</b>Carlos Lima · 9h</div></div>
    </div>
  </div>

  <!-- VISÃO DIA -->
  <div id="vDia" style="display:none">
    <div class="card diaview">
      <h3>Quinta-feira, 16/07 <small>· 2 compromissos</small></h3>
      <div class="hslot"><div class="h">09h</div><div class="livre">— livre —</div></div>
      <div class="hslot"><div class="h">10h</div><div class="ev"><b>🤝 Reunião · Meet</b>João Pereira · (82) 99871-3344 · previdenciário</div></div>
      <div class="hslot"><div class="h">11h</div><div class="livre">— livre —</div></div>
      <div class="hslot"><div class="h">14h</div><div class="livre">— livre —</div></div>
      <div class="hslot"><div class="h">15h30</div><div class="ev"><b>🤝 Reunião · Meet</b>Ana Beatriz · (82) 98765-1020 · família</div></div>
      <div class="hslot"><div class="h">17h</div><div class="livre">— livre —</div></div>
    </div>
  </div>

  <p class="mini" style="margin-top:12px">💡 Visualização padrão: <b style="color:var(--dourado)">mês inteiro</b>, com sábados e domingos (reunião acontece em fim de semana também). Alterne para Semana ou Dia nos botões acima. Ao agendar: reunião (Meet/presencial — o link do Meet ele cola do próprio Google) ou follow-up (lembrete). Os lembretes do dia aparecem no topo da Visão Geral.</p>
</section>

</main>

<!-- MODAL FECHAMENTO -->
<div class="overlay" id="ovl">
  <div class="modalmock">
    <h3>🎉 Fechou com Marcos Vieira!</h3>
    <p class="mini">Registre os honorários para acompanhar seu retorno.</p>
    <label>Honorários iniciais</label>
    <div class="duo"><div class="inp">R$ 2.500,00 (cobrado)</div><div class="inp">R$ 1.000,00 (recebido)</div></div>
    <label>Parcelamento do restante</label>
    <div class="inp">3x de R$ 500,00</div>
    <label>Honorários finais (estimativa) <span class="mini">· opcional</span></label>
    <div class="inp">R$ 12.000,00 — êxito estimado</div>
    <label>Origem do cliente</label>
    <div class="duo">
      <div class="inp" style="border-color:var(--dourado);color:var(--dourado);font-weight:800">📣 Anúncio</div>
      <div class="inp">🤝 Indicação</div>
      <div class="inp">⭐ Parceria</div>
    </div>
    <div style="margin-top:8px"><span class="orig-add">+ cadastrar nova origem</span></div>
    <div class="check">✔ Soma <span>R$ 2.500 + est. R$ 12.000</span> no painel de retorno.</div>
    <button class="btn" style="width:100%;margin-top:14px" onclick="document.getElementById('ovl').classList.remove('on')">Salvar fechamento</button>
    <button class="btn ghost" style="width:100%;margin-top:8px" onclick="document.getElementById('ovl').classList.remove('on')">Fechar</button>
  </div>
</div>

<script>
document.querySelectorAll('.nav button').forEach(function(b){
  b.addEventListener('click', function(){
    document.querySelectorAll('.nav button').forEach(function(x){x.classList.remove('on')});
    document.querySelectorAll('main section').forEach(function(s){s.classList.remove('on')});
    b.classList.add('on');
    document.getElementById(b.dataset.t).classList.add('on');
    window.scrollTo({top:0});
  });
});
var tituloAgenda = { vMes: 'Julho de 2026', vSem: 'Semana de 12 a 18/07', vDia: 'Quinta-feira, 16/07' };
document.querySelectorAll('.vsw button').forEach(function(b){
  b.addEventListener('click', function(){
    document.querySelectorAll('.vsw button').forEach(function(x){x.classList.remove('on')});
    ['vMes','vSem','vDia'].forEach(function(id){document.getElementById(id).style.display='none'});
    b.classList.add('on');
    document.getElementById(b.dataset.v).style.display='block';
    document.getElementById('agTitulo').textContent = tituloAgenda[b.dataset.v];
  });
});
document.getElementById('abreFechamento').addEventListener('click', function(){
  document.getElementById('ovl').classList.add('on');
});
document.getElementById('ovl').addEventListener('click', function(e){
  if(e.target === this) this.classList.remove('on');
});
</script>
</html>`;

export async function maqueteRoutes(app: FastifyInstance): Promise<void> {
  app.get('/maquete-crm', async (_req, reply) => {
    reply.header('Content-Type', 'text/html; charset=utf-8').send(HTML);
  });
}
