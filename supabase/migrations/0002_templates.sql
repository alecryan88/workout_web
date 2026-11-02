-- Templates, exercise library and active workouts.
-- See .scratch/templates/spec.md (Implementation Decisions: Schema).

-- ---------------------------------------------------------------------------
-- Sets: one lbs × reps pair plus a completed tick
-- ---------------------------------------------------------------------------

alter table public.sets
  add column weight numeric check (weight >= 0),
  add column reps integer check (reps >= 0),
  add column completed boolean not null default false;

update public.sets
set weight = case when actual_reps is not null or actual_weight is not null then actual_weight else target_weight end,
    reps = case when actual_reps is not null or actual_weight is not null then actual_reps else target_reps end,
    completed = (actual_reps is not null or actual_weight is not null);

alter table public.sets
  drop column target_reps,
  drop column target_weight,
  drop column actual_reps,
  drop column actual_weight;

alter table public.workout_exercises
  add column rest_seconds integer not null default 120 check (rest_seconds >= 0);

-- Saves name, date, notes and exercises. Status and times change only through
-- start_workout, finish_workout and direct status updates.
create or replace function public.save_workout(payload jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  w_id uuid := (payload ->> 'id')::uuid;
  ex jsonb;
  st jsonb;
  ex_pos integer := 0;
  st_pos integer;
  we_id uuid;
begin
  update workouts
  set date = (payload ->> 'date')::date,
      name = payload ->> 'name',
      notes = payload ->> 'notes',
      updated_at = now()
  where id = w_id;

  if not found then
    raise exception 'Workout not found';
  end if;

  delete from workout_exercises where workout_id = w_id;

  for ex in select value from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb)) loop
    insert into workout_exercises (workout_id, exercise_id, position, rest_seconds)
    values (w_id, (ex ->> 'exercise_id')::uuid, ex_pos, coalesce((ex ->> 'rest_seconds')::integer, 120))
    returning id into we_id;

    st_pos := 0;
    for st in select value from jsonb_array_elements(coalesce(ex -> 'sets', '[]'::jsonb)) loop
      insert into sets (workout_exercise_id, position, weight, reps, completed)
      values (
        we_id,
        st_pos,
        (st ->> 'weight')::numeric,
        (st ->> 'reps')::integer,
        coalesce((st ->> 'completed')::boolean, false)
      );
      st_pos := st_pos + 1;
    end loop;

    ex_pos := ex_pos + 1;
  end loop;
end;
$$;

drop function public.copy_workout(uuid, date[], boolean);

create function public.copy_workout(source_id uuid, dates date[], ticked_only boolean)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  d date;
  new_id uuid;
  we record;
  new_we uuid;
begin
  if not exists (select 1 from workouts where id = source_id) then
    raise exception 'Workout not found';
  end if;

  foreach d in array dates loop
    insert into workouts (date, name, notes, status)
    select d, name, notes, 'planned' from workouts where id = source_id
    returning id into new_id;

    for we in
      select id, exercise_id, position, rest_seconds from workout_exercises where workout_id = source_id order by position
    loop
      insert into workout_exercises (workout_id, exercise_id, position, rest_seconds)
      values (new_id, we.exercise_id, we.position, we.rest_seconds)
      returning id into new_we;

      insert into sets (workout_exercise_id, position, weight, reps, completed)
      select new_we, (row_number() over (order by position)) - 1, weight, reps, false
      from sets
      where workout_exercise_id = we.id and (not ticked_only or completed);
    end loop;
  end loop;
end;
$$;

