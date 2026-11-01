create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create unique index exercises_name_lower_key on public.exercises (lower(name));

create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  name text not null,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'done')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workouts_date_idx on public.workouts (date);

create table public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  exercise_id uuid not null references public.exercises (id),
  position integer not null
);

create index workout_exercises_workout_idx on public.workout_exercises (workout_id);
create index workout_exercises_exercise_idx on public.workout_exercises (exercise_id);

create table public.sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references public.workout_exercises (id) on delete cascade,
  position integer not null,
  target_reps integer check (target_reps >= 0),
  target_weight numeric check (target_weight >= 0),
  actual_reps integer check (actual_reps >= 0),
  actual_weight numeric check (actual_weight >= 0)
);

create index sets_workout_exercise_idx on public.sets (workout_exercise_id);

alter table public.exercises enable row level security;
alter table public.workouts enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.sets enable row level security;

create policy "authenticated full access" on public.exercises for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.workouts for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.workout_exercises for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.sets for all to authenticated using (true) with check (true);

revoke all on public.exercises, public.workouts, public.workout_exercises, public.sets from anon;

create function public.find_or_create_exercise(p_name text)
returns public.exercises
language plpgsql
security invoker
set search_path = public
as $$
declare
  result exercises;
begin
  insert into exercises (name) values (trim(p_name)) on conflict ((lower(name))) do nothing;
  select * into result from exercises where lower(name) = lower(trim(p_name));
  return result;
end;
$$;

create function public.save_workout(payload jsonb)
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
      status = payload ->> 'status',
      updated_at = now()
  where id = w_id;

  if not found then
    raise exception 'Workout not found';
  end if;

  delete from workout_exercises where workout_id = w_id;

  for ex in select value from jsonb_array_elements(coalesce(payload -> 'exercises', '[]'::jsonb)) loop
    insert into workout_exercises (workout_id, exercise_id, position)
    values (w_id, (ex ->> 'exercise_id')::uuid, ex_pos)
    returning id into we_id;

    st_pos := 0;
    for st in select value from jsonb_array_elements(coalesce(ex -> 'sets', '[]'::jsonb)) loop
      insert into sets (workout_exercise_id, position, target_reps, target_weight, actual_reps, actual_weight)
      values (
        we_id,
        st_pos,
        (st ->> 'target_reps')::integer,
        (st ->> 'target_weight')::numeric,
        (st ->> 'actual_reps')::integer,
        (st ->> 'actual_weight')::numeric
      );
      st_pos := st_pos + 1;
    end loop;

    ex_pos := ex_pos + 1;
  end loop;
end;
$$;

create function public.copy_workout(source_id uuid, dates date[], actuals_as_targets boolean)
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
      select id, exercise_id, position from workout_exercises where workout_id = source_id order by position
    loop
      insert into workout_exercises (workout_id, exercise_id, position)
      values (new_id, we.exercise_id, we.position)
      returning id into new_we;

      insert into sets (workout_exercise_id, position, target_reps, target_weight)
      select
        new_we,
        position,
        case when actuals_as_targets and actual_reps is not null then actual_reps else target_reps end,
        case when actuals_as_targets and actual_reps is not null then actual_weight else target_weight end
      from sets
      where workout_exercise_id = we.id;
    end loop;
  end loop;
end;
$$;

create function public.last_performance(p_exercise_id uuid, before_date date)
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
        where we.workout_id = w.id and we.exercise_id = p_exercise_id and s.actual_reps is not null
      )
    order by w.date desc, w.created_at desc
    limit 1
  )
  select jsonb_build_object(
    'date', l.date,
    'sets', (
      select jsonb_agg(jsonb_build_object('reps', s.actual_reps, 'weight', s.actual_weight) order by we.position, s.position)
      from workout_exercises we
      join sets s on s.workout_exercise_id = we.id
      where we.workout_id = l.id and we.exercise_id = p_exercise_id and s.actual_reps is not null
    )
  )
  from latest l;
$$;

revoke execute on function public.find_or_create_exercise(text) from public, anon;
revoke execute on function public.save_workout(jsonb) from public, anon;
revoke execute on function public.copy_workout(uuid, date[], boolean) from public, anon;
revoke execute on function public.last_performance(uuid, date) from public, anon;

grant execute on function public.find_or_create_exercise(text) to authenticated;
grant execute on function public.save_workout(jsonb) to authenticated;
grant execute on function public.copy_workout(uuid, date[], boolean) to authenticated;
grant execute on function public.last_performance(uuid, date) to authenticated;
