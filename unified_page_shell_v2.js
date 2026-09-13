/* AI TRADE unified page shell v2 — keep one UI while reusing legacy functional pages */
(()=>{
const D=()=>matchMedia('(min-width:901px)').matches,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
let root,legacy,workspace,body,homeNodes=[],moved=null,marker=null;
const map={
 launch:['today','启动中心','Launch / Production Center'],
 bootstrap:['leads','客户开发','Find Customers / Bootstrap'],
 sales:['crm','销售闭环','Sales Loop / CRM Pipeline'],
 brief:['today','今日简报','Daily Brief'],
 gmail:['inbox','邮件中心','Gmail / AI Inbox'],
 tasks:['tasks2','任务中心','Auto Tasks / Sales Actions'],
 calendar:['calendar2','日程日历','Sales Calendar / Follow-up Plan'],
 learning:['feedback','学习引擎','Learning / Data Feedback'],
 opportunity:['selection','产品机会','Opportunity / AI Selection'],
 market:['leads','市场分析','Market / Lead Intelligence'],
 core:['today','业务中心','Core ERP'],
 leads:['leads','客户开发','Lead Intelligence'],products:['products','产品中心','Product Brain'],customers:['customers','客户中心','Customer Brain'],sdr:['sdr','AI客户开发','AI SDR'],inbox:['inbox','AI收件箱','AI Inbox'],crm:['crm','CRM销售漏斗','CRM'],quotes:['quotes','AI报价','Quotes'],approval:['approval','人工审批','Human Approval'],orders:['orders','订单管理','Orders'],follow:['follow','跟进 / 复购','Follow-up / Reorder'],feedback:['feedback','数据反哺','Feedback']
};
function css(){if($('#unifiedShellCSS'))return;const s=document.createElement('style');s.id='unifiedShellCSS';s.textContent=`
@media(min-width:901px){
body.primary-core-open>#primaryDashboard{display:grid!important}body.primary-core-open>.app{display:none!important}.pd-back{display:none!important}
#pdUnifiedWorkspace{display:none;margin-top:12px}.pd-uhead{display:flex;justify-content:space-between;align-items:flex-end;margin:10px 0 12px}.pd-uhead h1{margin:0;font-size:28px;color:#0b2545}.pd-uhead p{margin:4px 0 0;color:#6d819b;font-size:12px}.pd-uhead button{border:1px solid #d8e5f2;background:#fff;color:#256dc9;border-radius:10px;padding:8px 12px;font-weight:800;cursor:pointer}
#pdUnifiedBody>.page{display:block!important;background:transparent!important}#pdUnifiedBody .top{display:flex!important;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px}#pdUnifiedBody .top h1{display:none}#pdUnifiedBody .top .sub{color:#71839a}#pdUnifiedBody .badge{background:#eaf3ff!important;color:#256dc9!important;border:1px solid #d8e6f5!important}
#pdUnifiedBody .card,#pdUnifiedBody .item,#pdUnifiedBody .col,#pdUnifiedBody .deal{background:#fff!important;border:1px solid #dfe8f2!important;border-radius:14px!important;box-shadow:0 6px 20px #2d5c8608!important;color:#173453!important}
#pdUnifiedBody .card{padding:14px!important}#pdUnifiedBody .grid4{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:10px!important}#pdUnifiedBody .two{display:grid!important;grid-template-columns:repeat(2,1fr)!important;gap:10px!important}#pdUnifiedBody .pipeline{display:grid!important;grid-template-columns:repeat(4,1fr)!important;gap:10px!important}
#pdUnifiedBody .toolbar{display:flex!important;gap:8px!important;flex-wrap:wrap!important;margin:10px 0!important}#pdUnifiedBody .input,#pdUnifiedBody input,#pdUnifiedBody select,#pdUnifiedBody textarea{border:1px solid #d9e5f1!important;border-radius:9px!important;background:#fff!important;color:#173453!important}#pdUnifiedBody .btn{border-radius:9px!important;background:#2d80e9!important;border-color:#2d80e9!important;color:#fff!important}#pdUnifiedBody .btn.g{background:#fff!important;color:#2d80e9!important}
#pdUnifiedBody table{width:100%!important;border-collapse:separate!important;border-spacing:0!important;background:#fff!important;border:1px solid #e1e9f2!important;border-radius:12px!important;overflow:hidden!important}#pdUnifiedBody th{background:#f4f8fd!important;color:#60758f!important;font-weight:800!important}#pdUnifiedBody th,#pdUnifiedBody td{padding:10px!important;border-bottom:1px solid #edf2f7!important;text-align:left!important}#pdUnifiedBody tr:last-child td{border-bottom:0!important}
#pdUnifiedBody .flow{background:#fff!important;border:1px solid #dfe8f2!important;border-radius:13px!important;padding:10px!important}#pdUnifiedBody .flow span,#pdUnifiedBody .tag{background:#edf5ff!important;color:#2a6fc7!important}
body>button[style*="position:fixed"][style*="right:"],body>div[style*="position:fixed"][style*="right:"]{display:none!important}
#cloudSyncModal,#gmailOauthModal,#gpsModal,#shModal,#patModal,#hmModal,#ancModal,#dacModal,#revIntelModal{display:none}#cloudSyncModal.on,#gmailOauthModal.on,#gpsModal.on,#shModal.on,#patModal.on,#hmModal.on,#ancModal.on,#dacModal.on,#revIntelModal.on{display:flex!important}
}
`;document.head.appendChild(s)}
function setup(){root=$('#primaryDashboard');legacy=$('body>.app')||$('#legacyAppV3 .app');if(!root||!legacy)return false;const main=$('.pd-main',root);if(!main)return false;if(!$('#pdUnifiedWorkspace')){workspace=document.createElement('section');workspace.id='pdUnifiedWorkspace';workspace.innerHTML='<div class="pd-uhead"><div><h1 id="pdUnifiedTitle">业务中心</h1><p id="pdUnifiedSub">Core ERP</p></div><button id="pdUnifiedHome">← 返回首页</button></div><div id="pdUnifiedBody"></div>';main.appendChild(workspace);$('#pdUnifiedHome').onclick=showHome}else workspace=$('#pdUnifiedWorkspace');body=$('#pdUnifiedBody');homeNodes=$$('.pd-head,.pd-kpis,.pd-hero,.pd-grid,.pd-footer',main);return true}
function restore(){if(moved&&marker&&marker.parentNode){marker.parentNode.insertBefore(moved,marker);marker.remove()}moved=null;marker=null}
function setActive(k){$$('.pd-nav',root).forEach(n=>n.classList.toggle('active',n.dataset.go===k))}
function showHome(){if(!setup())return;restore();workspace.style.display='none';homeNodes.forEach(n=>n.style.display='');setActive('home');window.scrollTo(0,0)}
function showPage(k){if(!setup())return;const cfg=map[k];if(!cfg)return;const [page,title,sub]=cfg;restore();if(window.AI_SALES_ACTION_CENTER){if(page==='tasks2')window.AI_SALES_ACTION_CENTER.renderTasks?.();if(page==='calendar2')window.AI_SALES_ACTION_CENTER.renderCalendar?.()}const nav=$(`nav button[data-p="${page}"]`,legacy);if(nav)nav.click();const sec=$(`section#${page}`,legacy);if(!sec)return;marker=document.createComment('pd-unified-page-marker');sec.parentNode.insertBefore(marker,sec);moved=sec;body.appendChild(sec);homeNodes.forEach(n=>n.style.display='none');workspace.style.display='block';$('#pdUnifiedTitle').textContent=title;$('#pdUnifiedSub').textContent=sub;setActive(k);window.scrollTo(0,0)}
function nativeModal(k){const ids={google:'gpsBtn',heal:'shBtn',acceptance:'patBtn',health:'hmBtn',alerts:'ancBtn'};const b=document.getElementById(ids[k]);if(b)b.click()}
function capture(e){if(!D())return;const t=e.target.closest('#primaryDashboard [data-go]');if(!t)return;const k=t.dataset.go;if(k==='home'){e.preventDefault();e.stopImmediatePropagation();showHome();return}if(map[k]){e.preventDefault();e.stopImmediatePropagation();showPage(k);return}if(['google','heal','acceptance','health','alerts'].includes(k)){e.preventDefault();e.stopImmediatePropagation();nativeModal(k)}}
function boot(){if(!D())return;css();let n=0,t=setInterval(()=>{n++;if(setup()){clearInterval(t);document.addEventListener('click',capture,true);showHome()}else if(n>60)clearInterval(t)},200)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.AI_UNIFIED_SHELL={showPage,showHome};
})();