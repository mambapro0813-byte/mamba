
create table public.ai_trade_inbound_campaigns(
 slug text primary key,user_id uuid not null references auth.users(id),model text not null,
 active boolean not null default true,created_at timestamptz not null default now());
alter table public.ai_trade_inbound_campaigns enable row level security;
create policy owner_read on public.ai_trade_inbound_campaigns for select to authenticated using(user_id=(select auth.uid()));
grant select on public.ai_trade_inbound_campaigns to authenticated;

create table public.ai_trade_inbound_inquiries(
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique,
 user_id uuid not null references auth.users(id),campaign text not null references public.ai_trade_inbound_campaigns(slug),
 company text not null,contact_name text not null,email text not null,whatsapp text,
 country text not null,channel text not null,quantity integer not null check(quantity between 1 and 1000000),
 customization text not null,message text not null,language text not null,
 attribution jsonb not null default '{}',consent_version text not null,
 score integer not null,status text not null default 'new' check(status in ('new','qualified','contacted','closed','spam')),
 customer_source_id text not null,rfq_id bigint references public.rfq_cases(id),quote_id bigint references public.ai_trade_quotes(id),
 is_test boolean not null default false,created_at timestamptz not null default now());
create index inbound_owner_created on public.ai_trade_inbound_inquiries(user_id,created_at desc);
create index inbound_email_created on public.ai_trade_inbound_inquiries(campaign,email,created_at desc);
alter table public.ai_trade_inbound_inquiries enable row level security;
create policy owner_read on public.ai_trade_inbound_inquiries for select to authenticated using(user_id=(select auth.uid()));
create policy owner_status on public.ai_trade_inbound_inquiries for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
grant select on public.ai_trade_inbound_inquiries to authenticated;
grant update(status) on public.ai_trade_inbound_inquiries to authenticated;
revoke all on public.ai_trade_inbound_campaigns,public.ai_trade_inbound_inquiries from anon;

-- Bind to the existing, unambiguous production account, never a visitor-supplied owner.
do $$ declare owner_id uuid; begin
 if (select count(distinct a.user_id) from public.gmail_oauth_accounts a join public.ai_trade_state s using(user_id))<>1 then
  raise exception 'campaign_owner_requires_configuration';
 end if;
 select a.user_id into owner_id from public.gmail_oauth_accounts a join public.ai_trade_state s using(user_id) limit 1;
 insert into public.ai_trade_inbound_campaigns(slug,user_id,model) values('mx-q105',owner_id,'Q105');
end $$;

