"use client";

import React, { useState, useEffect, useCallback } from "react";
import SearchForm from "./_components/serachForm";
import TransferTable from "./_components/transferTable";
import Pagination from "./_components/pagination";
import toast from "react-hot-toast";
import useSWR from "swr";
import { transferApi } from "./api/apis";

interface SearchParams {
  nationalCode: string;
  accountNumber: string;
  page: number;
  limit: number;
  sortBy: "date";
  sortOrder: "ASC" | "DESC";
}

export default function TransferDashboard() {
  // Search state - only set when user performs search
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);

  const fetcher = async (params: SearchParams) => {
    if (!params.nationalCode || !params.accountNumber) return null;

    try {
      const response = await transferApi.getAllTransfers(params);

      if (response.status !== 200) {
        toast.error("خطا در واکشی اطلاعات");
        throw new Error(`HTTP ${response.status}: Failed to fetch transfers`);
      }

      return await response.json();
    } catch (error) {
      toast.error("خطا در واکشی اطلاعات");
      throw error; // Let SWR handle the error state
    }
  };

  const { data, error, isLoading, mutate } = useSWR(
    searchParams,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000, // Consider data stale after 5 minutes
      revalidateIfStale: true, // Auto-refetch stale data
      revalidateOnFocus: false, // Don't auto-refetch on window focus
      revalidateOnReconnect: true, // Auto-refetch on network reconnect
      shouldRetryOnError: false, // Don't retry failed requests automatically
    }
  );

  const transfers = data?.data || [];
  const pagination = {
    total: data?.total || 0,
    totalPages: data?.totalPages || 0,
  };
  const loading = isLoading;

  useEffect(() => {
    if (error) {
      toast.error("خطا در واکشی اطلاعات");
    }
  }, [error]);

  const handleSearch = useCallback((nationalCode: string, accountNumber: string) => {
    const newSearchParams: SearchParams = {
      nationalCode,
      accountNumber,
      page: 1,
      limit: 8,
      sortBy: "date",
      sortOrder: "DESC",
    };
    setSearchParams(newSearchParams);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    if (!searchParams) return;
    setSearchParams({ ...searchParams, page });
  }, [searchParams]);

  const handleSort = useCallback((sortBy: "date" | "score", sortOrder: "ASC" | "DESC") => {
    if (!searchParams) return;
    setSearchParams({ ...searchParams, sortBy: "date", sortOrder });
  }, [searchParams]);

  const handleReverseSuccess = useCallback(() => {
    mutate(); // Refresh the data after successful reverse transfer
  }, [mutate]);

  return (
    <div className="container mx-auto p-2">
      <SearchForm onSearch={handleSearch} loading={loading} />

      {searchParams && (
        <>
          <TransferTable
            transfers={transfers}
            loading={loading}
            onSort={handleSort}
            sortBy={searchParams?.sortBy || "date"}
            sortOrder={searchParams?.sortOrder || "DESC"}
            onReverseSuccess={handleReverseSuccess}
          />

          {transfers.length > 0 && (
            <Pagination
              currentPage={searchParams?.page || 1}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}
    </div>
  );
}