-- Allow first-admin bootstrap: any authenticated user can claim admin role
-- ONLY if no admin exists yet. Once an admin exists, this policy blocks further inserts.
CREATE POLICY "bootstrap first admin" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (
  role = 'admin'
  AND user_id = auth.uid()
  AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
);

-- Allow existing admins to grant roles to anyone
CREATE POLICY "admins manage roles" ON public.user_roles
FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admins delete roles" ON public.user_roles
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));