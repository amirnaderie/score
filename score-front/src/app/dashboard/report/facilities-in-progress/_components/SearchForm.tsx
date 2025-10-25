"use client";

import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { handleInput } from "@/app/lib/utility";
import { useState } from "react";

interface SearchFormProps {
  onSearch: (branchCode: string) => void;
  isLoading?: boolean;

}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [branchCode, setBranchCode] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();



    onSearch(branchCode);
  };


  return (
    <form onSubmit={handleSubmit} className="bg-white p-2 mb-2">
      <div className="grid grid-cols-1 md:grid-cols-3 h-30 gap-4 rounded-lg shadow-md items-center p-2">
        <>
          <div className="h-full">
            <label
              htmlFor="branchCode"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              شاخص شعبه
            </label>
            <input
              type="number"
              id="branchCode"
              value={branchCode}
              onInput={(e) => handleInput(e, 15)}
              onChange={(e) => setBranchCode(e.target.value)}
              placeholder="شاخص شعبه را وارد نمایید"
              className="w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 placeholder:text-sm placeholder:text-right"
              maxLength={15}
              autoFocus
            />
          </div>
          <div className="h-full">{/* Placeholder for grid layout */}</div>
          <div className="flex items-center h-full pb-2">
            <button
              type="submit"
              disabled={isLoading || !branchCode.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <SpinnerSVG className="h-6 w-4 animate-spin text-white" />
              ) : (
                "جستجو"
              )}
            </button>
          </div>
        </>

      </div>
    </form>
  );
}