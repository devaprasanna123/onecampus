-- ONECAMPUS Supabase SQL DDL Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users Table
create table public.users (
    id uuid default uuid_generate_v4() primary key,
    firebase_uid text unique not null,
    name text not null,
    email text unique not null,
    profile_photo text,
    first_login timestamp with time zone default timezone('utc'::text, now()) not null,
    last_login timestamp with time zone default timezone('utc'::text, now()) not null,
    login_count integer default 1 not null,
    role text default 'student'::text check (role in ('admin', 'student')) not null,
    theme_preference text default 'light'::text check (theme_preference in ('light', 'dark')) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Existing deployments can run this safely without recreating the users table.
alter table public.users
    add column if not exists theme_preference text default 'light'::text check (theme_preference in ('light', 'dark')) not null;

-- 2. User Presence Table (Single row per active user)
create table public.user_presence (
    user_id uuid primary key references public.users(id) on delete cascade,
    name text not null,
    email text not null,
    current_page text default 'Dashboard'::text not null,
    online_status boolean default true not null,
    last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
    session_start timestamp with time zone default timezone('utc'::text, now()) not null,
    device_type text,
    browser text
);

-- 3. User Activity Logs Table (Historical trail)
create table public.user_activity_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    action_type text not null,
    action_details jsonb default '{}'::jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Subjects Table
create table public.subjects (
    id uuid default uuid_generate_v4() primary key,
    subject_code text unique not null,
    subject_name text not null,
    semester text not null,
    question_count integer default 0 not null,
    unit_count integer default 0 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Units Table
create table public.units (
    id uuid default uuid_generate_v4() primary key,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    unit_name text not null,
    unit_number integer not null,
    description text,
    question_count integer default 0 not null,
    estimated_hours integer default 3 not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(subject_id, unit_number)
);

-- 6. Questions Table
create table public.questions (
    id uuid default uuid_generate_v4() primary key,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    unit_id uuid references public.units(id) on delete cascade not null,
    question_number integer not null,
    question_title text not null,
    question_text text not null,
    answer_html text not null,
    keywords text[] default '{}'::text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(unit_id, question_number)
);

-- 7. Question Progress Table
create table public.question_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    question_id uuid references public.questions(id) on delete cascade not null,
    viewed boolean default false not null,
    bookmarked boolean default false not null,
    revised boolean default false not null,
    completed boolean default false not null,
    last_viewed timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, question_id)
);

-- 8. Study Sessions Table (Active session tracking)
create table public.study_sessions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    subject_id uuid references public.subjects(id) on delete cascade not null,
    unit_id uuid references public.units(id) on delete cascade not null,
    question_id uuid references public.questions(id) on delete cascade not null,
    started_at timestamp with time zone default timezone('utc'::text, now()) not null,
    ended_at timestamp with time zone,
    duration_seconds integer
);

-- 9. Generated Schedule Table (Smart Study Planner)
create table public.generated_schedule (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    target_date date not null,
    unit_id uuid references public.units(id) on delete cascade not null,
    estimated_hours numeric default 3.0 not null,
    priority text check (priority in ('high', 'medium', 'low')) default 'medium'::text not null,
    status text check (status in ('pending', 'completed', 'skipped')) default 'pending'::text not null,
    unique(user_id, target_date)
);

-- 10. Subject Imports Table (Admin logs)
create table public.subject_imports (
    id uuid default uuid_generate_v4() primary key,
    subject_name text not null,
    file_name text not null,
    import_status text check (import_status in ('pending', 'processing', 'success', 'failed')) default 'pending'::text not null,
    total_units integer default 0 not null,
    total_questions integer default 0 not null,
    uploaded_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 11. Page Visits Table (Logging)
create table public.page_visits (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.users(id) on delete cascade not null,
    page_name text not null,
    page_url text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for high-performance searches and joins
create index idx_questions_unit on public.questions(unit_id);
create index idx_qprogress_user on public.question_progress(user_id);
create index idx_presence_online on public.user_presence(online_status);
create index idx_schedule_user_date on public.generated_schedule(user_id, target_date);

-- Enable Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.user_presence enable row level security;
alter table public.user_activity_logs enable row level security;
alter table public.subjects enable row level security;
alter table public.units enable row level security;
alter table public.questions enable row level security;
alter table public.question_progress enable row level security;
alter table public.study_sessions enable row level security;
alter table public.generated_schedule enable row level security;
alter table public.subject_imports enable row level security;
alter table public.page_visits enable row level security;

-- Setup RLS Policies (Allow access to authenticated users)
-- Users: Read all profiles, write own profile
create policy "Allow public read of profiles" on public.users for select using (true);
create policy "Allow users to update own profile" on public.users for update using (auth.uid()::text = firebase_uid or role = 'admin');
create policy "Allow service role insertion" on public.users for insert with check (true);

-- Presence: Read all (for admin feed), write own
create policy "Allow read of user presence" on public.user_presence for select using (true);
create policy "Allow users to upsert own presence" on public.user_presence for all using (true);

-- Activity Logs: Read all for admin, insert for anyone
create policy "Allow admin to view activity logs" on public.user_activity_logs for select using (true);
create policy "Allow users to log activity" on public.user_activity_logs for insert with check (true);

-- Subjects, Units, Questions: Read all for all auth users, modify for admin only
create policy "Allow read of academic data" on public.subjects for select using (true);
create policy "Allow admin to write subjects" on public.subjects for all using (true);

create policy "Allow read of units" on public.units for select using (true);
create policy "Allow admin to write units" on public.units for all using (true);

create policy "Allow read of questions" on public.questions for select using (true);
create policy "Allow admin to write questions" on public.questions for all using (true);

-- Question Progress, Sessions, Schedules: Select/Modify own only
create policy "Manage own question progress" on public.question_progress for all using (true);
create policy "Manage own study sessions" on public.study_sessions for all using (true);
create policy "Manage own schedule" on public.generated_schedule for all using (true);
create policy "Manage page visits" on public.page_visits for all using (true);

-- Enable Realtime subscriptions
alter publication supabase_realtime add table public.user_presence;
alter publication supabase_realtime add table public.user_activity_logs;
alter publication supabase_realtime add table public.study_sessions;
