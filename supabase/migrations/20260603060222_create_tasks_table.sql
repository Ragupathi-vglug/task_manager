/*
  # Create Tasks Management Schema

  ## Overview
  Sets up the core data model for the task management application.

  ## New Tables

  ### `tasks`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key → auth.users) - Owner of the task
  - `title` (text, NOT NULL) - Task title
  - `description` (text) - Optional detailed description
  - `status` (text) - Task status: 'todo', 'in_progress', 'done'
  - `priority` (text) - Task priority: 'low', 'medium', 'high'
  - `due_date` (timestamptz) - Optional due date
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on `tasks` table
  - Authenticated users can only SELECT their own tasks
  - Authenticated users can only INSERT tasks with their own user_id
  - Authenticated users can only UPDATE their own tasks
  - Authenticated users can only DELETE their own tasks

  ## Notes
  1. `status` defaults to 'todo'
  2. `priority` defaults to 'medium'
  3. An index on user_id speeds up per-user queries
  4. `updated_at` is automatically maintained via a trigger
*/

CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx ON tasks(user_id, status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
