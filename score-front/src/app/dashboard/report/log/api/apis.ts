import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';

export interface LogEntry {
  id: number;
  method: string;
  message: string;
  created_at: string;
  createdAt?: string;
  user_id?: number;
  ip_address?: string;
  user_agent?: string;
}

export interface LogsResponse {
  data: LogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LogsQueryParams {
  from: string;
  to: string;
  page?: number;
  limit?: number;
  sortBy?: 'method' | 'createdAt';
  sortOrder?: 'ASC' | 'DESC';
  methods?: string[];
  searchText: string;
}

export const logsApi = {
  /**
   * Get logs with filtering and pagination
   */
  async getLogs(params: LogsQueryParams): Promise<LogsResponse> {
    const queryParams = new URLSearchParams();

    // Add required parameters
    queryParams.append('from', params.from);
    queryParams.append('to', params.to);

    // Add optional parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.searchText) queryParams.append('searchText', params.searchText);
    if (params.methods && params.methods.length > 0) {
      queryParams.append('methods', params.methods.join(','));
    }

    const url = `${API_BASE_URL}/logs?${queryParams.toString()}`;

    const response = await fetchWithAuthClient(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch logs`);
    }

    const data = await response.json();
    return {
      data: data.data || [],
      total: data.pagination?.total || data.total || 0,
      page: data.pagination?.page || data.page || 1,
      limit: data.pagination?.limit || data.limit || 10,
      totalPages: data.pagination?.totalPages || Math.ceil((data.pagination?.total || data.total || 0) / (data.pagination?.limit || data.limit || 10))
    };
  },
  async getOtherLogs(params: LogsQueryParams): Promise<Partial<LogsResponse>> {
    const queryParams = new URLSearchParams();

    // Add required parameters
    queryParams.append('from', params.from);
    queryParams.append('to', params.to);

    // Add optional parameters
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.searchText) queryParams.append('searchText', params.searchText);
    if (params.methods && params.methods.length > 0) {
      queryParams.append('methods', params.methods.join(','));
    }

    const url = `${API_BASE_URL}/logs/other-logs?${queryParams.toString()}`;

    const response = await fetchWithAuthClient(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch logs`);
    }

    const data = await response.json();
    return {
      data: data.data || [],
      page: data.pagination?.page || data.page || 1,
      limit: data.pagination?.limit || data.limit || 10,
    };
  },

  // /**
  //  * Get logs by specific method
  //  */
  // async getLogsByMethod(method: string, params: Omit<LogsQueryParams, 'methods'>): Promise<LogsResponse> {
  //   return this.getLogs({ ...params, methods: [method] });
  // },

  // /**
  //  * Get all createScore logs
  //  */
  // async getCreateScoreLogs(params: Omit<LogsQueryParams, 'methods'>): Promise<LogsResponse> {
  //   return this.getLogsByMethod('createScore', params);
  // },

  // /**
  //  * Get all updateScore logs
  //  */
  // async getUpdateScoreLogs(params: Omit<LogsQueryParams, 'methods'>): Promise<LogsResponse> {
  //   return this.getLogsByMethod('updateScore', params);
  // },

  // /**
  //  * Get all transferScore logs
  //  */
  // async getTransferScoreLogs(params: Omit<LogsQueryParams, 'methods'>): Promise<LogsResponse> {
  //   return this.getLogsByMethod('transferScore', params);
  // },

  // /**
  //  * Get log by ID
  //  */
  // async getLogById(id: number): Promise<LogEntry> {
  //   const url = `${API_BASE_URL}/front/logs/${id}`;

  //   const response = await fetchWithAuthClient(url, {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   if (!response.ok) {
  //     throw new Error(`HTTP ${response.status}: Failed to fetch log ${id}`);
  //   }

  //   const data = await response.json();
  //   return data.data || data;
  // },

  // /**
  //  * Export logs to CSV
  //  */
  // async exportLogs(params: LogsQueryParams): Promise<Blob> {
  //   const queryParams = new URLSearchParams();

  //   queryParams.append('from', params.from);
  //   queryParams.append('to', params.to);
  //   if (params.methods && params.methods.length > 0) {
  //     queryParams.append('methods', params.methods.join(','));
  //   }
  //   if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  //   if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  //   const url = `${API_BASE_URL}/front/logs/export?${queryParams.toString()}`;

  //   const response = await fetchWithAuthClient(url, {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   });

  //   if (!response.ok) {
  //     throw new Error(`HTTP ${response.status}: Failed to export logs`);
  //   }

  //   return response.blob();
  // }
};