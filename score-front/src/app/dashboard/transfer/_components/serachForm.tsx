'use client';

import React, { useState } from 'react';

interface SearchFormProps {
  onSearch: (nationalCode: string, accountNumber: string) => void;
}

export default function SearchForm({ onSearch }: SearchFormProps) {
  const [nationalCode, setNationalCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nationalCode && accountNumber) {
      onSearch(nationalCode, accountNumber);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            کد ملی
          </label>
          <input
            type="text"
            value={nationalCode}
            onChange={(e) => setNationalCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-sm"

            placeholder="کد ملی را وارد نمایید"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            شماره حساب
          </label>
          <input
            type="text"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-sm"
            placeholder="شماره حساب را وارد نمایید"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer"
          >
            جستجو
          </button>
        </div>
      </div>
    </form>
  );
}