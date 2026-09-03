export interface CommitteeMember {
  id: string | number;
  user_id: string | number;
  user_name?: string;
  role: 'chairman' | 'secretary' | 'member' | string;
  joined_at?: string;
  [key: string]: any;
}

export interface CommitteeTask {
  id: string | number;
  committee_id: string | number;
  title: string;
  assigned_to_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  due_date?: string;
  [key: string]: any;
}

export interface CommitteeMeeting {
  id: string | number;
  committee_id: string | number;
  title: string;
  meeting_date: string;
  meeting_time?: string;
  location?: string;
  agenda?: string;
  status: 'scheduled' | 'completed' | 'cancelled' | string;
  [key: string]: any;
}

export interface CommitteeFile {
  id: string | number;
  committee_id: string | number;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at?: string;
  [key: string]: any;
}

export interface Committee {
  id: string | number;
  name: string;
  description?: string;
  chairman_name?: string;
  status: 'active' | 'archived' | string;
  members_count?: number;
  meetings_count?: number;
  tasks_count?: number;
  created_at?: string;
  [key: string]: any;
}

export interface CreateCommitteePayload {
  name: string;
  description?: string;
  chairman_id?: string | number;
  status?: string;
  [key: string]: any;
}
