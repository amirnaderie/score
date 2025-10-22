import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

export interface TaahodResponse {
  data: {
    sumTaahod: number;
    lastUpdate: string;
  };
  message: string;
  statusCode: number;
}

export const taahodApi = {
  getTaahod: async (): Promise<Response> => {
    return fetchWithAuthClient(`${process.env.NEXT_PUBLIC_API_URL}/front/score/taahod`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  },
};