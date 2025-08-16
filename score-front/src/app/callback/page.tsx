"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "../type";
import { logOut } from "@/app/actions/authActions";
import SpinnerSVG from "../assets/svgs/spinnerSvg";
import toast from "react-hot-toast";
const logout_uri = process.env.NEXT_PUBLIC_SSO_URI;
import Cookies from "js-cookie";
import { UseStore } from "@/store/useStore";


function AuthCallbackInner() {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const updateUserData = UseStore((state) => state.updateUserData);
  const router = useRouter();
  const searchParams = useSearchParams();
  const signOut = async () => {
    try {
      await logOut();
    } catch (error) {}
    Cookies.remove("accessToken");
    Cookies.remove("refreshToken");
    router.push(`${logout_uri}api/auth/logout`);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const codeParameter = searchParams.get("code");
        const stateParameter = searchParams.get("state");
        const StateAuthCookie = sessionStorage.getItem("StateAuthCookie");

        if (codeParameter && StateAuthCookie === stateParameter) {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/auth`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                codeParameter,
              }),
              credentials: "include", // Important!
            }
          );

          setIsLoading(false);
          if (response.ok) {
            sessionStorage.removeItem("StateAuthCookie");
            const { data: userData } = await response.json();
            updateUserData(userData);
            router.push("/dashboard");
          } else {
            toast.error("خطا در احراز هویت");
            updateUserData(null);
            if (response.status === 401) {
              await signOut();
            }
          }
        } else {
          toast.error("خطا در احراز هویت");
          updateUserData(null);
          await signOut();
        }
      } catch (error) {
        updateUserData(null);
        toast.error("خطا در احراز هویت");
        setIsLoading(false);
      }
    };

    load();
  }, []);

  return (
    <div className="h-screen w-screen flex justify-center items-center">
      {isLoading && <SpinnerSVG className="h-4 w-4 animate-spin text-white" />}
    </div>
  );
}

const AuthCallback = () => (
  <Suspense fallback={<div className="h-screen w-screen flex justify-center items-center"><SpinnerSVG className="h-4 w-4 animate-spin text-white" /></div>}>
    <AuthCallbackInner />
  </Suspense>
);

export default AuthCallback;
