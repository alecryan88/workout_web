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
      select id, exercise_id, position from workout_exercises where workout_id = source_id order by position
    loop
      insert into workout_exercises (workout_id, exercise_id, position)
      values (new_id, we.exercise_id, we.position)
      returning id into new_we;

      insert into sets (workout_exercise_id, position, weight, reps, completed)
      select new_we, (row_number() over (order by position)) - 1, weight, reps, false
      from sets
      where workout_exercise_id = we.id and (not ticked_only or completed);
    end loop;
  end loop;
end;
$$;

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
      select jsonb_agg(jsonb_build_object('reps', s.reps, 'weight', s.weight) order by we.position, s.position)
      from workout_exercises we
      join sets s on s.workout_exercise_id = we.id
      where we.workout_id = l.id and we.exercise_id = p_exercise_id and s.completed
    )
  )
  from latest l;
$$;

revoke execute on function public.copy_workout(uuid, date[], boolean) from public, anon;
grant execute on function public.copy_workout(uuid, date[], boolean) to authenticated;
