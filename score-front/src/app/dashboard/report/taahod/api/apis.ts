import { fetchWithAuthServer } from "@/app/lib/fetchWithAuthServer";

export interface TaahodResponse {
  data: {
    sumTaahod: number;
    lastUpdate: string;
  };
  message: string;
  statusCode: number;
}

// Custom error class for authentication errors
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export const taahodApi = {
  getTaahod: async (): Promise<TaahodResponse> => {
    const response = await fetchWithAuthServer(`${process.env.NEXT_PUBLIC_API_URL}/front/score/taahod`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Handle 401 errors specifically
    if (response.status === 401) {
      throw new AuthenticationError("Unauthorized access - please log in again");
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch taahod`);
    }

    return await response.json() as TaahodResponse;
  },
};