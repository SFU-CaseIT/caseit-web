create table public.admin_push_workbook_sheets (
  endpoint text not null,
  workbook_id uuid not null,
  sheet_id uuid not null,
  primary key (endpoint, workbook_id, sheet_id)
);

alter table public.admin_push_workbook_sheets enable row level security;
grant select, insert, update, delete on table public.admin_push_workbook_sheets to service_role;

create or replace function public.save_push_workbook_sheet_preferences(
  p_user_id uuid,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_workbooks uuid[],
  p_sheet_preferences jsonb
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if jsonb_typeof(p_sheet_preferences) <> 'array' then
    raise exception 'Invalid sheet notification preferences.' using errcode = '22023';
  end if;

  perform public.save_push_workbook_preferences(p_user_id, p_endpoint, p_p256dh, p_auth, p_workbooks);

  delete from public.admin_push_workbook_sheets
  where endpoint = p_endpoint;

  insert into public.admin_push_workbook_sheets (endpoint, workbook_id, sheet_id)
  select p_endpoint, (preference ->> 'workbook_id')::uuid, sheet_id::uuid
  from jsonb_array_elements(p_sheet_preferences) as preferences(preference)
  cross join lateral jsonb_array_elements_text(preference -> 'sheet_ids') as selected(sheet_id)
  where (preference ->> 'workbook_id')::uuid = any(coalesce(p_workbooks, '{}'::uuid[]))
  on conflict do nothing;
end;
$$;

revoke all on function public.save_push_workbook_sheet_preferences(uuid, text, text, text, uuid[], jsonb)
from public, anon, authenticated;
grant execute on function public.save_push_workbook_sheet_preferences(uuid, text, text, text, uuid[], jsonb)
to service_role;
