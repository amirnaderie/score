import React from "react";
import { redirect } from "next/navigation";
import { taahodApi, TaahodResponse, AuthenticationError } from "../api/apis";
import { formatNumber } from "@/app/lib/utility";

// Define the interface for the taahod data item
interface TaahodItem {
  sumTaahod: number | string;
  lastUpdate: string;
  accountTypeName: string;
}

// Server-side data fetching
async function getTaahodData(): Promise<TaahodItem[] | null> {
  try {
    const response = await taahodApi.getTaahod();
    // Assuming the response data is now an array
    return response.data as unknown as TaahodItem[];
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
  const formatTaahodValue = (value: number | string) => {
    return formatNumber(value.toString());
  };

  // Show no results message if data is null or empty
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p>نتیجه‌ای یافت نشد.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          {/* Account Type Header */}
          <h3 className=" font-bold text-gray-800 dark:text-white mb-6 text-right">
            {item.accountTypeName}
          </h3>
          
          {/* Results Section */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2 flex gap-x-3">
              <div className="text-lg text-gray-700 dark:text-gray-300">
                مجموع تعهد:
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {formatTaahodValue(item.sumTaahod)}
              </div>
            </div>
            <div className="space-y-2 flex gap-x-3">
              <div className="text-lg text-gray-700 dark:text-gray-300">
                تاریخ آخرین بروزرسانی:
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {item.lastUpdate}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}