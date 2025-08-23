"use client";

import React from "react";

export default function TransferTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 animate-pulse">
        <thead className="bg-gray-50">
          <tr>
            {[...Array(8)].map((_, i) => (
              <th key={i} className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {[...Array(5)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(8)].map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div className="h-4 bg-gray-200 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}