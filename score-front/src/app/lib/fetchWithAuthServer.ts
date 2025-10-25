// src/lib/fetchWithAuthServer.ts
import { cookies } from "next/headers";

/**
 * Server-side authenticated fetch function
 * Uses cookies from the request context to authenticate API calls
 */
export async function fetchWithAuthServer(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // Get cookies from the request context
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  // Prepare headers
  const headers: Record<string, string> = {
    "Content-Type":
      init?.headers && "Content-Type" in init.headers
        ? (init.headers["Content-Type"] as string)
        : "application/json",
  };

  // Copy existing headers
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      init.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(init.headers)) {
      init.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, init.headers);
    }
  }

  // Add authorization cookie if available
  if (accessToken) {
    headers["Cookie"] = `accessToken=${accessToken}`;
  }

  const requestInit: RequestInit = {
    ...init,
    headers,
    credentials: "include",
  };

  const response = await fetch(input, requestInit);

  // Handle 401 responses
  if (response.status === 401) {
    console.log("Received 401 in server-side fetch");
    // Note: We can't redirect directly from server components
    // The handling of unauthorized responses should be done in the calling component
  }

  return response;
}