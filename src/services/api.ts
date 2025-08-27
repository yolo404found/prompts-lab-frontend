import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type { Template, Favorite, NotionIntegration, ExportRequest, ApiResponse, PaginatedResponse, User } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    const baseURL = import.meta.env.VITE_API_URL;
    console.log('API Service initialized with baseURL:', baseURL);
    console.log('All env vars:', import.meta.env);
    
    if (!baseURL) {
      console.error('VITE_API_URL is not defined!');
    }
    
    this.api = axios.create({
      baseURL: baseURL,
      timeout: 10000,
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('auth_token');
        console.log('Request interceptor - URL:', config.url, 'Method:', config.method);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('Sending request with token:', token.substring(0, 20) + '...');
        } else {
          console.log('No auth token found in sessionStorage for request to:', config.url);
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('Response received:', response.config.url, 'Status:', response.status);
        return response;
      },
      (error) => {
        console.log('Response error:', error.config?.url, 'Status:', error.response?.status, 'Message:', error.message);
        if (error.response?.status === 401) {
          // Token expired or invalid
          console.log('401 error - removing auth token');
          sessionStorage.removeItem('auth_token');
          // Don't redirect here - let the component handle it
          // window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Templates
  async getTemplates(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<Template>> {
    // Convert page to offset for backend
    const apiParams: Record<string, any> = { ...params };
    if (apiParams.page) {
      apiParams.offset = (apiParams.page - 1) * (apiParams.limit || 20);
      delete apiParams.page;
    }
    
    const response = await this.api.get('/templates', { params: apiParams });
    
    // Transform backend response to match frontend PaginatedResponse format
    const backendData = response.data.data;
    return {
      data: backendData.templates || [],
      total: backendData.total || 0,
      page: params.page || 1,
      limit: params.limit || 20,
      hasMore: (backendData.total || 0) > ((params.page || 1) * (params.limit || 20))
    };
  }

  async getTemplate(id: string): Promise<Template> {
    const response = await this.api.get(`/templates/${id}`);
    return response.data.data;
  }

  async createTemplate(data: { title: string; description: string; category: string; content: string }): Promise<Template> {
    const response = await this.api.post('/templates', data);
    return response.data.data;
  }

  async updateTemplate(id: string, data: Partial<{ title: string; description: string; category: string; content: string }>): Promise<Template> {
    const response = await this.api.patch(`/templates/${id}`, data);
    return response.data.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    await this.api.delete(`/templates/${id}`);
  }

  async exportTemplate(id: string, exportData: ExportRequest): Promise<ApiResponse<{ success: boolean; message: string }>> {
    const response = await this.api.post(`/templates/${id}/export`, exportData);
    return response.data;
  }

  // Favorites
  async getFavorites(): Promise<Favorite[]> {
    const response = await this.api.get('/favorites');
    return response.data.data.favorites;
  }

  async toggleFavorite(templateId: string): Promise<ApiResponse<Favorite>> {
    const response = await this.api.post('/favorites/toggle', { template_id: templateId });
    return response.data;
  }

  // Notion Integration
  async getNotionStatus(): Promise<NotionIntegration | null> {
    try {
      const response = await this.api.get('/notion/status');
      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async startNotionOAuth(): Promise<{ authUrl: string; state: string }> {
    const response = await this.api.get('/notion/oauth/start');
    return response.data.data;
  }

  // Auth
  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data.data;
  }

  async login(credentials: { email: string; password: string }): Promise<{ user: User; token: string }> {
    console.log('API login called with credentials:', credentials);
    const response = await this.api.post('/auth/login', credentials);
    console.log('API login response:', response.data);
    console.log('Returning data.data:', response.data.data);
    return response.data.data;
  }

  async signup(userData: { email: string; password: string; name?: string }): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/signup', userData);
    return response.data.data;
  }
}

export const apiService = new ApiService();

// Add debug method to window for easy console access
declare global {
  interface Window {
    debugToken: () => void;
    checkToken: () => void;
  }
}

window.debugToken = () => {
  const token = sessionStorage.getItem('auth_token');
  console.log('🔍 Debug Token Status:');
  console.log('🔍 Token exists:', !!token);
  if (token) {
    console.log('🔍 Token length:', token.length);
    console.log('🔍 Token preview:', token.substring(0, 20) + '...');
    console.log('🔍 Full token:', token);
  } else {
    console.log('🔍 No token found in sessionStorage');
  }
};

window.checkToken = () => {
  const token = sessionStorage.getItem('auth_token');
  console.log('🔍 Current token status:', !!token);
  if (token) {
    console.log('🔍 Token preview:', token.substring(0, 20) + '...');
  }
};

export default apiService;
