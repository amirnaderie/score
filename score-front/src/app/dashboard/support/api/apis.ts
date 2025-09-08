import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

export const ScoreApi = {
  getScoreByNationalCodeAndAccountNumber: async (
    nationalCode: string,
    accountNumber: string
  ) => {
    return fetchWithAuthClient(
      `${process.env.NEXT_PUBLIC_API_URL}/front/score/scores?nationalCode=${nationalCode}&accountNumber=${accountNumber}`,
      {
        credentials: "include",
      }
    );

  },

  createScore: async (scoreData: {
    nationalCode: string;
    accountNumber: string;
    score: number;
    updatedAt: string;
  }) => {
    return fetchWithAuthClient(
      `${BASE_URL}/front/score/scores`,
      {
        method: "POST",
        body: JSON.stringify(scoreData),
        credentials: "include",
      }
    );

  },

  updateScore: async (id: number, score: number, updatedAt: string) => {
    return fetchWithAuthClient(
      `${BASE_URL}/front/score/scores/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ score, updatedAt }),
        credentials: "include",
      }
    );

  },
};