export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export type TaskInsert = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>;
export type TaskUpdate = Partial<TaskInsert>;

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}
