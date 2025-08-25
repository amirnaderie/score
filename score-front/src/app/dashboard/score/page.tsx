"use client";
import React, { useState, useEffect } from "react";
import ConfirmModal from "@/app/_components/ConfirmModal";

import toast from "react-hot-toast";
import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";
import {
  formatNumber,
  handleInput,
  hasAccess,
  validateIranianNationalCode,
  onlyLettersAndNumbers,
} from "@/app/lib/utility";
import { fetchWithAuthClient } from "@/app/lib/fetchWithAuthClient";
import { UseStore } from "@/store/useStore";
import { User } from "@/app/type";

interface UsedScore {
  id: number;
  score: number;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: boolean;
  personalCode: number | null;
  branchCode: number | null;
  referenceCode: number | null;
  description: string;
}

interface ScoreRow {
  scoreId: number;
  accountNumber: string;
  usableScore: number;
  transferableScore: number;
  depositType: string;
  usedScore: UsedScore[];
  updated_at: string;
}

interface ApiResponse {
  data: { scoresRec: ScoreRow[]; ownerName: string };
  message: string;
  statusCode: number;
  error?: string;
}

export default function Home() {
  const [nationalCode, setNationalCode] = useState("");
  const [ownerFullName, setownerFullName] = useState("");
  const [data, setData] = useState<ScoreRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [consumeScores, setConsumeScores] = useState<{ [key: string]: string }>(
    {}
  );
  const [scoreDescriptions, setScoreDescriptions] = useState<{
    [key: string]: string;
  }>({});
  const [descriptionErrors, setDescriptionErrors] = useState<{
    [key: string]: boolean;
  }>({});
  const [saving, setSaving] = useState<{ [key: string]: boolean }>({});
  const [saveUse, setSaveUse] = useState<{ [key: number]: boolean }>({});
  const [calcleUse, setcancelUse] = useState<{ [key: number]: boolean }>({});
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({
    title: "",
    message: "",
    onConfirm: () => {},
  });
  // const [saveMsg, setSaveMsg] = useState<{ [key: string]: string }>({});
  const userData: User | null = UseStore((state) => state.userData);

  const clearConsumeScores = () => {
    const cleared = Object.keys(consumeScores).reduce((acc, key) => {
      acc[key] = "";
      return acc;
    }, {} as { [key: string]: string });
    setConsumeScores(cleared);

    const clearedDescriptions = Object.keys(scoreDescriptions).reduce(
      (acc, key) => {
        acc[key] = "";
        return acc;
      },
      {} as { [key: string]: string }
    );
    setScoreDescriptions(clearedDescriptions);

    const clearedErrors = Object.keys(descriptionErrors).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {} as { [key: string]: boolean });
    setDescriptionErrors(clearedErrors);
  };
  const handleFetch = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setSelectedIndex(null);
    try {
      clearConsumeScores();
      if (!validateIranianNationalCode(Number(nationalCode))) {
        setError("کد ملی معتبر نیست");
        setLoading(false);
        return;
      }
      await fillData(Number(nationalCode), 0);
    } catch (e) {
      toast.error("خطا در عملیات!");
    } finally {
      setLoading(false);
    }
  };

  const fillData = async (
    nationalCode: number,
    selectedScore: number | null
  ) => {
    try {
      const res = await fetchWithAuthClient(
        `${process.env.NEXT_PUBLIC_API_URL}/front/score/${nationalCode}`,
        {
          credentials: "include",
        }
      );
      const json: ApiResponse = await res.json();
      if (json.statusCode !== 200) {
        //setError(json.message || json.error || "Unknown error");
        toast.error(json.message);
      } else {
        const { scoresRec: scoresData, ownerName } = json.data;
        if (
          scoresData.length > 0 &&
          (scoresData as any)[0].usedScore &&
          (scoresData as any)[0].usedScore.length > 0
        ) {
          setSelectedIndex(selectedScore ?? 0);
        }
        setData(scoresData);
        setownerFullName(ownerName);
      }
    } catch (error) {
      throw error;
    }
  };

  // Keep only digits in state, but show formatted value
  const handleConsumeChange = (accountNumber: string, value: string) => {
    const digits = value.replace(/\D/g, "");
    setConsumeScores((prev) => ({ ...prev, [accountNumber]: digits }));
  };

  const acceptUse = async (referenceCode: number) => {
    setModalContent({
      title: "تایید ثبت نهایی",
      message: "آیا از ثبت نهایی این امتیاز مطمئن هستید؟",
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        setSaveUse((prev) => ({ ...prev, [referenceCode]: true }));
        try {
          const res = await fetchWithAuthClient(
            `${process.env.NEXT_PUBLIC_API_URL}/front/score/accept-use`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referenceCode }),
              credentials: "include",
            }
          );
          const json = await res.json();
          if (json.statusCode === 200) {
            toast.success("عملیات با موفقیت انجام پذیرفت");
            setSaveUse((prev) => ({ ...prev, [referenceCode]: false }));
            await fillData(Number(nationalCode), selectedIndex);
          } else {
            toast.error(json.message);
          }
        } catch (e) {
          toast.error("خطا در عملیات!");
        } finally {
          setSaveUse((prev) => ({ ...prev, [referenceCode]: false }));
        }
      },
    });
    setIsConfirmModalOpen(true);
  };
  const cancelUse = async (referenceCode: number) => {
    setModalContent({
      title: "تایید لغو امتیاز",
      message: "آیا از لغو این امتیاز مطمئن هستید؟",
      onConfirm: async () => {
        setIsConfirmModalOpen(false);
        setcancelUse((prev) => ({ ...prev, [referenceCode]: true }));
        try {
          const res = await fetchWithAuthClient(
            `${process.env.NEXT_PUBLIC_API_URL}/front/score/cancel-use`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ referenceCode }),
              credentials: "include",
            }
          );
          const json = await res.json();
          if (json.statusCode === 200) {
            toast.success("عملیات با موفقیت انجام پذیرفت");
            setcancelUse((prev) => ({ ...prev, [referenceCode]: false }));
            await fillData(Number(nationalCode), selectedIndex);
          } else {
            toast.error(json.message);
          }
        } catch (e) {
          toast.error("خطا در عملیات!");
        } finally {
          setcancelUse((prev) => ({ ...prev, [referenceCode]: false }));
        }
      },
    });
    setIsConfirmModalOpen(true);
  };
  const handleSaveConsume = async (accountNumber: string) => {
    setSaving((prev) => ({ ...prev, [accountNumber]: true }));
    // setSaveMsg((prev) => ({ ...prev, [accountNumber]: "" }));

    const currentScore: ScoreRow = data.find(
      (scoreItem: ScoreRow) => scoreItem.accountNumber === accountNumber
    )!;
    if (Number(consumeScores[accountNumber]) <= 0) {
      toast.error("میزان استفاده نمی تواند صفر باشد!");
      setSaving((prev) => ({ ...prev, [accountNumber]: false }));
      return false;
    }

    if (Number(consumeScores[accountNumber]) > currentScore.usableScore) {
      toast.error("مانده کافی نیست!");
      setSaving((prev) => ({ ...prev, [accountNumber]: false }));
      return false;
    }
    try {
      const res = await fetchWithAuthClient(
        `${process.env.NEXT_PUBLIC_API_URL}/front/score/consume`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountNumber: currentScore.accountNumber,
            nationalCode: nationalCode,
            score: Number(consumeScores[accountNumber]),
            description: scoreDescriptions[accountNumber] || "",
          }),
          credentials: "include",
        }
      );
      const json = await res.json();
      if (json.statusCode === 200) {
        toast.success("عملیات با موفقیت انجام پذیرفت");
        //setSaveMsg((prev) => ({ ...prev, [accountNumber]: "Saved!" }));
        await fillData(Number(nationalCode), selectedIndex);
      } else {
        // setSaveMsg((prev) => ({
        //   ...prev,
        //   [accountNumber]: json.message || "Error",
        // }));
        toast.error(json.message);
      }
    } catch (e) {
      toast.error("خطا در عملیات!");
      // setSaveMsg((prev) => ({ ...prev, [accountNumber]: "Failed to save" }));
    } finally {
      clearConsumeScores();
      setSaving((prev) => ({ ...prev, [accountNumber]: false }));
    }
  };

  return (
    <div className="flex flex-col items-center  justify-items-center h-full p-8  gap-14 sm:p-10">
      <div className="flex flex-col gap-y-2  max-w-md ">
        <label className="text-sm">کد یا شناسه ملی :</label>
        <div className="flex gap-2">
          <input
            type="number"
            className="border rounded px-3 py-2 flex-1 ltr w-4/6  placeholder:text-right placeholder:text-xs"
            onInput={(e) => handleInput(e, 11)}
            value={nationalCode}
            autoFocus
            onChange={(e) => setNationalCode(e.target.value)}
            placeholder=" کد ملی صاحب امتیاز را وارد نمایید"
            maxLength={11}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && nationalCode) {
                handleFetch();
              }
            }}
          />
          <button
            // className="bg-blue-300  w-24  py-2 rounded  flex justify-center items-center cursor-pointer"
            className="w-24 bg-blue-500 text-white disabled:opacity-50 flex justify-center items-center py-2 px-4 rounded-md hover:bg-blue-600 transition duration-200 cursor-pointer"
            onClick={handleFetch}
            disabled={loading || !nationalCode}
          >
            {loading ? (
              <SpinnerSVG className="h-4 w-4 animate-spin text-white" />
            ) : (
              "جستجو"
            )}
          </button>
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </div>

      {data.length > 0 && (
        <div className="w-[80%]  flex flex-col gap-y-10 items-center">
          <div className=" w-full rounded-md overflow-hidden">
            {ownerFullName.length > 0 && (
              <div className="h-14 w-full flex justify-center items-center bg-cyan-50 font-semibold">
                نام مشتری: {ownerFullName}
              </div>
            )}
            <div className="w-full border-collapse ">
              <div className="bg-gray-100 text-sm w-full flex justify-start">
                <span className=" px-3 py-2 w-[20%] text-center">
                  شماره حساب
                </span>
                <span className=" px-3 py-2 w-[15%] text-center">
                  امتیاز قابل استفاده
                </span>
                <span className=" px-3 py-2 w-[15%] text-center">
                  امتیاز قابل انتقال
                </span>
                <span className=" px-3 py-2 w-[20%] text-center">
                  میزان استفاده
                </span>
                <span className=" px-3 py-2 w-[20%] text-center">توضیح</span>
                {hasAccess(userData?.roles || [], [
                  "score.confirm",
                  "score.branch",
                ]) && (
                  <span className=" px-3 py-2 w-[10%] text-center">عملیات</span>
                )}
              </div>

              <div className="w-full max-h-[150px] overflow-auto pb-5">
                {data.map((row, idx) => (
                  <div
                    key={row.accountNumber}
                    className={`cursor-pointer w-full flex justify-start items-center ${
                      selectedIndex === idx ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedIndex(idx)}
                  >
                    <span className=" px-3 py-2 w-[20%] text-center">
                      {row.accountNumber}
                    </span>
                    <span className=" px-3 py-2  w-[15%] text-center">
                      {Number(row.usableScore).toLocaleString()}
                    </span>
                    <span className=" px-3 py-2  w-[15%] text-center">
                      {Number(row.transferableScore).toLocaleString()}
                    </span>
                    <span className=" py-2 flex justify-center w-[20%]">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="border rounded px-2 py-1 w-[70%] ltr bg-white"
                        value={formatNumber(
                          consumeScores[row.accountNumber] || ""
                        )}
                        onChange={(e) =>
                          handleConsumeChange(row.accountNumber, e.target.value)
                        }
                        readOnly={!row.usableScore || row.usableScore < 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(idx);
                        }}
                        onInput={(e) => handleInput(e, 15)}
                      />
                    </span>
                    <span className=" py-2 flex justify-center w-[20%]">
                      <input
                        type="text"
                        className={`border rounded px-2 py-2 w-[90%] text-xs bg-white ${
                          descriptionErrors[row.accountNumber]
                            ? "border-red-500"
                            : ""
                        }`}
                        value={scoreDescriptions[row.accountNumber] || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          setScoreDescriptions((prev) => ({
                            ...prev,
                            [row.accountNumber]: value,
                          }));

                          // Validate the description
                          const isValid = onlyLettersAndNumbers(value);
                          setDescriptionErrors((prev) => ({
                            ...prev,
                            [row.accountNumber]: !isValid,
                          }));
                        }}
                        maxLength={60}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIndex(idx);
                        }}
                      />
                    </span>
                    {hasAccess(userData?.roles || [], [
                      "score.confirm",
                      "score.branch",
                    ]) && (
                      <span className=" px-3 py-2 w-[10%] text-sm">
                        <button
                          className="bg-green-300 w-full   px-3 py-1 rounded disabled:opacity-50 flex justify-center items-center cursor-pointer"
                          disabled={
                            saving[row.accountNumber] ||
                            !consumeScores[row.accountNumber] ||
                            Number(consumeScores[row.accountNumber]) <= 0 ||
                            descriptionErrors[row.accountNumber]
                          }
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSaveConsume(row.accountNumber);
                          }}
                        >
                          {saving[row.accountNumber] ? (
                            <SpinnerSVG className="h-6 w-5 animate-spin text-white" />
                          ) : (
                            "ثبت"
                          )}
                        </button>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selectedIndex !== null &&
          data[selectedIndex] &&
          data[selectedIndex].usedScore.length ? (
            <div className=" w-full">
              <div className="bg-gray-50 p-4 rounded shadow">
                <div className="font-semibold mb-2 text-sm">
                  امتیازهای استفاده شده
                </div>
                {data[selectedIndex].usedScore.length === 0 ? (
                  <div className="text-gray-500">No used scores.</div>
                ) : (
                  <div className="w-full  text-sm ">
                    <div className="w-full flex justify-start  bg-gray-300 rounded-t-md">
                      <span className=" px-2 py-1 w-[25%] text-center">
                        امتیاز
                      </span>
                      <span className=" px-2 py-1 w-[10%] text-center">
                        تاریخ
                      </span>

                      <span className=" px-2 py-1 w-[10%] text-center">
                        کد شعبه
                      </span>

                      <span className=" px-2 py-1 w-[10%] text-center">
                        پرسنلی ثبت کننده
                      </span>
                      <span className=" px-2 py-1 w-[25%] text-center">
                        توضیح
                      </span>

                      {hasAccess(userData?.roles || [], [
                        "score.confirm",
                        "score.branch",
                      ]) && (
                        <span className=" px-2 py-1 w-[20%] text-center">
                          عملیات
                        </span>
                      )}
                    </div>
                    <div className=" max-h-[270px] w-full overflow-y-auto">
                      {data[selectedIndex].usedScore.map((u: UsedScore) => (
                        <div
                          key={u.referenceCode}
                          className="w-full flex  h-12 odd:bg-gray-100 even:bg-gray-200 items-center justify-start"
                        >
                          <span className=" px-2 py-1 text-center w-[25%]">
                            {Number(u.score).toLocaleString()}
                          </span>
                          <span className=" px-2 py-1 text-center w-[10%]">
                            {u.status ? u.updatedAt : "در دست اقدام"}
                          </span>
                          <span className=" px-2 py-1 text-center w-[10%]">
                            {u.branchCode}
                          </span>
                          <span className=" px-2 py-1 text-center w-[10%]">
                            {u.personalCode}
                          </span>
                          <span className=" px-2 py-1 text-center text-xs w-[25%]">
                            {u.description}
                          </span>
                          {hasAccess(userData?.roles || [], [
                            "score.confirm",
                            "score.branch",
                          ]) && (
                            <span className=" px-2 py-1 text-center w-[20%] flex justify-between items-center">
                              {userData &&
                                userData.branchCode === u.branchCode &&
                                !u.status && (
                                  <>
                                    <button
                                      className="bg-green-300 w-[45%]   px-3 py-1 rounded disabled:opacity-50 flex justify-center items-center cursor-pointer"
                                      // disabled={
                                      //   saving[row.accountNumber] ||
                                      //   !consumeScores[row.accountNumber]
                                      // }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        acceptUse(u.referenceCode!);
                                      }}
                                    >
                                      {saveUse[u.id] ? (
                                        <SpinnerSVG className="h-6 w-5 animate-spin text-white" />
                                      ) : (
                                        "ثبت نهایی"
                                      )}
                                    </button>
                                    <button
                                      className="bg-red-300 w-[45%]   px-3 py-1 rounded disabled:opacity-50 flex justify-center items-center cursor-pointer"
                                      // disabled={
                                      //   saving[row.accountNumber] ||
                                      //   !consumeScores[row.accountNumber]
                                      // }
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        cancelUse(u.referenceCode!);
                                      }}
                                    >
                                      {calcleUse[u.id] ? (
                                        <SpinnerSVG className="h-6 w-5 animate-spin text-white" />
                                      ) : (
                                        "لغو"
                                      )}
                                    </button>
                                  </>
                                )}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            data.length > 0 &&
            selectedIndex !== null &&
            !data[selectedIndex].usedScore.length && <div></div>
          )}
        </div>
      )}
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
