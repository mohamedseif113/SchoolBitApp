export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | string;
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | string;

export interface TaskAssignee {
  id: string | number;
  name: string;
  role?: string;
  initials?: string;
  avatar?: string;
  [key: string]: any;
}

export interface Task {
  id: string | number;
  title: string;
  description?: string;
  status: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: TaskAssignee | string | number;
  assignee_name?: string;
  category?: string;
  comments_count?: number;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface TaskComment {
  id: string | number;
  task_id: string | number;
  user_id: string | number;
  user_name?: string;
  user?: {
    id?: string | number;
    name?: string;
    avatar?: string;
  };
  content: string;
  created_at?: string;
  [key: string]: any;
}

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  assigned_to?: string | number;
  due_date?: string;
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: any;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  assigned_to?: string | number;
  category?: string;
  [key: string]: any;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {
  id: string | number;
}
