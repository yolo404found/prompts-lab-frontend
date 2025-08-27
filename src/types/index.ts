export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export interface Template {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  variables: string[];
  is_favorite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Favorite {
  id: string;
  template_id: string;
  user_id: string;
  created_at: string;
  template?: Template;
}

export interface NotionIntegration {
  connected: boolean;
  workspace: {
    name: string;
    id: string;
  } | null;
  lastUpdated?: string;
}

export interface ExportRequest {
  template_id: string;
  mode: 'page' | 'database';
  parent_id: string;
  variables: Record<string, string>;
}

export interface GlobalVariable {
  key: string;
  value: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
