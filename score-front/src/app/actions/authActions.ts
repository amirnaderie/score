"use server";
import axios from "axios";
import querystring from "querystring";

import { cookies } from "next/headers";

export const logOut = async () => {
  const cookieStore = await cookies();
  try {
    const accessToken = cookieStore.get("accessToken");
    
    // Only attempt to revoke if we have an access token
    if (accessToken?.value) {
      const basic = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
      const encodedToken = Buffer.from(basic).toString("base64");
      process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
      
      await axios.post(
        process.env.AUTH_URL + "revoke",
        querystring.stringify({
          token: accessToken.value,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + encodedToken,
          },
        }
      );
    }
    
    // Always delete the accessToken cookie, regardless of revoke success
    cookieStore.delete("accessToken");
    return true;
  } catch (error) {
    // Log the actual error for debugging
    console.error("Error during logout:", error);
    
    // Still delete the cookie even if revoke fails
    cookieStore.delete("accessToken");
    
    // Don't throw an error that prevents logout
    // The user should still be able to log out even if the revoke fails
    return true;
  }
};