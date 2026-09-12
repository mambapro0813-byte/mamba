/* AI TRADE — Mail Execution Engine 1.0 */
(()=>{
const KEY='aitrade_mail_execution_v1', SDR='aitrade_sdr2_v1';
const cfg=window.AITRADE_CLOUD_CONFIG||{};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k)||'null')||d}catch{return d}};
const put=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
function state(){return get(KEY,{queued:0,lastSync:null,lastError:null,mode:'gmail_connector_required'})}
function save(s){s.lastSync=new Date().toISOString();put(KEY,s);window.AITRADE_CLOUD?.push?.()}
async function client(){if(!window.supabase){await new Promise((res,rej)=>{let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=res;s.onerror=rej;document.head.appendChild(s)})}return window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true}})}
function approvedQueue(){let s=get(SDR,{queue:[]});return (s.queue||[]).filter(x=>/approved|ready|等待发送/i.test(String(x.status||''))&&x.to&&x.subject&&x.body)}
async function syncApproved(){let st=state();try{if(!cfg.url||!cfg.anonKey)throw new Error('cloud_not_configured');let sb=await client(),{data:{session}}=await sb.auth.getSession();if(!session)throw new Error('not_logged_in');let list=approvedQueue(),n=0;for(const x of list){let key=`${x.id||x.customerId||x.to}:${x.step||'SDR'}:${x.subject}`;let {data,error}=await sb.functions.invoke('mail-execution-runner',{body:{action:'enqueue',customer_id:x.customerId||null,campaign_id:x.campaignId||null,step:x.step||null,recipient_email:x.to,subject:x.subject,body:x.body,reply_message_id:x.replyMessageId||null,idempotency_key:key}});if(error)throw error;if(data?.ok)n++;}st.queued=n;st.lastError=null;save(st);return{ok:true,queued:n}}catch(e){st.lastError=String(e?.message||e);save(st);return{ok:false,error:st.lastError}}}
async function listReady(){try{let sb=await client(),{data,error}=await sb.functions.invoke('mail-execution-runner',{body:{action:'ready',limit:20}});if(error)throw error;return data?.jobs||[]}catch{return[]}}
function status(){let s=state();return{...s,approvedLocal:approvedQueue().length}}
window.MailExecutionEngine={syncApproved,listReady,status,state};setTimeout(syncApproved,4500);setInterval(syncApproved,120000);
})();