/* AI TRADE Primary Dashboard cleanup — hide duplicate floating tools, keep underlying functions */
(()=>{
const $=(s,r=document)=>r.querySelector(s);
function style(){if($('#pdCleanupCSS'))return;const s=document.createElement('style');s.id='pdCleanupCSS';s.textContent=`
#fplBtn,#rpbBtn,#aslBtn,#cdbBtn,#gmailOauthBtn,#le3Btn,#pobBtn,#gpsBtn,#shBtn,#patBtn,#hmBtn,#ancBtn,#dispatcherBtn,#revIntelBtn,#dacBtn{display:none!important}
`;document.head.appendChild(s)}
function toolCard(icon,title,en,desc,fn){const b=document.createElement('button');b.className='pd-card pd-extra-tool';b.type='button';b.innerHTML=`<div class="pd-card-head"><span>${icon}</span><div><b>${title}</b><small>${en}</small></div></div><p>${desc}</p><i>›</i>`;b.onclick=fn;return b}
function findPanel(name){return [...document.querySelectorAll('#primaryDashboard .pd-panel')].find(p=>p.querySelector('h3')?.textContent?.includes(name));}
function add(){const root=$('#primaryDashboard');if(!root||root.dataset.cleanupReady==='1')return;root.dataset.cleanupReady='1';
  const launch=findPanel('启动中心');const ops=findPanel('日常工作')||findPanel('Operations');const sys=findPanel('系统管理');
  if(launch){let row=launch.querySelector('.pd-row');if(row&&!launch.querySelector('[data-extra="activate"]')){const c=toolCard('⚡','数据激活','Activate','规范化历史数据并启动真实生产链路',()=>window.AI_DATA_ACTIVATION?.open?.());c.dataset.extra='activate';row.appendChild(c);row.style.gridTemplateColumns='repeat(3,1fr)';}}
  if(ops){let row=ops.querySelector('.pd-row');if(row&&!ops.querySelector('[data-extra="revenue"]')){const c=toolCard('💹','经营分析','Revenue','查看成交、销售管道与30/60/90天预测',()=>window.AITRADE_REVENUE?.open?.());c.dataset.extra='revenue';row.appendChild(c);row.style.gridTemplateColumns='repeat(4,1fr)';}}
  if(sys){let row=sys.querySelector('.pd-row');if(row&&!sys.querySelector('[data-extra="dispatcher"]')){const c=toolCard('⚙️','后台任务','Dispatcher','手动运行后台任务调度与队列处理',async()=>{try{const d=await window.AI_DISPATCHER?.run?.();alert(`Dispatcher完成：${d?.processed||0} 个任务`)}catch(e){alert(e?.message||'Dispatcher运行失败')}});c.dataset.extra='dispatcher';row.appendChild(c);row.style.gridTemplateColumns='repeat(5,1fr)';}}
}
function boot(){style();let n=0;const t=setInterval(()=>{n++;style();add();if($('#primaryDashboard')||n>40)clearInterval(t)},250);window.addEventListener('pageshow',()=>{style();add()});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();