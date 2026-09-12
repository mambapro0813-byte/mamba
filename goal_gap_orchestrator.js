/* AI TRADE — Goal Gap Orchestrator 1.0 */
(()=>{
const KEY='aitrade_goal_gap_v1', DBK='aitrade_full59_v1', OK='aitrade_automation_orchestrator_v1';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
const today=()=>new Date().toISOString().slice(0,10);
function countToday(arr,matcher){const d=today();return (arr||[]).filter(x=>String(x.createdAt||x.date||x.updatedAt||'').slice(0,10)===d&&(!matcher||matcher(x))).length}
function calc(){
 const p=window.AITRADE_GOAL?.plan?.(); if(!p)return null;
 const db=get(DBK,{leads:[],signals:[],quotes:[],orders:[]});
 const actual={
  leads:countToday(db.leads),
  replies:countToday(db.signals,s=>/reply|回复/i.test(s.type||'')),
  rfqs:countToday(db.signals,s=>/rfq|询价|quote|price|precio|cotiz/i.test(s.type||'')),
  quotes:countToday(db.quotes),
  orders:countToday(db.orders)
 };
 const target={leads:Math.ceil(p.daily.leads),replies:Math.ceil(p.daily.replies),rfqs:Math.ceil(p.daily.rfqs),quotes:Math.ceil(p.daily.quotes),orders:Math.ceil(p.daily.orders)};
 const gaps={};Object.keys(target).forEach(k=>gaps[k]=Math.max(0,target[k]-actual[k]));
 const s={date:today(),target,actual,gaps,updatedAt:new Date().toISOString()};put(KEY,s);return s;
}
function syncActions(){
 const g=calc();if(!g)return null;let o=get(OK,{enabled:true,lastRun:null,events:[],actions:[],rulesVersion:'1.0',stats:{runs:0,actionsCreated:0,autoTransitions:0,approvalBlocks:0}});
 const defs={leads:['补充新 Leads','Lead Intelligence 继续发现并验证目标公司','high'],replies:['提升有效回复','检查 SDR 个性化与跟进节奏，优先处理高ICP客户','normal'],rfqs:['推动 RFQ','对已回复/高意向客户生成下一步需求确认动作','high'],quotes:['完成报价','处理 RFQ 并调用 Product Brain + Pricing Brain','urgent'],orders:['推动订单','优先处理 Negotiation / Sample / 已报价客户','urgent']};
 Object.entries(g.gaps).forEach(([k,n])=>{const fp=`goal-gap:${g.date}:${k}`;let a=o.actions.find(x=>x.fingerprint===fp);if(n>0){let [title,next,priority]=defs[k];if(a){a.title=`${title}：今日还差 ${n}`;a.next=next;a.priority=priority;if(a.status==='done')a.status='open';a.updatedAt=new Date().toISOString()}else{o.actions.push({id:'ACT-GOAL-'+Date.now()+Math.random().toString(36).slice(2,6),fingerprint:fp,type:'goal_gap',metric:k,title:`${title}：今日还差 ${n}`,next,priority,status:'open',requiresApproval:false,createdAt:new Date().toISOString()});o.stats.actionsCreated=(o.stats.actionsCreated||0)+1}}else if(a&&a.status!=='done'){a.status='done';a.completedAt=new Date().toISOString();}}
 );o.actions=o.actions.slice(-1500);put(OK,o);window.AITRADE_CLOUD?.push?.();return g;
}
function summary(){return get(KEY,calc()||{})}
window.GoalGapOrchestrator={calc,syncActions,summary};setTimeout(syncActions,2300);setInterval(syncActions,60000);
})();