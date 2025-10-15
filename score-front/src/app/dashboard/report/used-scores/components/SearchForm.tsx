"use client";

import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { handleInput } from "@/app/lib/utility";
import { useState } from "react";

interface SearchFormProps {
  onSearch: (nationalCode: string) => void;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [nationalCode, setNationalCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalCode.trim()) {
      onSearch(nationalCode.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label
            htmlFor="nationalCode"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
           کد/شناسه ملی
          </label>
          <input
            type="number"
            id="nationalCode"
            value={nationalCode}
            onChange={(e) => {
              handleInput(e, 11);
              setNationalCode(e.target.value);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 placeholder:text-sm"
            placeholder="کد/شناسه ملی را وارد نمایید"
            disabled={isLoading}
            maxLength={11}
          />
        </div>
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={isLoading || !nationalCode.trim()}
            className=" w-36 flex justify-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             {isLoading ? (
                <SpinnerSVG className="h-6 w-4 animate-spin text-white" />
              ) : (
                "جستجو"
              )}
          </button>
        </div>
      </div>
    </form>
  );
}
