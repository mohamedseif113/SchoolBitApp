export type PortfolioStatus = 'draft' | 'submitted' | 'approved' | 'rejected' | string;
export type PerformanceRating = 'excellent' | 'very_good' | 'good' | 'needs_improvement' | string;

export interface PortfolioDocument {
  id: string | number;
  portfolio_id: string | number;
  file_name: string;
  file_url: string;
  file_size?: number;
  uploaded_at?: string;
  [key: string]: any;
}

export interface PortfolioNote {
  id: string | number;
  portfolio_id: string | number;
  author_name: string;
  content: string;
  created_at: string;
  [key: string]: any;
}

export interface PortfolioItem {
  id: string | number;
  employee_id: string | number;
  employee_name: string;
  department_name?: string;
  rating: PerformanceRating;
  status: PortfolioStatus;
  academic_year?: string;
  summary?: string;
  approved_by_name?: string;
  approved_at?: string;
  documents_count?: number;
  notes_count?: number;
  created_at?: string;
  [key: string]: any;
}

export interface CreatePortfolioPayload {
  employee_id: string | number;
  employee_name?: string;
  department_name?: string;
  rating: PerformanceRating;
  summary?: string;
  academic_year?: string;
  [key: string]: any;
}
