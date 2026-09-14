import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers={"content-type":"application/json","cache-control":"no-store","access-control-allow-origin":"https://mambapro0813-byte.github.io","access-control-allow-headers":"authorization,apikey,content-type,x-client-info","access-control-allow-methods":"POST,OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});

Deno.serve(async(req:Request)=>{
  try{
    if(req.method==="OPTIONS")return new Response(null,{status:204,headers});
    if(req.method!=="POST")return json({ok:false,error:"method_not_allowed"},405);
    const url=Deno.env.get("SUPABASE_URL")!;
    const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
    const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth=req.headers.get("authorization")||"";
    const userClient=createClient(url,anon,{global:{headers:{Authorization:auth}},auth:{persistSession:false}});
    const {data:{user}}=await userClient.auth.getUser();
    if(!user)return json({ok:false,error:"unauthorized"},401);
    const db=createClient(url,service,{auth:{persistSession:false}});
    const checks:Array<{category:string;name:string;status:"pass"|"blocked"|"fail";detail:unknown;action?:string}>=[];
    const add=(category:string,name:string,status:"pass"|"blocked"|"fail",detail:unknown,action?:string)=>checks.push({category,name,status,detail,...(action?{action}:{})});

    const unified=["ai_trade_products","ai_trade_customers","ai_trade_contacts","ai_trade_activities","ai_trade_tasks","ai_trade_approvals","ai_trade_sync_runs","ai_trade_schema_versions"];
    const counts:Record<string,number>={};
    for(const table of unified){
      const {count,error}=await userClient.from(table).select("*",{count:"exact",head:true}).eq("user_id",user.id);
      if(error)add("统一数据层",`DB · ${table}`,"fail",error.message,"检查数据库迁移");
      else{counts[table]=count||0;add("统一数据层",`DB · ${table}`,"pass",{rows:count||0});}
    }
    const {data:version,error:versionError}=await db.from("ai_trade_schema_versions").select("version,applied_at").eq("user_id",user.id).eq("version","unified-v1").maybeSingle();
    add("统一数据层","Unified Schema v1",versionError?"fail":version?"pass":"blocked",versionError?.message||version||"登录系统并执行一次云同步","打开云同步并立即同步");
    const {data:lastSync,error:syncError}=await db.from("ai_trade_sync_runs").select("status,entity_counts,error,started_at,finished_at").eq("user_id",user.id).order("started_at",{ascending:false}).limit(1).maybeSingle();
    const syncFresh=lastSync?.status==="success"&&lastSync.finished_at&&(Date.now()-new Date(lastSync.finished_at).getTime())<24*3600*1000;
    add("统一数据层","最近一次完整同步",syncError?"fail":syncFresh?"pass":"blocked",syncError?.message||lastSync||"尚无同步记录","打开云同步并立即同步");
    add("统一数据层","核心主数据",(counts.ai_trade_products||0)>0?"pass":"blocked",{products:counts.ai_trade_products||0,customers:counts.ai_trade_customers||0,contacts:counts.ai_trade_contacts||0},"同步产品与客户数据");

    const productionTables=["lead_candidates","decision_maker_candidates","mail_execution_jobs","mail_thread_map","gmail_history_messages","rfq_cases","ai_trade_quotes","ai_trade_orders","ai_trade_reorders","worker_scheduler_state","worker_dispatcher_runs","system_alerts"];
    for(const table of productionTables){const {error}=await userClient.from(table).select("*",{count:"exact",head:true}).eq("user_id",user.id);add("生产服务",`DB · ${table}`,error?"fail":"pass",error?.message||"可访问");}

    const {data:scheduler}=await db.from("worker_scheduler_state").select("*").eq("user_id",user.id).maybeSingle();
    add("后台自动化","Scheduler 配置",scheduler?"pass":"blocked",scheduler||"尚未初始化用户调度配置","运行 Bootstrap");
    const {data:heartbeat}=await db.from("dispatcher_heartbeats").select("source,status,created_at").order("created_at",{ascending:false}).limit(1).maybeSingle();
    const heartbeatFresh=heartbeat?.status==="ok"&&heartbeat.created_at&&(Date.now()-new Date(heartbeat.created_at).getTime())<30*60*1000;
    add("后台自动化","Dispatcher Heartbeat",heartbeatFresh?"pass":"blocked",heartbeat||"暂无近期心跳","运行后台调度器");
    const {count:openAlerts,error:alertError}=await db.from("system_alerts").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("status","open");
    add("后台自动化","开放告警",alertError?"fail":(openAlerts||0)>0?"blocked":"pass",alertError?.message||{open_alerts:openAlerts||0},"处理系统告警");

    const oauthConfigured=Boolean(Deno.env.get("GMAIL_CLIENT_ID")&&Deno.env.get("GMAIL_CLIENT_SECRET"));
    add("Gmail生产链","Google OAuth Client",oauthConfigured?"pass":"blocked",oauthConfigured?"Client ID/Secret 已配置":"缺少 Gmail OAuth 配置","打开 Google 设置");
    const topic=Deno.env.get("GMAIL_PUBSUB_TOPIC")||"";
    add("Gmail生产链","Google Pub/Sub Topic",topic?"pass":"blocked",topic||"缺少 GMAIL_PUBSUB_TOPIC","打开 Google 设置");
    const {data:oauth}=await db.from("gmail_oauth_accounts").select("email_address,status,updated_at").eq("user_id",user.id).maybeSingle();
    add("Gmail生产链","Gmail OAuth 授权",oauth?.status==="connected"?"pass":"blocked",oauth||"尚未授权 Gmail","连接 Gmail");
    const {data:watch}=await db.from("gmail_watch_state").select("email_address,topic_name,history_id,expiration,status,last_watch_at,last_error").eq("user_id",user.id).maybeSingle();
    const watchOk=watch?.status==="active"&&watch.expiration&&new Date(watch.expiration).getTime()>Date.now();
    add("Gmail生产链","Gmail Pub/Sub + Watch",watchOk?"pass":"blocked",watch||"尚未启动 Gmail Watch","启动或续期 Gmail Watch");
    const {count:failedJobs,error:failedError}=await db.from("mail_execution_jobs").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("status","failed");
    add("Gmail生产链","发送失败队列",failedError?"fail":(failedJobs||0)>0?"blocked":"pass",failedError?.message||{failed_jobs:failedJobs||0},"处理失败邮件");

    const {count:sent}=await db.from("mail_execution_jobs").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("status","sent");
    const {count:replies}=await db.from("gmail_history_messages").select("id",{count:"exact",head:true}).eq("user_id",user.id);
    const {count:rfqs}=await db.from("rfq_cases").select("id",{count:"exact",head:true}).eq("user_id",user.id);
    const {count:approved}=await db.from("ai_trade_quotes").select("id",{count:"exact",head:true}).eq("user_id",user.id).eq("approval_status","approved");
    add("业务闭环","发送与邮件记录（数量证据）",(sent||0)>0&&(replies||0)>0?"pass":"blocked",{sent:sent||0,replies:replies||0},"完成一封真实测试邮件闭环");
    add("业务闭环","RFQ与报价审批（数量证据）",(rfqs||0)>0&&(approved||0)>0?"pass":"blocked",{rfq:rfqs||0,approved_quotes:approved||0},"完成一次RFQ报价审批");

    add("业务闭环","同一客户端到端关联验收","blocked","数量统计不能证明发送、客户回复、RFQ、报价审批属于同一业务链；尚未执行关联验收。","使用已获批准的真实业务记录进行关联验收");
    const passed=checks.filter(x=>x.status==="pass").length;
    const failed=checks.filter(x=>x.status==="fail").length;
    const blocked=checks.filter(x=>x.status==="blocked").length;
    const overall=failed?"fail":blocked?"blocked":"pass";
    const categories=checks.reduce((all:any,item)=>{all[item.category]??={pass:0,blocked:0,fail:0};all[item.category][item.status]++;return all;},{});
    const {data:run,error:runError}=await db.from("production_acceptance_runs").insert({user_id:user.id,overall_status:overall,passed,failed,blocked,results:checks}).select("id,created_at").single();
    if(runError)throw runError;
    return json({ok:true,version:"2.1",overall_status:overall,passed,failed,blocked,categories,checks,run});
  }catch(error){console.error(error);return json({ok:false,error:"server_error",detail:String((error as Error)?.message||error)},500)}
});
