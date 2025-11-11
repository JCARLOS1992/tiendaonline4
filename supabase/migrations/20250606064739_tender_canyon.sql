/*
  # Update users table RLS policies

  1. Changes
    - Add new RLS policy to allow authenticated users to read their own admin status
    - This policy ensures users can check their admin status during login
    - Maintains security by only allowing users to read their own data

  2. Security
    - Policy uses auth.uid() to match the user's ID
    - Only allows reading of own user data
    - Maintains existing RLS policies
*/

-- Add policy to allow authenticated users to read their own admin status
CREATE POLICY "Allow authenticated users to read their own admin status"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);