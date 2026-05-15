
-- Recreate trigger so the authorized admin email gets the admin role on signup
DROP TRIGGER IF EXISTS grant_admin_on_signup_trg ON auth.users;
CREATE TRIGGER grant_admin_on_signup_trg
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.grant_admin_on_signup();

-- Backfill role for the authorized admin if they already exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users WHERE email = 'vivabemeco@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
