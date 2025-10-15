export interface UsedScoreData {
  id: number;
  accountNumber: number;
  score: number;
  referenceCode: number;
  createdAt: string;
  createdAtShamsi: string;
  branchCode: number;
}

export interface PaginatedUsedScoresResponse {
  data: UsedScoreData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UsedScoresSearchParams {
  nationalCode: string;
  page?: number;
  limit?: number;
}

import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';

export const usedScoresApi = {
  getUsedScoresByNationalCode: async (params: UsedScoresSearchParams): Promise<PaginatedUsedScoresResponse> => {
    const queryString = new URLSearchParams({
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '10',
    }).toString();

    const response = await fetchWithAuthClient(
      `${API_BASE_URL}/front/score/used-scores/by-national-code/${params.nationalCode}?${queryString}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch used scores');
    }

    const result = await response.json();
    return result.data; // Return the data object which contains the paginated response
  },

  updateUsedScore: async (id: number, score: number): Promise<any> => {
    const response = await fetchWithAuthClient(
      `${API_BASE_URL}/front/score/used-scores/${id}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ score }),
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update used score');
    }

    return response.json();
  },

  deleteUsedScore: async (id: number): Promise<any> => {
    const response = await fetchWithAuthClient(
      `${API_BASE_URL}/front/score/used-scores/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete used score');
    }

    return response.json();
  },
};