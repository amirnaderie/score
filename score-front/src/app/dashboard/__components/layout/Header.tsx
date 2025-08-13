"use client";

import { FC } from "react";
import Image from "next/image";
import NotificationIcon from "@/app/__components/icons/setting/notificationIcon";
import LogoutIcon from "@/app/__components/icons/setting/logoutIcon";
import NavbarIcon from "@/app/__components/icons/setting/navbarIcon";
import ThemeToggle from "@/app/__components/theme-toggle/ThemeToggle";

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
              <Image alt="" width={32} height={32} src={"/images/icon72.png"} />
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
          <div>
            <ThemeToggle />
          </div>
          <div>
            <NotificationIcon />
          </div>
          <div>
            <LogoutIcon />
          </div>
        </div>
      </div>
    </>
  );
};

export default Header;
