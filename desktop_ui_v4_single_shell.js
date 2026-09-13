/* AI TRADE v4 — stable single shell guard (no observer loop) */
(()=>{
const D=()=>matchMedia('(min-width:901px)').matches;
let applying=false;
function enforce(){
  if(!D()||applying)return;
  applying=true;
  try{
    document.body.classList.remove('ai-v5','aitrade-v3');
    if(!document.body.classList.contains('aitrade-v4')) document.body.classList.add('aitrade-v4');
    document.querySelectorAll('#aiTradeV5,#aitradeV3').forEach(x=>x.remove());
    const roots=[...document.querySelectorAll('#aitradeV4')];
    roots.slice(1).forEach(x=>x.remove());
    const legacy=document.querySelector('#legacyAppV3>.app')||document.querySelector('body>.app');
    const v4=document.getElementById('aitradeV4');
    const coreOpen=document.body.classList.contains('v4-core-open');
    if(v4) v4.style.display=coreOpen?'none':'grid';
    if(legacy) legacy.style.display=coreOpen?'grid':'none';
    patchBack();
  } finally { applying=false; }
}
function closeCore(){
  document.body.classList.remove('v4-core-open');
  enforce();
  window.scrollTo(0,0);
}
function patchBack(){
  const b=document.querySelector('.v4-core-back');
  if(b&&!b.dataset.v4Patched){
    b.dataset.v4Patched='1';
    b.onclick=closeCore;
    b.textContent='← 返回 AI TRADE 首页';
  }
}
function boot(){
  enforce();
  window.addEventListener('pageshow',()=>setTimeout(enforce,0));
  window.addEventListener('resize',()=>requestAnimationFrame(enforce));
  document.addEventListener('click',()=>setTimeout(enforce,30),true);
}
window.AI_TRADE_V4_SHELL={enforce,closeCore};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();