"use client";

import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { convertToGregorian } from "@/utils/dateConverter";
import { logsApi, LogEntry } from "./api/apis";
import { SearchForm } from "./_components/SearchForm";
import { LogsTable } from "./_components/LogsTable";
import { Pagination } from "./_components/Pagination";

interface SearchParams {
  from: string;
  to: string;
  page: number;
  limit: number;
  sortBy: "method" | "createdAt";
  sortOrder: "ASC" | "DESC";
  searchText: string;
}

// SWR fetcher function
const fetcher = async (params: SearchParams) => {
  const { from, to, page, limit, sortBy, sortOrder, searchText } = params;
  let response;
  if (page === 1) {
    response = await logsApi.getLogs({
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
      methods: [
        "transferScore",
        "createScore",
        "updateScore",
        "reverseTransfer",
      ],
      searchText,
    });
  } else {
    response = await logsApi.getOtherLogs({
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
      methods: [
        "transferScore",
        "createScore",
        "updateScore",
        "reverseTransfer",
      ],
      searchText,
    });
  }
  return response;
};

export default function LogReportPage() {
  // Form inputs
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchText, setSearchText] = useState("");

  // Search state - only set when user clicks search
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const itemsPerPage = 8;

  const { data, error, isLoading } = useSWR(
    searchParams ? searchParams : null,
    fetcher,
    {
      dedupingInterval: 2 * 60 * 1000,
      revalidateIfStale: true,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 2 * 60 * 1000,
    }
  );

  // Handle SWR errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching logs:", error);
      toast.error("خطا در دریافت اطلاعات لاگ");
    }
  }, [error]);

  // Convert Gregorian date to Persian (Shamsi) date
  const convertToPersianDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR").replace(/\//g, "/");
  };

  // Handle search - trigger SWR revalidation
  const handleSearch = useCallback((fromDate: string, toDate: string, searchText: string) => {
    if (!fromDate || !toDate) {
      toast.error("لطفاً بازه زمانی را مشخص کنید");
      return;
    }

    // Create new search params to trigger SWR fetch
    const newSearchParams: SearchParams = {
      from: convertToGregorian(fromDate) || "",
      to: convertToGregorian(toDate) || "",
      page: 1,
      limit: itemsPerPage,
      sortBy: "createdAt",
      sortOrder: "DESC",
      searchText: searchText,
    };

    setSearchParams(newSearchParams);
    setTotalPages(0);
    setTotal(0);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      if (!searchParams || page < 1 || page > (data?.totalPages || totalPages))
        return;

      if (page === 2 && data?.totalPages) {
        setTotalPages(data.totalPages);
        setTotal(data.total || 0);
      }

      setSearchParams({
        ...searchParams,
        page,
      });
    },
    [searchParams, data?.totalPages, totalPages, data?.total]
  );

  const handleSort = useCallback(
    (column: "method" | "createdAt") => {
      if (!searchParams) return;

      const newSortOrder =
        searchParams.sortBy === column
          ? searchParams.sortOrder === "ASC"
            ? "DESC"
            : "ASC"
          : "ASC";

      setSearchParams({
        ...searchParams,
        sortBy: column,
        sortOrder: newSortOrder,
        page: 1,
      });
    },
    [searchParams]
  );

  const logs: LogEntry[] = data?.data || [];
  const pagination = {
    total: data?.total || total || 0,
    totalPages: data?.totalPages || totalPages || 0,
    currentPage: searchParams?.page || 1,
  };

  return (
    <div className="container mx-auto p-2">
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading}
        initialFromDate={fromDate}
        initialToDate={toDate}
        initialSearchText={searchText}
      />

      {searchParams && (
        <>
          <LogsTable
            logs={logs}
            isLoading={isLoading}
            onSort={handleSort}
            sortBy={searchParams.sortBy}
            sortOrder={searchParams.sortOrder}
            convertToPersianDate={convertToPersianDate}
          />

          {logs.length > 0 && (pagination.totalPages > 1 || totalPages > 1) && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages || totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-red-50 rounded-lg shadow-md p-8 border border-red-200">
          <div className="text-center text-red-600">
            <p>خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.</p>
          </div>
        </div>
      )}
    </div>
  );
}