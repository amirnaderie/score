"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import { ScoreApi } from "@/app/dashboard/support/api/apis";
import { convertToGregorian } from "@/utils/dateConverter";

export default function SupportPage() {
  const [nationalCode, setNationalCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [score, setScore] = useState<number | string>("");
  const [updatedAt, setUpdatedAt] = useState("");
  const [scoreId, setScoreId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await ScoreApi.getScoreByNationalCodeAndAccountNumber(
        nationalCode,
        accountNumber
      );
      if (response.status === 200) {
        const data = await response.json();
        if (data && data.id) {
          setScoreId(data.id);
          setScore(data.score);
          setUpdatedAt(data.updatedAt); // Assuming updatedAt is already in yyyy/mm/dd or similar format
          setIsEditing(true);
          toast.success("Score found!");
        } else {
          setScoreId(null);
          setScore("");
          setUpdatedAt("");
          setIsEditing(false);
          toast.info("No score found. You can create a new one.");
        }
      } else {
        toast.error("Error searching for score.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("An error occurred during search.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const gregorianDate = convertToGregorian(updatedAt);
      if (!gregorianDate) {
        toast.error("Invalid date format. Please use yyyy/mm/dd.");
        setLoading(false);
        return;
      }

      if (isEditing && scoreId) {
        // Update existing score
        const response = await ScoreApi.updateScore(
          scoreId,
          Number(score),
          gregorianDate
        );
        if (response.status === 200) {
          toast.success("Score updated successfully!");
        } else {
          toast.error("Error updating score.");
        }
      } else {
        // Create new score
        const response = await ScoreApi.createScore({
          nationalCode,
          accountNumber,
          score: Number(score),
          updatedAt: gregorianDate,
        });
        if (response.status === 201) {
          toast.success("Score created successfully!");
          setIsEditing(true);
          const data = await response.json();
          setScoreId(data.id);
        } else {
          toast.error("Error creating score.");
        }
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("An error occurred during submission.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Score Management</h1>

      <div className="mb-4">
        <label htmlFor="nationalCode" className="block text-sm font-medium text-gray-700">National Code</label>
        <input
          type="text"
          id="nationalCode"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={nationalCode}
          onChange={(e) => setNationalCode(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
        <input
          type="text"
          id="accountNumber"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
        />
      </div>

      <button
        onClick={handleSearch}
        disabled={loading || !nationalCode || !accountNumber}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed mb-4"
      >
        {loading ? "Searching..." : "Search Score"}
      </button>

      {(isEditing || (!isEditing && nationalCode && accountNumber)) && (
        <div className="mt-6 p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">{isEditing ? "Edit Score" : "Create New Score"}</h2>

          <div className="mb-4">
            <label htmlFor="score" className="block text-sm font-medium text-gray-700">Score</label>
            <input
              type="number"
              id="score"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={score}
              onChange={(e) => setScore(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="updatedAt" className="block text-sm font-medium text-gray-700">Updated At (yyyy/mm/dd)</label>
            <input
              type="text"
              id="updatedAt"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              value={updatedAt}
              onChange={(e) => setUpdatedAt(e.target.value)}
              placeholder="e.g., 1402/01/15 or 2023/04/04"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || !score || !updatedAt}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : (isEditing ? "Update Score" : "Create Score")}
          </button>
        </div>
      )}
    </div>
  );
}