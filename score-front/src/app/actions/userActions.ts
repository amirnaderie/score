"use server";
import querystring from "querystring";
import { cookies } from "next/headers";


export const verifyToken = async (token: string) => {
  try {
    const basic = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
    const encodedToken = Buffer.from(basic).toString("base64");
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    if (!token || token === "") {
      console.error(`token is null`);
      return null;
    }
    const response = await fetch(process.env.AUTH_URL + "api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + encodedToken,
      },
      body: querystring.stringify({ token: token }),
      next: { revalidate: 1200 },
    });

    if (response.ok) {
      const retVal = await response.json();
      return retVal;
    } else {
      console.error(
        `verifyToken failed  Status: ${response.status} token: ${token}`
      );
      return null;
    }
  } catch (error) {
    console.error("Error in verifyToken:", error);
    if (
      (error as any)?.response?.status &&
      ((error as any).response.status === 401 ||
        ((error as any).response.status === 400 &&
          (error as any).response.data.includes("invalid token")))
    ) {
      throw new Error("invalid token");
    } else {
      throw new Error("error in server");
    }
  }
};

export const getUserData = async () => {
  try {
    if (process.env.NEED_AUTHENTICATION === "true") {
      const nextCookies = await cookies(); // Get cookies object
      const userCookie = nextCookies.get("accessToken"); // Find cookie

      let userData: any = {};
      userData = await verifyToken(userCookie?.value || "");
      return userData;
    } else
      return {
        id: "669f5973eaf17d3c9868d37e",
        name: "inspector.test",
        roles: ["inspector.test"],
      };
  } catch (error) {
    throw new Error("error in Server");
  }
};

// export const getUserById = async (userId: string) => {
//   try {
//     const user = await prisma.userTbl.findUnique({
//       where: {
//         id: userId,
//       },
//     });
//     return { ...user, isAdmin: user?.roleId === 1 ? true : false };
//   } catch (error) {
//     throw new Error("error in Server");
//   }
// };
