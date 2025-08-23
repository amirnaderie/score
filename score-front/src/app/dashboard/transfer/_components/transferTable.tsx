"use client";

import { TransferData } from "@/app/dashboard/transfer/api/apis";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import TransferTableSkeleton from "./transferTableSkeleton";
import React from "react";

interface TransferTableProps {
  transfers: TransferData[];
  loading: boolean;
  onSort: (sortBy: "date" | "score", sortOrder: "ASC" | "DESC") => void;
  sortBy: string;
  sortOrder: string;
}

export default function TransferTable({
  transfers,
  loading,
  onSort,
  sortBy,
  sortOrder,
}: TransferTableProps) {
  const handleSort = (field: "date" | "score") => {
    const newOrder = sortBy === field && sortOrder === "DESC" ? "ASC" : "DESC";
    onSort(field, newOrder);
  };

  if (loading) {
    return <TransferTableSkeleton />;
  }

  if (transfers.length === 0) {
    return <div className="text-center py-4 w-full flex justify-center h-full items-center"> لیست خالی است </div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              کد پیگیری
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              جهت انتقال
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              کد ملی فرستنده
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              شماره حساب فرستنده
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              کد ملی گیرنده
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              شماره حساب گیرنده
            </th>
            <th
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("score")}
            >
              امتیاز {sortBy === "score" && (sortOrder === "ASC" ? "↑" : "↓")}
            </th>
            <th
              className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
              onClick={() => handleSort("date")}
            >
              تاریخ انتقال{" "}
              {sortBy === "date" && (sortOrder === "ASC" ? "↑" : "↓")}
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transfers.map((transfer, idx) => (
            // <tr key={`${transfer.referenceCode}-${transfer.direction}`}>
            <tr key={idx}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transfer.referenceCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transfer.direction === "from"
                      ? "bg-red-100 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {transfer.direction === "from" ? "ارسال" : "دریافت"}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transfer.fromNationalCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transfer.fromAccountNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transfer.toNationalCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {transfer.toAccountNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {Number(transfer.score).toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 ltr text-right">
                {transfer.transferDateShamsi}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
