"use server";
import axios from "axios";
import querystring from "querystring";

import { cookies } from "next/headers";

export const logOut = async () => {
  const cookieStore = await cookies(); // Not async
  try {
    const accessToken = cookieStore.get("accessToken");
    // const accessToken = cookies().get("accessToken");
    const basic = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
    const encodedToken = Buffer.from(basic).toString("base64");
    process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";
    const isValidAccessToken = await axios.post(
      process.env.AUTH_URL + "revoke",
      querystring.stringify({
        token: accessToken?.value,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + encodedToken,
        },
      }
    );
    cookieStore.delete("accessToken");
    return true;
  } catch (error) {
    cookieStore.delete("accessToken");

    throw new Error("Error in Connection ");
  }
};
