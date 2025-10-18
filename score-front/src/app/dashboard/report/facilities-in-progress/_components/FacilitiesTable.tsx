"use client";

import { formatNumber } from "@/app/lib/utility";
import { FacilityInProgressResponseDto } from "../api/apis";

interface FacilitiesTableProps {
  data: FacilityInProgressResponseDto[];
  isLoading?: boolean;
}

function SkeletonRow() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-200 rounded w-20"></div>
      </td>
    </tr>
  );
}

export function FacilitiesTable({ data, isLoading }: FacilitiesTableProps) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                کد ملی
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                شماره حساب
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                امتیاز استفاده شده
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                تاریخ ایجاد
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                شناسه ارجاع
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <SkeletonRow key={index} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mt-2">لیست خالی است</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              کد ملی
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              شماره حساب
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              امتیاز استفاده شده
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              تاریخ ایجاد
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              شناسه ارجاع
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((facility, index) => (
            <tr
              key={facility.referenceCode}
              className={
                index % 2 === 0
                  ? "bg-white"
                  : "bg-gray-50"
              }
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {facility.nationalCode}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {facility.accountNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {formatNumber(facility.usedScore.toString())}
              </td>
              <td className="px-6 py-4 whitespace-nowrap ltr text-sm text-gray-900 text-center">
                {facility.createdAtShamsi}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                {facility.referenceCode}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}