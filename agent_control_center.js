/* AI TRADE — Agent Control Center 1.0 */
(()=>{
const KEY='aitrade_agent_control_center_v1', ORK='aitrade_automation_orchestrator_v1';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function cfg(){return get(KEY,{version:'1.0',opened:0,lastOpenedAt:null})}
function saveCfg(x){put(KEY,x);window.AITRADE_CLOUD?.push?.()}
function data(){
 const db=get('aitrade_full59_v1',{customers:[],leads:[],signals:[],quotes:[],orders:[]});
 const dm=get('aitrade_decision_makers_v1',{people:[]});
 const sdr=get('aitrade_sdr2_v1',{campaigns:[],queue:[]});
 const inbox=get('aitrade_inbox_listener_v2',{events:[],processed:[]});
 const gmail=get('aitrade_gmail_bridge_v1',{queue:[],threads:[]});
 const pricing=get('ai_trade_quotes_v2',[]);
 const crm=get('aitrade_crm_followup_v2',{tasks:[],history:[]});
 const feedback=get('aitrade_feedback_brain_v2',{events:[]});
 const orch=get(ORK,{enabled:true,events:[],actions:[],stats:{}});
 return {db,dm,sdr,inbox,gmail,pricing,crm,feedback,orch};
}
function agentList(){let x=data(), products=(window.PRODUCTS||[]).length, orch=window.AutomationOrchestrator?.dashboard?.()||null;
 const q=(x.sdr.queue||[]), blocked=(orch?.blocked??(x.orch.actions||[]).filter(a=>a.status==='blocked').length), ready=(orch?.ready??(x.orch.actions||[]).filter(a=>a.status==='ready').length);
 return [
  {name:'Product Brain',status:products?'running':'warn',metric:`${products} SKU`,note:'产品知识、销售画像、市场匹配'},
  {name:'Lead Intelligence',status:'running',metric:`${(x.db.leads||[]).length} Leads`,note:'多源候选池 / ICP / 自动进客'},
  {name:'Customer Brain',status:'running',metric:`${(x.db.customers||[]).length} Customers`,note:'客户画像 / Top 3 产品 / Next Best Action'},
  {name:'Decision Maker',status:(x.dm.people||[]).length?'running':'warn',metric:`${(x.dm.people||[]).length} People`,note:'关键人识别；付费联系人源按需补全'},
  {name:'AI SDR 2.0',status:'running',metric:`${q.length} Queue`,note:'D1/D3/D7/D14；外发前人工审批'},
  {name:'Inbox Listener 2.0',status:'running',metric:`${(x.inbox.events||x.inbox.processed||[]).length||0} Events`,note:'回复意图识别 / Buying Signals / CRM回写'},
  {name:'Gmail Bridge',status:'warn',metric:`${(x.gmail.queue||[]).length} Queue`,note:'Gmail连接可用；24/7 Push Watch仍待Google Cloud配置'},
  {name:'Pricing Brain 2.0',status:'running',metric:`${Array.isArray(x.pricing)?x.pricing.length:0} Quotes`,note:'阶梯价 / 毛利 / 风控 / Human Approval'},
  {name:'CRM + Follow-up',status:'running',metric:`${(x.crm.tasks||[]).length} Tasks`,note:'阶段自动推进 / 动态跟进 / 复购窗口'},
  {name:'Feedback Brain 2.0',status:'running',metric:`${(x.feedback.events||[]).length} Events`,note:'结果反哺 / Learned Score'},
  {name:'Automation Orchestrator',status:x.orch.enabled===false?'paused':'running',metric:`${(x.orch.actions||[]).length} Actions`,note:`Blocked ${blocked} · Ready ${ready}`},
  {name:'Cloud Sync',status:window.AITRADE_CLOUD?'running':'warn',metric:window.AITRADE_CLOUD?'Connected':'Local',note:'电脑端 / 手机端共用业务状态'}
 ]
}
function style(){if(document.getElementById('agentCCStyle'))return;let s=document.createElement('style');s.id='agentCCStyle';s.textContent=`#agentCCBtn{position:fixed;right:14px;bottom:18px;z-index:9997;border:0;border-radius:999px;padding:10px 14px;background:#172033;color:#fff;box-shadow:0 8px 25px #0003;font:700 12px Arial;cursor:pointer}#agentCCModal{position:fixed;inset:0;z-index:10001;background:#0f172a80;display:none;align-items:center;justify-content:center;padding:14px}#agentCCModal .box{width:min(980px,96vw);max-height:90vh;overflow:auto;background:#f7f9fc;border-radius:18px;padding:16px;box-shadow:0 28px 90px #0005}.accTop{display:flex;justify-content:space-between;align-items:center;gap:10px}.accGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin-top:12px}.accCard{background:#fff;border:1px solid #e3e8f0;border-radius:13px;padding:12px}.accDot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}.accRun{background:#19a66a}.accWarn{background:#e39a21}.accPause{background:#8a94a6}.accMetric{font-size:20px;font-weight:800;margin:7px 0}.accNote{font-size:11px;color:#748096;line-height:1.45}.accToolbar{display:flex;gap:7px;flex-wrap:wrap}.accBtn{border:0;border-radius:9px;padding:8px 10px;background:#2764dc;color:#fff;cursor:pointer;font-size:11px}.accBtn.gray{background:#eef3fb;color:#2764dc}.accLog{background:#fff;border:1px solid #e3e8f0;border-radius:12px;padding:9px;margin-top:7px;font-size:11px}.accTag{border-radius:999px;padding:3px 6px;background:#eef3fb;font-size:9px}.accUrg{background:#fff0ed;color:#b7472e}.accBlock{background:#fff5e8;color:#9b6519}@media(max-width:720px){.accGrid{grid-template-columns:1fr 1fr}#agentCCBtn{bottom:88px}.accMetric{font-size:17px}}@media(max-width:430px){.accGrid{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function statusHTML(a){let cls=a.status==='running'?'accRun':a.status==='paused'?'accPause':'accWarn',tx=a.status==='running'?'运行中':a.status==='paused'?'已暂停':'需配置/受限';return `<div class="accCard"><div><span class="accDot ${cls}"></span><b>${esc(a.name)}</b></div><div class="accMetric">${esc(a.metric)}</div><div class="accNote">${esc(a.note)}</div><div style="margin-top:8px"><span class="accTag">${tx}</span></div></div>`}
function actionHTML(a){let p=a.priority==='urgent'?'accUrg':a.status==='blocked'?'accBlock':'',approval=a.requiresApproval?' · Human Approval':'';return `<div class="accLog"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(a.title||a.type||'Action')}</b><span class="accTag ${p}">${esc(a.priority||'normal')} / ${esc(a.status||'open')}</span></div><div class="accNote" style="margin-top:5px">${esc(a.company||'')} ${approval}<br>${esc(a.next||'')}</div></div>`}
function render(){let box=document.getElementById('agentCCBody');if(!box)return;let list=agentList(),d=window.AutomationOrchestrator?.dashboard?.()||{actions:(data().orch.actions||[]).filter(a=>['open','ready','blocked'].includes(a.status)),stats:data().orch.stats||{},enabled:data().orch.enabled!==false};let actions=(d.actions||[]).slice(0,20);box.innerHTML=`<div class="accTop"><div><h2 style="margin:0">Agent Control Center 1.0</h2><div class="accNote">监控 Agent 健康、自动动作、审批阻塞和失败风险。外发邮件与异常报价仍保留人工审批。</div></div><button class="accBtn gray" onclick="AITRADE_AGENT_CC.close()">关闭</button></div><div class="accToolbar" style="margin-top:12px"><button class="accBtn" onclick="AITRADE_AGENT_CC.runNow()">立即运行 Orchestrator</button><button class="accBtn gray" onclick="AITRADE_AGENT_CC.toggle()">${d.enabled===false?'恢复自动化':'暂停自动化'}</button><button class="accBtn gray" onclick="AITRADE_CLOUD?.push?.()">同步到云端</button></div><div class="accGrid">${list.map(statusHTML).join('')}</div><h3 style="margin:18px 0 8px">待处理动作</h3>${actions.map(actionHTML).join('')||'<div class="accLog">当前没有待处理动作。</div>'}<h3 style="margin:18px 0 8px">运行统计</h3><div class="accGrid"><div class="accCard"><div class="accNote">Runs</div><div class="accMetric">${d.stats?.runs||0}</div></div><div class="accCard"><div class="accNote">Actions Created</div><div class="accMetric">${d.stats?.actionsCreated||0}</div></div><div class="accCard"><div class="accNote">Approval Blocks</div><div class="accMetric">${d.stats?.approvalBlocks||0}</div></div></div>`}
function open(){let c=cfg();c.opened=(c.opened||0)+1;c.lastOpenedAt=new Date().toISOString();saveCfg(c);document.getElementById('agentCCModal').style.display='flex';render()}
function close(){document.getElementById('agentCCModal').style.display='none'}
function runNow(){window.AutomationOrchestrator?.run?.();window.FeedbackBrain2?.learn?.();render();window.AITRADE_CLOUD?.push?.()}
function toggle(){let s=data().orch.enabled!==false;window.AutomationOrchestrator?.setEnabled?.(!s);render();window.AITRADE_CLOUD?.push?.()}
function boot(){style();if(!document.getElementById('agentCCBtn')){let b=document.createElement('button');b.id='agentCCBtn';b.textContent='⚙ Agents';b.onclick=open;document.body.appendChild(b)}if(!document.getElementById('agentCCModal')){let m=document.createElement('div');m.id='agentCCModal';m.innerHTML='<div class="box" id="agentCCBody"></div>';m.onclick=e=>{if(e.target===m)close()};document.body.appendChild(m)}}
window.AITRADE_AGENT_CC={open,close,render,runNow,toggle,agents:agentList};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();