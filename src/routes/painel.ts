import type { FastifyInstance } from 'fastify';

// Painel da agência (HENRIQUECER Assessoria Digital).
// Identidade: preto + dourado. Servido como página única.
// Autentica com a ADMIN_API_KEY e consome as rotas /admin/*.

const HTML = /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>HENRIQUECER · Painel Júria</title>
<style>
  :root{
    --bg:#0d0d0d; --preto:#000; --card:#191919; --card-2:#141414;
    --dourado:#e8b84b; --dourado-2:#d1a238;
    --texto:#f4f2ec; --muted:#9b968c; --linha:#2b2b2b;
    --ok:#3ecf8e; --off:#6b6b6b; --erro:#ff6b5e;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--texto);font-family:var(--sans);font-size:15px;line-height:1.5}
  .hidden{display:none!important}
  /* Marca */
  .brand{display:flex;flex-direction:column;line-height:1.15}
  .brand b{font-size:20px;font-weight:800;letter-spacing:3px}
  .brand b i{color:var(--dourado);font-style:normal}
  .brand span{font-size:10px;letter-spacing:4px;color:var(--dourado);text-transform:uppercase;margin-top:1px}
  /* Header */
  header{background:var(--preto);color:#fff;padding:15px 22px;display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid var(--dourado)}
  header .sair{background:transparent;border:1px solid rgba(232,184,75,.4);color:var(--dourado);padding:7px 14px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600}
  header .sair:hover{background:rgba(232,184,75,.12)}
  /* Layout */
  main{max-width:1000px;margin:0 auto;padding:24px 18px 60px}
  .tabs{display:flex;gap:6px;margin-bottom:22px;border-bottom:1px solid var(--linha)}
  .tabs button{background:none;border:none;padding:12px 18px;cursor:pointer;font-size:15px;color:var(--muted);border-bottom:2px solid transparent;font-weight:700}
  .tabs button.on{color:var(--dourado);border-color:var(--dourado)}
  h2{font-weight:800;margin:0;font-size:22px;letter-spacing:.3px}
  .row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap}
  /* Botões */
  .btn{background:var(--dourado);color:#171717;border:none;padding:10px 18px;border-radius:9px;cursor:pointer;font-weight:800;font-size:14px}
  .btn:hover{background:var(--dourado-2)}
  .btn:disabled{opacity:.6;cursor:default}
  .btn.ghost{background:transparent;border:1px solid var(--linha);color:var(--dourado);font-weight:700}
  .btn.ghost:hover{background:#1f1f1f}
  .btn.danger{background:transparent;border:1px solid rgba(255,107,94,.55);color:var(--erro);font-weight:700}
  .btn.danger:hover{background:rgba(255,107,94,.12)}
  .btn.sm{padding:7px 12px;font-size:13px}
  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .card{background:var(--card);border:1px solid var(--linha);border-radius:14px;padding:18px}
  .card h3{margin:0 0 2px;font-size:18px;font-weight:800}
  .card .adv{color:var(--muted);font-size:13px;margin-bottom:10px}
  .card .adv b{color:var(--dourado)}
  .card .meta{font-size:12px;color:var(--muted);margin:2px 0}
  .badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px}
  .badge .dot{width:8px;height:8px;border-radius:50%}
  .badge.ok{background:rgba(62,207,142,.14);color:var(--ok)} .badge.ok .dot{background:var(--ok)}
  .badge.off{background:#242424;color:var(--muted)} .badge.off .dot{background:var(--off)}
  .card .acoes{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap}
  /* Tabela leads */
  .tabela{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--linha);border-radius:14px;overflow:hidden}
  .tabela th,.tabela td{text-align:left;padding:11px 14px;border-bottom:1px solid var(--linha);font-size:13px;vertical-align:top}
  .tabela th{background:#141414;color:var(--muted);text-transform:uppercase;font-size:11px;letter-spacing:.5px}
  .tabela tr:last-child td{border-bottom:none}
  .urg{font-weight:800;font-size:11px;padding:2px 8px;border-radius:6px;text-transform:uppercase}
  .urg.alta{background:rgba(255,107,94,.16);color:#ff8a80} .urg.media{background:rgba(232,184,75,.16);color:var(--dourado)} .urg.baixa{background:#242424;color:var(--muted)}
  .pill{font-size:11px;font-weight:800;padding:2px 8px;border-radius:6px;background:rgba(232,184,75,.14);color:var(--dourado)}
  .vazio{color:var(--muted);padding:40px;text-align:center}
  select,input,textarea{font-family:inherit;font-size:14px;padding:10px 12px;border:1px solid var(--linha);border-radius:9px;width:100%;background:var(--card-2);color:var(--texto)}
  input::placeholder{color:#6b6b6b}
  label{display:block;font-size:13px;font-weight:700;margin:12px 0 5px;color:#cfcabd}
  /* Modal */
  .overlay{position:fixed;inset:0;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;padding:18px;z-index:50}
  .modal{background:var(--card);border:1px solid var(--linha);border-radius:16px;max-width:460px;width:100%;padding:24px;max-height:92vh;overflow:auto}
  .modal h3{margin:0 0 4px;font-size:20px;font-weight:800}
  .modal .fechar{float:right;background:none;border:none;font-size:22px;cursor:pointer;color:var(--muted);line-height:1}
  .qrbox{text-align:center;padding:8px}
  .qrbox img{width:260px;max-width:100%;border:6px solid #fff;border-radius:12px;background:#fff}
  .aviso{background:rgba(232,184,75,.1);border:1px solid rgba(232,184,75,.35);color:#e8cf95;padding:10px 12px;border-radius:9px;font-size:13px;margin:10px 0}
  /* Login */
  .login{min-height:100vh;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 30%,#1a1a1a,#000);padding:20px}
  .login .box{background:var(--card);border-radius:18px;padding:34px;max-width:380px;width:100%;text-align:center;border-top:3px solid var(--dourado);border-left:1px solid var(--linha);border-right:1px solid var(--linha);border-bottom:1px solid var(--linha)}
  .logoH{width:64px;height:64px;margin:0 auto 14px;border:3px solid var(--dourado);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:900;color:var(--dourado)}
  .login b{font-size:24px;font-weight:800;letter-spacing:3px;color:#fff}
  .login .sub{display:block;font-size:10px;letter-spacing:4px;color:var(--dourado);text-transform:uppercase;margin:2px 0 22px}
  .erroMsg{color:var(--erro);font-size:13px;margin-top:10px;min-height:16px}
  .muted{color:var(--muted);font-size:12px}
</style>
</head>
<body>

<!-- LOGIN -->
<div id="login" class="login">
  <div class="box">
    <div class="logoH">H</div>
    <b>HENRIQUECER</b><span class="sub">Assessoria Digital</span>
    <label style="text-align:left">Chave de acesso (admin)</label>
    <input id="chave" type="password" placeholder="Cole sua ADMIN_API_KEY" />
    <div class="erroMsg" id="loginErro"></div>
    <button class="btn" style="width:100%;margin-top:14px" onclick="entrar()">Entrar</button>
  </div>
</div>

<!-- APP -->
<div id="app" class="hidden">
  <header>
    <div class="brand"><b><i>H</i>ENRIQUECER</b><span>Assessoria Digital · Painel Júria</span></div>
    <button class="sair" onclick="sair()">Sair</button>
  </header>
  <main>
    <div class="tabs">
      <button id="tabAdv" class="on" onclick="mostrar('adv')">Advogados</button>
      <button id="tabLeads" onclick="mostrar('leads')">Leads</button>
    </div>

    <section id="secAdv">
      <div class="row">
        <h2>Advogados</h2>
        <button class="btn" onclick="abrirNovo()">+ Novo advogado</button>
      </div>
      <div id="listaAdv" class="cards"></div>
    </section>

    <section id="secLeads" class="hidden">
      <div class="row">
        <h2>Leads capturados</h2>
        <select id="filtroLead" style="max-width:260px" onchange="carregarLeads()"></select>
      </div>
      <div id="listaLeads"></div>
    </section>
  </main>
</div>

<div id="modal"></div>

<script>
const KEY='henriquecer_admin_key';
let TENANTS=[];
function chave(){return localStorage.getItem(KEY)||''}
async function api(path,opts={}){
  const r=await fetch(path,{...opts,headers:{'Content-Type':'application/json','x-admin-key':chave(),...(opts.headers||{})}});
  if(r.status===401){sair();throw new Error('não autorizado')}
  const t=await r.text(); let d; try{d=t?JSON.parse(t):{}}catch{d=t}
  if(!r.ok)throw new Error((d&&d.error)||('erro '+r.status));
  return d;
}
async function entrar(){
  const k=document.getElementById('chave').value.trim();
  if(!k)return;
  localStorage.setItem(KEY,k);
  try{ await api('/admin/tenants'); iniciar(); }
  catch(e){ document.getElementById('loginErro').textContent='Chave inválida. Tente de novo.'; localStorage.removeItem(KEY); }
}
function sair(){localStorage.removeItem(KEY);document.getElementById('app').classList.add('hidden');document.getElementById('login').classList.remove('hidden')}
function mostrar(t){
  document.getElementById('secAdv').classList.toggle('hidden',t!=='adv');
  document.getElementById('secLeads').classList.toggle('hidden',t!=='leads');
  document.getElementById('tabAdv').classList.toggle('on',t==='adv');
  document.getElementById('tabLeads').classList.toggle('on',t==='leads');
  if(t==='leads')carregarLeads();
}
function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

async function carregarAdv(){
  const el=document.getElementById('listaAdv');
  el.innerHTML='<div class="vazio">Carregando…</div>';
  try{
    const {tenants}=await api('/admin/tenants'); TENANTS=tenants;
    preencherFiltro();
    if(!tenants.length){el.innerHTML='<div class="vazio">Nenhum advogado cadastrado ainda. Clique em “+ Novo advogado”.</div>';return}
    el.innerHTML=tenants.map(t=>\`
      <div class="card">
        <h3>\${esc(t.nome_escritorio)}</h3>
        <div class="adv">\${esc(t.nome_advogado)} · assistente <b>\${esc(t.nome_assistente||'Júria')}</b></div>
        <div class="meta">Áreas: \${(t.areas&&t.areas.length)?esc(t.areas.join(', ')):'todas'}</div>
        <div class="meta">Aviso p/ advogado: \${esc(t.whatsapp_advogado||'—')}</div>
        <div class="meta" style="margin-top:8px" id="st-\${t.evolution_instance}"><span class="badge off"><span class="dot"></span>verificando…</span></div>
        <div class="acoes">
          <button class="btn sm" onclick="verQR('\${t.evolution_instance}')">Conectar / QR</button>
          <button class="btn ghost sm" onclick="verLeads('\${t.id}')">Ver leads</button>
          <button class="btn ghost sm" onclick="desconectar('\${t.evolution_instance}')">Desconectar</button>
          <button class="btn danger sm" onclick="abrirExcluir('\${t.evolution_instance}')">Excluir</button>
        </div>
      </div>\`).join('');
    tenants.forEach(t=>verificarStatus(t.evolution_instance));
  }catch(e){el.innerHTML='<div class="vazio">Erro ao carregar: '+esc(e.message)+'</div>'}
}
async function verificarStatus(inst){
  const box=document.getElementById('st-'+inst); if(!box)return;
  try{
    const d=await api('/admin/tenants/'+inst+'/status');
    const state=(d&&d.instance&&d.instance.state)||d.state||'';
    const ok=state==='open';
    box.innerHTML=ok?'<span class="badge ok"><span class="dot"></span>WhatsApp conectado</span>':'<span class="badge off"><span class="dot"></span>Desconectado</span>';
  }catch{box.innerHTML='<span class="badge off"><span class="dot"></span>Desconectado</span>'}
}

function preencherFiltro(){
  const s=document.getElementById('filtroLead');
  s.innerHTML='<option value="">Todos os advogados</option>'+TENANTS.map(t=>\`<option value="\${t.id}">\${esc(t.nome_escritorio)}</option>\`).join('');
}
async function carregarLeads(){
  const tid=document.getElementById('filtroLead').value;
  const el=document.getElementById('listaLeads');
  el.innerHTML='<div class="vazio">Carregando…</div>';
  try{
    const {leads}=await api('/admin/leads'+(tid?('?tenant_id='+tid):''));
    if(!leads.length){el.innerHTML='<div class="vazio">Nenhum lead ainda. Assim que a Júria atender, eles aparecem aqui.</div>';return}
    el.innerHTML=\`<table class="tabela"><thead><tr>
      <th>Chegada</th><th>Nome</th><th>Área</th><th>Urgência</th><th>Resumo</th><th>Contato</th><th>Status</th></tr></thead><tbody>\`+
      leads.map(l=>{
        const c=l.conversations||{}; const u=(l.urgencia||'').toLowerCase();
        const chegada=l.created_at?new Date(l.created_at).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'—';
        return \`<tr>
          <td style="white-space:nowrap">\${chegada}</td>
          <td>\${esc(l.nome||'—')}</td>
          <td>\${esc(l.area_juridica||'—')}</td>
          <td>\${u?'<span class="urg '+esc(u)+'">'+esc(u)+'</span>':'—'}</td>
          <td style="max-width:280px">\${esc(l.resumo_caso||'—')}</td>
          <td>\${esc(c.contato||'—')}</td>
          <td>\${l.encaminhado?'<span class="pill">encaminhado</span>':(l.qualificado?'<span class="pill">qualificado</span>':'em triagem')}</td>
        </tr>\`}).join('')+'</tbody></table>';
  }catch(e){el.innerHTML='<div class="vazio">Erro ao carregar: '+esc(e.message)+'</div>'}
}
function verLeads(tid){document.getElementById('filtroLead').value=tid;mostrar('leads')}

function fecharModal(){document.getElementById('modal').innerHTML=''}
function abrirModal(html){document.getElementById('modal').innerHTML='<div class="overlay" onclick="if(event.target===this)fecharModal()"><div class="modal">'+html+'</div></div>'}

function abrirNovo(){
  abrirModal(\`
    <button class="fechar" onclick="fecharModal()">×</button>
    <h3>Novo advogado</h3>
    <p class="muted">Ao cadastrar, geramos o WhatsApp e o QR Code para conectar.</p>
    <label>Nome do escritório *</label><input id="f_esc" placeholder="Ex: Silva Advocacia"/>
    <label>Nome do advogado(a) *</label><input id="f_adv" placeholder="Ex: Dra. Ana Silva"/>
    <label>Áreas (separadas por vírgula, opcional)</label><input id="f_areas" placeholder="previdenciário, trabalhista"/>
    <label>WhatsApp p/ receber leads (DDI+DDD, opcional)</label><input id="f_wpp" placeholder="5511999998888"/>
    <div class="erroMsg" id="f_erro"></div>
    <button class="btn" style="width:100%;margin-top:16px" id="f_btn" onclick="salvarNovo()">Cadastrar e gerar QR</button>\`);
}
async function salvarNovo(){
  const b=document.getElementById('f_btn'); b.disabled=true; b.textContent='Criando…';
  document.getElementById('f_erro').textContent='';
  const areas=document.getElementById('f_areas').value.split(',').map(s=>s.trim()).filter(Boolean);
  const body={
    nome_escritorio:document.getElementById('f_esc').value.trim(),
    nome_advogado:document.getElementById('f_adv').value.trim(),
    areas, whatsapp_advogado:document.getElementById('f_wpp').value.trim()||undefined,
  };
  if(!body.nome_escritorio||!body.nome_advogado){document.getElementById('f_erro').textContent='Preencha escritório e advogado.';b.disabled=false;b.textContent='Cadastrar e gerar QR';return}
  try{
    const d=await api('/admin/tenants',{method:'POST',body:JSON.stringify(body)});
    mostrarQR(d.qrcode,'Advogado cadastrado! Escaneie para conectar o WhatsApp:');
    carregarAdv();
  }catch(e){document.getElementById('f_erro').textContent='Erro: '+e.message;b.disabled=false;b.textContent='Cadastrar e gerar QR'}
}
async function verQR(inst){
  abrirModal('<div class="qrbox" style="color:var(--muted)">Gerando QR…</div>');
  try{const d=await api('/admin/tenants/'+inst+'/qrcode');mostrarQR(d.qrcode,'Escaneie no WhatsApp do escritório:');}
  catch(e){abrirModal('<button class="fechar" onclick="fecharModal()">×</button><p>Erro: '+esc(e.message)+'</p>')}
}
function mostrarQR(qr,titulo){
  const img=qr&&(qr.base64||(qr.qrcode&&qr.qrcode.base64));
  const body=\`<button class="fechar" onclick="fecharModal()">×</button>
    <h3>Conectar WhatsApp</h3><p class="muted">\${esc(titulo)}</p>
    \${img?'<div class="qrbox"><img src="'+img+'"/></div>':'<div class="aviso">QR não disponível. Tente “Conectar / QR” novamente em alguns segundos.</div>'}
    <div class="aviso">No celular do escritório: WhatsApp → Aparelhos conectados → Conectar aparelho → aponte a câmera.</div>
    <button class="btn ghost" style="width:100%" onclick="fecharModal()">Fechar</button>\`;
  abrirModal(body);
}

async function desconectar(inst){
  const t=TENANTS.find(function(x){return x.evolution_instance===inst})||{};
  const nome=t.nome_escritorio||inst;
  if(!confirm('Desconectar o WhatsApp de "'+nome+'"?\\n\\nA Júria para de atender esse escritório até alguém conectar de novo pelo QR Code.'))return;
  try{
    await api('/admin/tenants/'+inst+'/disconnect',{method:'POST',body:'{}'});
    verificarStatus(inst);
  }catch(e){alert('Erro ao desconectar: '+e.message)}
}

let EXCLUIR=null;
function abrirExcluir(inst){
  EXCLUIR=inst;
  const t=TENANTS.find(function(x){return x.evolution_instance===inst})||{};
  const nome=t.nome_escritorio||inst;
  abrirModal(
    '<button class="fechar" onclick="fecharModal()">×</button>'+
    '<h3>Excluir escritório</h3>'+
    '<div class="aviso" style="border-color:rgba(255,107,94,.5);background:rgba(255,107,94,.08);color:#ffb3ab">Isso desconecta o WhatsApp e remove <b>'+esc(nome)+'</b> do painel. A Júria deixa de atender esse escritório. O histórico de leads e conversas fica guardado.</div>'+
    '<div class="erroMsg" id="x_erro"></div>'+
    '<button class="btn danger" style="width:100%;margin-top:14px" id="x_btn" onclick="confirmarExclusao()">Excluir definitivamente</button>'+
    '<button class="btn ghost" style="width:100%;margin-top:8px" onclick="fecharModal()">Cancelar</button>');
}
async function confirmarExclusao(){
  const b=document.getElementById('x_btn');b.disabled=true;b.textContent='Excluindo…';
  try{
    await api('/admin/tenants/'+EXCLUIR,{method:'DELETE',body:'{}'});
    fecharModal();
    carregarAdv();
  }catch(e){
    document.getElementById('x_erro').textContent='Erro: '+e.message;
    b.disabled=false;b.textContent='Excluir definitivamente';
  }
}

function iniciar(){
  document.getElementById('login').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  carregarAdv();
}
if(chave()){ api('/admin/tenants').then(iniciar).catch(sair); }
document.getElementById('chave').addEventListener('keydown',e=>{if(e.key==='Enter')entrar()});
</script>
</body>
</html>`;

export async function painelRoutes(app: FastifyInstance): Promise<void> {
  const serve = async (_req: unknown, reply: any) => {
    reply.header('Content-Type', 'text/html; charset=utf-8').send(HTML);
  };
  app.get('/', serve);
  app.get('/painel', serve);
}
