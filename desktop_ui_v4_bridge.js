/* AI TRADE v4 route bridge — keeps the v4 dashboard while wiring every entry to a working module */
(()=>{
const D=()=>matchMedia('(min-width:901px)').matches;
const native={launch:'fplBtn',bootstrap:'rpbBtn',sales:'aslBtn',brief:'cdbBtn',gmail:'gmailOauthBtn',learning:'le3Btn',opportunity:'pobBtn',google:'gpsBtn',heal:'shBtn',acceptance:'patBtn',alerts:'ancBtn',health:'hmBtn',revenue:'revIntelBtn',inbox:'ghuBtn',cloud:'cloudSyncBtn'};
const corePages={core:'today',leads:'leads',products:'products',selection:'selection',customers:'customers',signals:'signals',memory:'memory',sdr:'sdr',aiinbox:'inbox',crm:'crm',quotes:'quotes',approval:'approval',orders:'orders',follow:'follow',feedback:'feedback'};
function toast(msg){let t=document.getElementById('v4BridgeToast');if(!t){t=document.createElement('div');t.id='v4BridgeToast';Object.assign(t.style,{position:'fixed',left:'50%',bottom:'30px',transform:'translateX(-50%)',background:'#111827',color:'#fff',padding:'10px 16px',borderRadius:'999px',zIndex:60000,fontSize:'12px'});document.body.appendChild(t)}t.textContent=msg;clearTimeout(t._x);t._x=setTimeout(()=>t.remove(),2200)}
function clickNative(k){const id=native[k],b=id&&document.getElementById(id);if(!b){toast('模块正在加载，请稍后重试');return false}b.click();return true}
function ensureBack(){let b=document.getElementById('v4BridgeBack');if(b)return;b=document.createElement('button');b.id='v4BridgeBack';b.textContent='← 返回 AI TRADE 首页';Object.assign(b.style,{position:'fixed',right:'20px',top:'16px',zIndex:65000,border:'0',borderRadius:'999px',padding:'11px 15px',background:'#111827',color:'#fff',fontWeight:'800',boxShadow:'0 10px 28px #0003',display:'none'});b.onclick=closeCore;document.body.appendChild(b)}
function openCore(page='today'){ensureBack();document.body.classList.add('v4-core-open');document.getElementById('v4BridgeBack').style.display='block';const app=document.querySelector('#legacyAppV3>.app')||document.querySelector('.app');if(app)app.style.display='grid';setTimeout(()=>{const btn=document.querySelector(`#legacyAppV3 nav button[data-p="${page}"]`)||document.querySelector(`nav button[data-p="${page}"]`);if(btn)btn.click();else toast('业务页面未加载')},80)}
function closeCore(){document.body.classList.remove('v4-core-open');const b=document.getElementById('v4BridgeBack');if(b)b.style.display='none'}
function fallbackTasks(){openCore('follow')}
function fallbackCalendar(){openCore('follow')}
function fallbackMarket(){openCore('leads')}
function wire(){if(!D())return;ensureBack();const root=document.getElementById('aitradeV4');if(!root)return;
root.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(!b)return;const k=b.dataset.go;
 if(k==='core'){e.preventDefault();e.stopImmediatePropagation();return openCore('today')}
 if(corePages[k]){e.preventDefault();e.stopImmediatePropagation();return openCore(corePages[k])}
 if(native[k]){const target=document.getElementById(native[k]);if(target){e.preventDefault();e.stopImmediatePropagation();return target.click()}}
 if(k==='tasks'&&!window.__v4TasksWired){setTimeout(()=>{if(!document.getElementById('v4Modal')?.classList.contains('on'))fallbackTasks()},120)}
 if(k==='calendar'&&!window.__v4CalendarWired){setTimeout(()=>{if(!document.getElementById('v4Modal')?.classList.contains('on'))fallbackCalendar()},120)}
 if(k==='market'&&!window.__v4MarketWired){setTimeout(()=>{if(!document.getElementById('v4Modal')?.classList.contains('on'))fallbackMarket()},120)}
 },true);
 // Core ERP access is always available from the v4 dashboard.
 window.AI_TRADE_V4_BRIDGE={openCore,closeCore,clickNative};
}
function boot(){let n=0,t=setInterval(()=>{n++;if(document.getElementById('aitradeV4')){clearInterval(t);wire()}else if(n>40)clearInterval(t)},250)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();