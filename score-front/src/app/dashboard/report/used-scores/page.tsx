"use client";

import { useState, useCallback, useEffect } from "react";
import toast from "react-hot-toast";
import useSWR from "swr";
import {
  UsedScoresSearchParams,
  usedScoresApi,
  UsedScoreData,
  PaginatedUsedScoresResponse,
} from "./api/apis";
import { SearchForm } from "./_components/SearchForm";
import { UsedScoresTable } from "./_components/UsedScoresTable";
import { Pagination } from "./_components/Pagination";
import { UpdateScoreModal } from "./_components/UpdateScoreModal";
import { DeleteConfirmModal } from "./_components/DeleteConfirmModal";

const fetcher = async (url: string) => {
  try {
    // Extract nationalCode, page, and limit from the URL
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const nationalCode = pathParts[pathParts.length - 1];
    const page = urlObj.searchParams.get("page") || "1";
    const limit = urlObj.searchParams.get("limit") || "8";

    const result = await usedScoresApi.getUsedScoresByNationalCode({
      nationalCode,
      page: parseInt(page),
      limit: parseInt(limit),
    });

    return result; // Now returns PaginatedUsedScoresResponse directly
  } catch (error) {
    console.error("Fetcher error:", error);
    throw error;
  }
};

export default function UsedScoresPage() {
  const [searchParams, setSearchParams] = useState<UsedScoresSearchParams>({
    nationalCode: "",
    page: 1,
    limit: 8,
  });

  const [updateModalData, setUpdateModalData] = useState<{
    isOpen: boolean;
    usedScore: UsedScoreData | null;
  }>({
    isOpen: false,
    usedScore: null,
  });

  const [deleteModalData, setDeleteModalData] = useState<{
    isOpen: boolean;
    usedScore: UsedScoreData | null;
  }>({
    isOpen: false,
    usedScore: null,
  });

  const shouldFetch = searchParams.nationalCode.trim() !== "";

  const { data, error, isLoading, mutate } =
    useSWR<PaginatedUsedScoresResponse>(
      shouldFetch
        ? `${process.env.NEXT_PUBLIC_API_URL}/front/score/used-scores/by-national-code/${searchParams.nationalCode}?page=${searchParams.page}&limit=${searchParams.limit}`
        : null,
      fetcher,
      {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
      }
    );

  const handleSearch = useCallback((nationalCode: string) => {
    setSearchParams((prev) => ({
      ...prev,
      nationalCode,
      page: 1,
    }));
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setSearchParams((prev) => ({
      ...prev,
      page,
    }));
  }, []);

  const handleUpdateScore = useCallback((usedScore: UsedScoreData) => {
    setUpdateModalData({
      isOpen: true,
      usedScore,
    });
  }, []);

  const handleDeleteScore = useCallback((usedScore: UsedScoreData) => {
    setDeleteModalData({
      isOpen: true,
      usedScore,
    });
  }, []);

  const handleUpdateSubmit = async (newScore: number) => {
    if (!updateModalData.usedScore) return;

    try {
      await usedScoresApi.updateUsedScore(
        updateModalData.usedScore.id,
        newScore
      );
      toast.success("امتیاز با موفقیت بروزرسانی شد");
      mutate();
      setUpdateModalData({ isOpen: false, usedScore: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "خطا در بروزرسانی امتیاز";
      toast.error(errorMessage);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalData.usedScore) return;

    try {
      await usedScoresApi.deleteUsedScore(deleteModalData.usedScore.id);
      toast.success("امتیاز با موفقیت حذف شد");
      mutate();
      setDeleteModalData({ isOpen: false, usedScore: null });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "خطا در حذف امتیاز";
      toast.error(errorMessage);
    }
  };

  // Handle SWR error with useEffect to avoid multiple toast calls
  useEffect(() => {
    if (error) {
      toast.error("خطا در دریافت اطلاعات");
    }
  }, [error]);

  // // Debug logging to understand the data structure
  // useEffect(() => {
  //   console.log("SWR data:", data);
  //   console.log("SWR data type:", typeof data);
  //   console.log("SWR data?.data:", data?.data);
  //   console.log("SWR data?.data type:", typeof data?.data);
  //   console.log("SWR data?.data isArray:", Array.isArray(data?.data));
  // }, [data]);

  return (
    <div className="container mx-auto p-2">

      <SearchForm onSearch={handleSearch} isLoading={isLoading} />

      {shouldFetch && (
        <>
          <UsedScoresTable
            data={data?.data || []}
            isLoading={isLoading}
            onUpdateScore={handleUpdateScore}
            onDeleteScore={handleDeleteScore}
          />

          {data && data.totalPages > 1 && (
            <Pagination
              currentPage={searchParams.page || 1}
              totalPages={data.totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      )}

      <UpdateScoreModal
        isOpen={updateModalData.isOpen}
        usedScore={updateModalData.usedScore}
        onClose={() => setUpdateModalData({ isOpen: false, usedScore: null })}
        onSubmit={handleUpdateSubmit}
      />

      <DeleteConfirmModal
        isOpen={deleteModalData.isOpen}
        usedScore={deleteModalData.usedScore}
        onClose={() => setDeleteModalData({ isOpen: false, usedScore: null })}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
