(()=>{
 const form=document.querySelector('#inquiryForm');if(!form)return;
 const lang=document.documentElement.lang==='es'?'es':'en';
 const text=lang==='es'?{busy:'Enviando…',send:'Enviar solicitud',ok:'Solicitud recibida. Guarda tu referencia:',error:'No se pudo enviar. Tus datos siguen en el formulario; inténtalo de nuevo.',limit:'Has enviado varias solicitudes. Inténtalo más tarde.',privacy:'Confirma el uso de tus datos para responder a esta solicitud.'}:{busy:'Sending…',send:'Send inquiry',ok:'Inquiry received. Save your reference:',error:'Unable to send. Your entries have been kept; please try again.',limit:'Submission limit reached. Please try again later.',privacy:'Please confirm use of your details to respond to this inquiry.'};
 const params=new URLSearchParams(location.search),source={};
 ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>source[k]=(params.get(k)||'').slice(0,120));
 try{source.referrer_host=document.referrer?new URL(document.referrer).hostname:'';}catch{source.referrer_host='';}
 source.landing_path=location.pathname;
 let requestId=null,busy=false;
 form.addEventListener('input',()=>{if(!busy)requestId=null;});
 form.addEventListener('submit',async e=>{
 e.preventDefault();if(busy||!form.reportValidity())return;
 const status=document.querySelector('#formStatus'),button=form.querySelector('button[type=submit]');
 if(!form.elements.consent.checked){status.textContent=text.privacy;return;}
 busy=true;button.disabled=true;status.textContent=text.busy;
 const fields=Object.fromEntries(new FormData(form).entries());
 requestId=requestId||crypto.randomUUID();
 const payload={...fields,...source,utm_source:source.utm_source||'direct',language:lang,consent:true};
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{
 const cfg=window.AITRADE_CLOUD_CONFIG;
 const response=await fetch(cfg.url+'/rest/v1/rpc/ai_trade_submit_inquiry',{method:'POST',headers:{apikey:cfg.anonKey,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:requestId,p_data:payload}),signal:controller.signal});
 const result=await response.json();
 if(!response.ok||!result.ok)throw new Error(result.message||'request_failed');
 status.textContent=text.ok+' '+result.receipt;status.className='success';status.focus();
 form.reset();requestId=null;
 }catch(error){status.className='error';status.textContent=error.message.includes('submission_limit')?text.limit:text.error;}
 finally{clearTimeout(timeout);busy=false;button.disabled=false;button.textContent=text.send;}
 });
})();