-- Returns the latest done workout's sets for the exercise in set order; sets that
-- weren't completed come back as null so Previous can match by set number.
create or replace function public.last_performance(p_exercise_id uuid, before_date date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with latest as (
    select w.id, w.date
    from workouts w
    where w.status = 'done'
      and w.date < before_date
      and exists (
        select 1
        from workout_exercises we
        join sets s on s.workout_exercise_id = we.id
        where we.workout_id = w.id and we.exercise_id = p_exercise_id and s.completed
      )
    order by w.date desc, w.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'date', l.date,
    'sets', (
      select jsonb_agg(
        case when s.completed then jsonb_build_object('reps', s.reps, 'weight', s.weight) else 'null'::jsonb end
        order by we.position, s.position
      )
      from workout_exercises we
      join sets s on s.workout_exercise_id = we.id
      where we.workout_id = l.id and we.exercise_id = p_exercise_id
    )
  )
  from latest l;
$$;

revoke execute on function public.copy_workout(uuid, date[], boolean) from public, anon;
grant execute on function public.copy_workout(uuid, date[], boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Exercise library: equipment, muscle group, notes, archiving
-- ---------------------------------------------------------------------------

alter table public.exercises
  add column equipment text not null default 'other'
    check (equipment in ('barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other')),
  add column muscle_group text
    check (muscle_group in ('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body')),
  add column notes text,
  add column archived_at timestamptz;

drop index public.exercises_name_lower_key;
create unique index exercises_name_equipment_key on public.exercises (lower(name), equipment);

-- Inline creation from the picker: equipment "other". An archived match is restored.
create or replace function public.find_or_create_exercise(p_name text)
returns public.exercises
language plpgsql
security invoker
set search_path = public
as $$
declare
  result exercises;
begin
  insert into exercises (name, equipment) values (trim(p_name), 'other')
  on conflict ((lower(name)), equipment) do update set archived_at = null
  returning * into result;
  return result;
end;
$$;

create function public.delete_or_archive_exercise(p_id uuid)
returns text
language plpgsql
security invoker
set search_path = public
as $$
begin
  if exists (select 1 from workout_exercises where exercise_id = p_id)
     or exists (select 1 from template_exercises where exercise_id = p_id) then
    update exercises set archived_at = now() where id = p_id;
    return 'archived';
  end if;
  delete from exercises where id = p_id;
  return 'deleted';
end;
$$;

revoke execute on function public.delete_or_archive_exercise(uuid) from public, anon;
grant execute on function public.delete_or_archive_exercise(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Templates
-- ---------------------------------------------------------------------------

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_exercises (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.templates (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null,
  rest_seconds integer not null default 120 check (rest_seconds >= 0)
);

create index template_exercises_template_idx on public.template_exercises (template_id);
create index template_exercises_exercise_idx on public.template_exercises (exercise_id);

create table public.template_sets (
  id uuid primary key default gen_random_uuid(),
  template_exercise_id uuid not null references public.template_exercises (id) on delete cascade,
  position integer not null,
  weight numeric check (weight >= 0),
  reps integer check (reps >= 0)
);

create index template_sets_template_exercise_idx on public.template_sets (template_exercise_id);

alter table public.templates enable row level security;
alter table public.template_exercises enable row level security;
alter table public.template_sets enable row level security;

create policy "authenticated full access" on public.templates for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.template_exercises for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.template_sets for all to authenticated using (true) with check (true);

revoke all on public.templates, public.template_exercises, public.template_sets from anon;

alter table public.workouts
  add column template_id uuid references public.templates (id) on delete set null;

-- Creates the template when payload.id is null, otherwise replaces it. Returns its id.
create function public.save_template(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  t_id uuid := (payload ->> 'id')::uuid;
  ex jsonb;
  st jsonb;
  ex_pos integer := 0;
  st_pos integer;
  te_id uuid;
begin
  if t_id is null then
    insert into templates (name, notes) values (payload ->> 'name', payload ->> 'notes') returning id into t_id;
  else
    update templates set name = payload ->> 'name', notes = payload ->> 'notes', updated_at = now() where id = t_id;
    if not found then
      raise exception 'Template not found';
    end if;
    delete from template_exercises where template_id = t_id;
  end if;

  for ex in select value from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb)) loop
    insert into template_exercises (template_id, exercise_id, position, rest_seconds)
    values (t_id, (ex ->> 'exercise_id')::uuid, ex_pos, coalesce((ex ->> 'rest_seconds')::integer, 120))
    returning id into te_id;

    st_pos := 0;
    for st in select value from jsonb_array_elements(coalesce(ex -> 'sets', '[]'::jsonb)) loop
      insert into template_sets (template_exercise_id, position, weight, reps)
      values (te_id, st_pos, (st ->> 'weight')::numeric, (st ->> 'reps')::integer);
      st_pos := st_pos + 1;
    end loop;

    ex_pos := ex_pos + 1;
  end loop;

  return t_id;
end;
$$;

create function public.create_template_from_workout(p_workout_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  t_id uuid;
  we record;
  new_te uuid;
begin
  insert into templates (name, notes)
  select name, notes from workouts where id = p_workout_id
  returning id into t_id;

  if t_id is null then
    raise exception 'Workout not found';
  end if;

  for we in
    select id, exercise_id, position, rest_seconds from workout_exercises where workout_id = p_workout_id order by position
  loop
    insert into template_exercises (template_id, exercise_id, position, rest_seconds)
    values (t_id, we.exercise_id, we.position, we.rest_seconds)
    returning id into new_te;

    insert into template_sets (template_exercise_id, position, weight, reps)
    select new_te, position, weight, reps from sets where workout_exercise_id = we.id;
  end loop;

  return t_id;
end;
$$;

revoke execute on function public.save_template(jsonb) from public, anon;
revoke execute on function public.create_template_from_workout(uuid) from public, anon;
grant execute on function public.save_template(jsonb) to authenticated;
grant execute on function public.create_template_from_workout(uuid) to authenticated;

-- Creates one planned, unticked snapshot workout per date. Returns the new ids in date order.
create function public.schedule_template(p_template_id uuid, dates date[])
returns uuid[]
language plpgsql
security invoker
set search_path = public
as $$
declare
  d date;
  new_id uuid;
  ids uuid[] := '{}';
  te record;
  new_we uuid;
begin
  if not exists (select 1 from templates where id = p_template_id) then
    raise exception 'Template not found';
  end if;

  foreach d in array coalesce((select array_agg(x order by x) from unnest(dates) as x), '{}') loop
    insert into workouts (date, name, notes, status, template_id)
    select d, name, notes, 'planned', id from templates where id = p_template_id
    returning id into new_id;
    ids := ids || new_id;

    for te in
      select id, exercise_id, position, rest_seconds from template_exercises where template_id = p_template_id order by position
    loop
      insert into workout_exercises (workout_id, exercise_id, position, rest_seconds)
      values (new_id, te.exercise_id, te.position, te.rest_seconds)
      returning id into new_we;

      insert into sets (workout_exercise_id, position, weight, reps, completed)
      select new_we, position, weight, reps, false from template_sets where template_exercise_id = te.id;
    end loop;
  end loop;

  return ids;
end;
$$;

revoke execute on function public.schedule_template(uuid, date[]) from public, anon;
grant execute on function public.schedule_template(uuid, date[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Active workouts: Start / in progress / Finish
-- ---------------------------------------------------------------------------

alter table public.workouts drop constraint workouts_status_check;
alter table public.workouts
  add constraint workouts_status_check check (status in ('planned', 'in_progress', 'done')),
  add column started_at timestamptz,
  add column finished_at timestamptz;

-- At most one workout in progress.
create unique index workouts_one_in_progress on public.workouts ((true)) where status = 'in_progress';

create function public.start_workout(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update workouts
  set status = 'in_progress', started_at = now(), finished_at = null, updated_at = now()
  where id = p_id and status = 'planned';
end;
$$;

-- Duration is finished_at - started_at; a workout finished without Start has no started_at.
create function public.finish_workout(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update workouts set status = 'done', finished_at = now(), updated_at = now() where id = p_id;
  if not found then
    raise exception 'Workout not found';
  end if;
end;
$$;

revoke execute on function public.start_workout(uuid) from public, anon;
revoke execute on function public.finish_workout(uuid) from public, anon;
grant execute on function public.start_workout(uuid) to authenticated;
grant execute on function public.finish_workout(uuid) to authenticated;
