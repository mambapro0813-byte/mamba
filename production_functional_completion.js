/* AI TRADE Production Functional Completion — non-destructive smoke test */
(()=>{
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const checks=[
 ['Primary UI',()=>!!$('#primaryDashboard')],
 ['Unified Workspace',()=>!!window.AI_UNIFIED_SHELL],
 ['Legacy Core Pages',()=>['today','leads','products','customers','sdr','inbox','crm','quotes','approval','orders','follow','feedback'].every(id=>!!document.querySelector(`body>.app section#${id}`))],
 ['Local Data Source',()=>{try{JSON.parse(localStorage.getItem('aitrade_full59_v1')||'{}');return true}catch{return false}}],
 ['Cloud Config',()=>!!(window.AITRADE_CLOUD_CONFIG?.url&&window.AITRADE_CLOUD_CONFIG?.anonKey)],
 ['Cloud Sync Engine',()=>!!window.AITRADE_CLOUD],
 ['Gmail OAuth UI',()=>!!document.getElementById('gmailOauthBtn')],
 ['Sales Loop',()=>!!document.getElementById('aslBtn')],
 ['Learning Engine',()=>!!document.getElementById('le3Btn')],
 ['Opportunity Brain',()=>!!document.getElementById('pobBtn')],
 ['Self-Heal',()=>!!document.getElementById('shBtn')],
 ['Acceptance',()=>!!document.getElementById('patBtn')],
 ['Revenue',()=>!!window.AITRADE_REVENUE],
 ['Dispatcher',()=>!!window.AI_DISPATCHER],
 ['Data Activation',()=>!!window.AI_DATA_ACTIVATION]
];
async function sessionCheck(){try{if(window.AITRADE_CLOUD?.loadClient)await AITRADE_CLOUD.loadClient();const c=AITRADE_CLOUD?.client;if(!c)return false;const {data}=await c.auth.getSession();return !!data?.session}catch{return false}}
async function run(){const rows=checks.map(([name,fn])=>{let ok=false;try{ok=!!fn()}catch{}return{name,ok}});rows.push({name:'Cloud Session',ok:await sessionCheck()});const passed=rows.filter(x=>x.ok).length;return{passed,total:rows.length,score:Math.round(passed/rows.length*100),rows,at:new Date().toISOString()}}
function style(){if($('#pfcStyle'))return;const s=document.createElement('style');s.id='pfcStyle';s.textContent=`#pfcModal{position:fixed;inset:0;z-index:14000;background:#0f172a66;display:none;align-items:center;justify-content:center;padding:20px}#pfcModal.on{display:flex}.pfc-box{width:min(860px,94vw);max-height:88vh;overflow:auto;background:#f7fbff;border-radius:18px;padding:18px;border:1px solid #dfe8f2}.pfc-head{display:flex;justify-content:space-between;align-items:center}.pfc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:14px 0}.pfc-kpi,.pfc-row{background:#fff;border:1px solid #dfe8f2;border-radius:12px;padding:12px}.pfc-list{display:grid;gap:8px}.pfc-row{display:flex;justify-content:space-between}.pfc-ok{color:#0a8f62;font-weight:800}.pfc-no{color:#b45309;font-weight:800}.pfc-btn{border:0;border-radius:9px;padding:8px 12px;background:#2d80e9;color:#fff;font-weight:800;cursor:pointer}@media(max-width:700px){.pfc-grid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
async function render(){const d=await run(),b=$('#pfcBody');if(!b)return;b.innerHTML=`<div class="pfc-grid"><div class="pfc-kpi"><small>功能检查</small><b style="display:block;font-size:26px">${d.passed}/${d.total}</b></div><div class="pfc-kpi"><small>完成度</small><b style="display:block;font-size:26px">${d.score}%</b></div><div class="pfc-kpi"><small>状态</small><b style="display:block;font-size:20px">${d.score===100?'Ready':'Needs Work'}</b></div></div><div class="pfc-list">${d.rows.map(x=>`<div class="pfc-row"><span>${x.name}</span><span class="${x.ok?'pfc-ok':'pfc-no'}">${x.ok?'已就绪':'待完成'}</span></div>`).join('')}</div>`}
function open(){style();let m=$('#pfcModal');if(!m){m=document.createElement('div');m.id='pfcModal';m.innerHTML='<div class="pfc-box"><div class="pfc-head"><div><h2 style="margin:0">Production Functional Completion</h2><small>非破坏性功能检查，不发送邮件、不修改客户数据。</small></div><button class="pfc-btn" id="pfcClose">关闭</button></div><div id="pfcBody" style="margin-top:12px">检查中…</div></div>';document.body.appendChild(m);$('#pfcClose').onclick=()=>m.classList.remove('on');m.onclick=e=>{if(e.target===m)m.classList.remove('on')}}m.classList.add('on');render()}
function addCard(){const root=$('#primaryDashboard');if(!root||$('#pfcCard'))return;const sys=$$('.pd-panel',root).find(p=>p.querySelector('h3')?.textContent?.includes('系统管理'));const row=sys?.querySelector('.pd-row');if(!row)return;const b=document.createElement('button');b.id='pfcCard';b.className='pd-card';b.innerHTML='<div class="pd-card-head"><span>🧪</span><div><b>功能验收</b><small>Functional QA</small></div></div><p>检查 UI、核心页面、云同步和生产模块是否就绪</p><i>›</i>';b.onclick=open;row.appendChild(b);row.style.gridTemplateColumns='repeat(6,1fr)'}
function boot(){style();let n=0,t=setInterval(()=>{n++;addCard();if($('#pfcCard')||n>50)clearInterval(t)},200)}
window.AI_PRODUCTION_COMPLETION={run,open};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();