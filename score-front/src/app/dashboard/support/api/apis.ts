const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export const ScoreApi = {
  getScoreByNationalCodeAndAccountNumber: async (
    nationalCode: string,
    accountNumber: string
  ) => {
    return fetch(
      `${BASE_URL}/scores?nationalCode=${nationalCode}&accountNumber=${accountNumber}`
    );
  },

  createScore: async (scoreData: {
    nationalCode: string;
    accountNumber: string;
    score: number;
    updatedAt: string;
  }) => {
    return fetch(`${BASE_URL}/scores`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(scoreData),
    });
  },

  updateScore: async (id: number, score: number, updatedAt: string) => {
    return fetch(`${BASE_URL}/scores/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ score, updatedAt }),
    });
  },
};