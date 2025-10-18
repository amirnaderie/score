"use client";

import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import { handleInput, validateIranianNationalCode } from "@/app/lib/utility";
import { useState } from "react";

interface SearchFormProps {
  onSearch: (nationalCode: string) => void;
  isLoading?: boolean;
}

export function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [nationalCode, setNationalCode] = useState("");
  const [nationalCodeError, setNationalCodeError] = useState("");

  const validateNationalCode = (value: string) => {
    if (!value) {
      setNationalCodeError("کد /شناسه ملی الزامی است");
    } else if (!validateIranianNationalCode(Number(value))) {
      setNationalCodeError("کد/شناسه ملی معتبر نیست");
    } else {
      setNationalCodeError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    validateNationalCode(nationalCode);

    if (!isLoading && nationalCode && !nationalCodeError) {
      onSearch(nationalCode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-2   mb-2">
      <div className="grid grid-cols-1 md:grid-cols-3 h-30 gap-4 rounded-lg shadow-md  items-center p-2">
        <div className="h-full">
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
            onInput={(e) => handleInput(e, 11)}
            onChange={(e) => {
              setNationalCode(e.target.value);
              validateNationalCode(e.target.value);
            }}
            className={`w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right ${
              nationalCodeError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="کد/شناسه ملی را وارد نمایید"
            disabled={isLoading}
            maxLength={11}
            autoFocus
            required
          />
          {nationalCodeError && (
            <p className="text-red-500 text-xs mt-1">{nationalCodeError}</p>
          )}
        </div>
        <div className="h-full">{/* Placeholder for grid layout */}</div>
        <div className="flex items-center h-full pb-2">
          <button
            type="submit"
            disabled={isLoading || !nationalCode || !!nationalCodeError}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
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