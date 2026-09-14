(()=>{
let client=null,user=null;
async function loadClient(){if(client)return client;if(!window.supabase)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';script.onload=resolve;script.onerror=reject;document.head.appendChild(script);});
const cfg=window.AITRADE_CLOUD_CONFIG;client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{storageKey:'aitrade-auth-v1',persistSession:true,autoRefreshToken:true}});
const {data,error}=await client.auth.getSession();if(error)throw error;user=data.session?.user||null;
client.auth.onAuthStateChange((_event,session)=>{user=session?.user||null;window.dispatchEvent(new Event('aitrade:inbound-auth'));});return client;}
window.AITRADE_CLOUD={loadClient,get client(){return client},get user(){return user}};
})();