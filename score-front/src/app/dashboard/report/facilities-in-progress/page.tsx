import React from "react";
import { redirect } from "next/navigation";
import { facilitiesInProgressApiServer } from "./api/apisServer";
import { FacilitiesClient } from "./_components/FacilitiesClient";
import { FacilitiesInProgressResponse, FacilitiesInProgressParams } from "./api/apis";
import { fetchWithAuthServer } from "@/app/lib/fetchWithAuthServer";

// Custom error class for authentication errors
class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

// Server-side data fetching for initial load
async function getInitialData(): Promise<{
  data: FacilitiesInProgressResponse | null;
  params: FacilitiesInProgressParams | null;
}> {
  try {
    // Fetch first page data server-side ONLY for score.branch users
    const data = await facilitiesInProgressApiServer.getFacilitiesInProgress({
      page: 1,
      limit: 7
    });
    return {
      data,
      params: { page: 1, limit: 7 }
    };

  } catch (error) {
    console.error("Error fetching initial data:", error);
    // If it's an authentication error, redirect to login
    if (error instanceof AuthenticationError) {
      redirect("/login");
    }
    return {
      data: null,
      params: null
    };
  }
}

export default async function FacilitiesInProgressPage() {
  // Get initial data for SSR
  const { data: initialData, params: initialParams } = await getInitialData();

  return (
    <FacilitiesClient
      initialData={initialData}
      initialParams={initialParams}
    />
  );
}