create function public.ai_trade_submit_inquiry(p_request_id uuid,p_data jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 c public.ai_trade_inbound_campaigns; email_value text; company_value text; qty integer;
 inquiry_id uuid:=gen_random_uuid(); customer_key text; rfq_key bigint; quote_key bigint; score_value integer;
 attr jsonb; existing public.ai_trade_inbound_inquiries; request_count integer;
begin
 if p_request_id is null or p_data is null or jsonb_typeof(p_data)<>'object' or octet_length(p_data::text)>12000 then raise exception 'invalid_request' using errcode='22023'; end if;
 if coalesce(p_data->>'website_check','')<>'' then raise exception 'invalid_request' using errcode='22023'; end if;
 if coalesce(p_data->>'consent','')<>'true' then raise exception 'consent_required' using errcode='22023'; end if;
 select * into c from public.ai_trade_inbound_campaigns where slug='mx-q105' and active;
 if not found then raise exception 'campaign_unavailable' using errcode='22023'; end if;
 email_value:=lower(btrim(coalesce(p_data->>'email','')));
 company_value:=btrim(coalesce(p_data->>'company',''));
 if email_value!~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' or length(email_value)>254 or
 length(company_value) not between 2 and 160 or
 length(btrim(coalesce(p_data->>'contact_name',''))) not between 2 and 100 or
 length(btrim(coalesce(p_data->>'message',''))) not between 5 and 3000 or
 length(btrim(coalesce(p_data->>'country',''))) not between 2 and 80 or
 length(coalesce(p_data->>'whatsapp',''))>40 or
 coalesce(p_data->>'channel','') not in ('distributor','importer','brand','retailer','other') or
 coalesce(p_data->>'customization','') not in ('standard','logo','packaging','both','unsure') or
 coalesce(p_data->>'language','') not in ('es','en') or
 coalesce(p_data->>'quantity','')!~ '^[0-9]{1,7}$'
 then raise exception 'invalid_fields' using errcode='22023'; end if;
 qty:=(p_data->>'quantity')::integer;
 if qty not between 1 and 1000000 then raise exception 'invalid_quantity' using errcode='22023'; end if;
 -- Serialize per campaign so quotas and idempotency cannot race.
 perform pg_advisory_xact_lock(hashtextextended('inbound:'||c.slug,0));
 select * into existing from public.ai_trade_inbound_inquiries where request_id=p_request_id;
 if found then
  if existing.email<>email_value then raise exception 'invalid_request' using errcode='22023'; end if;
  return jsonb_build_object('ok',true,'receipt',p_request_id);
 end if;
 select count(*) into request_count from public.ai_trade_inbound_inquiries where campaign=c.slug and created_at>now()-interval '24 hours';
 if request_count>=100 or (select count(*) from public.ai_trade_inbound_inquiries where campaign=c.slug and email=email_value and created_at>now()-interval '24 hours')>=3
 then raise exception 'submission_limit' using errcode='P0001'; end if;
 attr:=jsonb_build_object('utm_source',left(coalesce(p_data->>'utm_source','direct'),120),
 'utm_medium',left(coalesce(p_data->>'utm_medium',''),120),'utm_campaign',left(coalesce(p_data->>'utm_campaign',''),120),
 'utm_content',left(coalesce(p_data->>'utm_content',''),120),'referrer_host',left(coalesce(p_data->>'referrer_host',''),200),'landing_path',left(coalesce(p_data->>'landing_path',''),200));
 customer_key:='inbound:'||md5(email_value);
 score_value:=20+case when lower(p_data->>'country') in ('mexico','méxico','mx') then 20 else 0 end
 +case when p_data->>'channel' in ('importer','distributor','brand') then 25 else 10 end
 +case when qty>=1000 then 25 when qty>=100 then 10 else 0 end
 +case when p_data->>'customization' in ('logo','packaging','both') then 10 else 0 end;
 insert into public.ai_trade_customers(user_id,source_id,company,country,channel,stage,icp_score,next_action,payload)
 values(c.user_id,customer_key,company_value,p_data->>'country',p_data->>'channel','rfq',score_value,'核实采购需求并准备报价',
 jsonb_build_object('source','public_inquiry','email',email_value))
 on conflict(user_id,source_id) do nothing;
 insert into public.ai_trade_contacts(user_id,source_id,customer_source_id,company,person_name,email,whatsapp,verification_status,payload)
 values(c.user_id,customer_key,customer_key,company_value,p_data->>'contact_name',email_value,p_data->>'whatsapp','self_reported','{}')
 on conflict(user_id,source_id) do nothing;
 insert into public.rfq_cases(user_id,customer_id,from_email,subject,intent,product_model,quantity,country,requirements,next_action)
 values(c.user_id,customer_key,email_value,'Q105 · Public website inquiry','RFQ','Q105',qty,p_data->>'country',
 jsonb_build_object('message',p_data->>'message','customization',p_data->>'customization','inquiry_id',inquiry_id,'attribution',attr),
 '人工核实规格、成本和交期，再审批报价') returning id into rfq_key;
 insert into public.ai_trade_quotes(user_id,rfq_case_id,customer_id,quote_no,product_model,quantity,status,approval_status,terms)
 values(c.user_id,rfq_key,customer_key,'WEB-'||inquiry_id::text,'Q105',qty,'draft','pending',
 jsonb_build_object('inquiry_id',inquiry_id,'source','public_inquiry','requires_price_confirmation',true)) returning id into quote_key;
 insert into public.ai_trade_approvals(user_id,source_id,entity_type,entity_source_id,customer_source_id,approval_type,status,risk_flags,payload)
 values(c.user_id,'inbound:'||inquiry_id,'quote',quote_key::text,customer_key,'quote','pending','["price_missing","specs_confirmation"]',
 jsonb_build_object('quote_id',quote_key,'rfq_id',rfq_key));
 insert into public.ai_trade_tasks(user_id,source_id,customer_source_id,title,status,priority,due_at,requires_approval,payload)
 values(c.user_id,'inbound:'||inquiry_id,customer_key,'Q105 新询盘：核实需求并准备报价','open','high',now()+interval '1 day',true,
 jsonb_build_object('inquiry_id',inquiry_id,'quote_id',quote_key));
 insert into public.ai_trade_activities(user_id,source_id,customer_source_id,activity_type,channel,direction,subject,content,payload)
 values(c.user_id,'inbound:'||inquiry_id,customer_key,'RFQ','website','inbound','Q105 公开站询盘',p_data->>'message',attr);
 insert into public.ai_trade_inbound_inquiries(id,request_id,user_id,campaign,company,contact_name,email,whatsapp,country,channel,quantity,customization,message,language,attribution,consent_version,score,customer_source_id,rfq_id,quote_id)
 values(inquiry_id,p_request_id,c.user_id,c.slug,company_value,p_data->>'contact_name',email_value,p_data->>'whatsapp',
 p_data->>'country',p_data->>'channel',qty,p_data->>'customization',p_data->>'message',p_data->>'language',attr,'inquiry-v1',score_value,customer_key,rfq_key,quote_key);
 -- The inquiry queue is the in-app notification. No external message is sent here.
 return jsonb_build_object('ok',true,'receipt',p_request_id);
end $$;
revoke all on function public.ai_trade_submit_inquiry(uuid,jsonb) from public;
grant execute on function public.ai_trade_submit_inquiry(uuid,jsonb) to anon,authenticated;
