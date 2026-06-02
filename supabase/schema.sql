-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Households table (2 users share one household)
create table households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

-- Profiles table (extends Supabase auth.users)
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  household_id uuid references households(id) on delete set null,
  display_name text not null,
  created_at timestamptz default now()
);

-- Categories table
create table categories (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references households(id) on delete cascade not null,
  name text not null,
  type text check (type in ('income', 'expense')) not null,
  color text not null default '#6366f1',
  icon text not null default 'tag',
  created_at timestamptz default now()
);

-- Transactions table
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references households(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  category_id uuid references categories(id) on delete set null,
  amount integer not null,
  type text check (type in ('income', 'expense')) not null,
  note text,
  date date not null default current_date,
  created_at timestamptz default now()
);

-- Row Level Security
alter table households enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table transactions enable row level security;

-- Households policies
create policy "Users can view their own household"
  on households for select
  using (id in (select household_id from profiles where id = auth.uid()));

create policy "Users can insert households"
  on households for insert
  with check (true);

create policy "Household members can update"
  on households for update
  using (id in (select household_id from profiles where id = auth.uid()));

-- Profiles policies
create policy "Users can view profiles in same household"
  on profiles for select
  using (
    id = auth.uid() or
    household_id in (select household_id from profiles where id = auth.uid())
  );

create policy "Users can insert own profile"
  on profiles for insert
  with check (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update
  using (id = auth.uid());

-- Categories policies
create policy "Household members can view categories"
  on categories for select
  using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can insert categories"
  on categories for insert
  with check (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can update categories"
  on categories for update
  using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can delete categories"
  on categories for delete
  using (household_id in (select household_id from profiles where id = auth.uid()));

-- Transactions policies
create policy "Household members can view transactions"
  on transactions for select
  using (household_id in (select household_id from profiles where id = auth.uid()));

create policy "Household members can insert transactions"
  on transactions for insert
  with check (
    household_id in (select household_id from profiles where id = auth.uid()) and
    user_id = auth.uid()
  );

create policy "Users can update own transactions"
  on transactions for update
  using (user_id = auth.uid());

create policy "Users can delete own transactions"
  on transactions for delete
  using (user_id = auth.uid());

-- Default categories function
create or replace function create_default_categories(p_household_id uuid)
returns void as $$
begin
  insert into categories (household_id, name, type, color, icon) values
    (p_household_id, '食費', 'expense', '#ef4444', 'utensils'),
    (p_household_id, '交通費', 'expense', '#f97316', 'car'),
    (p_household_id, '光熱費', 'expense', '#eab308', 'zap'),
    (p_household_id, '住居費', 'expense', '#22c55e', 'home'),
    (p_household_id, '医療費', 'expense', '#06b6d4', 'heart'),
    (p_household_id, '娯楽費', 'expense', '#8b5cf6', 'gamepad-2'),
    (p_household_id, '日用品', 'expense', '#ec4899', 'shopping-bag'),
    (p_household_id, 'その他支出', 'expense', '#6b7280', 'minus-circle'),
    (p_household_id, '給与', 'income', '#10b981', 'briefcase'),
    (p_household_id, 'その他収入', 'income', '#3b82f6', 'plus-circle');
end;
$$ language plpgsql security definer;

-- Realtime
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table categories;
