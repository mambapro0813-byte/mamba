
begin;
set local role anon;
select public.ai_trade_submit_inquiry('11111111-1111-4111-8111-111111111111',
'{"company":"Acceptance Test Only","contact_name":"Test Buyer","email":"q105-acceptance@example.invalid","country":"Mexico","channel":"distributor","quantity":"1000","customization":"logo","message":"TEST ONLY — rollback validation","language":"es","consent":true,"utm_source":"acceptance-test"}');
select public.ai_trade_submit_inquiry('11111111-1111-4111-8111-111111111111',
'{"company":"Acceptance Test Only","contact_name":"Test Buyer","email":"q105-acceptance@example.invalid","country":"Mexico","channel":"distributor","quantity":"1000","customization":"logo","message":"TEST ONLY — rollback validation","language":"es","consent":true}');
reset role;
do $$ declare i public.ai_trade_inbound_inquiries; begin
 select * into strict i from public.ai_trade_inbound_inquiries where request_id='11111111-1111-4111-8111-111111111111';
 if not exists(select 1 from public.ai_trade_quotes where id=i.quote_id and rfq_case_id=i.rfq_id and approval_status='pending' and unit_price is null) then raise exception 'quote_link_failed'; end if;
 if not exists(select 1 from public.ai_trade_customers where source_id=i.customer_source_id and user_id=i.user_id) then raise exception 'customer_link_failed'; end if;
 if (select count(*) from public.ai_trade_tasks where source_id='inbound:'||i.id)<>1 then raise exception 'task_link_failed'; end if;
 if (select count(*) from public.ai_trade_approvals where source_id='inbound:'||i.id)<>1 then raise exception 'approval_link_failed'; end if;
end $$;

select set_config('request.jwt.claim.sub',(select user_id::text from public.ai_trade_inbound_campaigns where slug='mx-q105'),true);
set local role authenticated;
select public.ai_trade_review_inbound_quote((select id from public.ai_trade_inbound_inquiries where request_id='11111111-1111-4111-8111-111111111111'),12.5,'USD','TEST ONLY: sample terms, shipping and taxes excluded',false);
select public.ai_trade_review_inbound_quote((select id from public.ai_trade_inbound_inquiries where request_id='11111111-1111-4111-8111-111111111111'),12.5,'USD','TEST ONLY: sample terms, shipping and taxes excluded',true);
do $test$ begin
 if not exists(select 1 from public.ai_trade_quotes q join public.ai_trade_inbound_inquiries i on i.quote_id=q.id
 where i.request_id='11111111-1111-4111-8111-111111111111' and q.approval_status='approved' and q.total_amount=12500 and q.sent_at is null) then raise exception 'approval_failed'; end if;
end $test$;
set local role anon;
do $test$ begin
 begin
  perform 1 from public.ai_trade_inbound_inquiries;
  raise exception 'anonymous_read_should_fail';
 exception when insufficient_privilege then null; end;
 begin
  perform public.ai_trade_submit_inquiry(gen_random_uuid(),'{}');
  raise exception 'consent_should_fail';
 exception when invalid_parameter_value then null; end;
end $test$;
rollback;
select 'anonymous submission, idempotent retry, customer/RFQ/quote/task/approval linkage passed; rolled back' as result;
