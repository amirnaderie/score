import { fetchWithAuthServer } from "@/app/lib/fetchWithAuthServer";

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
    branchCode?: number;
}

export interface FacilitiesInProgressResponse {
    data: PaginatedFacilitiesInProgressResponseDto;
    message: string;
    statusCode: number;
}

export const facilitiesInProgressApiServer = {
    getFacilitiesInProgress: async (params: FacilitiesInProgressParams): Promise<FacilitiesInProgressResponse> => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append('page', params.page.toString());
        if (params.limit) searchParams.append('limit', params.limit.toString());
        if (params.branchCode) searchParams.append('branchCode', params.branchCode.toString());

        const url = `${process.env.NEXT_PUBLIC_API_URL}/front/score/facilities-in-progress${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

        const response = await fetchWithAuthServer(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: Failed to fetch facilities in progress`);
        }
        return await response.json() as FacilitiesInProgressResponse;
    },
};