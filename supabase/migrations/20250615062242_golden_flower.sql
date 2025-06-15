/*
  # Fix RLS Policy Syntax Error
  
  This migration fixes the syntax error in the previous migration where
  "CREATE POLICY IF NOT EXISTS" was used, which is not valid PostgreSQL syntax.
  
  1. Drop and recreate the policy with correct syntax
  2. Ensure proper permissions for email column access
*/

-- Drop the policy if it exists (using DO block to handle IF EXISTS)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own email in profile'
  ) THEN
    DROP POLICY "Users can update own email in profile" ON user_profiles;
  END IF;
END $$;

-- Create the policy with correct syntax (without IF NOT EXISTS)
CREATE POLICY "Users can update own email in profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also ensure users can read their own email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can read own email in profile'
  ) THEN
    CREATE POLICY "Users can read own email in profile"
      ON user_profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- Grant necessary permissions for the webhook function
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON user_profiles TO authenticated;
GRANT SELECT ON user_profiles TO service_role;

-- Add comment for documentation
COMMENT ON POLICY "Users can update own email in profile" ON user_profiles IS 'Allows users to update their own email address in their profile';
COMMENT ON POLICY "Users can read own email in profile" ON user_profiles IS 'Allows users to read their own email address from their profile';