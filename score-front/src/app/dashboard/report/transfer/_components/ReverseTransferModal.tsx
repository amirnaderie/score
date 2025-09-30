'use client'
import { formatNumber, handleInput } from "@/app/lib/utility";
import React, { useEffect, useState } from "react";

interface ReverseTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reverseScore: number) => void;
  title: string;
  maxScore: number;
}

const ReverseTransferModal: React.FC<ReverseTransferModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  maxScore,
}) => {
  const [reverseScore, setReverseScore] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!isOpen) return null;

  const handleReverseScoreChange = (value: string) => {
    // Remove any non-digit characters (including commas) for processing
    const cleanValue = value.replace(/[^0-9]/g, '');
    setReverseScore(cleanValue);
    setError("");

    const numValue = Number(cleanValue);
    if (cleanValue && (isNaN(numValue) || numValue <= 0)) {
      setError("امتیاز عودت باید عددی مثبت باشد");
    } else if (numValue > maxScore) {
      setError(`امتیاز عودت نمی‌تواند بیشتر از ${formatNumber(maxScore.toLocaleString())} باشد`);
    }
  };

  const handleConfirm = () => {
    const numValue = Number(reverseScore);

    if (!reverseScore) {
      setError("امتیاز عودت الزامی است");
      return;
    }

    if (isNaN(numValue) || numValue <= 0) {
      setError("امتیاز عودت باید عددی مثبت باشد");
      return;
    }

    if (numValue > maxScore) {
      setError(`امتیاز عودت نمی‌تواند بیشتر از ${formatNumber(maxScore.toLocaleString())} باشد`);
      return;
    }

    onConfirm(numValue);
  };

  const handleClose = () => {
    setReverseScore("");
    setError("");
    onClose();
  };

  return (
    <div className="fixed text-sm inset-0 bg-black/70 bg-opacity-10 flex justify-center items-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full rtl vazirmatn">
        <h2 className="font-bold mb-4 text-right">{title}</h2>
        {/* <p className="text-gray-700 mb-4 text-right">{message}</p> */}

        <div className="mb-6">
          <label className="block text-right text-sm font-medium text-gray-700 mb-2">
            امتیاز عودت (حداکثر: {formatNumber(maxScore.toLocaleString())})
          </label>
          <input
            type="text"
            onChange={(e) => handleReverseScoreChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="امتیاز عودت را وارد کنید"
            value={reverseScore ? formatNumber(reverseScore) : ""}
            onInput={(e) => handleInput(e, 19)}
            // onKeyPress={(e) => {
            //   // Only allow digits
            //   if (!/[0-9]/.test(e.key)) {
            //     e.preventDefault();
            //   }
            // }}
          />
          {error && (
            <p className="text-red-500 text-xs mt-1 text-right">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 text-xs">
          <button
            onClick={handleConfirm}
            disabled={!!error || !reverseScore}
            className="bg-blue-300 disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer hover:bg-blue-700 disabled:hover:bg-gray-300 py-2 px-4 rounded transition-colors duration-200"
          >
            بله، عودت کن
          </button>
          <button
            onClick={handleClose}
            className="bg-gray-200 cursor-pointer hover:bg-gray-500 py-2 px-4 rounded transition-colors duration-200"
          >
            خیر
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReverseTransferModal;