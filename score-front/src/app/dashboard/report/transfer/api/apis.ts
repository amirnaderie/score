import { fetchWithAuthClient } from '@/app/lib/fetchWithAuthClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004';

export interface TransferData {
  referenceCode: number;
  fromNationalCode: number;
  fromAccountNumber: number;
  toNationalCode: number;
  toAccountNumber: number;
  score: number;
  transferDate: string;
  transferDateShamsi: string;
  direction: 'from' | 'to';
  reversedAt?: string | null;
  description?: string | null;
}

export interface PaginatedTransferResponse {
  data: TransferData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransferSearchParams {
  nationalCode: string;
  accountNumber: string;
  page?: number;
  limit?: number;
  sortBy?: 'date' | 'score';
  sortOrder?: 'ASC' | 'DESC';
}

export interface TransferRequest {
  fromNationalCode: string;
  fromAccountNumber: string;
  toNationalCode: string;
  toAccountNumber: string;
  score: number;
  referenceCode?: string;
  description?: string;
}

export interface EstelamResponse {
  fromName: string;
  toName: string;
}

export const transferApi = {
  getAllTransfers: async (params: TransferSearchParams) => {
    const queryString = new URLSearchParams(Object.fromEntries(
      Object.entries(params).filter(([_, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    )).toString()
    const res = await fetchWithAuthClient(
      `${process.env.NEXT_PUBLIC_API_URL}/front/score/transfers/all?${queryString}`,
      {
        credentials: "include",
      }
    );
    return res;
  },

  reverseTransfer: async (params: {
    referenceCode: number;
    reverseScore: number;
  }) => {
    const res = await fetchWithAuthClient(
      `${process.env.NEXT_PUBLIC_API_URL}/front/score/reverse-transfer`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify(params),
      }
    );
    return res;
  },
};