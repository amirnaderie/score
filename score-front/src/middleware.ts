import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define public paths
const publicPaths = ["/login", "/logout", "/callback", "/","/dashboard"];

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Clone the request headers and set a new header `x-hello-from-middleware1`
  const requestHeaders = new Headers(request.headers);

  // Get the origin of the request
  const origin = request.headers.get("origin");
  const requestUrl = request.nextUrl.origin; // The URL of the project itself
  const pathname = request.nextUrl.pathname; // Get the request path

  // Check if the path is public
  const isPublicPath = publicPaths.includes(pathname);

  // You can add logic here based on whether the path is public
  // For example, skip authentication for public paths
  if (isPublicPath) {
    // console.log(`Accessing public path: ${pathname}`);
    // Potentially add a header or modify response for public paths
    requestHeaders.set("x-path-type", "public");
  } else {
    // console.log(`Accessing protected path: ${pathname}`);
    requestHeaders.set("x-path-type", "protected");

    // Check for access token in Authorization header
    // const authorizationHeader = request.headers.get("Authorization");
    //console.log('aaaaaaaaaaaaaaaaaa', request.cookies.get("accessToken"))
    const token = request.cookies.get("accessToken")?.value;;// authorizationHeader?.split(" ")[1]; // Assuming 'Bearer <token>' format

    // Basic check: If no token, redirect to login
    // In a real app, you'd validate the token here (e.g., using JWT library)
    if (!token) {
      console.log('No access token found, redirecting to login.');
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    // If token exists (basic check passed), proceed
    // console.log('Access token found, proceeding.');
    // Add more robust token validation logic here if needed
  }

  // Create a response object
  const response = NextResponse.next({
    request: {
      // New request headers
      headers: requestHeaders,
    },
  });

  response.headers.set("x-pathname", request.nextUrl.pathname);
  // Allow requests from the same origin for CORS
  if (origin === requestUrl) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  }

  // Set standard CORS headers
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");

  // Handle OPTIONS requests
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: new Headers({
        // Conditionally set Allow-Origin based on environment
        "Access-Control-Allow-Origin":
          process.env.NODE_ENV === "production" ? origin ?? "*" : "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
      }),
    });
  }

  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // Example: Match only API routes
    // '/api/:path*',
  ],
};
