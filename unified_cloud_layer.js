/* Unified cloud adapter v2: atomic snapshot + normalized owner-scoped records. */
(()=>{
const tables=['products','customers','contacts','activities','tasks','approvals'];
const list=x=>Array.isArray(x)?x:[];
const number=x=>x!==''&&x!=null&&Number.isFinite(Number(x))?Number(x):null;
const integer=x=>Math.trunc(number(x)||0);
const date=x=>x&&Number.isFinite(Date.parse(x))?new Date(x).toISOString():null;
function normalized(payload,products){
 const core=payload.aitrade_full59_v1||{},crm=payload.aitrade_crm_followup_v2||{},dm=payload.aitrade_decision_makers_v2||payload.aitrade_decision_makers_v1||{};
 const out=Object.fromEntries(tables.map(t=>['ai_trade_'+t,[]]));
 function map(table,rows,identity,fields){
  const unique=new Map();
  for(const p of list(rows)){const key=identity(p);if(key==null||key==='')throw new Error(table+' 存在缺少稳定标识的记录，请补全后同步');
   const source_id='local:'+String(key);
   unique.set(source_id,{source_id,payload:p,...fields(p)});
  }
  out['ai_trade_'+table]=Array.from(unique.values());
 }
 map('products',products,p=>p.id||p.sku||p.model,p=>({model:p.model||p.sku||String(p.id),name:p.name||p.model,category:p.category||null,price:number(p.price),cost:number(p.cost),moq:number(p.moq)===null?null:integer(p.moq),status:p.status||'active'}));
 map('customers',core.customers,p=>p.id||p.domain||p.company,p=>({company:p.company||'',country:p.country||null,channel:p.channel||null,domain:p.domain||null,website:p.website||null,stage:p.stage||'prospect',icp_score:integer(p.icp),next_action:p.next||null,notes:p.notes||null}));
 const contacts=[...list(dm.people),...list(core.customers).filter(p=>p.contact||p.email).map(p=>({...p,id:'customer:'+p.id,name:p.contact,customerId:p.id}))];
 map('contacts',contacts,p=>p.id||p.email||[p.company,p.name,p.role].join('|'),p=>({customer_source_id:p.customerId?'local:'+p.customerId:null,company:p.company||null,person_name:p.name||p.person_name||null,role:p.role||null,email:p.email||null,phone:p.phone||null,whatsapp:p.whatsapp||null,linkedin_url:p.linkedin||null,verification_status:p.status||'unverified',confidence:integer(p.confidence)}));
 map('activities',core.signals,p=>p.id,p=>({customer_source_id:p.customerId?'local:'+p.customerId:null,activity_type:p.type||'signal',content:p.note||null,points:integer(p.points),...(date(p.time)?{occurred_at:date(p.time)}:{})}));
 map('tasks',[...list(core.tasks).map(p=>({...p,_origin:'core'})),...list(crm.tasks).map(p=>({...p,_origin:'crm'}))],p=>p._origin+':'+(p.id||[p.customerId,p.title||p.action,p.due||p.dueAt].join('|')),p=>({customer_source_id:p.customerId?'local:'+p.customerId:null,title:p.title||p.action||'跟进任务',status:p.status||'open',priority:p.priority||'normal',due_at:date(p.dueAt||p.due),requires_approval:!!p.requiresApproval}));
 map('approvals',core.quotes,p=>'quote:'+p.id,p=>({entity_type:'quote',entity_source_id:String(p.id),customer_source_id:p.customerId?'local:'+p.customerId:null,approval_type:'quote',status:p.status||'pending',risk_flags:list(p.riskFlags)}));
 return out;
}
async function commit(payload,expected){
 const cloud=window.AITRADE_CLOUD;
 if(!cloud?.user||!cloud.client)throw new Error('请先登录');
 const entities=normalized(payload,window.PRODUCTS||[]);
 const {data,error}=await cloud.client.rpc('ai_trade_commit_unified',{p_payload:payload,p_entities:entities,p_expected_updated_at:expected});
 if(error)throw new Error(error.message.includes('cloud_version_conflict')?'另一设备已更新云端。请先导出本地副本，再从云端恢复后继续编辑。':error.message);
 return data;
}
async function read(entity){
 if(!tables.includes(entity))throw new Error('未知数据类型');
 const cloud=window.AITRADE_CLOUD;
 if(!cloud?.user)throw new Error('请先登录');
 let rows=[],offset=0;
 for(;;){const {data,error}=await cloud.client.from('ai_trade_'+entity).select('*').eq('user_id',cloud.user.id).order('id').range(offset,offset+499);if(error)throw error;rows.push(...data);if(data.length<500)return rows;offset+=500;}
}
window.AITRADE_UNIFIED={normalized,commit,read,sync:()=>window.AITRADE_CLOUD.push(),version:'2.1'};
})();