/* AI TRADE — Mobile Tools Hub */
(()=>{
const targets=[
 ['rpbBtn','🚀','Bootstrap','真实生产自动启动'],
 ['aslBtn','↻','Sales Loop','自动销售闭环'],
 ['cdbBtn','☀','今日简报','老板经营简报'],
 ['gpsBtn','G','Google Setup','OAuth / Pub/Sub / Gmail Watch'],
 ['shBtn','🛠','Self-Heal','自动修复系统'],
 ['le3Btn','🧠','Learning','销售学习引擎'],
 ['pobBtn','◆','Opportunity','产品机会与新品方向'],
 ['dacBtn','⚡','Activate','真实数据激活'],
 ['gmailOauthBtn','✉️','Gmail','Gmail连接与发送'],
 ['goalBtn','◎','Goal','年度/日目标'],
 ['ancBtn','🔔','Alerts','关键告警'],
 ['revIntelBtn','◈','Revenue','收入与预测'],
 ['ghuBtn','↩','Inbox Live','实时邮件'],
 ['dispatcherBtn','⚡','Dispatcher','后台任务'],
 ['hmBtn','⚙','Health','系统健康'],
 ['agentCCBtn','AI','Agents','Agent状态'],
 ['patBtn','✓','验收','生产验收']
];
function style(){if(document.getElementById('mobileToolsHubStyle'))return;let s=document.createElement('style');s.id='mobileToolsHubStyle';s.textContent=`@media(max-width:720px){#rpbBtn,#aslBtn,#cdbBtn,#gpsBtn,#shBtn,#le3Btn,#pobBtn,#dacBtn,#gmailOauthBtn,#goalBtn,#ancBtn,#revIntelBtn,#ghuBtn,#dispatcherBtn,#hmBtn,#agentCCBtn,#patBtn{display:none!important}#mToolsBtn{display:flex!important}}#mToolsBtn{display:none;position:fixed;right:14px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:10010;border:0;border-radius:999px;padding:11px 15px;background:#111827;color:#fff;font:800 12px -apple-system,BlinkMacSystemFont,"PingFang SC",Arial;box-shadow:0 10px 28px #0003;align-items:center;gap:6px}#mToolsPanel{position:fixed;left:12px;right:12px;bottom:calc(138px + env(safe-area-inset-bottom));z-index:10011;background:rgba(255,255,255,.98);backdrop-filter:blur(18px);border:1px solid #e5e7eb;border-radius:20px;padding:14px;box-shadow:0 24px 70px #0004;display:none;max-height:65vh;overflow:auto}#mToolsPanel.on{display:block}.mToolsHead{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}.mToolsTitle{font-size:16px;font-weight:900}.mToolsSub{font-size:10px;color:#64748b;margin-top:2px}.mToolsClose{border:0;background:#eef2f7;border-radius:10px;width:34px;height:34px;font-size:18px}.mToolsGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.mTool{border:1px solid #e5e7eb;background:#fff;border-radius:14px;padding:11px 8px;text-align:left;min-height:74px}.mToolIcon{font-size:20px;line-height:24px}.mToolName{font-size:12px;font-weight:800;margin-top:4px}.mToolDesc{font-size:9px;color:#64748b;margin-top:3px;line-height:1.3}.mTool.primary{background:#111827;color:#fff;border-color:#111827}.mTool.primary .mToolDesc{color:#cbd5e1}@media(max-width:390px){.mToolsGrid{grid-template-columns:repeat(3,1fr);gap:7px}.mTool{padding:9px 7px;min-height:70px}.mToolName{font-size:11px}}`;document.head.appendChild(s)}
function clickTarget(id){const el=document.getElementById(id);if(!el)return;close();el.click()}
function render(){let g=document.getElementById('mToolsGrid');if(!g)return;let existing=targets.filter(([id])=>document.getElementById(id));g.innerHTML=existing.map(([id,icon,name,desc])=>`<button class="mTool ${id==='rpbBtn'?'primary':''}" data-target="${id}"><div class="mToolIcon">${icon}</div><div class="mToolName">${name}</div><div class="mToolDesc">${desc}</div></button>`).join('');g.querySelectorAll('[data-target]').forEach(b=>b.onclick=()=>clickTarget(b.dataset.target))}
function open(){render();document.getElementById('mToolsPanel')?.classList.add('on')}
function close(){document.getElementById('mToolsPanel')?.classList.remove('on')}
function boot(){style();if(!document.getElementById('mToolsBtn')){let b=document.createElement('button');b.id='mToolsBtn';b.innerHTML='☰ 工具';b.onclick=()=>{let p=document.getElementById('mToolsPanel');p?.classList.contains('on')?close():open()};document.body.appendChild(b)}if(!document.getElementById('mToolsPanel')){let p=document.createElement('div');p.id='mToolsPanel';p.innerHTML='<div class="mToolsHead"><div><div class="mToolsTitle">AI TRADE 工具</div><div class="mToolsSub">Bootstrap、Google生产配置、销售闭环、学习、自愈与验收</div></div><button class="mToolsClose">×</button></div><div id="mToolsGrid" class="mToolsGrid"></div>';p.querySelector('.mToolsClose').onclick=close;document.body.appendChild(p)}setTimeout(render,1600);window.addEventListener('resize',()=>{if(innerWidth>720)close()})}
window.AI_MOBILE_TOOLS={open,close,render};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();