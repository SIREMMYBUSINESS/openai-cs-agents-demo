/*
  # Federated Learning Consent Management Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `full_name` (text, nullable)
      - `role` (enum: patient, admin)
      - `hospital_id` (uuid, nullable, references hospitals)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `hospitals`
      - `id` (uuid, primary key)
      - `name` (text)
      - `address` (text, nullable)
      - `contact_email` (text, nullable)
      - `created_at` (timestamp)
    
    - `research_projects`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `principal_investigator` (text)
      - `institution` (text)
      - `data_types` (text array)
      - `purpose` (text)
      - `duration_months` (integer)
      - `status` (enum: active, completed, paused)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `consent_records`
      - `id` (uuid, primary key)
      - `patient_id` (uuid, references profiles)
      - `project_id` (uuid, references research_projects)
      - `consent_given` (boolean)
      - `consent_date` (timestamp)
      - `withdrawal_date` (timestamp, nullable)
      - `data_retention_period` (integer, months)
      - `specific_permissions` (jsonb)
      - `gdpr_compliant` (boolean, default true)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (text)
      - `details` (jsonb)
      - `ip_address` (text, nullable)
      - `user_agent` (text, nullable)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for admins to view aggregated data
    - Add policies for audit logging
*/

-- Create custom types
CREATE TYPE user_role AS ENUM ('patient', 'admin');
CREATE TYPE project_status AS ENUM ('active', 'completed', 'paused');

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  contact_email text,
  created_at timestamptz DEFAULT now()
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  role user_role DEFAULT 'patient',
  hospital_id uuid REFERENCES hospitals(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create research_projects table
CREATE TABLE IF NOT EXISTS research_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  principal_investigator text NOT NULL,
  institution text NOT NULL,
  data_types text[] NOT NULL DEFAULT '{}',
  purpose text NOT NULL,
  duration_months integer NOT NULL DEFAULT 12,
  status project_status DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consent_records table
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES research_projects(id) ON DELETE CASCADE,
  consent_given boolean NOT NULL DEFAULT false,
  consent_date timestamptz NOT NULL DEFAULT now(),
  withdrawal_date timestamptz,
  data_retention_period integer NOT NULL DEFAULT 60,
  specific_permissions jsonb DEFAULT '{}',
  gdpr_compliant boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(patient_id, project_id)
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  details jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Hospitals policies
CREATE POLICY "Anyone can read hospitals"
  ON hospitals
  FOR SELECT
  TO authenticated
  USING (true);

-- Research projects policies
CREATE POLICY "Anyone can read active research projects"
  ON research_projects
  FOR SELECT
  TO authenticated
  USING (status = 'active');

-- Consent records policies
CREATE POLICY "Users can read own consent records"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "Users can insert own consent records"
  ON consent_records
  FOR INSERT
  TO authenticated
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Users can update own consent records"
  ON consent_records
  FOR UPDATE
  TO authenticated
  USING (patient_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admin policies (assuming admin role exists)
CREATE POLICY "Admins can read all consent records"
  ON consent_records
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_projects_updated_at
  BEFORE UPDATE ON research_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consent_records_updated_at
  BEFORE UPDATE ON consent_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();