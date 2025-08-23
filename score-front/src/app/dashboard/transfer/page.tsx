"use client";

import React, { useState, useEffect } from "react";
import SearchForm from "./_components/serachForm";
import TransferTable from "./_components/transferTable";
import Pagination from "./_components/pagination";
import { transferApi, TransferData } from "@/app/dashboard/transfer/api/apis";
import toast from "react-hot-toast";
import useSWR from "swr";

export default function TransferDashboard() {
  const [searchParams, setSearchParams] = useState({
    nationalCode: "",
    accountNumber: "",
    page: 1,
    limit: 8,
    sortBy: "date" as const,
    sortOrder: "DESC" as const,
  });

  const fetcher = async (url: string) => {
    if (!searchParams.nationalCode || !searchParams.accountNumber) return null;

    const retVal = await transferApi.getAllTransfers(searchParams);
    if (retVal.status !== 200) {
      toast.error("خطا در واکشی اطلاعات");
      // throw new Error("Failed to fetch data");
    } else {
      const resData = await retVal.json();
      return resData;
    }
  };

  const { data, error, isLoading } = useSWR(
    `/api/transfers?nationalCode=${searchParams.nationalCode}&accountNumber=${searchParams.accountNumber}&page=${searchParams.page}&limit=${searchParams.limit}&sortBy=${searchParams.sortBy}&sortOrder=${searchParams.sortOrder}`,
    fetcher,
    {
      revalidateIfStale: false,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
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

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error.message}
        </div>
      )}

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
