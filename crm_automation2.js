/* AI TRADE CRM Automation 2.0 — CRM auto progression + inbound reply intelligence + RFQ quote preparation */
(()=>{
const CORE='aitrade_full59_v1', TASKS='aitrade_sales_tasks_v2', RFQ='aitrade_rfq_queue_v2', DONE='aitrade_crm_auto_processed_v2';
const $=s=>document.querySelector(s), esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}}, write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function now(){return new Date().toISOString()} function due(hours){return new Date(Date.now()+hours*3600000).toISOString()}
function classifyText(text=''){
 const t=String(text).toLowerCase(); let x={intent:'Reply',stage:'replied',priority:'normal',next:'4小时内人工回复',task:'回复客户',dueHours:4,points:15};
 if(/quote|quotation|price|pricing|precio|cotiz|rfq|offer|unit price|best price|报价|价格/.test(t))x={...x,intent:'RFQ',stage:'rfq',priority:'urgent',next:'进入AI报价准备',task:'准备AI报价',dueHours:1,points:30};
 if(/sample|muestra|demo unit|样品/.test(t))x={...x,intent:'Sample',stage:'sample',priority:'high',next:'准备样品方案',task:'确认样品方案',dueHours:2,points:25};
 if(/meeting|call|zoom|teams|reunión|reunion|会议|通话/.test(t))x={...x,intent:'Meeting',stage:'replied',priority:'high',next:'安排会议并准备资料',task:'安排客户会议',dueHours:2,points:25};
 if(/order|purchase order|\bpo\b|pedido|confirm order|place order|下单|订单/.test(t))x={...x,intent:'Order Intent',stage:'quoted',priority:'urgent',next:'人工确认PO/付款/交期',task:'确认订单条件',dueHours:1,points:40};
 if(/reorder|repeat order|reposición|reposicion|again order|复购/.test(t))x={...x,intent:'Reorder',stage:'won',priority:'urgent',next:'准备复购报价',task:'准备复购报价',dueHours:1,points:40};
 if(/not interested|no thanks|remove me|unsubscribe|no interesado|no nos interesa|没兴趣|不考虑/.test(t))x={...x,intent:'Rejected',stage:'lost',priority:'low',next:'停止主动跟进，进入长期培育',task:'',dueHours:0,points:-20};
 let q=t.match(/(?:qty|quantity|cantidad|数量)[:\s-]*(\d[\d,]*)/i)||t.match(/(\d[\d,]*)\s*(?:pcs|pieces|units|unidades|个|只)/i); if(q)x.qty=Number(q[1].replace(/,/g,''));
 let mm=t.match(/\b(?:yyk[- ]?)?[a-z]{0,4}q?\d{2,4}(?:\s*pro)?\b/i); if(mm)x.model=mm[0].toUpperCase().replace(/\s+/g,'-');
 return x;
}
function customerById(id){try{if(typeof cby==='function')return cby(id)}catch{};let d=read(CORE,{});return d.customers?.find(c=>c.id===id)||null}
function addTask(c,ai,message){if(!ai.task||!c)return;let s=read(TASKS,{items:[]});s.items=s.items||[];let key=`${message.id}:${ai.intent}`;if(s.items.some(x=>x.key===key))return;s.items.push({id:'T'+Date.now()+Math.random().toString(36).slice(2,5),key,customerId:c.id,company:c.company,title:ai.task,priority:ai.priority,status:'open',intent:ai.intent,dueAt:due(ai.dueHours),createdAt:now(),source:'CRM Automation 2.0',messageId:message.id});write(TASKS,s)}
function addRfq(c,ai,message){if(ai.intent!=='RFQ'||!c)return;let q=read(RFQ,{items:[]});q.items=q.items||[];if(q.items.some(x=>x.messageId===message.id))return;let model=ai.model||message.entities?.model||c.lastModel||'';let qty=ai.qty||message.entities?.qty||c.lastQty||0;let item={id:'RFQ-'+Date.now(),messageId:message.id,customerId:c.id,company:c.company,model,qty,subject:message.subject||'',from:message.from||'',status:'quote_preparation',createdAt:now(),next:'补全型号/数量/价格 → 人工审批'};q.items.unshift(item);write(RFQ,q);
 try{if(typeof db!=='undefined'){db.quotes=db.quotes||[];if(!db.quotes.some(x=>x.sourceMessageId===message.id)){db.quotes.push({id:'Q'+Date.now(),customerId:c.id,model:model||'',qty:qty||0,unit:0,total:0,status:'preparing',created:new Date().toLocaleString(),sourceMessageId:message.id,source:'RFQ Auto',subject:message.subject||''})}}}catch{}
}
function syncCustomer(c,ai,message){if(!c)return;c.stage=ai.stage||c.stage;c.next=ai.next;c.lastReplyAt=message.receivedAt||now();c.lastIntent=ai.intent;if(ai.qty||message.entities?.qty)c.lastQty=ai.qty||message.entities.qty;if(ai.model||message.entities?.model)c.lastModel=ai.model||message.entities.model;c.notes=(c.notes||'')+`\n[CRM Automation 2.0] ${new Date().toLocaleString()} | ${ai.intent} | ${message.subject||''}${c.lastQty?' | Qty='+c.lastQty:''}${c.lastModel?' | Model='+c.lastModel:''}`}
function processMessage(message){if(!message?.id||!message.customerId)return false;let done=read(DONE,[]);if(done.includes(message.id))return false;let text=[message.subject,message.body,message.snippet].filter(Boolean).join(' '), ai={...classifyText(text),...(message.intent?{intent:message.intent}:{}),...(message.entities||{})};
 // Respect listener's strongest intent/stage while enriching CRM action metadata.
 if(message.intent==='RFQ')Object.assign(ai,{intent:'RFQ',stage:'rfq',priority:'urgent',next:'进入AI报价准备',task:'准备AI报价',dueHours:1});
 if(message.intent==='Sample')Object.assign(ai,{intent:'Sample',stage:'sample',priority:'high',next:'准备样品方案',task:'确认样品方案',dueHours:2});
 if(message.intent==='Order Intent')Object.assign(ai,{intent:'Order Intent',stage:'quoted',priority:'urgent',next:'人工确认PO/付款/交期',task:'确认订单条件',dueHours:1});
 if(message.intent==='Rejected')Object.assign(ai,{intent:'Rejected',stage:'lost',priority:'low',next:'停止主动跟进，进入长期培育',task:''});
 if(message.intent==='Reorder')Object.assign(ai,{intent:'Reorder',stage:'won',priority:'urgent',next:'准备复购报价',task:'准备复购报价',dueHours:1});
 let c=customerById(message.customerId);if(!c)return false;syncCustomer(c,ai,message);addTask(c,ai,message);addRfq(c,ai,message);done.push(message.id);write(DONE,done.slice(-2000));
 try{if(typeof save==='function')save();else{let core=read(CORE,{});let cc=core.customers?.find(x=>x.id===c.id);if(cc)Object.assign(cc,c);write(CORE,core)}}catch{}
 window.dispatchEvent(new CustomEvent('aitrade:crm-advanced',{detail:{customerId:c.id,intent:ai.intent,stage:ai.stage,messageId:message.id}}));return true}
