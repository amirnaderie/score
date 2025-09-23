"use client";

import { TransferData } from "@/app/dashboard/transfer/api/apis";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import TransferTableSkeleton from "./transferTableSkeleton";
import React, { useState } from "react";
import { hasAccess } from "@/app/lib/utility";
import { UseStore } from "@/store/useStore";
import ConfirmModal from "@/app/_components/ConfirmModal";
import { transferApi } from "@/app/dashboard/transfer/api/apis";
import toast from "react-hot-toast";

interface TransferTableProps {
  transfers: TransferData[];
  loading: boolean;
  onSort: (sortBy: "date" | "score", sortOrder: "ASC" | "DESC") => void;
  sortBy: string;
  sortOrder: string;
  onReverseSuccess?: () => void;
}

export default function TransferTable({
  transfers,
  loading,
  onSort,
  sortBy,
  sortOrder,
  onReverseSuccess,
}: TransferTableProps) {
  const user = UseStore((state) => state.userData);
  const [reverseLoading, setReverseLoading] = useState<{ [key: number]: boolean }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    onConfirm: () => { },
  });

  const handleSort = (field: "date" | "score") => {
    const newOrder = sortBy === field && sortOrder === "DESC" ? "ASC" : "DESC";
    onSort(field, newOrder);
  };

  const handleReverseTransfer = async (referenceCode: number) => {
    setModalContent({
      title: "تایید عودت انتقال",
      message: "آیا از عودت این انتقال مطمئن هستید؟",
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        setReverseLoading((prev) => ({ ...prev, [referenceCode]: true }));
        try {
          const res = await transferApi.reverseTransfer(referenceCode);
          const json = await res.json();
          if (json.statusCode === 200 || res.status === 200) {
            toast.success("عملیات با موفقیت انجام پذیرفت");
            onReverseSuccess?.();
          } else {
            toast.error(json.message || "خطا در عملیات");
          }
        } catch (e) {
          toast.error("خطا در عملیات!");
        } finally {
          setReverseLoading((prev) => ({ ...prev, [referenceCode]: false }));
        }
      },
    });
    setIsConfirmModalOpen(true);
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
            {hasAccess(user?.roles || [], ["score.confirm","score.admin"]) && (
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                وضعیت عودت
              </th>
            )}
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
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transfer.direction === "from"
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
              {hasAccess(user?.roles || [], ["score.confirm","score.admin"]) && transfer.direction === "to" && (
                <td className="px-6 py-4 whitespace-nowrap text-sm ltr flex justify-end items-center">
                  {!transfer.reversedAt ? (
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[60px]  cursor-pointer"
                      onClick={() => handleReverseTransfer(transfer.referenceCode)}
                      disabled={reverseLoading[transfer.referenceCode]}
                    >
                      {reverseLoading[transfer.referenceCode] ? (
                        <SpinnerSVG className="h-4 w-4 animate-spin text-white" />
                      ) : (
                        "عودت"
                      )}
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs ">{transfer.reversedAt}</span>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={modalContent.onConfirm}
        title={modalContent.title}
        message={modalContent.message}
      />
    </div>
  );
}
