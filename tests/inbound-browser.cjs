const {chromium}=require('playwright');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const root=process.cwd();const server=http.createServer((req,res)=>{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}try{const data=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(data);}catch{res.writeHead(404).end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch();
 try{
 for(const [language,width] of [['mx',390],['en',1280]]){
 const page=await browser.newPage({viewport:{width,height:844}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let submitted,fail=false;
 await page.route('**/rest/v1/rpc/ai_trade_submit_inquiry',async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:fail?500:200,contentType:'application/json',body:JSON.stringify(fail?{message:'temporary_error'}:{ok:true,receipt:submitted.p_request_id})});});
 await page.goto(base+'/'+language+'/q105.html?utm_source=facebook&utm_campaign=mx-q105',{waitUntil:'networkidle'});
 assert.equal(await page.locator('h1').count(),1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
 const fill=async()=>{await page.locator('[name=company]').fill('QA Company');await page.locator('[name=contact_name]').fill('QA Buyer');await page.locator('[name=email]').fill('qa@example.invalid');await page.locator('[name=quantity]').fill('1000');await page.locator('[name=channel]').selectOption('distributor');await page.locator('[name=customization]').selectOption('logo');await page.locator('[name=message]').fill('QA only: request Q105 sample terms');await page.locator('[name=consent]').check();};
 await fill();await page.locator('button[type=submit]').click();await page.locator('#formStatus.success').waitFor();
 assert.equal(submitted.p_data.utm_source,'facebook');assert.equal(submitted.p_data.language,language==='mx'?'es':'en');assert.equal(submitted.p_data.quantity,'1000');
 assert.equal(await page.locator('[name=email]').inputValue(),'');
 fail=true;await fill();await page.locator('button[type=submit]').click();await page.locator('#formStatus.error').waitFor();const firstId=submitted.p_request_id;
 assert.equal(await page.locator('[name=email]').inputValue(),'qa@example.invalid');
 await page.locator('button[type=submit]').click();await page.locator('button[type=submit]:enabled').waitFor();assert.equal(submitted.p_request_id,firstId,'retry is idempotent');
 assert.deepEqual(errors,[]);
 await page.close();
 }
 // Check real deployed public RPC validation without creating any record.
 const config=fs.readFileSync('cloud-config.js','utf8');const url=config.match(/url:'([^']+)'/)[1],key=config.match(/anonKey:'([^']+)'/)[1];
 const response=await fetch(url+'/rest/v1/rpc/ai_trade_submit_inquiry',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({p_request_id:'22222222-2222-4222-8222-222222222222',p_data:{}})});
 assert.equal(response.status,400);assert.match((await response.json()).message,/consent_required/);
 console.log('PASS: mobile/desktop layout, bilingual form, attribution, success/error, safe retry, real RPC validation');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
