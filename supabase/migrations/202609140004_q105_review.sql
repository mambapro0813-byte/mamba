
create function public.ai_trade_review_inbound_quote(p_inquiry_id uuid,p_unit_price numeric,p_currency text,p_terms text,p_approve boolean default false)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare i public.ai_trade_inbound_inquiries; q public.ai_trade_quotes; state text;
begin
 if auth.uid() is null then raise exception 'authentication_required'; end if;
 select * into strict i from public.ai_trade_inbound_inquiries where id=p_inquiry_id and user_id=auth.uid();
 if p_unit_price is null or p_unit_price<=0 or p_unit_price>1000000 or p_currency not in ('USD','CNY','MXN') or length(btrim(coalesce(p_terms,''))) not between 5 and 3000 then raise exception 'invalid_quote_terms'; end if;
 select * into strict q from public.ai_trade_quotes where id=i.quote_id and user_id=auth.uid() for update;
 if q.sent_at is not null then raise exception 'sent_quote_cannot_be_changed'; end if;
 state:=case when p_approve then 'approved' else 'pending' end;
 update public.ai_trade_quotes set unit_price=p_unit_price,total_amount=round(p_unit_price*quantity,2),currency=p_currency,
 terms=terms||jsonb_build_object('commercial_terms',p_terms,'requires_price_confirmation',false),
 status=case when p_approve then 'approved' else 'draft' end,approval_status=state,
 approved_at=case when p_approve then now() else null end,updated_at=now()
 where id=q.id;
 update public.ai_trade_approvals set status=state,decided_at=case when p_approve then now() else null end,
 risk_flags=case when p_approve then '[]'::jsonb else '["human_review_pending"]'::jsonb end,updated_at=now()
 where user_id=auth.uid() and source_id='inbound:'||i.id;
 return jsonb_build_object('ok',true,'quote_id',q.id,'approval_status',state);
end $$;
revoke all on function public.ai_trade_review_inbound_quote(uuid,numeric,text,text,boolean) from public,anon;
grant execute on function public.ai_trade_review_inbound_quote(uuid,numeric,text,text,boolean) to authenticated;
