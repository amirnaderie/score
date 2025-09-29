"use client";

import React, { useState, useCallback } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { taahodApi, TaahodResponse } from "./api/apis";
import { formatNumber } from "@/app/lib/utility";

// SWR fetcher function
const fetcher = async (key: string) => {
    if (key !== 'taahod') return null;

    try {
        const response = await taahodApi.getTaahod();

        if (response.status !== 200) {
            toast.error("خطا در واکشی اطلاعات");
            throw new Error(`HTTP ${response.status}: Failed to fetch taahod`);
        }

        return await response.json() as TaahodResponse;
    } catch (error) {
        toast.error("خطا در واکشی اطلاعات");
        throw error;
    }
};

export default function TaahodReportPage() {
    // Search state - only set when user clicks search
    const [shouldFetch, setShouldFetch] = useState(false);

    const { data, error, isLoading } = useSWR(
        shouldFetch ? 'taahod' : null,
        fetcher,
        {
            dedupingInterval: 20 * 60 * 1000,
            revalidateIfStale: true,
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            refreshInterval: 20 * 60 * 1000,
        }
    );

    // Handle SWR errors
    React.useEffect(() => {
        if (error) {
            console.error("Error fetching taahod:", error);
            toast.error("خطا در دریافت اطلاعات تعهد");
        }
    }, [error]);

    // Handle search - trigger SWR revalidation
    const handleSearch = useCallback(() => {
        setShouldFetch(true);
    }, []);

    // Format the taahod value with thousands separator
    const formatTaahodValue = (value: number) => {
        return formatNumber(value.toString());
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Search Section */}
            <div className="bg-white dark:bg-gray-800  rounded-lg shadow-md p-6">
                <div className="flex justify-center">
                    <button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="bg-blue-500 text-white py-3 px-8 min-w-40 text-center rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2  justify-center"
                    >
                        {isLoading ? (
                            <>
                                <SpinnerSVG className="h-5 w-5 animate-spin text-white" />

                            </>
                        ) : (
                            "استعلام"
                        )}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {data?.data && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center space-y-4">

                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                            <div className="space-y-2">
                                <p className="text-lg text-gray-700 dark:text-gray-300">
                                    مجموع تعهد:
                                </p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                    {formatTaahodValue(data.data.sumTaahod)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Results Message */}
            {shouldFetch && !isLoading && !data?.data && !error && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        <p>نتیجه‌ای یافت نشد.</p>
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