"use client";

import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { facilitiesInProgressApi, FacilitiesInProgressResponse, FacilitiesInProgressParams } from "./api/apis";
import { formatNumber, hasAccess, handleInput } from "@/app/lib/utility";
import { UseStore } from "@/store/useStore";

// SWR fetcher function
const fetcher = async (params: FacilitiesInProgressParams) => {
  if (!params) return null;

  try {
    const response = await facilitiesInProgressApi.getFacilitiesInProgress(params);

    if (response.status !== 200) {
      toast.error("خطا در واکشی اطلاعات");
      throw new Error(`HTTP ${response.status}: Failed to fetch facilities in progress`);
    }

    return await response.json() as FacilitiesInProgressResponse;
  } catch (error) {
    toast.error("خطا در واکشی اطلاعات");
    throw error;
  }
};

export default function FacilitiesInProgressPage() {
  // Get user data and roles
  const user = UseStore((state) => state.userData);
  const hasAdminOrConfirmRole = hasAccess(user?.roles || [], ["score.admin", "score.confirm"]);
  
  // Form state
  const [branchCode, setBranchCode] = useState<string>("");
  
  // Search state - only set when user clicks search
  const [searchParams, setSearchParams] = useState<FacilitiesInProgressParams | null>(null);

  const { data, error, isLoading } = useSWR(
    searchParams,
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
  React.useEffect(() => {
    if (error) {
      console.error("Error fetching facilities in progress:", error);
      toast.error("خطا در دریافت اطلاعات تسهیلات در حال اقدام");
    }
  }, [error]);

  // Handle search - trigger SWR revalidation
  const handleSearch = useCallback(() => {
    // Validation for admin/confirm roles: branchCode is required
    if (hasAdminOrConfirmRole && !branchCode.trim()) {
      toast.error("لطفاً کد شعبه را وارد کنید");
      return;
    }
    
    const newSearchParams: FacilitiesInProgressParams = {
      page: 1,
      limit: 7,
    };
    
    // Add branchCode if user has admin/confirm role and provided it
    if (hasAdminOrConfirmRole && branchCode.trim()) {
      newSearchParams.branchCode = parseInt(branchCode.trim());
    }
    // For score.branch role, no branchCode is needed (backend uses user's own branch)
    
    setSearchParams(newSearchParams);
  }, [hasAdminOrConfirmRole, branchCode]);

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    if (!searchParams) return;
    const updatedParams = { ...searchParams, page };
    setSearchParams(updatedParams);
  }, [searchParams]);

  const facilities = data?.data?.data || [];
  const pagination = {
    total: data?.data?.total || 0,
    totalPages: data?.data?.totalPages || 0,
    currentPage: data?.data?.page || 1,
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {/* Branch Code Input for Admin/Confirm Roles */}
        {hasAdminOrConfirmRole ? (
          <div className="flex gap-4 items-end">
            <div className="w-1/5">
              <label htmlFor="branchCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                شاخص شعبه 
              </label>
              <input
                type="number"
                id="branchCode"
                value={branchCode}
                onChange={(e) => {
                  handleInput(e, 15);
                  setBranchCode(e.target.value);
                }}
                placeholder="شاخص شعبه را وارد کنید"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                maxLength={15}
              />
            </div>
            <div className="w-1/7">
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                {isLoading ? (
                  <>
                    <SpinnerSVG className="h-5 w-5 animate-spin text-white" />
                  </>
                ) : (
                  "جستجو"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="bg-blue-500 text-white py-3 px-8 min-w-40 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
            >
              {isLoading ? (
                <>
                  <SpinnerSVG className="h-5 w-5 animate-spin text-white" />
                </>
              ) : (
                "جستجو"
              )}
            </button>
          </div>
        )}
      </div>

      {/* Results Section */}
      {data?.data && facilities.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              نتایج جستجو ({pagination.total} رکورد)
            </h2>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    کد ملی
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    شماره حساب
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    امتیاز استفاده شده
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    تاریخ ایجاد
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    شناسه ارجاع
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {facilities.map((facility, index) => (
                  <tr
                    key={facility.referenceCode}
                    className={index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50 dark:bg-gray-700"}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                      {facility.nationalCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                      {facility.accountNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                      {formatNumber(facility.usedScore.toString())}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap ltr text-sm text-gray-900 dark:text-white text-center">
                      {facility.createdAtShamsi}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-center">
                      {facility.referenceCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                صفحه {pagination.currentPage} از {pagination.totalPages}
              </div>
              <div className="flex space-x-2 rtl:space-x-reverse w-36 gap-x-5">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  قبلی
                </button>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                >
                  بعدی
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Results Message */}
      {searchParams && !isLoading && (!data?.data || facilities.length === 0) && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>هیچ تسهیلات در حال اقدامی برای شعبه شما یافت نشد.</p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && !isLoading && (
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-md p-8 border border-red-200 dark:border-red-800">
          <div className="text-center text-red-600 dark:text-red-400">
            <p>خطا در دریافت اطلاعات. لطفاً دوباره تلاش کنید.</p>
          </div>
        </div>
      )}
    </div>
  );
}