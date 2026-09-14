(()=>{
const CFG=window.AITRADE_CLOUD_CONFIG||{};
const KEYS=['aitrade_full59_v1','aitrade_decision_makers_v1','aitrade_decision_makers_v2','aitrade_sdr2_v1','aitrade_gmail_bridge_v1','aitrade_inbox_listener_v2','ai_trade_pricing_brain_v2','ai_trade_quotes_v2','aitrade_crm_followup_v2','aitrade_feedback_brain_v2','aitrade_automation_orchestrator_v1','aitrade_agent_control_center_v1','aitrade_revenue_intelligence_v1','aitrade_goal_engine_v1','aitrade_goal_gap_v1','aitrade_sales_execution_pack_v1','aitrade_decision_enrichment_v2','aitrade_ai_inbox_v3','aitrade_autonomous_leads_v2','aitrade_decision_enrichment_v3','aitrade_mail_execution_v1'];
const MARK='aitrade_cloud_initialized_v1';let sb=null,user=null,lastSnapshot='',readyUser=null,revision=null,pushing=null,initializing=null;
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function snapshot(){let out={};for(const k of KEYS){try{out[k]=JSON.parse(localStorage.getItem(k)||'null')}catch{out[k]=null}}return out}function snapshotText(){return JSON.stringify(snapshot())}
function ensureStyle(){if(document.getElementById('cloudSyncStyle'))return;let st=document.createElement('style');st.id='cloudSyncStyle';st.textContent=`#cloudSyncBtn{position:fixed;right:14px;top:12px;z-index:9998;border:1px solid #dce4f1;background:#fff;color:#24324a;padding:8px 11px;border-radius:999px;font:12px Arial;box-shadow:0 5px 18px #0001}#cloudSyncBtn.ok{background:#eaf8f1;color:#147b56;border-color:#c8eadb}#cloudSyncBtn.warn{background:#fff6e8;color:#9b6519;border-color:#f0d5a8}#cloudSyncModal{position:fixed;inset:0;z-index:9999;background:#17203366;display:none;align-items:center;justify-content:center;padding:18px}#cloudSyncModal .box{width:min(430px,94vw);background:#fff;border-radius:18px;padding:20px;box-shadow:0 25px 80px #0005}#cloudSyncModal input{width:100%;padding:11px;border:1px solid #dfe5ef;border-radius:10px;margin:6px 0 10px}#cloudSyncModal button{border:0;border-radius:10px;padding:10px 12px;margin-right:6px;cursor:pointer}#cloudSyncModal .primary{background:#2764dc;color:#fff}#cloudSyncModal .ghost{background:#eef3fb;color:#2764dc}#cloudSyncStatus{font-size:12px;color:#748096;line-height:1.6;margin:8px 0 12px}`;document.head.appendChild(st)}
function ui(){ensureStyle();if(!document.getElementById('cloudSyncBtn')){let b=document.createElement('button');b.id='cloudSyncBtn';b.textContent='☁ 本地模式';b.onclick=()=>openModal();document.body.appendChild(b)}if(!document.getElementById('cloudSyncModal')){let m=document.createElement('div');m.id='cloudSyncModal';m.innerHTML=`<div class="box"><h2 style="margin:0 0 6px">AI TRADE 云同步</h2><div id="cloudSyncStatus"></div><div id="cloudAuthForm"><input id="cloudEmail" type="email" autocomplete="email" placeholder="工作邮箱"><input id="cloudPassword" type="password" autocomplete="current-password" placeholder="密码（至少6位）"><button class="primary" id="cloudLogin">登录</button><button class="ghost" id="cloudSignup">注册</button></div><div id="cloudUserPanel" style="display:none"><button class="primary" id="cloudPush">立即同步到云端</button><button class="ghost" id="cloudPull">从云端恢复</button><button class="ghost" id="cloudExport">导出本地副本</button><button class="ghost" id="cloudLogout">退出登录</button></div><div style="margin-top:12px"><button class="ghost" id="cloudClose">关闭</button></div></div>`;document.body.appendChild(m);m.onclick=e=>{if(e.target===m)closeModal()};cloudClose.onclick=closeModal;cloudLogin.onclick=login;cloudSignup.onclick=signup;cloudLogout.onclick=logout;cloudExport.onclick=()=>{const url=URL.createObjectURL(new Blob([snapshotText()],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='AI-TRADE-local-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};cloudPush.onclick=()=>pushNow().catch(()=>{});cloudPull.onclick=()=>pullNow(true)}renderStatus()}
function openModal(){cloudSyncModal.style.display='flex';refreshSession(true)}function closeModal(){cloudSyncModal.style.display='none'}
function renderStatus(msg){let status=document.getElementById('cloudSyncStatus'),btn=document.getElementById('cloudSyncBtn');if(!status||!btn)return;if(!CFG.url||!CFG.anonKey){btn.className='warn';btn.textContent='☁ 云同步待连接';status.innerHTML=`当前仍使用浏览器本地数据。${msg?'<br>'+esc(msg):''}`;return}if(user){btn.className='ok';btn.textContent='☁ 已登录';status.innerHTML=`已登录：<b>${esc(user.email||'')}</b><br>手机和电脑共用销售闭环、Autonomous Leads、Decision Enrichment、AI Inbox 与 Mail Execution 数据。${msg?'<br>'+esc(msg):''}`;cloudAuthForm.style.display='none';cloudUserPanel.style.display='block'}else{btn.className='warn';btn.textContent='☁ 未登录';status.innerHTML=`Supabase 已连接，请登录后启用多端同步。${msg?'<br>'+esc(msg):''}`;cloudAuthForm.style.display='block';cloudUserPanel.style.display='none'}}
async function loadClient(){if(sb||!CFG.url||!CFG.anonKey)return sb;await new Promise((res,rej)=>{if(window.supabase)return res();let s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=res;s.onerror=rej;document.head.appendChild(s)});sb=window.supabase.createClient(CFG.url,CFG.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:'aitrade-auth-v1'}});let {data}=await sb.auth.getSession();user=data.session?.user||null;sb.auth.onAuthStateChange((_e,s)=>{const prev=user?.id;user=s?.user||null;if(user?.id!==prev)readyUser=null;renderStatus();if(user&&user.id!==prev)initUser()});return sb}
async function refreshSession(silent=false){try{await loadClient();let {data,error}=await sb.auth.getSession();if(error)throw error;user=data.session?.user||null;if(user&&data.session?.expires_at&&data.session.expires_at*1000-Date.now()<120000){let r=await sb.auth.refreshSession();if(r.error)throw r.error;user=r.data.session?.user||user}renderStatus(silent?'':undefined);return user}catch(e){if(!silent)renderStatus('登录状态检查失败：'+(e.message||e));return null}}
async function login(){try{await loadClient();let email=cloudEmail.value.trim(),password=cloudPassword.value;if(!email||!password)return renderStatus('请输入邮箱和密码');let {data,error}=await sb.auth.signInWithPassword({email,password});if(error)throw error;user=data.user||data.session?.user||null;renderStatus('登录成功');if(user)await initUser()}catch(e){renderStatus(e.message||'登录失败')}}async function signup(){try{await loadClient();let email=cloudEmail.value.trim(),password=cloudPassword.value;if(!email||password.length<6)return renderStatus('请输入邮箱，密码至少6位');let {data,error}=await sb.auth.signUp({email,password});if(error)throw error;user=data.session?.user||null;renderStatus(user?'注册并登录成功':'注册成功。如开启邮箱验证，请先完成验证后登录。');if(user)await initUser()}catch(e){renderStatus(e.message||'注册失败')}}async function logout(){if(!sb)return;await sb.auth.signOut();user=null;readyUser=null;localStorage.removeItem(MARK);renderStatus('已退出')}
async function cloudRow(){let {data,error}=await sb.from('ai_trade_state').select('payload,updated_at').eq('user_id',user.id).maybeSingle();if(error)throw error;return data}

function archiveLocal(owner){localStorage.setItem('aitrade_recovery_'+(owner||'local')+'_'+Date.now(),snapshotText());}
function restore(payload){for(const k of KEYS){if(payload[k]!=null)localStorage.setItem(k,JSON.stringify(payload[k]));else localStorage.removeItem(k);}}
async function initUser(){
 if(initializing)return initializing;
 initializing=(async()=>{try{
  if(!user)return;const id=user.id;readyUser=null;
  const owner=localStorage.getItem('aitrade_data_owner_v2'),row=await cloudRow();
  if(user?.id!==id)return;
  if(owner&&owner!==id){archiveLocal(owner);restore({});}
  localStorage.setItem('aitrade_data_owner_v2',id);
  if(row?.payload){
    revision=row.updated_at;
    const saved=localStorage.getItem('aitrade_revision_'+id);
    if(saved!==revision||owner!==id){
      archiveLocal(owner);restore(row.payload);
      localStorage.setItem('aitrade_revision_'+id,revision);
      renderStatus('已载入云端数据，正在刷新');setTimeout(()=>location.reload(),100);return;
    }
  }else{
    revision=null;
    if(owner&&owner!==id){renderStatus('已切换账号，正在刷新');setTimeout(()=>location.reload(),100);return;}
  }
  readyUser=id;lastSnapshot=snapshotText();renderStatus('统一云同步已就绪');
  window.dispatchEvent(new CustomEvent('aitrade:cloud-ready',{detail:{userId:id}}));
  if(!row)await pushNow();
 }catch(e){readyUser=null;renderStatus('初始化失败：'+e.message);}finally{initializing=null;}})();
 return initializing;
}
async function pushNow(){
 if(pushing)return pushing;
 pushing=(async()=>{try{
  if(!user||readyUser!==user.id)throw new Error('请先登录并等待云端数据载入');
  if(!window.AITRADE_UNIFIED)throw new Error('统一数据层未加载，请刷新页面');
  const id=user.id,payload=snapshot(),result=await window.AITRADE_UNIFIED.commit(payload,revision);
  if(user?.id!==id)return;
  revision=result.updated_at;localStorage.setItem('aitrade_revision_'+id,revision);
  lastSnapshot=JSON.stringify(payload);renderStatus('统一数据已同步 · '+new Date().toLocaleTimeString());
  return result;
 }catch(e){renderStatus('同步未完成：'+e.message);throw e;}finally{pushing=null;}})();
 return pushing;
}
async function pullNow(force){try{
 if(!user)throw new Error('请先登录');const id=user.id,row=await cloudRow();
 if(user?.id!==id)return;
 if(!row?.payload)return renderStatus('云端暂无数据');
 if(force&&!confirm('恢复前会保留本地副本，然后载入云端版本，继续吗？'))return;
 readyUser=null;archiveLocal(id);restore(row.payload);
 localStorage.setItem('aitrade_revision_'+id,row.updated_at);
 renderStatus('已从云端恢复');setTimeout(()=>location.reload(),100);
}catch(e){renderStatus('恢复失败：'+e.message);}}
function watch(){setInterval(()=>{if(!user||readyUser!==user.id)return;let now=snapshotText();if(now!==lastSnapshot)pushNow().catch(()=>{})},7000);setInterval(()=>refreshSession(true),60000);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshSession(true)});window.addEventListener('pageshow',()=>refreshSession(true));window.addEventListener('focus',()=>refreshSession(true))}
async function boot(){ui();if(CFG.url&&CFG.anonKey){try{await loadClient();await refreshSession(true);if(user)await initUser();watch()}catch(e){renderStatus('云端连接失败：'+(e.message||e))}}}window.AITRADE_CLOUD={push:pushNow,pull:pullNow,open:openModal,refresh:refreshSession,get client(){return sb},get user(){return user},get ready(){return !!user&&readyUser===user.id},loadClient};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();