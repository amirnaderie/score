"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { transferApi, TransferRequest, EstelamResponse } from "./api/apis";
import {
  formatNumber,
  handleInput,
  validateIranianNationalCode,
} from "@/app/lib/utility";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";

export default function TransferPage() {
  const [formData, setFormData] = useState<TransferRequest>({
    fromNationalCode: "",
    fromAccountNumber: "",
    toNationalCode: "",
    toAccountNumber: "",
    score: 0,
    description: "",
  });

  const [errors, setErrors] = useState<{
    fromNationalCode?: string;
    fromAccountNumber?: string;
    toNationalCode?: string;
    toAccountNumber?: string;
    score?: string;
  }>({});

  const [estelamData, setEstelamData] = useState<EstelamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [showEstelam, setShowEstelam] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(true);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateField = (name: string, value: string | number) => {
    let error = "";

    switch (name) {
      case "fromNationalCode":
      case "toNationalCode":
        if (!value) {
          error = "کد ملی الزامی است";
        } else if (!validateIranianNationalCode(Number(value.toString()))) {
          error = "کد ملی معتبر نیست";
        }
        break;

      case "fromAccountNumber":
      case "toAccountNumber":
        if (!value) {
          error = "شماره حساب الزامی است";
        }
        break;

      case "score":
        if (!value || Number(value) <= 0) {
          error = "مقدار امتیاز باید بیشتر از صفر باشد";
        }
        break;
    }

    return error;
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof TransferRequest]);
      if (error) {
        newErrors[key as keyof typeof errors] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleEstelam = async () => {
    // if (
    //   !formData.fromNationalCode ||
    //   !formData.fromAccountNumber ||
    //   !formData.toNationalCode ||
    //   !formData.toAccountNumber
    // ) {
    //   toast.error("لطفاً کد ملی و شماره حساب طرفین را وارد کنید");
    //   return;
    // }

    if (!validateForm()) {
      toast.error("لطفاً خطاهای فرم را برطرف نمایید");
      return;
    }
    if (
      formData.fromNationalCode === formData.toNationalCode &&
      formData.fromAccountNumber === formData.toAccountNumber
    ) {
      toast.error("امکان انتقال برای این مشخصات وجود ندارد");
      return;
    }

    setLoading(true);
    try {
      const estelamData = {
        fromNationalCode: formData.fromNationalCode,
        fromAccountNumber: formData.fromAccountNumber,
        toNationalCode: formData.toNationalCode,
        toAccountNumber: formData.toAccountNumber,
      };

      const response = await transferApi.estelamTransfer(estelamData);
      const data = await response.json();
      if (response.status === 200) {
        //const data = await response.json();
        setEstelamData(data.data);
        setShowEstelam(true);
        toast.success("اطلاعات استعلام دریافت شد");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!validateForm()) {
      toast.error("لطفاً خطاهای فرم را برطرف نمایید");
      return;
    }

    setSaveLoading(true);
    try {
      const response = await transferApi.transferScore({
        ...formData,
        score: Number(formData.score.toString().replaceAll(",", "")),
      });
      if (response.status === 200) {
        toast.success("انتقال امتیاز با موفقیت انجام شد");
        // Reset form
        setFormData({
          fromNationalCode: "",
          fromAccountNumber: "",
          toNationalCode: "",
          toAccountNumber: "",
          score: 0,
          description: "",
        });
        setErrors({});
        setEstelamData(null);
        setShowEstelam(false);
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "خطا در انتقال امتیاز");
      }
    } catch (error) {
      toast.error("خطا در برقراری ارتباط با سرور");
    } finally {
      setSaveLoading(false);
    }
  };

  // const handleInput = (
  //   e: React.ChangeEvent<HTMLInputElement>,
  //   maxLength: number
  // ) => {
  //   const value = e.target.value.replace(/[^\d]/g, "");
  //   if (value.length <= maxLength) {
  //     handleInputChange({
  //       target: {
  //         name: e.target.name,
  //         value: value,
  //       },
  //     } as React.ChangeEvent<HTMLInputElement>);
  //   }
  // };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 py-4">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-3">
          {showTransferForm && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  اطلاعات مبدا
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد/شناسه ملی مبدا
                    </label>
                    <input
                      type="number"
                      name="fromNationalCode"
                      value={formData.fromNationalCode}
                      onInput={(e) => handleInput(e, 11)}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={` ${
                        errors.fromNationalCode
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="کد/شناسه مبدا را وارد کنید"
                      maxLength={11}
                    />
                    {errors.fromNationalCode && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.fromNationalCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره حساب مبدا
                    </label>
                    <input
                      type="number"
                      name="fromAccountNumber"
                      value={formData.fromAccountNumber}
                      onInput={(e) => handleInput(e, 16)}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={` ${
                        errors.fromAccountNumber
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="شماره حساب مبدا را وارد کنید"
                      maxLength={16}
                    />
                    {errors.fromAccountNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.fromAccountNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  اطلاعات مقصد
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      کد/شناسه ملی مقصد
                    </label>
                    <input
                      type="number"
                      name="toNationalCode"
                      value={formData.toNationalCode}
                      onInput={(e) => handleInput(e, 11)}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={` ${
                        errors.toNationalCode
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="کد/شناسه مقصد را وارد کنید"
                      maxLength={11}
                    />
                    {errors.toNationalCode && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.toNationalCode}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      شماره حساب مقصد
                    </label>
                    <input
                      type="number"
                      name="toAccountNumber"
                      value={formData.toAccountNumber}
                      onInput={(e) => handleInput(e, 16)}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={` ${
                        errors.toAccountNumber
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="شماره حساب مقصد را وارد کنید"
                      maxLength={16}
                    />
                    {errors.toAccountNumber && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.toAccountNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      مقدار امتیاز
                    </label>
                    <input
                      type="text"
                      id="score"
                      name="score"
                      inputMode="numeric"
                      className="w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right"
                      value={
                        formData.score &&
                        formatNumber(formData.score.toString())
                      }
                      onChange={handleInputChange}
                      placeholder="مقدار امتیاز را وارد نمایید"
                      onInput={(e) => handleInput(e, 17)}
                    />
                    {/* <input
                      type="text"
                      name="score"
                      inputMode="numeric"
                      value={formatNumber(formData.score.toString())}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      onInput={(e) => handleInput(e, 15)}
                      className={`${
                        errors.score
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="مقدار امتیاز را وارد کنید"
                      // min="1"
                    /> */}
                    {errors.score && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {errors.score}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      توضیحات (اختیاری)
                    </label>
                    <input
                      name="description"
                      value={formData.description}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }));
                      }}
                      onBlur={handleBlur}
                      className={` border-gray-300 dark:border-gray-600 w-full px-3 py-2 border ltr rounded-md focus:outline-none focus:ring-2 placeholder:text-sm placeholder:text-right`}
                      placeholder="توضیح"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <button
                    onClick={handleEstelam}
                    disabled={
                      loading ||
                      !formData.fromNationalCode ||
                      !formData.fromAccountNumber ||
                      !formData.toNationalCode ||
                      !formData.toAccountNumber
                    }
                    className="w-full flex text-sm justify-center bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3 px-6 rounded-md transition duration-200"
                  >
                    {loading ? (
                      <SpinnerSVG className="h-5 w-5 animate-spin text-white" />
                    ) : (
                      "استعلام"
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {showEstelam && estelamData && (
            <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex gap-x-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    نام دارنده حساب مبدا:
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {estelamData.fromName}
                  </p>
                </div>
                <div className="flex gap-x-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    نام دارنده حساب مقصد:
                  </p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {estelamData.toName}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-4 text-sm">
                <button
                  onClick={handleTransfer}
                  disabled={saveLoading}
                  className="bg-green-600 flex min-w-28 justify-center hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-2 px-6 rounded-md transition duration-200"
                >
                  {saveLoading ? (
                    <SpinnerSVG className="h-5 w-5 animate-spin text-white" />
                  ) : (
                    "ثبت انتقال"
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowEstelam(false);
                    setEstelamData(null);
                  }}
                  className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-6 rounded-md transition duration-200"
                >
                  بازگشت
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
