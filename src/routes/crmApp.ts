import type { FastifyInstance } from 'fastify';

// CRM HENRIQUECER — aplicação do advogado, servida em /crm.
// Página única que consome /api/crm/*. Identidade: preto + dourado.

const HTML = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CRM · HENRIQUECER</title>
<style>
:root{--bg:#0d0d0d;--preto:#000;--card:#191919;--card2:#141414;--dourado:#e8b84b;--dourado2:#d1a238;
--texto:#f4f2ec;--muted:#9b968c;--linha:#2b2b2b;--ok:#3ecf8e;--erro:#ff6b5e;--azul:#6db3f2;--roxo:#b58ce6;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}
html{color-scheme:dark}
body{margin:0;background:var(--bg);color:var(--texto);font-family:var(--sans);font-size:14px;line-height:1.45}
.hidden{display:none!important}
button{font-family:inherit}
/* ---------- login ---------- */
.login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#1a1a1a,#000);padding:20px}
.login .box{background:var(--card);border-radius:18px;padding:34px;max-width:380px;width:100%;text-align:center;border:1px solid var(--linha);border-top:3px solid var(--dourado)}
.logoH{width:60px;height:60px;margin:0 auto 12px;border:3px solid var(--dourado);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:900;color:var(--dourado)}
.login b{font-size:22px;font-weight:800;letter-spacing:3px}
.login .sub{display:block;font-size:10px;letter-spacing:4px;color:var(--dourado);text-transform:uppercase;margin:2px 0 20px}
label{display:block;font-size:12.5px;font-weight:700;margin:12px 0 4px;color:#cfcabd;text-align:left}
input,select,textarea{font-family:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--linha);border-radius:9px;width:100%;background:var(--card2);color:var(--texto)}
input::placeholder,textarea::placeholder{color:#6b6b6b}
.erroMsg{color:var(--erro);font-size:13px;margin-top:10px;min-height:16px}
.btn{background:var(--dourado);color:#171717;border:none;padding:10px 16px;border-radius:9px;cursor:pointer;font-weight:800;font-size:13.5px}
.btn:hover{background:var(--dourado2)}
.btn:disabled{opacity:.55;cursor:default}
.btn.ghost{background:transparent;border:1px solid var(--linha);color:var(--dourado);font-weight:700}
.btn.ghost:hover{background:#1f1f1f}
.btn.sm{padding:7px 11px;font-size:12.5px}
/* ---------- layout sidebar ---------- */
.app{display:flex;min-height:100vh}
aside{width:210px;background:var(--preto);border-right:1px solid var(--linha);padding:16px 10px;display:flex;flex-direction:column;gap:4px;position:sticky;top:0;height:100vh}
aside .marca{padding:4px 10px 16px}
aside .marca b{font-size:15px;font-weight:800;letter-spacing:2px}
aside .marca b i{color:var(--dourado);font-style:normal}
aside .marca span{display:block;font-size:8.5px;letter-spacing:3px;color:var(--dourado);text-transform:uppercase}
aside button.mi{display:flex;align-items:center;gap:10px;background:none;border:none;color:var(--muted);font-weight:700;font-size:13.5px;padding:10px 12px;border-radius:9px;cursor:pointer;text-align:left;width:100%}
aside button.mi.on{color:var(--dourado);background:rgba(232,184,75,.12)}
aside button.mi:hover{background:#151515}
aside .rodape{margin-top:auto;padding:10px;font-size:11px;color:var(--muted)}
aside .rodape b{color:var(--texto);display:block;font-size:12px}
aside .sair{color:var(--erro);background:none;border:none;font-size:12px;cursor:pointer;padding:4px 0;font-weight:700}
.conteudo{flex:1;padding:22px 20px 70px;max-width:1150px;min-width:0}
@media(max-width:760px){
  .app{flex-direction:column}
  aside{width:100%;height:auto;position:static;flex-direction:row;flex-wrap:wrap;align-items:center}
  aside .marca{padding:4px 8px}
  aside button.mi{width:auto;padding:8px 10px;font-size:12.5px}
  aside .rodape{margin:0 0 0 auto;padding:4px 8px}
}
.row{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}
h2{font-weight:800;font-size:20px;margin:0}
.mini{font-size:11.5px;color:var(--muted)}
.chip{background:var(--card);border:1px solid var(--linha);padding:8px 12px;border-radius:9px;font-weight:700;font-size:12.5px}
/* KPIs / cards */
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}
.kpi{background:var(--card);border:1px solid var(--linha);border-radius:13px;padding:13px}
.kpi .n{font-size:24px;font-weight:900;color:var(--dourado);font-variant-numeric:tabular-nums}
.kpi .l{font-size:10.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.g2{display:grid;grid-template-columns:1.4fr 1fr;gap:12px;margin-top:12px}
@media(max-width:900px){.g2{grid-template-columns:1fr}}
.card{background:var(--card);border:1px solid var(--linha);border-radius:14px;padding:16px}
.card h3{margin:0 0 12px;font-size:13.5px;font-weight:800}
.card h3 small{color:var(--muted);font-weight:600}
.chart{display:flex;align-items:flex-end;gap:5px;height:120px;padding-top:16px}
.bar{flex:1;background:linear-gradient(180deg,var(--dourado),#8a6a1f);border-radius:5px 5px 2px 2px;position:relative;min-width:6px}
.bar span{position:absolute;top:-17px;left:0;right:0;text-align:center;font-size:10px;font-weight:800;color:var(--dourado)}
.bar i{position:absolute;bottom:-17px;left:0;right:0;text-align:center;font-size:9px;color:var(--muted);font-style:normal;white-space:nowrap;overflow:hidden}
.chartwrap{padding-bottom:20px}
.pop{background:rgba(232,184,75,.1);border:1px solid rgba(232,184,75,.4);border-radius:12px;padding:11px 13px;margin:12px 0;font-size:13px}
.pop b{color:var(--dourado)}
.meet{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--linha);font-size:13px}
.meet:last-child{border-bottom:none}
.meet .dt{background:var(--card2);border:1px solid var(--linha);border-radius:9px;padding:5px 8px;text-align:center;min-width:50px}
.meet .dt b{display:block;font-size:14px;color:var(--dourado)}
.meet .dt small{font-size:9.5px;color:var(--muted);text-transform:uppercase}
.hono{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px}
.hono .h{background:var(--card2);border:1px solid var(--linha);border-radius:11px;padding:11px}
.hono .h .v{font-size:18px;font-weight:900;font-variant-numeric:tabular-nums}
.hono .h.gold .v{color:var(--dourado)}.hono .h.green .v{color:var(--ok)}
.hono .h .t{font-size:10px;color:var(--muted);font-weight:700;text-transform:uppercase}
.orig{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.orig .o{flex:1;min-width:88px;background:var(--card2);border:1px solid var(--linha);border-radius:10px;padding:10px;text-align:center}
.orig .o b{font-size:16px;display:block;color:var(--dourado)}
.orig .o small{color:var(--muted);font-size:11px}
/* kanban */
.kb{display:flex;gap:10px;overflow-x:auto;padding-bottom:10px}
.col{min-width:205px;background:var(--card2);border:1px solid var(--linha);border-radius:13px;padding:9px;flex-shrink:0}
.col.drag{border-color:var(--dourado)}
.col h4{margin:2px 4px 9px;font-size:11px;letter-spacing:.5px;text-transform:uppercase;color:var(--muted)}
.col h4 b{color:var(--texto)}.col h4 .ct{float:right;color:var(--dourado)}
.leadc{background:var(--card);border:1px solid var(--linha);border-radius:11px;padding:9px;margin-bottom:8px;cursor:grab}
.leadc:hover{border-color:var(--dourado)}
.leadc b{font-size:12.5px}
.leadc .a{display:inline-block;font-size:9.5px;font-weight:800;padding:2px 6px;border-radius:6px;margin:5px 4px 0 0;background:rgba(232,184,75,.14);color:var(--dourado)}
.leadc .a.urg{background:rgba(255,107,94,.15);color:var(--erro)}
.leadc .m{font-size:10.5px;color:var(--muted);margin-top:5px}
/* tabela */
.twrap{overflow-x:auto;border:1px solid var(--linha);border-radius:14px}
table{width:100%;border-collapse:collapse;background:var(--card);min-width:680px}
th,td{text-align:left;padding:10px 12px;border-bottom:1px solid var(--linha);font-size:12.5px}
th{background:var(--card2);color:var(--muted);text-transform:uppercase;font-size:10px;letter-spacing:.5px}
tr:last-child td{border-bottom:none}
tbody tr{cursor:pointer}
tbody tr:hover{background:#1d1d1d}
.st{font-size:10px;font-weight:800;padding:3px 8px;border-radius:6px;white-space:nowrap;background:#2a2a2a;color:#ccc}
.st.qualificado{background:rgba(109,179,242,.14);color:var(--azul)}
.st.reuniao{background:rgba(232,184,75,.16);color:var(--dourado)}
.st.proposta,.st.negociacao{background:rgba(181,140,230,.16);color:var(--roxo)}
.st.fechado{background:rgba(62,207,142,.16);color:var(--ok)}
.st.perdido{background:rgba(255,107,94,.13);color:var(--erro)}
.vazio{color:var(--muted);padding:38px;text-align:center}
/* conversas */
.convgrid{display:grid;grid-template-columns:280px 1fr;gap:12px;min-height:420px}
@media(max-width:800px){.convgrid{grid-template-columns:1fr}}
.convlist{background:var(--card);border:1px solid var(--linha);border-radius:14px;overflow:auto;max-height:70vh}
.convitem{padding:11px 13px;border-bottom:1px solid var(--linha);cursor:pointer}
.convitem:hover,.convitem.on{background:#1d1d1d}
.convitem b{font-size:13px;display:block}
.convitem small{color:var(--muted);font-size:11px}
.chat{background:var(--card);border:1px solid var(--linha);border-radius:14px;padding:14px;overflow:auto;max-height:70vh;display:flex;flex-direction:column;gap:8px}
.balao{max-width:78%;padding:8px 12px;border-radius:12px;font-size:13px;white-space:pre-wrap}
.balao.lead{background:#242424;align-self:flex-start;border-bottom-left-radius:3px}
.balao.ia{background:rgba(232,184,75,.15);border:1px solid rgba(232,184,75,.25);align-self:flex-end;border-bottom-right-radius:3px}
.balao small{display:block;font-size:9.5px;color:var(--muted);margin-top:3px}
/* agenda */
.vsw{display:inline-flex;background:var(--card);border:1px solid var(--linha);border-radius:9px;overflow:hidden}
.vsw button{background:none;border:none;color:var(--muted);font-weight:800;font-size:12.5px;padding:8px 13px;cursor:pointer}
.vsw button.on{background:rgba(232,184,75,.14);color:var(--dourado)}
.wkhd{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:6px}
.wkhd div{text-align:center;font-size:10px;letter-spacing:1px;color:var(--muted);text-transform:uppercase;font-weight:800}
.mes{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.mdia{background:var(--card2);border:1px solid var(--linha);border-radius:9px;min-height:74px;padding:5px}
.mdia.fds{background:#101010}
.mdia.vazio2{background:transparent;border-color:transparent}
.mdia.hoje{border-color:var(--dourado);box-shadow:0 0 0 1px var(--dourado)}
.mdia .num{font-size:10.5px;font-weight:800;color:var(--muted)}
.mdia.hoje .num{color:var(--dourado)}
.evm{display:block;font-size:9px;font-weight:700;border-radius:5px;padding:2px 5px;margin-top:3px;background:rgba(232,184,75,.16);color:var(--dourado);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;cursor:pointer}
.evm.f{background:rgba(109,179,242,.14);color:var(--azul)}
.sem7{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
@media(max-width:820px){.sem7{grid-template-columns:repeat(2,1fr)}.mdia{min-height:54px}}
.dia7{background:var(--card2);border:1px solid var(--linha);border-radius:11px;padding:8px;min-height:105px}
.dia7.fds{background:#101010}
.dia7 h5{margin:0 0 7px;font-size:10px;color:var(--muted);text-transform:uppercase}
.dia7 h5 b{color:var(--texto);font-size:12.5px;display:block}
.ev{background:var(--card);border-left:3px solid var(--dourado);border-radius:7px;padding:5px 8px;font-size:11px;margin-bottom:6px;cursor:pointer}
.ev b{display:block;font-size:11px}
.ev.f{border-left-color:var(--azul)}
/* modal / drawer */
.overlay{position:fixed;inset:0;background:rgba(0,0,0,.78);display:flex;align-items:center;justify-content:center;padding:16px;z-index:50}
.modal{max-width:460px;width:100%;background:var(--card);border:1px solid var(--linha);border-radius:16px;padding:20px;max-height:92vh;overflow:auto}
.modal h3{margin:0 0 4px;font-size:17px;font-weight:800}
.modal .fechar{float:right;background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted);line-height:1}
.duo{display:flex;gap:8px}.duo>*{flex:1}
</style>
</head>
<body>

<div id="telaLogin" class="login">
  <div class="box">
    <div class="logoH">H</div>
    <b>HENRIQUECER</b><span class="sub">CRM Jurídico · Júria</span>
    <label>E-mail</label><input id="lEmail" type="email" placeholder="seu@email.com"/>
    <label>Senha</label><input id="lSenha" type="password" placeholder="••••••••"/>
    <div class="erroMsg" id="lErro"></div>
    <button class="btn" style="width:100%;margin-top:12px" onclick="fazerLogin()">Entrar</button>
  </div>
</div>

<div id="telaApp" class="app hidden">
  <aside>
    <div class="marca"><b><i>H</i>ENRIQUECER</b><span>CRM Jurídico</span></div>
    <button class="mi on" data-v="painel" onclick="irPara('painel')">📊 Painel de controle</button>
    <button class="mi" data-v="funil" onclick="irPara('funil')">🎯 Funil</button>
    <button class="mi" data-v="leads" onclick="irPara('leads')">👥 Leads</button>
    <button class="mi" data-v="conversas" onclick="irPara('conversas')">💬 Conversas</button>
    <button class="mi" data-v="agenda" onclick="irPara('agenda')">📅 Agenda</button>
    <div class="rodape"><b id="uNome"></b><span id="uEsc"></span><br/><button class="sair" onclick="sair()">Sair</button></div>
  </aside>
  <div class="conteudo">
    <div id="vw-painel"></div>
    <div id="vw-funil" class="hidden"></div>
    <div id="vw-leads" class="hidden"></div>
    <div id="vw-conversas" class="hidden"></div>
    <div id="vw-agenda" class="hidden"></div>
  </div>
</div>

<div id="modal"></div>

<script>
// =============== infra ===============
var TK='crm_token';
var LEADS=[]; var ORIGENS=['anúncio','indicação']; var EVENTOS=[];
var ETAPAS=[['novo','Novo'],['qualificado','Qualificado'],['reuniao','Reunião agendada'],['proposta','Proposta enviada'],['negociacao','Negociação'],['fechado','✅ Fechado'],['perdido','Perdido']];
function tk(){return localStorage.getItem(TK)||''}
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function dinheiro(v){return 'R$ '+Number(v||0).toLocaleString('pt-BR',{minimumFractionDigits:0,maximumFractionDigits:0})}
function api(path,opts){
  opts=opts||{};
  opts.headers=Object.assign({'Content-Type':'application/json','Authorization':'Bearer '+tk()},opts.headers||{});
  return fetch(path,opts).then(function(r){
    if(r.status===401){sair();throw new Error('sessão expirada')}
    return r.text().then(function(t){var d;try{d=t?JSON.parse(t):{}}catch(e){d={}}
      if(!r.ok)throw new Error(d.error||('erro '+r.status));return d});
  });
}
function fazerLogin(){
  var email=document.getElementById('lEmail').value.trim();
  var senha=document.getElementById('lSenha').value;
  if(!email||!senha)return;
  fetch('/api/crm/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,senha:senha})})
    .then(function(r){return r.json().then(function(d){if(!r.ok)throw new Error(d.error||'erro');return d})})
    .then(function(d){localStorage.setItem(TK,d.token);localStorage.setItem('crm_nome',d.nome||'');localStorage.setItem('crm_esc',d.escritorio||'');iniciar()})
    .catch(function(e){document.getElementById('lErro').textContent=e.message});
}
function sair(){localStorage.removeItem(TK);document.getElementById('telaApp').classList.add('hidden');document.getElementById('telaLogin').classList.remove('hidden')}
function iniciar(){
  document.getElementById('telaLogin').classList.add('hidden');
  document.getElementById('telaApp').classList.remove('hidden');
  document.getElementById('uNome').textContent=localStorage.getItem('crm_nome')||'';
  document.getElementById('uEsc').textContent=localStorage.getItem('crm_esc')||'';
  api('/api/crm/origens').then(function(d){ORIGENS=d.origens}).catch(function(){});
  irPara('painel');
}
function irPara(v){
  document.querySelectorAll('aside .mi').forEach(function(b){b.classList.toggle('on',b.dataset.v===v)});
  ['painel','funil','leads','conversas','agenda'].forEach(function(x){document.getElementById('vw-'+x).classList.toggle('hidden',x!==v)});
  if(v==='painel')renderPainel(7);
  if(v==='funil')carregarLeads().then(renderFunil);
  if(v==='leads')carregarLeads().then(renderLeads);
  if(v==='conversas')carregarLeads().then(renderConversas);
  if(v==='agenda')renderAgenda();
}
function carregarLeads(){return api('/api/crm/leads').then(function(d){LEADS=d.leads;return LEADS})}
function fecharModal(){document.getElementById('modal').innerHTML=''}
function abrirModal(html){document.getElementById('modal').innerHTML='<div class="overlay" onclick="if(event.target===this)fecharModal()"><div class="modal">'+html+'</div></div>'}

// =============== PAINEL ===============
function renderPainel(dias){
  var el=document.getElementById('vw-painel');
  el.innerHTML='<div class="vazio">Carregando…</div>';
  api('/api/crm/dashboard?dias='+dias).then(function(d){
    var k=d.kpis,h='';
    h+='<div class="row"><h2>Painel de controle</h2><select style="max-width:170px" onchange="renderPainel(this.value)">';
    [[7,'Últimos 7 dias'],[30,'Últimos 30 dias'],[90,'Últimos 90 dias']].forEach(function(o){
      h+='<option value="'+o[0]+'"'+(Number(dias)===o[0]?' selected':'')+'>'+o[1]+'</option>'});
    h+='</select></div>';
    // lembretes de follow-up de hoje
    var hoje=new Date().toISOString().slice(0,10);
    var fups=(d.reunioes_semana||[]).filter(function(e){return e.tipo==='followup'&&String(e.inicio).slice(0,10)===hoje});
    if(fups.length)h+='<div class="pop">🔔 <b>'+fups.length+' follow-up(s) hoje:</b> '+fups.map(function(e){return esc(e.titulo)}).join(' · ')+'</div>';
    h+='<div class="kpis">';
    [[k.leads_novos,'Leads novos'],[k.em_triagem,'Em triagem'],[k.reunioes_agendadas,'Reuniões agendadas'],[k.reunioes_realizadas,'Reuniões realizadas'],[k.fechadas,'Vendas fechadas'],[k.tempo_medio_min+'min','Tempo médio triagem']].forEach(function(x){
      h+='<div class="kpi"><div class="n">'+x[0]+'</div><div class="l">'+x[1]+'</div></div>'});
    h+='</div>';
    // gráfico + reuniões
    var max=Math.max.apply(null,d.serie.map(function(s){return s.total}).concat([1]));
    h+='<div class="g2"><div class="card chartwrap"><h3>Leads por dia</h3><div class="chart">';
    var passo=Math.max(1,Math.ceil(d.serie.length/15));
    d.serie.forEach(function(s,i){
      var alt=Math.round(s.total/max*100);
      var lbl=(i%passo===0)?s.dia.slice(8,10)+'/'+s.dia.slice(5,7):'';
      h+='<div class="bar" style="height:'+Math.max(alt,3)+'%"><span>'+(s.total||'')+'</span><i>'+lbl+'</i></div>'});
    h+='</div></div>';
    h+='<div class="card"><h3>Próximas reuniões <small>· 7 dias</small></h3>';
    var reunioes=(d.reunioes_semana||[]).filter(function(e){return e.tipo!=='followup'});
    if(!reunioes.length)h+='<div class="mini" style="padding:14px 0">Nenhuma reunião agendada. Use a Agenda pra marcar. 📅</div>';
    reunioes.forEach(function(e){
      var dt=new Date(e.inicio);
      h+='<div class="meet"><div class="dt"><b>'+dt.getDate()+'</b><small>'+dt.toLocaleDateString('pt-BR',{weekday:'short'})+'</small></div>'+
         '<div><b>'+esc(e.titulo)+'</b><div class="mini">'+dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})+' · '+esc(e.local||'')+'</div></div></div>'});
    h+='</div></div>';
    // honorários + origem
    var ho=d.honorarios;
    h+='<div class="g2"><div class="card"><h3>💰 Retorno no período</h3><div class="hono">'+
      '<div class="h green"><div class="v">'+dinheiro(ho.inicial_recebido)+'</div><div class="t">Iniciais recebidos</div></div>'+
      '<div class="h gold"><div class="v">'+dinheiro(ho.inicial_total-ho.inicial_recebido)+'</div><div class="t">A receber</div></div>'+
      '<div class="h gold"><div class="v">'+dinheiro(ho.finais_estimados)+'</div><div class="t">Estimativa de finais ✨</div></div>'+
      '<div class="h"><div class="v">'+ho.contratos+'</div><div class="t">Contratos fechados</div></div></div></div>';
    h+='<div class="card"><h3>Origem dos fechamentos</h3><div class="orig">';
    var tot=Object.values(d.origens).reduce(function(a,b){return a+b},0);
    if(!tot)h+='<div class="mini" style="padding:10px">Registre fechamentos para ver as origens.</div>';
    Object.keys(d.origens).forEach(function(o){
      h+='<div class="o"><b>'+Math.round(d.origens[o]/tot*100)+'%</b><small>'+esc(o)+'</small></div>'});
    h+='</div></div></div>';
    el.innerHTML=h;
  }).catch(function(e){el.innerHTML='<div class="vazio">Erro: '+esc(e.message)+'</div>'});
}

// =============== FUNIL ===============
function renderFunil(){
  var el=document.getElementById('vw-funil'),h='';
  h+='<div class="row"><h2>Funil</h2><button class="btn" onclick="modalNovoLead()">+ Novo lead manual</button></div><div class="kb">';
  ETAPAS.forEach(function(et){
    var lista=LEADS.filter(function(l){return (l.etapa||'novo')===et[0]});
    h+='<div class="col" data-et="'+et[0]+'" ondragover="event.preventDefault();this.classList.add(\\'drag\\')" ondragleave="this.classList.remove(\\'drag\\')" ondrop="soltarLead(event,this)">';
    h+='<h4><b>'+et[1]+'</b><span class="ct">'+lista.length+'</span></h4>';
    lista.forEach(function(l){
      var c=l.conversations||{};
      h+='<div class="leadc" draggable="true" ondragstart="event.dataTransfer.setData(\\'text\\','+JSON.stringify(l.id).replace(/"/g,'&quot;')+')" onclick="abrirLead(\\''+l.id+'\\')">';
      h+='<b>'+esc(l.nome||c.nome_contato||'(sem nome)')+'</b><br/>';
      if(l.area_juridica)h+='<span class="a">'+esc(l.area_juridica)+'</span>';
      if((l.urgencia||'')==='alta')h+='<span class="a urg">urgente</span>';
      if(l.resumo_caso)h+='<div class="m">'+esc(String(l.resumo_caso).slice(0,90))+'</div>';
      h+='</div>'});
    h+='</div>'});
  h+='</div><p class="mini">💡 Arraste os cards entre as colunas. As duas primeiras a Júria move sozinha. Clique num card para ver a conversa e anotar.</p>';
  el.innerHTML=h;
}
function soltarLead(ev,colEl){
  ev.preventDefault();colEl.classList.remove('drag');
  var id=ev.dataTransfer.getData('text');var etapa=colEl.dataset.et;
  var lead=LEADS.find(function(l){return l.id===id});
  if(!lead||lead.etapa===etapa)return;
  if(etapa==='fechado'){modalFechamento(lead);return}
  api('/api/crm/leads/'+id,{method:'PATCH',body:JSON.stringify({etapa:etapa})})
    .then(function(){lead.etapa=etapa;renderFunil()})
    .catch(function(e){alert('Erro: '+e.message)});
}
function abrirLead(id){
  var l=LEADS.find(function(x){return x.id===id});if(!l)return;
  var c=l.conversations||{};
  var h='<button class="fechar" onclick="fecharModal()">×</button><h3>'+esc(l.nome||c.nome_contato||'(sem nome)')+'</h3>';
  h+='<div class="mini">'+esc(l.area_juridica||'área não identificada')+(c.contato?' · 📱 '+esc(c.contato):'')+' · origem: '+esc(l.origem||'anúncio')+'</div>';
  if(l.resumo_caso)h+='<p style="font-size:13px">'+esc(l.resumo_caso)+'</p>';
  h+='<label>Anotações</label><textarea id="nts" rows="3">'+esc(l.notas||'')+'</textarea>';
  h+='<div class="duo" style="margin-top:10px"><button class="btn sm" onclick="salvarNotas(\\''+l.id+'\\')">Salvar anotações</button>'+
     '<button class="btn ghost sm" onclick="modalAgendar(\\''+l.id+'\\')">📅 Agendar</button></div>';
  h+='<div id="convBox" style="margin-top:14px" class="mini">Carregando conversa…</div>';
  abrirModal(h);
  api('/api/crm/leads/'+id+'/mensagens').then(function(d){
    var box=document.getElementById('convBox');if(!box)return;
    if(!d.mensagens.length){box.innerHTML='<i>Sem conversa registrada (lead manual).</i>';return}
    var hh='<div class="chat" style="max-height:300px">';
    d.mensagens.forEach(function(m){
      hh+='<div class="balao '+(m.role==='user'?'lead':'ia')+'">'+esc(m.content)+'<small>'+new Date(m.created_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+(m.role==='assistant'?' · Júria':'')+'</small></div>'});
    box.innerHTML=hh+'</div>';
  }).catch(function(){});
}
function salvarNotas(id){
  api('/api/crm/leads/'+id,{method:'PATCH',body:JSON.stringify({notas:document.getElementById('nts').value})})
    .then(function(){var l=LEADS.find(function(x){return x.id===id});if(l)l.notas=document.getElementById('nts').value;fecharModal()})
    .catch(function(e){alert('Erro: '+e.message)});
}
function modalNovoLead(){
  var h='<button class="fechar" onclick="fecharModal()">×</button><h3>Novo lead manual</h3>'+
  '<label>Nome *</label><input id="nl_nome"/><label>Contato (WhatsApp)</label><input id="nl_ctt" placeholder="82999998888"/>'+
  '<label>Área</label><input id="nl_area" placeholder="previdenciário"/>'+
  '<label>Origem</label><select id="nl_orig">'+ORIGENS.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select>'+
  '<div class="erroMsg" id="nl_erro"></div><button class="btn" style="width:100%;margin-top:12px" onclick="salvarNovoLead()">Cadastrar</button>';
  abrirModal(h);
}
function salvarNovoLead(){
  var body={nome:document.getElementById('nl_nome').value.trim(),contato:document.getElementById('nl_ctt').value.trim(),
    area_juridica:document.getElementById('nl_area').value.trim()||null,origem:document.getElementById('nl_orig').value};
  if(!body.nome){document.getElementById('nl_erro').textContent='Informe o nome.';return}
  api('/api/crm/leads',{method:'POST',body:JSON.stringify(body)})
    .then(function(){fecharModal();carregarLeads().then(renderFunil)})
    .catch(function(e){document.getElementById('nl_erro').textContent='Erro: '+e.message});
}
function modalFechamento(lead){
  var h='<button class="fechar" onclick="fecharModal()">×</button><h3>🎉 Fechou com '+esc(lead.nome||'este lead')+'!</h3>'+
  '<p class="mini">Registre os honorários para acompanhar seu retorno.</p>'+
  '<label>Honorários iniciais (cobrado)</label><input id="f_ini" type="number" placeholder="2500"/>'+
  '<label>Já recebido</label><input id="f_rec" type="number" placeholder="1000"/>'+
  '<label>Parcelamento do restante</label><input id="f_par" placeholder="3x de R$ 500"/>'+
  '<label>Honorários finais (estimativa, opcional)</label><input id="f_fin" type="number" placeholder="12000"/>'+
  '<label>Origem do cliente</label><div class="duo"><select id="f_orig">'+ORIGENS.map(function(o){return '<option>'+esc(o)+'</option>'}).join('')+'</select>'+
  '<button class="btn ghost sm" onclick="novaOrigem()">+ origem</button></div>'+
  '<div class="erroMsg" id="f_erro"></div>'+
  '<button class="btn" style="width:100%;margin-top:12px" onclick="salvarFechamento(\\''+lead.id+'\\')">Salvar fechamento</button>';
  abrirModal(h);
}
function novaOrigem(){
  var nome=prompt('Nome da nova origem (ex: parceria):');
  if(!nome)return;
  api('/api/crm/origens',{method:'POST',body:JSON.stringify({nome:nome})}).then(function(){
    return api('/api/crm/origens')}).then(function(d){ORIGENS=d.origens;
    var sel=document.getElementById('f_orig');if(sel){sel.innerHTML=ORIGENS.map(function(o){return '<option>'+esc(o)+'</option>'}).join('');sel.value=nome.toLowerCase()}
  }).catch(function(e){alert('Erro: '+e.message)});
}
function salvarFechamento(id){
  var body={lead_id:id,honorario_inicial:document.getElementById('f_ini').value,inicial_recebido:document.getElementById('f_rec').value,
    parcelas:document.getElementById('f_par').value,honorario_final_estimado:document.getElementById('f_fin').value,origem:document.getElementById('f_orig').value};
  api('/api/crm/fechamentos',{method:'POST',body:JSON.stringify(body)})
    .then(function(){fecharModal();carregarLeads().then(renderFunil)})
    .catch(function(e){document.getElementById('f_erro').textContent='Erro: '+e.message});
}

// =============== LEADS (lista) ===============
function renderLeads(){
  var el=document.getElementById('vw-leads'),h='';
  h+='<div class="row"><h2>Leads</h2><div class="duo"><input id="busca" placeholder="🔎 Buscar…" style="max-width:220px" oninput="renderLeads()"/>'+
     '<button class="btn" onclick="modalNovoLead()">+ Novo</button></div></div>';
  var q=(document.getElementById('busca')||{}).value;q=(q||'').toLowerCase();
  var lista=LEADS.filter(function(l){var c=l.conversations||{};
    return !q||String(l.nome||'').toLowerCase().includes(q)||String(l.area_juridica||'').toLowerCase().includes(q)||String(c.contato||'').includes(q)});
  h+='<div class="twrap"><table><thead><tr><th>Nome</th><th>Contato</th><th>Origem</th><th>Área</th><th>Etapa</th><th>Atualizado</th></tr></thead><tbody>';
  if(!lista.length)h+='<tr><td colspan="6" class="vazio">Nenhum lead ainda.</td></tr>';
  lista.forEach(function(l){var c=l.conversations||{};
    h+='<tr onclick="abrirLead(\\''+l.id+'\\')"><td><b>'+esc(l.nome||c.nome_contato||'(sem nome)')+'</b></td><td>'+esc(c.contato||(l.dados&&l.dados.contato_manual)||'—')+'</td>'+
       '<td>'+esc(l.origem||'anúncio')+'</td><td>'+esc(l.area_juridica||'—')+'</td>'+
       '<td><span class="st '+esc(l.etapa||'novo')+'">'+esc(l.etapa||'novo')+'</span></td>'+
       '<td class="mini">'+new Date(l.updated_at).toLocaleDateString('pt-BR')+'</td></tr>'});
  h+='</tbody></table></div>';
  el.innerHTML=h;
  var b=document.getElementById('busca');if(b&&q)b.value=q;
}

// =============== CONVERSAS ===============
function renderConversas(){
  var el=document.getElementById('vw-conversas');
  var comConversa=LEADS.filter(function(l){return l.conversation_id});
  var h='<div class="row"><h2>Conversas</h2><span class="mini">respostas manuais: pelo WhatsApp (a Júria pausa sozinha)</span></div>';
  h+='<div class="convgrid"><div class="convlist" id="clist">';
  if(!comConversa.length)h+='<div class="vazio">Nenhuma conversa ainda.</div>';
  comConversa.forEach(function(l){var c=l.conversations||{};
    h+='<div class="convitem" data-id="'+l.id+'" onclick="abrirChat(\\''+l.id+'\\')"><b>'+esc(l.nome||c.nome_contato||'(sem nome)')+'</b>'+
       '<small>'+esc(l.area_juridica||'')+' · '+esc(c.status||'')+'</small></div>'});
  h+='</div><div class="chat" id="cchat"><div class="vazio">Selecione uma conversa ao lado. 💬</div></div></div>';
  el.innerHTML=h;
}
function abrirChat(id){
  document.querySelectorAll('.convitem').forEach(function(x){x.classList.toggle('on',x.dataset.id===id)});
  var box=document.getElementById('cchat');box.innerHTML='<div class="vazio">Carregando…</div>';
  api('/api/crm/leads/'+id+'/mensagens').then(function(d){
    var h='';
    d.mensagens.forEach(function(m){
      h+='<div class="balao '+(m.role==='user'?'lead':'ia')+'">'+esc(m.content)+'<small>'+new Date(m.created_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+(m.role==='assistant'?' · Júria':'')+'</small></div>'});
    box.innerHTML=h||'<div class="vazio">Sem mensagens.</div>';
    box.scrollTop=box.scrollHeight;
  }).catch(function(e){box.innerHTML='<div class="vazio">Erro: '+esc(e.message)+'</div>'});
}

// =============== AGENDA ===============
var AG={modo:'mes',ref:new Date()};
function renderAgenda(){
  var ini,fim,ref=AG.ref;
  ini=new Date(ref.getFullYear(),ref.getMonth()-1,1);fim=new Date(ref.getFullYear(),ref.getMonth()+2,1);
  api('/api/crm/eventos?de='+ini.toISOString()+'&ate='+fim.toISOString()).then(function(d){
    EVENTOS=d.eventos;desenharAgenda();
  }).catch(function(e){document.getElementById('vw-agenda').innerHTML='<div class="vazio">Erro: '+esc(e.message)+'</div>'});
}
function mudarAgenda(delta){
  var r=AG.ref;
  if(AG.modo==='mes')AG.ref=new Date(r.getFullYear(),r.getMonth()+delta,1);
  if(AG.modo==='semana')AG.ref=new Date(r.getTime()+delta*7*86400000);
  if(AG.modo==='dia')AG.ref=new Date(r.getTime()+delta*86400000);
  renderAgenda();
}
function setModo(m){AG.modo=m;desenharAgenda()}
function evsDoDia(d){
  var chave=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  return EVENTOS.filter(function(e){var x=new Date(e.inicio);
    return x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0')===chave});
}
function desenharAgenda(){
  var el=document.getElementById('vw-agenda'),ref=AG.ref,h='';
  var meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  var titulo=AG.modo==='mes'?meses[ref.getMonth()]+' de '+ref.getFullYear():
    AG.modo==='semana'?'Semana de '+ref.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}):
    ref.toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit'});
  h+='<div class="row"><h2>'+titulo+'</h2><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">'+
     '<div class="vsw"><button class="'+(AG.modo==='mes'?'on':'')+'" onclick="setModo(\\'mes\\')">Mês</button>'+
     '<button class="'+(AG.modo==='semana'?'on':'')+'" onclick="setModo(\\'semana\\')">Semana</button>'+
     '<button class="'+(AG.modo==='dia'?'on':'')+'" onclick="setModo(\\'dia\\')">Dia</button></div>'+
     '<button class="btn ghost sm" onclick="mudarAgenda(-1)">‹</button><button class="btn ghost sm" onclick="mudarAgenda(1)">›</button>'+
     '<button class="btn" onclick="modalAgendar()">+ Agendar</button></div></div>';
  var hojeStr=new Date().toDateString();
  if(AG.modo==='mes'){
    h+='<div class="wkhd"><div>dom</div><div>seg</div><div>ter</div><div>qua</div><div>qui</div><div>sex</div><div>sáb</div></div><div class="mes">';
    var prim=new Date(ref.getFullYear(),ref.getMonth(),1);
    var nDias=new Date(ref.getFullYear(),ref.getMonth()+1,0).getDate();
    for(var i=0;i<prim.getDay();i++)h+='<div class="mdia vazio2"></div>';
    for(var dnum=1;dnum<=nDias;dnum++){
      var d=new Date(ref.getFullYear(),ref.getMonth(),dnum);
      var cls='mdia'+((d.getDay()===0||d.getDay()===6)?' fds':'')+(d.toDateString()===hojeStr?' hoje':'');
      h+='<div class="'+cls+'"><span class="num">'+dnum+(d.toDateString()===hojeStr?' · hoje':'')+'</span>';
      evsDoDia(d).forEach(function(e){
        var hh=new Date(e.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        h+='<span class="evm'+(e.tipo==='followup'?' f':'')+'" onclick="abrirEvento(\\''+e.id+'\\')">'+(e.tipo==='followup'?'🔔':'🤝')+' '+hh+' '+esc(e.titulo)+'</span>'});
      h+='</div>'}
    h+='</div>';
  }
  if(AG.modo==='semana'){
    var dow=ref.getDay();var dom=new Date(ref.getTime()-dow*86400000);
    var nomes=['DOM','SEG','TER','QUA','QUI','SEX','SÁB'];
    h+='<div class="sem7">';
    for(var j=0;j<7;j++){
      var dj=new Date(dom.getTime()+j*86400000);
      h+='<div class="dia7'+((j===0||j===6)?' fds':'')+'"><h5>'+nomes[j]+'<b>'+dj.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})+(dj.toDateString()===hojeStr?' · hoje':'')+'</b></h5>';
      evsDoDia(dj).forEach(function(e){
        var hh=new Date(e.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
        h+='<div class="ev'+(e.tipo==='followup'?' f':'')+'" onclick="abrirEvento(\\''+e.id+'\\')"><b>'+(e.tipo==='followup'?'🔔 Follow-up':'🤝 Reunião')+'</b>'+esc(e.titulo)+' · '+hh+'</div>'});
      h+='</div>'}
    h+='</div>';
  }
  if(AG.modo==='dia'){
    var lista=evsDoDia(ref).sort(function(a,b){return a.inicio.localeCompare(b.inicio)});
    h+='<div class="card" style="max-width:560px">';
    if(!lista.length)h+='<div class="vazio">Nenhum compromisso neste dia. 🍃</div>';
    lista.forEach(function(e){
      var hh=new Date(e.inicio).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      h+='<div class="ev'+(e.tipo==='followup'?' f':'')+'" style="margin-bottom:10px" onclick="abrirEvento(\\''+e.id+'\\')"><b>'+hh+' · '+(e.tipo==='followup'?'🔔 Follow-up':'🤝 Reunião · '+esc(e.local||''))+'</b>'+esc(e.titulo)+(e.notas?'<div class="mini">'+esc(e.notas)+'</div>':'')+'</div>'});
    h+='</div>';
  }
  h+='<p class="mini" style="margin-top:12px">🟡 reuniões · 🔵 follow-ups · clique num evento para concluir/excluir</p>';
  el.innerHTML=h;
}
function modalAgendar(leadId){
  var opts='<option value="">— sem vínculo —</option>'+LEADS.map(function(l){
    return '<option value="'+l.id+'"'+(l.id===leadId?' selected':'')+'>'+esc(l.nome||'(sem nome)')+'</option>'}).join('');
  var h='<button class="fechar" onclick="fecharModal()">×</button><h3>Agendar</h3>'+
  '<label>Tipo</label><select id="a_tipo"><option value="reuniao">🤝 Reunião</option><option value="followup">🔔 Follow-up (lembrete)</option></select>'+
  '<label>Título *</label><input id="a_tit" placeholder="Reunião com João Pereira"/>'+
  '<label>Lead</label><select id="a_lead">'+opts+'</select>'+
  '<div class="duo"><div><label>Data *</label><input id="a_data" type="date"/></div><div><label>Hora *</label><input id="a_hora" type="time"/></div></div>'+
  '<label>Local</label><select id="a_loc"><option>Meet</option><option>presencial</option><option>telefone</option></select>'+
  '<label>Notas (cole o link do Meet aqui)</label><textarea id="a_notas" rows="2"></textarea>'+
  '<div class="erroMsg" id="a_erro"></div><button class="btn" style="width:100%;margin-top:12px" onclick="salvarEvento()">Salvar</button>';
  abrirModal(h);
}
function salvarEvento(){
  var data=document.getElementById('a_data').value,hora=document.getElementById('a_hora').value;
  var tit=document.getElementById('a_tit').value.trim();
  if(!tit||!data||!hora){document.getElementById('a_erro').textContent='Preencha título, data e hora.';return}
  var body={tipo:document.getElementById('a_tipo').value,titulo:tit,lead_id:document.getElementById('a_lead').value||null,
    inicio:new Date(data+'T'+hora).toISOString(),local:document.getElementById('a_loc').value,notas:document.getElementById('a_notas').value};
  api('/api/crm/eventos',{method:'POST',body:JSON.stringify(body)})
    .then(function(){fecharModal();renderAgenda()})
    .catch(function(e){document.getElementById('a_erro').textContent='Erro: '+e.message});
}
function abrirEvento(id){
  var e=EVENTOS.find(function(x){return x.id===id});if(!e)return;
  var dt=new Date(e.inicio);
  var h='<button class="fechar" onclick="fecharModal()">×</button><h3>'+(e.tipo==='followup'?'🔔 Follow-up':'🤝 Reunião')+'</h3>'+
  '<p><b>'+esc(e.titulo)+'</b><br/><span class="mini">'+dt.toLocaleString('pt-BR',{weekday:'long',day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})+' · '+esc(e.local||'')+'</span></p>'+
  (e.notas?'<p class="mini">'+esc(e.notas)+'</p>':'')+
  '<div class="duo"><button class="btn sm" onclick="concluirEvento(\\''+e.id+'\\')">'+(e.concluido?'Concluído ✓':'Marcar concluído')+'</button>'+
  '<button class="btn ghost sm" style="color:var(--erro);border-color:var(--erro)" onclick="excluirEvento(\\''+e.id+'\\')">Excluir</button></div>';
  abrirModal(h);
}
function concluirEvento(id){
  api('/api/crm/eventos/'+id,{method:'PATCH',body:JSON.stringify({concluido:true})}).then(function(){fecharModal();renderAgenda()}).catch(function(e){alert(e.message)});
}
function excluirEvento(id){
  if(!confirm('Excluir este compromisso?'))return;
  api('/api/crm/eventos/'+id,{method:'DELETE'}).then(function(){fecharModal();renderAgenda()}).catch(function(e){alert(e.message)});
}

// boot
document.getElementById('lSenha').addEventListener('keydown',function(e){if(e.key==='Enter')fazerLogin()});
if(tk()){api('/api/crm/leads').then(iniciar).catch(function(){sair()})}
</script>
</body>
</html>`;

export async function crmAppRoutes(app: FastifyInstance): Promise<void> {
  app.get('/crm', async (_req, reply) => {
    reply.header('Content-Type', 'text/html; charset=utf-8').send(HTML);
  });
}
