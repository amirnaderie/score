import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

export interface FacilityInProgressResponseDto {
  nationalCode: number;
  accountNumber: number;
  usedScore: number;
  createdAt: string;
  createdAtShamsi: string;
  referenceCode: number;
}

export interface PaginatedFacilitiesInProgressResponseDto {
  data: FacilityInProgressResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface FacilitiesInProgressParams {
  page?: number;
  limit?: number;
}

export interface FacilitiesInProgressResponse {
  data: PaginatedFacilitiesInProgressResponseDto;
  message: string;
  statusCode: number;
}

export const facilitiesInProgressApi = {
  getFacilitiesInProgress: async (params: FacilitiesInProgressParams): Promise<Response> => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    
    const url = `${process.env.NEXT_PUBLIC_API_URL}/front/score/facilities-in-progress${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    return fetchWithAuthClient(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};