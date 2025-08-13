"use client";

import React, { useState, useEffect } from "react";
import SearchForm from "./_components/serachForm";
import TransferTable from "./_components/transferTable";
import Pagination from "./_components/pagination";
import { transferApi, TransferData } from "@/app/api/score/route";
import toast from "react-hot-toast";

export default function TransferDashboard() {
  const [transfers, setTransfers] = useState<TransferData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({
    nationalCode: "",
    accountNumber: "",
    page: 1,
    limit: 10,
    sortBy: "date" as const,
    sortOrder: "DESC" as const,
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 0,
  });

  const fetchTransfers = async () => {
    if (!searchParams.nationalCode || !searchParams.accountNumber) return;

    setLoading(true);
    setError(null);

    try {
      const retVal = await transferApi.getAllTransfers(searchParams);
      if (retVal.status !== 200) {
        toast.error("خطا در واکشی اطلاعات");
      } else {
        const resData = await retVal.json();
        setTransfers(resData.data);
        setPagination({
          total: resData.total,
          totalPages: resData.totalPages,
        });
      }
    } catch (err) {
      toast.error("خطا در واکشی اطلاعات");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, [searchParams]);

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
    setSearchParams((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  return (
    <div className="container mx-auto p-4">

      <SearchForm onSearch={handleSearch} />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
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
