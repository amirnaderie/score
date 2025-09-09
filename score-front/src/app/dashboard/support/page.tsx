"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { ScoreApi } from "@/app/dashboard/support/api/apis";
import { convertToGregorian } from "@/utils/dateConverter";
import {
  formatNumber,
  handleInput,
  validateIranianNationalCode,
} from "@/app/lib/utility";

export default function SupportPage() {
  const [nationalCode, setNationalCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [score, setScore] = useState<number | string>("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [scoreId, setScoreId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scores, setScores] = useState<any[]>([]);
  const [selectedScore, setSelectedScore] = useState<any | null>(null);
  const [showScoresList, setShowScoresList] = useState(false);
  const [nationalCodeError, setNationalCodeError] = useState("");
  const [accountNumberError, setAccountNumberError] = useState("");

  const validateNationalCode = (value: string) => {
    let retVal = false;
    if (!value) {
      setNationalCodeError("کد /شناسه ملی الزامی است");
    } else if (!validateIranianNationalCode(Number(value))) {
      setNationalCodeError("کد/شناسه ملی معتبر نیست");
      // } else if (!/^\d{10}$/.test(value)) {
      //   setNationalCodeError("کد ملی فقط باید شامل اعداد باشد");
    } else {
      setNationalCodeError("");
      retVal = true;
    }
    return retVal;
  };

  const validateAccountNumber = (value: string) => {
    let retVal = false;
    if (!value) {
      setAccountNumberError("شماره حساب الزامی است");
    } else if (value.length < 4 || value.length > 14) {
      setAccountNumberError("شماره حساب معتبر نیست");
      // } else if (!/^\d+$/.test(value)) {
      //   setAccountNumberError("شماره حساب فقط باید شامل اعداد باشد");
    } else {
      setAccountNumberError("");
      retVal = true;
    }
    return retVal;
  };

  const handleSearch = async () => {
    if (!nationalCode || !accountNumber) {
      toast.error("لطفاً کد ملی و شماره حساب را وارد نمایید");
      return;
    }
    if (!validateNationalCode(nationalCode)) return false;
    if (!validateAccountNumber(accountNumber)) return false;
    setLoading(true);
    try {
      const response = await ScoreApi.getScoreByNationalCodeAndAccountNumber(
        nationalCode,
        accountNumber
      );
      if (response.status === 200) {
        const retVal = await response.json();
        const { data } = retVal;
        if (Array.isArray(data) && data.length > 0) {
          setScores(data);
          setShowScoresList(true);
          setIsEditing(false);
          setScoreId(null);
          setScore("");
          setUpdatedAt("");
          setSelectedScore(null);
          toast.success(`امتیاز یافت شد!`);
        } else if (data && data.id) {
          // For backward compatibility if API still returns a single object
          setScoreId(data.id);
          setScore(data.score);
          // Convert date to Persian format if it's Gregorian
          const date = new Date(data.updatedAt);
          const persianDate = date
            .toLocaleDateString("fa-IR")
            .replace(/\//g, "/");
          setUpdatedAt(persianDate);
          setIsEditing(true);
          setSelectedScore(data);
          setScores([data]);
          setShowScoresList(true);
          toast.success("امتیاز یافت شد!");
        } else {
          setScoreId(null);
          setScore("");
          setUpdatedAt("");
          setIsEditing(false);
          setSelectedScore(null);
          setScores([]);
          setShowScoresList(false);
          toast.error("امتیازی یافت نشد. می‌توانید امتیاز جدید ایجاد کنید.");
        }
      } else if (response.status === 404) {
        setScoreId(null);
        setScore("");
        setUpdatedAt("");
        setIsEditing(false);
        setSelectedScore(null);
        setScores([]);
        setShowScoresList(false);
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
        toast.error("فرمت تاریخ نامعتبر است.");
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

          // Update the score in the scores array if it exists
          if (scores.length > 0) {
            const updatedScores = scores.map((item) => {
              if (item.id === scoreId) {
                return {
                  ...item,
                  score: Number(score.toString().replaceAll(",", "")),
                  updatedAt: gregorianDate,
                };
              }
              return item;
            });
            setScores(updatedScores);
            setSelectedScore(null);
            setIsEditing(false);
            setShowScoresList(true);
          }
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
          const data = await response.json();

          // Add the new score to the scores array
          const newScore = {
            id: data.id,
            nationalCode,
            accountNumber,
            score: Number(score.toString().replaceAll(",", "")),
            updatedAt: gregorianDate,
          };
          setScores([...scores, newScore]);
          setSelectedScore(null);
          setIsEditing(false);
          setShowScoresList(true);
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

  const handleSelectScore = (score: any) => {
    setSelectedScore(score);
    setScoreId(score.id);
    setScore(score.score);
    // Convert date to Persian format if it's Gregorian
    const date = new Date(score.updatedAt);
    const persianDate = date.toLocaleDateString("fa-IR").replace(/\//g, "/");
    setUpdatedAt(persianDate);
    setIsEditing(true);
    setShowScoresList(false);
  };

  return (
    <div>
    <div className="bg-white py-2 px-4 rounded-lg shadow-md h-30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full items-center">
        <div className="h-full">
          <label
            htmlFor="nationalCode"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            کد/شناسه ملی
          </label>
          <input
            type="number"
            onInput={(e) => handleInput(e, 11)}
            id="nationalCode"
            autoFocus
            className={`w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right ${
              nationalCodeError
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-500"
            }`}
            value={nationalCode}
            onChange={(e) => {
              setNationalCode(e.target.value);
              validateNationalCode(e.target.value);
            }}
            placeholder="کد/شناسه ملی را وارد نمایید"
            maxLength={11}
          />
          {nationalCodeError && (
            <p className="text-red-500 text-xs mt-1">{nationalCodeError}</p>
          )}
        </div>

        <div className="h-full">
          <label
            htmlFor="accountNumber"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            شماره حساب
          </label>
          <input
            type="number"
            id="accountNumber"
            onInput={(e) => handleInput(e, 14)}
            className={`w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right
              ${
                accountNumberError
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }
              `}
            value={accountNumber}
            maxLength={14}
            onChange={(e) => setAccountNumber(e.target.value)}
            placeholder="شماره حساب را وارد نمایید"
            required
          />
          {accountNumberError && (
            <p className="text-red-500 text-xs mt-1">{accountNumberError}</p>
          )}
        </div>
        <div className="flex items-center h-full pb-2">
          <button
            onClick={handleSearch}
            disabled={
              loading ||
              !nationalCode ||
              !accountNumber ||
              !!nationalCodeError ||
              !!accountNumberError
            }
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? "در حال جستجو..." : "جستجو"}
          </button>
        </div>
      </div>

      {showScoresList && scores.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            لیست امتیازات
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    شماره حساب
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    امتیاز
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    تاریخ بروزرسانی
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  >
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                {scores.map((scoreItem) => {
                  // Convert date to Persian format
                  const date = new Date(scoreItem.updatedAt);
                  const persianDate = date
                    .toLocaleDateString("fa-IR")
                    .replace(/\//g, "/");

                  return (
                    <tr
                      key={scoreItem.id}
                      className="hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {scoreItem.accountNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatNumber(scoreItem.score.toString())}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {persianDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleSelectScore(scoreItem)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          انتخاب
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(isEditing ||
        (!isEditing &&
          nationalCode &&
          accountNumber &&
          (!showScoresList || scores.length === 0))) && (
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
                setSelectedScore(null);

                // If we have scores listed, show them again
                if (scores.length > 0) {
                  setShowScoresList(true);
                }
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition duration-200"
            >
              {isEditing ? "انصراف" : "پاک کردن فرم"}
            </button>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
