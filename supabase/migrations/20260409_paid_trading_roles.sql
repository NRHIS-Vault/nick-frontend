-- Extend the profile role contract so trading authorization can distinguish
-- paid accounts from other signed-in users without overloading subscription state.

alter table public.profiles
drop constraint if exists profiles_role_check;

alter table public.profiles
add constraint profiles_role_check
check (role in ('admin', 'paid', 'member', 'viewer'));
