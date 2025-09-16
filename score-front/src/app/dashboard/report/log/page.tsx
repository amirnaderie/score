"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { convertToGregorian } from "@/utils/dateConverter";
import TransferTableSkeleton from "../transfer/_components/transferTableSkeleton";
import { logsApi } from "./api/apis";

interface LogEntry {
  id: number;
  method: string;
  message: string;
  createdAt: string;
}

// interface LogsResponse {
//   data: LogEntry[];
//   total: number;
//   page: number;
//   limit: number;
// }

// SWR fetcher function
const fetcher = async (key: string) => {
  const { from, to, page, limit, sortBy, sortOrder,searchText } = JSON.parse(key);
  let response
  if (page === 1)
    response = await logsApi.getLogs({
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
      methods: ["transferScore", "createScore", "updateScore"],
      searchText
    });
  else
    response = await logsApi.getOtherLogs({
      from,
      to,
      page,
      limit,
      sortBy,
      sortOrder,
      methods: ["transferScore", "createScore", "updateScore"],
      searchText
    });
  return response;
};

export default function LogReportPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<"method" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("DESC");
  const [dateFromError, setDateFromError] = useState("");
  const [dateToError, setDateToError] = useState("");

  const itemsPerPage = 8;

  const shouldFetch = searchFromDate && searchToDate && !dateFromError && !dateToError;
  const swrKey = shouldFetch
    ? JSON.stringify({
      from: convertToGregorian(searchFromDate) || "",
      to: convertToGregorian(searchToDate) || "",
      page: currentPage,
      limit: itemsPerPage,
      sortBy,
      sortOrder,
      searchText: searchKeyword
    })
    : null;

  const { data, error, isLoading } = useSWR(swrKey, fetcher, {
    dedupingInterval: 2 * 60 * 1000,
    revalidateIfStale: true, // Auto-refetch stale data
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 2 * 60 * 1000,
  });


  // Handle SWR errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching logs:", error);
      toast.error("خطا در دریافت اطلاعات لاگ");
    }
  }, [error]);

  // Set default date range on mount
  // useEffect(() => {
  //   const today = new Date();
  //   const yesterday = new Date(today);
  //   yesterday.setDate(today.getDate() - 1);

  //   const formatDate = (date: Date) => {
  //     return date.toLocaleDateString("fa-IR", {
  //       year: "numeric",
  //       month: "2-digit",
  //       day: "2-digit",
  //     });
  //   };

  //   setFromDate(formatDate(yesterday));
  //   setToDate(formatDate(today));
  // }, []);

  // Convert Gregorian date to Persian (Shamsi) date
  const convertToPersianDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("fa-IR").replace(/\//g, "/");
  };

  // Validate date range (max 7 days difference)
  const validateDateRange = () => {
    if (!fromDate || !toDate) return true;

    const from = new Date(convertToGregorian(fromDate) || "");
    const to = new Date(convertToGregorian(toDate) || "");
    setDateToError("");
    setDateFromError("");
    if (isNaN(from.getTime())) {
      setDateFromError("فرمت تاریخ نامعتبر است");
      return false;
    }
    if (isNaN(to.getTime())) {
      setDateToError("فرمت تاریخ نامعتبر است");
      return false;
    }

    const diffTime = Math.abs(to.getTime() - from.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      setDateToError("بازه زمانی نباید بیشتر از 7 روز باشد");
      return false;
    }

    return true;
  };

  // Format date input as Persian date (YYYY/MM/DD)
  const formatDateInput = (value: string) => {
    const cleaned = value.replace(/[^\d]/g, "");
    let formatted = "";

    if (cleaned.length > 0) {
      if (cleaned.length <= 4) {
        formatted = cleaned;
      } else if (cleaned.length <= 6) {
        formatted = cleaned.slice(0, 4) + "/" + cleaned.slice(4);
      } else {
        formatted =
          cleaned.slice(0, 4) +
          "/" +
          cleaned.slice(4, 6) +
          "/" +
          cleaned.slice(6, 8);
      }
    }

    return formatted;
  };

  // Handle search - trigger SWR revalidation
  const handleSearch = () => {
    if (!fromDate || !toDate) {
      toast.error("لطفاً بازه زمانی را مشخص کنید");
      return;
    }

    if (!validateDateRange()) {
      return;
    }

    // Set search dates and keyword to trigger SWR fetch
    setSearchFromDate(fromDate);
    setSearchToDate(toDate);
    setSearchKeyword(searchText);
    setTotalPages(0);
    setTotal(0);
    setCurrentPage(1);
  };


  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (data?.totalPages || totalPages)) {
      if (page === 2 && data?.totalPages) {
        setTotalPages(data.totalPages)
        setTotal(data.total || 0)
      }
      setCurrentPage(page);
    }
  };


  const handleSort = (column: "method" | "createdAt") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(column);
      setSortOrder("ASC");
    }
    setCurrentPage(1);
  };

  return (
    <div className="container mx-auto p-2">
      <div className="bg-white p-2 mb-2 flex flex-col gap-y-3">
        {/* Date Filter Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-30 items-center rounded-lg shadow-md p-2">
          <div className="h-full">
            <label
              htmlFor="fromDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              از تاریخ
            </label>
            <input
              type="text"
              id="fromDate"
              autoFocus
              className="w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right"
              value={fromDate}
              onChange={(e) => setFromDate(formatDateInput(e.target.value))}
              maxLength={10}
              placeholder="مثال: 14030615"
            />
            {dateFromError && (
              <p className="text-red-500 text-sm mt-2">{dateFromError}</p>
            )}
          </div>

          <div className="h-full">
            <label
              htmlFor="toDate"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              تا تاریخ
            </label>
            <input
              type="text"
              id="toDate"
              className="w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right"
              value={toDate}
              onChange={(e) => setToDate(formatDateInput(e.target.value))}
              maxLength={10}
              placeholder="مثال: 14030622"
            />
            {dateToError && (
              <p className="text-red-500 text-sm mt-2">{dateToError}</p>
            )}
          </div>
          <div className="h-full">
            <label
              htmlFor="searchText"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              کلید واژه
            </label>
            <input
              type="text"
              id="searchText"
              className="w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              maxLength={40}
              placeholder=""
            />
          </div>
          <div className="flex items-center h-full pb-2">
            <button
              onClick={handleSearch}
              disabled={isLoading || !fromDate || !toDate || dateFromError !== "" || dateToError !== ""}
              className="w-full flex justify-center bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <SpinnerSVG className="h-4 w-4 animate-spin text-white" />
              ) : (
                "جستجو"
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {isLoading ? (
          <TransferTableSkeleton />
        ) : (
          data?.data &&
          data.data.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-xs text-gray-900 dark:text-white">
                  نتایج ({data.total || total} رکورد)
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("method")}
                      >
                        <div className="flex items-center justify-center">
                          روش
                          {sortBy === "method" && (
                            <span className="mr-1">
                              {sortOrder === "ASC" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 w-28  text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className="flex items-center justify-center">
                          تاریخ ایجاد
                          {sortBy === "createdAt" && (
                            <span className="mr-1">
                              {sortOrder === "ASC" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs flex justify-center font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                      >
                        پیام
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white text-xs divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {data?.data?.map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <td className="px-3 py-3 whitespace-nowrap  text-gray-900 dark:text-white">
                          {log.method === "createScore" && "ایجاد امتیاز"}
                          {log.method === "updateScore" && "بروزرسانی امتیاز"}
                          {log.method === "transferScore" && "انتقال امتیاز"}
                        </td>
                        <td className="px-3 w-28 flex justify-center py-3 whitespace-nowrap  text-gray-900 dark:text-white">
                          {convertToPersianDate(log.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-left  text-gray-900 dark:text-white">
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {((data?.totalPages && data.totalPages > 1) || (totalPages > 1)) && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    صفحه {currentPage} از {data.totalPages || totalPages}
                  </div>
                  <div className="flex space-x-2 rtl:space-x-reverse w-36 gap-x-5">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      قبلی
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === data.totalPages || currentPage === totalPages}
                      className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      بعدی
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {data?.data?.length === 0 && !isLoading && searchFromDate && searchToDate && (
          <div className="text-center py-8 text-gray-500">
            لیست شما خالی است.
          </div>
        )}
      </div>
    </div>
  );
}
