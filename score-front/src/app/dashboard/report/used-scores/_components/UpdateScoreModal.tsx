"use client";

import { useState, useEffect } from "react";
import { UsedScoreData } from "../api/apis";
import { formatNumber, handleInput } from "@/app/lib/utility";

interface UpdateScoreModalProps {
  isOpen: boolean;
  usedScore: UsedScoreData | null;
  onClose: () => void;
  onSubmit: (newScore: number) => void;
}

export function UpdateScoreModal({
  isOpen,
  usedScore,
  onClose,
  onSubmit,
}: UpdateScoreModalProps) {
  const [newScore, setNewScore] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (usedScore) {
      setNewScore(usedScore.score.toString());
      setError("");
    }
  }, [usedScore]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const scoreValue = Number(newScore.toString().replaceAll(",", ""));

    // Validate that the entered score is not more than the current usedScore
    if (usedScore && scoreValue > usedScore.score) {
      setError("امتیاز وارد شده نمی‌تواند بیشتر از امتیاز فعلی باشد");
      return;
    }

    // Also check for valid number
    if (isNaN(scoreValue) || scoreValue < 0) {
      setError("لطفاً یک مقدار عددی معتبر وارد کنید");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      await onSubmit(scoreValue);
    } catch (err) {
      // Handle submission errors if needed
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !usedScore) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="p-5 border w-96 shadow-lg rounded-md bg-white mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">ویرایش امتیاز</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="text"
              id="newScore"
              inputMode="numeric"
              value={newScore && formatNumber(newScore.toString())}
              onChange={(e) => {
                setNewScore(e.target.value);
                // Clear error when user starts typing
                if (error) setError("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none placeholder:text-sm focus:ring-blue-500 focus:border-blue-500 ltr text-right"
              placeholder="مقدار جدید امتیاز را وارد نمایید"
              required
              onInput={(e) => handleInput(e, 17)}
            />
            {error && (
              <div className="text-red-500 text-xs mt-1">{error}</div>
            )}

          </div>

          <div className="flex justify-end gap-x-3 space-x-reverse w-full">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "در حال بروزرسانی..." : "بروزرسانی"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}