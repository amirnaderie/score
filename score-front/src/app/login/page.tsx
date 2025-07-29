"use client";


import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { generateToken } from "../lib/utility";

const redirect_uri = process.env.NEXT_PUBLIC_REDIRECT_URI;
const client_id = process.env.NEXT_PUBLIC_CLIENT_ID;
const login_uri = process.env.NEXT_PUBLIC_SSO_URI;


const Login = () => {
  const router = useRouter();
  const csrfToken: string = generateToken(32);

  useEffect(() => {
    const load = async () => {
      try {
        sessionStorage.setItem("StateAuthCookie", csrfToken);
        router.push(
          `${login_uri}authorize?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=openid+profile+email+role&state=${csrfToken}`
        );
      } catch (error) {
        // handle error if needed
      }
    };
    load();
  }, []);
  return <div></div>;
};

export default Login;
