"use client";

import { handleInput, validateIranianNationalCode } from "@/app/lib/utility";
import React, { useState } from "react";

interface SearchFormProps {
  onSearch: (nationalCode: string, accountNumber: string) => void;
  loading: boolean;
}

export default function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [nationalCode, setNationalCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [nationalCodeError, setNationalCodeError] = useState("");
  const [accountNumberError, setAccountNumberError] = useState("");

  const validateNationalCode = (value: string) => {
    if (!value) {
      setNationalCodeError("کد ملی الزامی است");
    } else if (!validateIranianNationalCode(Number(value))) {
      setNationalCodeError("کد ملی معتبر نیست");
    } else if (!/^\d{10}$/.test(value)) {
      setNationalCodeError("کد ملی فقط باید شامل اعداد باشد");
    } else {
      setNationalCodeError("");
    }
  };

  const validateAccountNumber = (value: string) => {
    if (!value) {
      setAccountNumberError("شماره حساب الزامی است");
    } else if (value.length < 4 || value.length > 14) {
      setAccountNumberError("شماره حساب معتبر نیست");
    } else if (!/^\d+$/.test(value)) {
      setAccountNumberError("شماره حساب فقط باید شامل اعداد باشد");
    } else {
      setAccountNumberError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    validateNationalCode(nationalCode);
    validateAccountNumber(accountNumber);

    if (
      !loading &&
      nationalCode &&
      accountNumber &&
      !nationalCodeError &&
      !accountNumberError
    ) {
      onSearch(nationalCode, accountNumber);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-lg shadow-md mb-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            کد ملی
          </label>
          <input
            type="number"
            value={nationalCode}
            onInput={(e) => handleInput(e, 11)}
            onChange={(e) => {
              setNationalCode(e.target.value);
              validateNationalCode(e.target.value);
            }}
            className={`w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm ${
              nationalCodeError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="کد ملی را وارد نمایید"
            maxLength={11}
            required
          />
          {nationalCodeError && (
            <p className="text-red-500 text-xs mt-1">{nationalCodeError}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شماره حساب
          </label>
          <input
            type="number"
            value={accountNumber}
            onInput={(e) => handleInput(e, 14)}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              validateAccountNumber(e.target.value);
            }}
            className={`w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm ${
              accountNumberError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            placeholder="شماره حساب را وارد نمایید"
            maxLength={14}
            required
          />
          {accountNumberError && (
            <p className="text-red-500 text-xs mt-1">{accountNumberError}</p>
          )}
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={
              loading ||
              !nationalCode ||
              !accountNumber ||
              !!nationalCodeError ||
              !!accountNumberError
            }
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            جستجو
          </button>
        </div>
      </div>
    </form>
  );
}
