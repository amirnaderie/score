"use client";

import React, { useState, useEffect } from "react";
import SearchForm from "./_components/serachForm";
import TransferTable from "./_components/transferTable";
import Pagination from "./_components/pagination";
import toast from "react-hot-toast";
import useSWR from "swr";
import { transferApi } from "./api/apis";

export default function TransferDashboard() {
  const [searchParams, setSearchParams] = useState({
    nationalCode: "",
    accountNumber: "",
    page: 1,
    limit: 8,
    sortBy: "date" as const,
    sortOrder: "DESC" as const,
  });

  const fetcher = async () => {
    if (!searchParams.nationalCode || !searchParams.accountNumber) return null;

    try {
      const response = await transferApi.getAllTransfers(searchParams);

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

  // Create a more manageable key
  const transfersKey =
    !searchParams.nationalCode || !searchParams.accountNumber
      ? null
      : ["transfers", searchParams];

  const { data, error, isLoading } = useSWR(transfersKey, fetcher, {
    dedupingInterval: 5 * 60 * 1000, // Consider data stale after 5 minutes
    revalidateIfStale: true, // Auto-refetch stale data
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 10 * 60 * 1000, // Optional: Auto-refresh every 10 minutes
  });

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

  const handleSearch = (nationalCode: string, accountNumber: string) => {
    setSearchParams((prev) => ({
      ...prev,
      nationalCode,
      accountNumber,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams((prev) => ({ ...prev, page }));
  };

  const handleSort = (sortBy: "date" | "score", sortOrder: "ASC" | "DESC") => {
    setSearchParams((prev: any) => ({ ...prev, sortBy, sortOrder }));
  };

  return (
    <div className="container mx-auto p-2">
      <SearchForm onSearch={handleSearch} loading={loading} />

      {/* {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>     
      )} */}

      <TransferTable
        transfers={transfers}
        loading={loading}
        onSort={handleSort}
        sortBy={searchParams.sortBy}
        sortOrder={searchParams.sortOrder}
      />

      <Pagination
        currentPage={searchParams.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
