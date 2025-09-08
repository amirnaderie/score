"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { ScoreApi } from "@/app/dashboard/support/api/apis";
import { convertToGregorian } from "@/utils/dateConverter";
import { formatNumber, handleInput } from "@/app/lib/utility";

export default function SupportPage() {
  const [nationalCode, setNationalCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [score, setScore] = useState<number | string>("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [scoreId, setScoreId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!nationalCode || !accountNumber) {
      toast.error("لطفاً کد ملی و شماره حساب را وارد کنید");
      return;
    }

    setLoading(true);
    try {
      const response = await ScoreApi.getScoreByNationalCodeAndAccountNumber(
        nationalCode,
        accountNumber
      );
      if (response.status === 200) {
        const retVal = await response.json();
        const { data } = retVal;
        if (data && data.id) {
          setScoreId(data.id);
          setScore(data.score);
          // Convert date to Persian format if it's Gregorian
          const date = new Date(data.updatedAt);
          const persianDate = date
            .toLocaleDateString("fa-IR")
            .replace(/\//g, "/");
          setUpdatedAt(persianDate);
          setIsEditing(true);
          toast.success("امتیاز یافت شد!");
        } else {
          setScoreId(null);
          setScore("");
          setUpdatedAt("");
          setIsEditing(false);
          toast.error("امتیازی یافت نشد. می‌توانید امتیاز جدید ایجاد کنید.");
        }
      } else if (response.status === 404) {
        setScoreId(null);
        setScore("");
        setUpdatedAt("");
        setIsEditing(false);
        toast.error("امتیازی یافت نشد. می‌توانید امتیاز جدید ایجاد کنید.");
      } else {
        toast.error("خطا در جستجوی امتیاز.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("خطا در جستجو رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!score || !updatedAt) {
      toast.error("لطفاً تمام فیلدها را پر کنید");
      return;
    }

    setLoading(true);
    try {
      const gregorianDate = convertToGregorian(updatedAt);
      if (!gregorianDate) {
        toast.error(
          "فرمت تاریخ نامعتبر است."
        );
        setLoading(false);
        return;
      }

      if (isEditing && scoreId) {
        // Update existing score
        const response = await ScoreApi.updateScore(
          scoreId,
          Number(score.toString().replaceAll(",", "")),
          gregorianDate
        );
        if (response.status === 200) {
          toast.success("امتیاز با موفقیت بروزرسانی شد!");
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "خطا در بروزرسانی امتیاز.");
        }
      } else {
        // Create new score
        const response = await ScoreApi.createScore({
          nationalCode,
          accountNumber,
          score: Number(score.toString().replaceAll(",", "")),
          updatedAt: gregorianDate,
        });
        if (response.status === 200) {
          toast.success("امتیاز با موفقیت ایجاد شد!");
          setIsEditing(true);
          const data = await response.json();
          setScoreId(data.id);
        } else {
          const errorData = await response.json();
          toast.error(errorData.message || "خطا در ایجاد امتیاز.");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("خطا در ارسال اطلاعات رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          جستجوی امتیاز
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="nationalCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              کد ملی
            </label>
            <input
              type="number"
              onInput={(e) => handleInput(e, 11)}
              id="nationalCode"
              autoFocus
              className="mt-1 block w-full ltr text-left border placeholder:text-right border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={nationalCode}
              onChange={(e) => setNationalCode(e.target.value)}
              placeholder="کد ملی را وارد نمایید"
              maxLength={11}
            />
          </div>

          <div>
            <label
              htmlFor="accountNumber"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              شماره حساب
            </label>
            <input
              type="number"
              id="accountNumber"
              onInput={(e) => handleInput(e, 16)}
              className="mt-1 block w-full border ltr text-left placeholder:text-right border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={accountNumber}
              maxLength={16}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="شماره حساب را وارد نمایید"
            />
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={loading || !nationalCode || !accountNumber}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {loading ? "در حال جستجو..." : "جستجو"}
        </button>
      </div>

      {(isEditing || (!isEditing && nationalCode && accountNumber)) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {isEditing ? "ویرایش امتیاز" : "ایجاد امتیاز جدید"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="score"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                امتیاز
              </label>
              <input
                type="text"
                id="score"
                inputMode="numeric"
                className="mt-1 block w-full border ltr text-left placeholder:text-right border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={score && formatNumber(score.toString())}
                onChange={(e) => setScore(e.target.value)}
                placeholder="مقدار امتیاز را وارد نمایید"
                onInput={(e) => handleInput(e, 15)}
              />
            </div>

            <div>
              <label
                htmlFor="updatedAt"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                تاریخ بروزرسانی
              </label>
              <input
                type="text"
                inputMode="numeric"
                id="updatedAt"
                className="mt-1 block w-full border ltr text-center placeholder:text-right border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={updatedAt}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d]/g, "");
                  let formatted = "";

                  if (value.length > 0) {
                    if (value.length <= 4) {
                      formatted = value;
                    } else if (value.length <= 6) {
                      formatted = value.slice(0, 4) + "/" + value.slice(4);
                    } else {
                      formatted =
                        value.slice(0, 4) +
                        "/" +
                        value.slice(4, 6) +
                        "/" +
                        value.slice(6, 8);
                    }
                  }

                  setUpdatedAt(formatted);
                }}
                maxLength={10}
                placeholder="مثال: 14020115"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading || !score || !updatedAt}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
            >
              {loading
                ? "در حال ذخیره..."
                : isEditing
                ? "بروزرسانی امتیاز"
                : "ایجاد امتیاز"}
            </button>
            <button
              onClick={() => {
                setScore("");
                setUpdatedAt("");
                setIsEditing(false);
                setScoreId(null);
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition duration-200"
            >
              پاک کردن فرم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