function processNew(){let api=window.AITRADE_INBOX_LISTENER;if(!api?.state)return 0;let n=0;for(const m of (api.state().messages||[]))if(processMessage(m))n++;renderRfq();return n}
function hook(){let api=window.AITRADE_INBOX_LISTENER;if(!api||api.__crm2hook)return false;let original=api.ingest.bind(api);api.ingest=function(input){let r=original(input);setTimeout(processNew,0);return r};api.__crm2hook=true;processNew();return true}
function quoteStatusLabel(q){return q.status==='preparing'?'<span class="tag warn">报价准备中</span>':q.status}
function renderRfq(){let sec=document.getElementById('quotes');if(!sec)return;let q=read(RFQ,{items:[]}).items||[],box=document.getElementById('rfqAutoQueue');if(!box){box=document.createElement('div');box.id='rfqAutoQueue';box.className='card';box.style.marginBottom='10px';let table=sec.querySelector('.card');sec.insertBefore(box,table||null)}let rows=q.slice(0,30).map(x=>`<tr><td><b>${esc(x.company)}</b></td><td>${esc(x.model||'待确认')}</td><td>${x.qty||'待确认'}</td><td>${esc(x.subject||'-')}</td><td><span class="tag warn">待补价格 / 审批</span></td></tr>`).join('');let content=q.length?`<div class="wrap"><table><thead><tr><th>客户</th><th>型号</th><th>数量</th><th>邮件主题</th><th>状态</th></tr></thead><tbody>${rows}</tbody></table></div>`:'<div class="item">暂无 RFQ。客户邮件出现 price / quote / RFQ / precio / cotización 等意图后会自动进入。</div>';box.innerHTML=`<div class="top" style="margin-bottom:8px"><div><b>RFQ 自动报价队列</b><div class="sub">邮件识别为 RFQ 后自动进入这里；价格仍保留人工审批。</div></div><span class="tag ${q.length?'warn':'ok'}">${q.length} 条</span></div>${content}`;
 // Upgrade raw preparing labels in legacy quote table without changing original data model.
 sec.querySelectorAll('#qr tr').forEach(tr=>{for(const td of tr.children){if(td.textContent.trim()==='preparing')td.innerHTML='<span class="tag warn">报价准备中</span>'}})}
function init(){let tries=0,t=setInterval(()=>{tries++;if(hook()||tries>60)clearInterval(t)},250);setInterval(()=>{hook();processNew();renderRfq()},5000);document.addEventListener('click',e=>{if(e.target.closest('[data-go="quotes"],button[data-p="quotes"]'))setTimeout(renderRfq,100)},true);window.addEventListener('aitrade:inbound-email',e=>{if(e.detail)window.AITRADE_INBOX_LISTENER?.ingest?.(e.detail)});}
window.AI_CRM_AUTOMATION={processMessage,processNew,classifyText,rfqQueue:()=>read(RFQ,{items:[]}).items||[]};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
