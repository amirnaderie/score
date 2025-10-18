"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-between items-center mt-4">
      <div className="text-sm text-gray-700 dark:text-gray-300">
        صفحه {currentPage} از {totalPages}
      </div>
      <div className="flex space-x-2 rtl:space-x-reverse w-36 gap-x-5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          قبلی
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 border cursor-pointer rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
        >
          بعدی
        </button>
      </div>
    </div>
  );
}
