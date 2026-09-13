/* AI TRADE — Gmail History Consumer + Unified Mail Center */
(()=>{
let timer=null;
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
function dt(v){try{return new Date(v).toLocaleString('zh-CN',{hour12:false})}catch{return v||''}}
async function getClient(){
  if(window.AITRADE_CLOUD?.loadClient){
    const c=await window.AITRADE_CLOUD.loadClient();
    if(c)return c;
  }
  const cfg=window.AITRADE_CLOUD_CONFIG||{};
  if(!cfg.url||!cfg.anonKey)throw new Error('云端配置尚未加载');
  if(!window.supabase){
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
  }
  return window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storage:window.localStorage,storageKey:'aitrade-auth-v1'}});
}
async function load(){
  const sb=await getClient();
  const {data:{session},error:sessionError}=await sb.auth.getSession();
  if(sessionError)throw sessionError;
  if(!session)throw new Error('AI TRADE 云同步登录状态未找到，请重新登录一次');
  const {data,error}=await sb.from('gmail_history_messages')
    .select('id,from_email,to_email,subject,snippet,body_text,intent,priority,customer_id,gmail_thread_id,received_at,processing_status,extracted')
    .eq('user_id',session.user.id)
    .order('received_at',{ascending:false}).limit(100);
  if(error)throw error;
  return data||[];
}
function css(){if(document.getElementById('ghuCss'))return;const s=document.createElement('style');s.id='ghuCss';s.textContent=`#ghuInline{margin-top:14px}.ghuHead{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px}.ghuHead h3{margin:0;font-size:16px;color:#173453}.ghuMeta{font-size:11px;color:#71839a}.ghuRefresh{border:1px solid #d8e5f2;background:#fff;color:#256dc9;border-radius:9px;padding:7px 11px;font-weight:800;cursor:pointer}.ghuTable{width:100%;border-collapse:separate;border-spacing:0;background:#fff;border:1px solid #e1e9f2;border-radius:12px;overflow:hidden;font-size:11px}.ghuTable th{background:#f4f8fd;color:#60758f;font-weight:800}.ghuTable th,.ghuTable td{padding:10px;border-bottom:1px solid #edf2f7;text-align:left;vertical-align:top}.ghuTable tr:last-child td{border-bottom:0}.ghuTag{display:inline-block;border-radius:999px;padding:3px 7px;background:#edf5ff;color:#2a6fc7;font-weight:800}.ghuTag.high{background:#fff4dd;color:#a46100}.ghuTag.urgent{background:#feecec;color:#b42318}.ghuSub{color:#71839a;margin-top:4px;max-width:680px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.ghuEmpty{padding:30px;text-align:center;color:#71839a;background:#fff;border:1px dashed #d8e5f2;border-radius:12px}.ghuErr{padding:14px;color:#b42318;background:#fff1f1;border:1px solid #ffd5d5;border-radius:10px}#ghuModal,#ghuBtn{display:none!important}`;document.head.appendChild(s)}
function mount(){const inbox=document.querySelector('section#inbox');if(!inbox)return null;let box=document.getElementById('ghuInline');if(!box){box=document.createElement('div');box.id='ghuInline';inbox.appendChild(box)}return box}
async function renderInline(){const box=mount();if(!box)return;box.innerHTML='<div class="ghuEmpty">正在读取 Gmail 实时邮件…</div>';try{const rows=await load();box.innerHTML=`<div class="ghuHead"><div><h3>Gmail 实时收件箱</h3><div class="ghuMeta">Google Gmail → Pub/Sub → Supabase → AI TRADE</div></div><div><span class="ghuMeta">${rows.length} 封</span> <button class="ghuRefresh" onclick="AI_GMAIL_HISTORY.refresh()">刷新</button></div></div>${rows.length?`<div style="overflow:auto"><table class="ghuTable"><thead><tr><th>时间</th><th>发件人</th><th>主题</th><th>AI意图</th><th>优先级</th><th>识别信息</th><th>状态</th></tr></thead><tbody>${rows.map(r=>`<tr><td style="white-space:nowrap">${esc(dt(r.received_at))}</td><td><b>${esc(r.from_email||'-')}</b></td><td><b>${esc(r.subject||'(无主题)')}</b><div class="ghuSub">${esc((r.snippet||r.body_text||'').slice(0,180))}</div></td><td><span class="ghuTag">${esc(r.intent||'reply')}</span></td><td><span class="ghuTag ${r.priority==='urgent'?'urgent':r.priority==='high'?'high':''}">${esc(r.priority||'normal')}</span></td><td>${r.extracted?.model?`型号：${esc(r.extracted.model)}<br>`:''}${r.extracted?.qty?`数量：${esc(r.extracted.qty)}`:'-'}</td><td>${esc(r.processing_status||'classified')}</td></tr>`).join('')}</tbody></table></div>`:'<div class="ghuEmpty">数据库中暂时没有邮件。</div>'}`;}catch(e){box.innerHTML=`<div class="ghuErr"><b>邮件读取失败</b><br>${esc(e.message||e)}<br><button class="ghuRefresh" onclick="AI_GMAIL_HISTORY.refresh()" style="margin-top:8px">重试</button></div>`}}
function open(){const nav=document.querySelector('#primaryDashboard [data-go="gmail"]');if(nav)nav.click();setTimeout(renderInline,300)}
function boot(){css();mount();setTimeout(renderInline,2200);timer=setInterval(()=>{const inbox=document.querySelector('section#inbox');if(inbox&&(inbox.classList.contains('on')||inbox.closest('#pdUnifiedBody')))renderInline()},20000);document.addEventListener('click',e=>{const t=e.target.closest('[data-go="gmail"],nav button[data-p="inbox"]');if(t)setTimeout(renderInline,500)},true);window.addEventListener('focus',()=>{const inbox=document.querySelector('section#inbox');if(inbox&&(inbox.classList.contains('on')||inbox.closest('#pdUnifiedBody')))renderInline()})}
window.AI_GMAIL_HISTORY={open,refresh:renderInline,load};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();