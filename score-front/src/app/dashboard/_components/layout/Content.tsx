"use client";

import { FC, ReactNode, useState } from "react";
import {
  NavbarAction,
  useNavbarClickHandler,
} from "@/hooks/useNavbarClickHandler";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ArrowSvg from "@/assets/svgs/arrowSvg";

interface ContentProps {
  children: ReactNode;
}

const Content: FC<ContentProps> = ({ children }) => {
  const [navState, setNavState] = useState<
    | "desktop"
    | "tablet-large"
    | "tablet-small"
    | "mobile-large"
    | "mobile-close"
  >("desktop");

  useNavbarClickHandler({
    onAction: (action: NavbarAction) => {
      console.log(action, navState, "action navState 787878");
      // mobile
      if (
        (action === "arrowSidebar-xl" || action === "arrowSidebar-sm") &&
        (navState === "desktop" ||
          navState === "tablet-large" ||
          navState === "tablet-small")
      ) {
        setNavState("mobile-close");
      }
      if (action === "arrowSidebar-sm" && navState === "mobile-large") {
        setNavState("mobile-close");
      }

      // tablet
      if (action === "arrowSidebar-md" && navState === "tablet-small") {
        setNavState("tablet-large");
      }

      if (action === "arrowSidebar-md" && navState === "tablet-large") {
        setNavState("tablet-small");
      }
      if (action === "arrowSidebar-md" && navState === "mobile-close") {
        setNavState("tablet-large");
      }

      if (
        action === "arrowSidebar-md" &&
        (navState === "mobile-large" || navState === "desktop")
      ) {
        setNavState("tablet-large");
      }

      // navbarIcon
      if (action === "navbarIcon") {
        setNavState("mobile-large");
      }
    },
  });

  return (
    <>
      <div className={`w-full`}>
        <Sidebar navState={navState} />
        <div
          className={`mr-auto p-5 bg-back dark:bg-primary-0 
            ${
              (navState === "mobile-close" ||
                navState === "mobile-large" ||
                navState === "desktop") &&
              "w-full md:rounded-s-4xl md:relative md:z-20 md:w-[calc(100%-85px)]  lg:w-[calc(100%-250px)]"
            }
            ${
              navState === "tablet-small" &&
              "w-full md:rounded-s-4xl md:relative md:z-20 md:w-[calc(100%-85px)]  lg:w-[calc(100%-250px)]"
            }
            ${navState === "mobile-close" && "w-full lg:w-[calc(100%-250px)]"}
            ${navState === "tablet-large" ? "lg:w-[calc(100%-250px)]" : ""}
            
          lg:rounded-s-4xl
          lg:relative lg:z-20
            `}
        >
          <Header navState={navState} />
          {/*  100dvh => 100% */}
          <div className=" bg-white dark:bg-primary-00 relative !overflow-x-hidden rounded-2xl mt-5 w-full h-[calc(100dvh_-_178px)] min-h-[calc(100dvh_-_178px)] flex justify-between flex-col">
            {children}
          </div>

          <div className="text-center dark:text-white-02 text-black-03 text-xs pt-5">
            تمامی حقوق مادی و معنوی این سامانه متعلق به
            <span className="text-Secondary-01 mx-1"> بانک سپه </span>{" "}
            می باشد.
          </div>

          <div
            id="arrowSidebar"
            className={`block lg:hidden w-max group bg-Secondary-01 hover:bg-Secondary-03 rounded-lg p-1 cursor-pointer absolute  -right-6 top-1/2 -translate-y-1/2
            ${
              navState == "desktop" ||
              navState == "mobile-close" ||
              navState == "mobile-large"
                ? "right-[265px] md:-right-[16px] z-20 md:z-20 block md:block lg:hidden"
                : ""
            }
            ${navState == "desktop" ? "hidden" : ""}
            ${
              navState == "tablet-large"
                ? "hidden md:block lg:hidden right-[265px] z-20"
                : ""
            }
          ${
            navState === "tablet-small"
              ? "hidden md:block lg:hidden right-[265px] md:-right-[16px]"
              : ""
          }
          ${navState === "mobile-close" ? "hidden" : ""}
            
            `}
          >
            <ArrowSvg
              id="arrowSidebar"
              className="fill-white-01 group-hover:fill-Secondary-01 pl-0.5 pt-0.5"
              width={24}
              height={24}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Content;
