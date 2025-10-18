"use client";

import { LogMethodLabels } from "@/app/type";
import TransferTableSkeleton from "../../transfer/_components/transferTableSkeleton";
import { LogEntry } from "../api/apis";

interface LogsTableProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onSort: (column: "method" | "createdAt") => void;
  sortBy: "method" | "createdAt";
  sortOrder: "ASC" | "DESC";
  convertToPersianDate: (dateString: string | undefined) => string;
}

export function LogsTable({ 
  logs, 
  isLoading, 
  onSort, 
  sortBy, 
  sortOrder,
  convertToPersianDate
}: LogsTableProps) {
  if (isLoading) {
    return <TransferTableSkeleton />;
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        لیست شما خالی است.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("method")}
              >
                <div className="flex items-center justify-center">
                  روش
                  {sortBy === "method" && (
                    <span className="mr-1">
                      {sortOrder === "ASC" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 w-28 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => onSort("createdAt")}
              >
                <div className="flex items-center justify-center">
                  تاریخ ایجاد
                  {sortBy === "createdAt" && (
                    <span className="mr-1">
                      {sortOrder === "ASC" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs flex justify-center font-medium text-gray-500 uppercase tracking-wider"
              >
                پیام
              </th>
            </tr>
          </thead>
          <tbody className="bg-white text-xs divide-y divide-gray-200">
            {logs.map((log) => (
              <tr
                key={log.id}
                className="hover:bg-gray-100"
              >
                <td className="px-3 py-3 whitespace-nowrap text-gray-900">
                  {LogMethodLabels[log.method] || log.method}
                </td>
                <td className="px-3 w-28 flex justify-center py-3 whitespace-nowrap text-gray-900">
                  {convertToPersianDate(log.createdAt || log.created_at)}
                </td>
                <td className="px-3 py-3 text-left text-gray-900">
                  {log.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}