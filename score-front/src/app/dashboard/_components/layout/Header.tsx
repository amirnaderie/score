"use client";

import { FC } from "react";
import Image from "next/image";
import NotificationIcon from "@/app/_components/icons/setting/notificationIcon";
import LogoutIcon from "@/app/_components/icons/setting/logoutIcon";
import NavbarIcon from "@/app/_components/icons/setting/navbarIcon";
import ThemeToggle from "@/app/_components/theme-toggle/ThemeToggle";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Props {
  navState:
    | "desktop"
    | "tablet-large"
    | "tablet-small"
    | "mobile-large"
    | "mobile-close";
}

const Header: FC<Props> = (props) => {
  const { navState } = props;
    const router = useRouter();

  const signOut = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/sign-out`,
        {
          method: "POST",
          credentials: "include", // Important!
        }
      );
      if (response.ok) {
        toast.success("خروج موفق");
        router.push(`${process.env.NEXT_PUBLIC_SSO_URI}api/auth/logout`);
      } else {
        toast.error("خطا در خروج");
      }
    } catch (error) {
      toast.error("خطا در خروج");
    }
  };
  return (
    <>
      <div className=" flex justify-between items-center p-6 bg-white dark:bg-primary-00 rounded-2xl">
        <div className="flex items-center gap-4">
          <div>
            <NavbarIcon
              id="navbarIcon"
              className={`lg:hidden md:hidden 
            
            ${navState == "tablet-small" ? "block md:hidden" : ""}
            `}
            />
          </div>
          <div>
            <div className="dark:hidden flex justify-center ">
              <Image alt="" width={32} height={32} src={"/images/dashboard-icon.png"} />
            </div>
            <div className="hidden dark:flex justify-center">
              <Image
                alt=""
                width={32}
                height={32}
                src={"/images/sepah-icon-small-dark.png"}
              />
            </div>
          </div>
          <div className="hidden md:block md:text-sm">
            مدیریت امتیاز تسهیلات
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* <div className="ml-6">سرچ</div> */}
          {/* <div>
            <ThemeToggle />
          </div> */}
          {/* <div>
            <NotificationIcon />
          </div> */}
          <div onClick={signOut}>
            <LogoutIcon />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
