import React from "react";
import { redirect } from "next/navigation";
import { taahodApi, TaahodResponse, AuthenticationError } from "../api/apis";
import { formatNumber } from "@/app/lib/utility";

// Server-side data fetching
async function getTaahodData(): Promise<TaahodResponse | null> {
  try {
    const data = await taahodApi.getTaahod();
    return data;
  } catch (error) {
    console.error("Error fetching taahod:", error);
    // If it's an authentication error, redirect to login
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    return null;
  }
}

export async function TaahodContent() {
  const data = await getTaahodData();

  // Format the taahod value with thousands separator
  const formatTaahodValue = (value: number) => {
    return formatNumber(value.toString());
  };

  // Show no results message if data is null
  if (!data) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>نتیجه‌ای یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Results Section */}
      {data.data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 grid grid-cols-2">
          <div className="space-y-2 flex gap-x-3">
            <div className="text-lg text-gray-700 dark:text-gray-300">
              مجموع تعهد:
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {formatTaahodValue(data.data.sumTaahod)}
            </div>
          </div>
          <div className="space-y-2 flex gap-x-3">
            <div className="text-lg text-gray-700 dark:text-gray-300">
              تاریخ آخرین بروزرسانی:
            </div>
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {data.data.lastUpdate}
            </div>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {!data.data && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>نتیجه‌ای یافت نشد.</p>
          </div>
        </div>
      )}
    </>
  );
}