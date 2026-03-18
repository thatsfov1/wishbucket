-- Stores completed social tasks used for level progression.
CREATE TABLE IF NOT EXISTS user_social_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

CREATE INDEX IF NOT EXISTS idx_user_social_tasks_user_id
  ON user_social_tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_user_social_tasks_task_id
  ON user_social_tasks(task_id);
