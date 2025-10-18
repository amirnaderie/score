"use client";

import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import {
  facilitiesInProgressApi,
  FacilitiesInProgressResponse,
  FacilitiesInProgressParams,
  FacilityInProgressResponseDto,
} from "./api/apis";
import { UseStore } from "@/store/useStore";
import { hasAccess } from "@/app/lib/utility";
import { SearchForm } from "./_components/SearchForm";
import { FacilitiesTable } from "./_components/FacilitiesTable";
import { Pagination } from "./_components/Pagination";

// SWR fetcher function
const fetcher = async (params: FacilitiesInProgressParams) => {
  if (!params) return null;

  try {
    const response = await facilitiesInProgressApi.getFacilitiesInProgress(
      params
    );

    if (response.status !== 200) {
      toast.error("خطا در واکشی اطلاعات");
      throw new Error(
        `HTTP ${response.status}: Failed to fetch facilities in progress`
      );
    }

    return (await response.json()) as FacilitiesInProgressResponse;
  } catch (error) {
    toast.error("خطا در واکشی اطلاعات");
    throw error;
  }
};

export default function FacilitiesInProgressPage() {
  // Get user data and roles
  const user = UseStore((state) => state.userData);
  const hasAdminOrConfirmRole = hasAccess(user?.roles || [], [
    "score.admin",
    "score.confirm",
  ]);

  // Search state - only set when user clicks search
  const [searchParams, setSearchParams] =
    useState<FacilitiesInProgressParams | null>(null);

  const { data, error, isLoading } = useSWR(searchParams, fetcher, {
    dedupingInterval: 2 * 60 * 1000,
    revalidateIfStale: true,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    refreshInterval: 2 * 60 * 1000,
  });

  // Handle SWR errors
  useEffect(() => {
    if (error) {
      console.error("Error fetching facilities in progress:", error);
      toast.error("خطا در واکشی اطلاعات");
    }
  }, [error]);

  // Handle search - trigger SWR revalidation
  const handleSearch = useCallback((branchCode: string) => {
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
  }, [hasAdminOrConfirmRole]);

  // Handle pagination
  const handlePageChange = useCallback(
    (page: number) => {
      if (!searchParams) return;
      const updatedParams = { ...searchParams, page };
      setSearchParams(updatedParams);
    },
    [searchParams]
  );

  const facilities: FacilityInProgressResponseDto[] = data?.data?.data || [];
  const pagination = {
    total: data?.data?.total || 0,
    totalPages: data?.data?.totalPages || 0,
    currentPage: data?.data?.page || 1,
  };

  return (
    <div className="container mx-auto p-2">
      <SearchForm 
        onSearch={handleSearch} 
        isLoading={isLoading} 
        hasAdminOrConfirmRole={hasAdminOrConfirmRole} 
      />

      {searchParams && (
        <>
          <FacilitiesTable 
            data={facilities} 
            isLoading={isLoading} 
          />

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
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