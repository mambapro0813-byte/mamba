/* AI TRADE — Automation Orchestrator 1.0 */
(()=>{
const DBK='aitrade_full59_v1', SDK='aitrade_sdr2_v1', QK='ai_trade_quotes_v2', CRMK='aitrade_crm_followup_v2', KEY='aitrade_automation_orchestrator_v1';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const now=()=>new Date().toISOString();
function state(){return get(KEY,{enabled:true,lastRun:null,events:[],actions:[],rulesVersion:'1.0',stats:{runs:0,actionsCreated:0,autoTransitions:0,approvalBlocks:0}})}
function save(s){s.lastRun=now();put(KEY,s);window.AITRADE_CLOUD?.push?.()}
function pushEvent(s,type,entityId,detail){let key=[type,entityId,detail?.fingerprint||''].join('|');if(s.events.some(e=>e.key===key))return false;s.events.push({id:'EV-'+Date.now()+Math.random().toString(36).slice(2,6),key,type,entityId,detail:detail||{},createdAt:now()});s.events=s.events.slice(-1200);return true}
function addAction(s,a){let fp=a.fingerprint||[a.type,a.customerId,a.refId,a.due].join('|');if(s.actions.some(x=>x.fingerprint===fp&&['open','blocked','ready'].includes(x.status)))return false;s.actions.push({id:'ACT-'+Date.now()+Math.random().toString(36).slice(2,7),fingerprint:fp,status:a.status||'open',priority:a.priority||'normal',requiresApproval:!!a.requiresApproval,createdAt:now(),...a});s.actions=s.actions.slice(-1500);s.stats.actionsCreated++;if(a.status==='blocked')s.stats.approvalBlocks++;return true}
function customerBy(db,id){return (db.customers||[]).find(c=>String(c.id)===String(id))}
function run(){let s=state();if(!s.enabled)return s;let db=get(DBK,{customers:[],signals:[],quotes:[],orders:[],leads:[]}), sdr=get(SDK,{campaigns:[],queue:[]}), qv=get(QK,[]), crm=get(CRMK,{tasks:[],history:[]});s.stats.runs++;
 // 1) Lead promoted/high ICP -> SDR preparation task (not auto-send)
 (db.customers||[]).forEach(c=>{let icp=+c.icp||0,stage=String(c.stage||'prospect').toLowerCase();if(icp>=75&&['prospect','lead','new'].includes(stage)){if(pushEvent(s,'qualified_lead',c.id,{icp,fingerprint:'qualified:'+c.id+':'+icp}))addAction(s,{type:'prepare_sdr',customerId:c.id,company:c.company,priority:icp>=90?'high':'normal',title:'生成首封开发序列',next:'AI SDR 生成 D1/D3/D7/D14 草稿并等待人工审批',fingerprint:'sdr:'+c.id});}}
 );
 // 2) Signals -> CRM stage + next best action
 (db.signals||[]).forEach(sig=>{let c=customerBy(db,sig.customerId);if(!c)return;let t=String(sig.type||'').toLowerCase(),target=null,action=null,priority='normal';if(/rfq|询价|quote|price|precio|cotiz/.test(t)){target='rfq';action='生成 Pricing Brain 报价草稿';priority='high'}else if(/sample|样品|muestra/.test(t)){target='sample';action='建立样品寄送/测试跟进';priority='high'}else if(/meeting|call|会议/.test(t)){target='qualified';action='安排会议并准备客户摘要';priority='high'}else if(/order|po|下单/.test(t)){target='negotiation';action='人工确认订单条件';priority='high'}else if(/reject|拒绝|not interested/.test(t)){target='lost';action='停止自动开发并记录拒绝原因';priority='normal'}else if(/reorder|复购/.test(t)){target='reorder';action='生成复购方案';priority='high'}else if(/reply|回复/.test(t)){target='replied';action='AI Inbox 生成回复草稿';priority='normal'};
  if(target){let fp='sig:'+String(sig.id||sig.createdAt||sig.date||'')+':'+target;if(pushEvent(s,'signal_detected',c.id,{signal:t,target,fingerprint:fp})){if(c.stage!==target&&target!=='lost'){c.stage=target;s.stats.autoTransitions++;}if(target==='lost')c.stage='lost';addAction(s,{type:'customer_next_action',customerId:c.id,company:c.company,priority,title:action,next:action,fingerprint:fp});}}
 });
 // 3) RFQ stage without quote -> create quote preparation task
 (db.customers||[]).forEach(c=>{if(String(c.stage).toLowerCase()==='rfq'){let has=(db.quotes||[]).some(q=>String(q.customerId)===String(c.id)&&!['rejected','cancelled'].includes(String(q.status||'').toLowerCase()))||(Array.isArray(qv)&&qv.some(q=>String(q.customerId)===String(c.id)));if(!has)addAction(s,{type:'prepare_quote',customerId:c.id,company:c.company,priority:'high',title:'RFQ 等待报价',next:'调用 Product Brain + Pricing Brain 生成报价',fingerprint:'quote:'+c.id});}}
 );
 // 4) Quotes requiring approval -> block external send
 [...(db.quotes||[]),...(Array.isArray(qv)?qv:[])].forEach(q=>{let st=String(q.status||q.humanApproval||'').toLowerCase(),needs=/pending|approval|required|待审批|待人工/.test(st)||q.approvalRequired===true;if(needs)addAction(s,{type:'quote_approval',customerId:q.customerId,company:q.company||q.customer,refId:q.id,priority:'urgent',title:'报价待人工审批',next:'检查价格、毛利、付款条件后批准；未批准不得发送',status:'blocked',requiresApproval:true,fingerprint:'approve:'+q.id});});
 // 5) SDR queue approved -> ready to send; unapproved remains blocked
 (sdr.queue||[]).forEach(x=>{let st=String(x.status||'').toLowerCase(),ready=/等待发送|ready|approved/.test(st),blocked=/pending|待审批|draft|草稿/.test(st);if(ready)addAction(s,{type:'send_email',customerId:x.customerId,company:x.company,refId:x.id,priority:'normal',title:`${x.step||'SDR'} 邮件待发送`,next:'通过 Gmail Bridge 发送并记录 thread/message id',status:'ready',requiresApproval:false,fingerprint:'send:'+x.id});else if(blocked)addAction(s,{type:'sdr_approval',customerId:x.customerId,company:x.company,refId:x.id,priority:'normal',title:`${x.step||'SDR'} 草稿待审批`,next:'人工审核后才进入发送队列',status:'blocked',requiresApproval:true,fingerprint:'sdrapprove:'+x.id});});
 // 6) Won orders -> reorder window task (default 45d if no date)
 (db.orders||[]).forEach(o=>{let status=String(o.status||'').toLowerCase();if(/won|paid|shipped|completed|完成|出货/.test(status)){let base=new Date(o.shipDate||o.createdAt||o.date||Date.now()),due=new Date(base.getTime()+45*864e5).toISOString().slice(0,10);addAction(s,{type:'reorder_watch',customerId:o.customerId,company:o.company||o.customer,refId:o.id,priority:'normal',title:'复购窗口监测',due,next:`${due} 起检查库存/销售周期并启动复购开发`,fingerprint:'reorder:'+o.id+':'+due});}}
 );
 // 7) Aging follow-up: replied/qualified/negotiation with no recent signal
 (db.customers||[]).forEach(c=>{let stage=String(c.stage||'').toLowerCase();if(!['replied','qualified','negotiation','sample'].includes(stage))return;let ev=(db.signals||[]).filter(x=>String(x.customerId)===String(c.id)).sort((a,b)=>new Date(b.createdAt||b.date||0)-new Date(a.createdAt||a.date||0))[0];let d=ev?new Date(ev.createdAt||ev.date):new Date(c.updatedAt||c.createdAt||Date.now());let age=(Date.now()-d.getTime())/864e5;if(age>=3)addAction(s,{type:'follow_up',customerId:c.id,company:c.company,priority:age>=7?'high':'normal',title:'客户需要跟进',next:`已 ${Math.floor(age)} 天无新信号；根据阶段生成个性化跟进`,fingerprint:'follow:'+c.id+':'+Math.floor(age/3)});});
 put(DBK,db);put(CRMK,crm);save(s);return s}
function complete(id){let s=state(),a=s.actions.find(x=>x.id===id);if(a){a.status='done';a.completedAt=now();save(s)}return a}
function approve(id){let s=state(),a=s.actions.find(x=>x.id===id);if(a&&a.requiresApproval){a.status='ready';a.approvedAt=now();save(s)}return a}
function dashboard(){let s=state(),open=s.actions.filter(a=>['open','ready','blocked'].includes(a.status));return{enabled:s.enabled,lastRun:s.lastRun,total:open.length,urgent:open.filter(a=>['urgent','high'].includes(a.priority)).length,blocked:open.filter(a=>a.status==='blocked').length,ready:open.filter(a=>a.status==='ready').length,actions:open.sort((a,b)=>({urgent:0,high:1,normal:2}[a.priority]??3)-({urgent:0,high:1,normal:2}[b.priority]??3)).slice(0,50),stats:s.stats}}
function setEnabled(v){let s=state();s.enabled=!!v;save(s);return s.enabled}
window.AutomationOrchestrator={run,dashboard,complete,approve,setEnabled,state};
setTimeout(run,1600);setInterval(run,60000);
})();