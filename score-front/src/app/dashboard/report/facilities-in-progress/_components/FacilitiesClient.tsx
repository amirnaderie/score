"use client";

import React, { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import {
    facilitiesInProgressApi,
    FacilitiesInProgressResponse,
    FacilitiesInProgressParams,
    FacilityInProgressResponseDto,
} from "../api/apis";
import { UseStore } from "@/store/useStore";
import { hasAccess } from "@/app/lib/utility";
import { SearchForm } from "./SearchForm";
import { FacilitiesTable } from "./FacilitiesTable";
import { Pagination } from "./Pagination";

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

export function FacilitiesClient({
    initialData,
    initialParams
}: {
    initialData: FacilitiesInProgressResponse | null;
    initialParams: FacilitiesInProgressParams | null;
}) {
    // Get user data and roles
    const user = UseStore((state) => state.userData);
    const hasAdminOrConfirmRole = hasAccess(user?.roles || [], [
        "score.admin",
        "score.confirm",
    ]);
    const hasBranchRole = hasAccess(user?.roles || [], ["score.branch"]);

    // Search state - initialize with passed params
    const [searchParams, setSearchParams] =
        useState<FacilitiesInProgressParams | null>(initialParams);

    const { data, error, isLoading } = useSWR(searchParams, fetcher, {
        dedupingInterval: 2 * 60 * 1000,
        revalidateIfStale: true,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        refreshInterval: 2 * 60 * 1000,
        fallbackData: initialData // Use SSR data as initial fallback
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
            {!hasBranchRole &&
                <SearchForm
                    onSearch={handleSearch}
                    isLoading={isLoading}
                />}

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