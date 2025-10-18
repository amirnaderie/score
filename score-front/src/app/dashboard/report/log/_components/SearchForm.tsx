"use client";

import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { useState } from "react";

interface SearchFormProps {
  onSearch: (fromDate: string, toDate: string, searchText: string) => void;
  isLoading?: boolean;
  initialFromDate?: string;
  initialToDate?: string;
  initialSearchText?: string;
}

export function SearchForm({ 
  onSearch, 
  isLoading,
  initialFromDate = "",
  initialToDate = "",
  initialSearchText = ""
}: SearchFormProps) {
  const [fromDate, setFromDate] = useState(initialFromDate);
  const [toDate, setToDate] = useState(initialToDate);
  const [searchText, setSearchText] = useState(initialSearchText);
  const [dateFromError, setDateFromError] = useState("");
  const [dateToError, setDateToError] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromDate || !toDate) {
      // Handle validation errors
      return;
    }

    onSearch(fromDate, toDate, searchText);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-30 items-center rounded-lg shadow-md p-2">
        <div className="h-full">
          <label
            htmlFor="fromDate"
            className="block text-sm font-medium text-gray-700 mb-2"
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
            className="block text-sm font-medium text-gray-700 mb-2"
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
            className="block text-sm font-medium text-gray-700 mb-2"
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
            placeholder=" ... شماره حساب، کد ملی  یا "
          />
        </div>
        <div className="flex items-center h-full pb-2">
          <button
            type="submit"
            disabled={
              isLoading ||
              !fromDate ||
              !toDate
            }
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
    </form>
  );
}