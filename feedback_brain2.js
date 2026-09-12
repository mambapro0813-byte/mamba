/* AI TRADE — Data Feedback Brain 2.0 */
(()=>{
const DB='aitrade_full59_v1', KEY='aitrade_feedback_brain_v2';
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
const db=()=>get(DB,{customers:[],leads:[],signals:[],quotes:[],orders:[]});
const state=()=>get(KEY,{events:[],weights:{reply:8,rfq:18,sample:22,negotiation:28,order:45,reorder:55,reject:-25},updatedAt:null});
function save(s){s.updatedAt=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(s));window.AITRADE_CLOUD?.push?.()}
function norm(v){return String(v||'').toLowerCase()}
function learn(){let x=db(),s=state(),events=[];
 (x.signals||[]).forEach(a=>events.push({kind:norm(a.type),customerId:a.customerId,points:+a.points||0,at:a.createdAt||a.date||null,source:'signal'}));
 (x.quotes||[]).forEach(q=>events.push({kind:'quote',customerId:q.customerId,status:q.status,amount:+q.total||0,at:q.createdAt||null,source:'quote'}));
 (x.orders||[]).forEach(o=>events.push({kind:norm(o.status).includes('reorder')?'reorder':'order',customerId:o.customerId,amount:+o.total||0,at:o.createdAt||o.date||null,source:'order'}));
 s.events=events.slice(-1000);save(s);return score();}
function score(){let x=db(),s=state(),rows=(x.customers||[]).map(c=>{let ev=s.events.filter(e=>String(e.customerId)===String(c.id)),delta=0;ev.forEach(e=>{let k=e.kind;if(k.includes('rfq')||k.includes('询价'))delta+=s.weights.rfq;else if(k.includes('sample')||k.includes('样品'))delta+=s.weights.sample;else if(k.includes('reorder')||k.includes('复购'))delta+=s.weights.reorder;else if(k.includes('order')||k.includes('won')||k.includes('订单'))delta+=s.weights.order;else if(k.includes('reject')||k.includes('拒绝'))delta+=s.weights.reject;else if(k.includes('reply')||k.includes('回复'))delta+=s.weights.reply;});let base=+c.icp||50,learned=Math.max(0,Math.min(100,base+Math.round(delta/3)));return{id:c.id,company:c.company||c.name||'',base,learned,delta,events:ev.length}}).sort((a,b)=>b.learned-a.learned);return rows}
function insights(){let rows=score(),x=db(),won=(x.orders||[]).length,rfq=(x.signals||[]).filter(s=>/rfq|询价/i.test(s.type||'')).length,replies=(x.signals||[]).filter(s=>/reply|回复/i.test(s.type||'')).length;return{customers:rows.length,hot:rows.filter(r=>r.learned>=85).length,rfq,replies,orders:won,top:rows.slice(0,10)}}
window.FeedbackBrain2={learn,score,insights,state};
setTimeout(()=>learn(),1200);
})();