
create or replace function public.ai_trade_commit_unified(p_payload jsonb,p_entities jsonb,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
 uid uuid:=auth.uid(); current_version timestamptz; stamp timestamptz:=clock_timestamp();
 tab text; item jsonb; cols text; vals text; updates text; counts jsonb:='{}'::jsonb; n integer;
begin
 if uid is null then raise exception 'authentication_required'; end if;
 if jsonb_typeof(p_payload)<>'object' or jsonb_typeof(p_entities)<>'object' then raise exception 'invalid_payload'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 select updated_at into current_version from public.ai_trade_state where user_id=uid for update;
 if current_version is distinct from p_expected_updated_at then raise exception 'cloud_version_conflict' using errcode='40001'; end if;
 foreach tab in array array['ai_trade_products','ai_trade_customers','ai_trade_contacts','ai_trade_activities','ai_trade_tasks','ai_trade_approvals'] loop
   if jsonb_typeof(p_entities->tab) is distinct from 'array' then raise exception 'missing_entity_array: %',tab; end if;
   n:=0;
   for item in select value from jsonb_array_elements(p_entities->tab) loop
     if coalesce(item->>'source_id','') not like 'local:%' then raise exception 'invalid_source_id'; end if;
     item:=(item-'id'-'created_at'-'updated_at')||jsonb_build_object('user_id',uid);
     if tab<>'ai_trade_activities' then item:=item||jsonb_build_object('updated_at',stamp); end if;
     select string_agg(format('%I',key),',' order by key),
       string_agg(format('r.%I',key),',' order by key),
       string_agg(format('%I=excluded.%I',key,key),',' order by key) filter(where key not in ('user_id','source_id'))
     into cols,vals,updates from jsonb_object_keys(item) as k(key);
     execute format('insert into public.%I (%s) select %s from jsonb_populate_record(null::public.%I,$1) r on conflict(user_id,source_id) do update set %s',tab,cols,vals,tab,coalesce(updates,'source_id=excluded.source_id')) using item;
     n:=n+1;
   end loop;
   execute format('delete from public.%I where user_id=$1 and source_id like ''local:%%'' and not exists(select 1 from jsonb_array_elements($2) e where e->>''source_id''=source_id)',tab) using uid,p_entities->tab;
   counts:=counts||jsonb_build_object(tab,n);
 end loop;
 insert into public.ai_trade_state(user_id,payload,updated_at) values(uid,p_payload,stamp)
 on conflict(user_id) do update set payload=excluded.payload,updated_at=excluded.updated_at
 returning updated_at into stamp;
 insert into public.ai_trade_schema_versions(user_id,version) values(uid,'unified-v1') on conflict do nothing;
 insert into public.ai_trade_sync_runs(user_id,status,entity_counts,finished_at) values(uid,'success',counts,stamp);
 return jsonb_build_object('updated_at',stamp,'counts',counts);
end $$;
revoke all on function public.ai_trade_commit_unified(jsonb,jsonb,timestamptz) from public,anon;
grant execute on function public.ai_trade_commit_unified(jsonb,jsonb,timestamptz) to authenticated;
comment on function public.ai_trade_commit_unified(jsonb,jsonb,timestamptz) is 'Atomic legacy snapshot and normalized records, owner RLS, optimistic concurrency; local: records are browser-managed. Approval rows are mirrors, not send authorization.';
