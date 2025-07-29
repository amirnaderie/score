// src/lib/fetchWithAuthClient.ts

// Function to handle redirection to login
function redirectToLogin(): void {
  // Assuming your login page is at '/login'
  window.location.href = "/login";
}

async function refreshTokenClient(): Promise<boolean> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Add this to ensure cookies are sent
      }
    );

    if (!response.ok) {
      redirectToLogin();
      return false;
    }

    return true;
  } catch (error) {
    redirectToLogin();
    return false;
  }
}

export async function fetchWithAuthClient(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const requestInit: RequestInit = {
    ...init,
    headers: {
      ...init?.headers,
      "Content-Type":
        init?.headers && "Content-Type" in init.headers
          ? init.headers["Content-Type"]
          : "application/json", // Keep or set default Content-Type
    },
    credentials: init?.credentials || "include",
  };

  let response = await fetch(input, requestInit);

  if (response.status === 401) {
    console.log(
      "Received 401, attempting to refresh token via HttpOnly cookie mechanism..."
    );
    redirectToLogin(); // Fallback redirect
    // const refreshSuccessful = await refreshTokenClient();

    // if (refreshSuccessful) {
    //     // Retry the request. The browser will now use the new HttpOnly accessToken cookie.
    //     response = await fetch(input, requestInit); // Use the same requestInit, browser handles new cookie
    // } else {
    //     if (!response.redirected) { // Check if already redirected by refreshTokenClient
    //         redirectToLogin(); // Fallback redirect
    //     }
    //     throw new Error("Session expired or refresh failed. Please log in again.");
    // }
  }

  return response;
}
