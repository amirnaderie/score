"use client";

import React, { FC, useState } from "react";
import Link from "next/link";
import {
  BaseCollapser,
  BaseCollapserContent,
  BaseCollapserHeader,
} from "@/app/_components/collapser";
import Image from "next/image";
import { UseStore } from "@/store/useStore";
import ArrowDownSvg from "@/assets/svgs/arrowDownSvg";

type IItem = {
  label: string;
  key: string;
  isOpen?: boolean;
  iconComponent?: React.ReactNode;
  roles?: string[];
};

type INavbarItem = IItem & { children?: IItem[] };

interface Props {
  navState:
    | "desktop"
    | "tablet-large"
    | "tablet-small"
    | "mobile-large"
    | "mobile-close";
}

import { useEffect } from "react";

// Add role mapping for menu items
const MENU_ROLES = {
  score: ["score.view", "score.confirm", "score.branch","score.admin"],
  // Add more menu items and their required roles here
};

const Sidebar: FC<Props> = (props) => {
  const { navState } = props;
  const [selectedItem, setSelectedItem] = useState<IItem>();
  const user = UseStore((state) => state.userData);
  const [profileIsOpen, setProfileIsOpen] = useState(false);

  // Define all possible menu items with their roles
  const allMenuItems: INavbarItem[] = [
    {
      label: "عملیات",
      key: "actions",
      isOpen: false,
      children: [
        {
          label: "مصرف امتیاز",
          key: "score",
          isOpen: false,
          // Using MENU_ROLES instead of inline roles
          ...MENU_ROLES.score,
          //roles: ['score.view', 'score.confirm', 'score.branch']
        },
        {
          label: "مدیریت امتیاز",
          key: "support",
          isOpen: false,
          roles: ["score.confirm"],
        },
        {
          label: "انتقال امتیاز",
          key: "transfer",
          isOpen: false,
          roles: ["score.confirm"],
        },
      ],
    },
    {
      label: "گزارش",
      key: "reports",
      isOpen: false,
      children: [
        {
          label: "انتقال ها",
          key: "report/transfer",
          isOpen: false,
          ...MENU_ROLES.score,
        },
        {
          label: "لاگ ها",
          key: "report/log",
          isOpen: false,
          roles: ["score.admin"],
        },
        {
          label: "تعهدات",
          key: "report/taahod",
          isOpen: false,
          roles: ["score.admin","score.confirm"],
        },
        {
          label: "تسهیلات در حال اقدام",
          key: "report/facilities-in-progress",
          isOpen: false,
          roles: ["score.branch"],
        },
      ],
    },
    // Add more menu items with roles as needed
  ];

  // Filter menu items based on user roles
  const [items, setItems] = useState<INavbarItem[]>([]);

  useEffect(() => {
    if (user?.roles) {
      const filteredItems = allMenuItems
        .map((item) => ({
          ...item,
          children: item.children?.filter(
            (child) =>
              !child.roles ||
              child.roles.some((role) => user.roles?.includes(role))
          ),
        }))
        .filter((item) => !item.children || item.children.length > 0);
      setItems(filteredItems);
    } else {
      setItems(allMenuItems);
    }
  }, [user]);

  const clickOnHeader = (i: number): void => {
    const localItems = items.map((item: INavbarItem, index: number) =>
      index !== i
        ? { ...item, isOpen: false }
        : { ...item, isOpen: !items[i].isOpen }
    );

    setItems(localItems);
  };

  const clickOnProfileHeader = () => {
    setProfileIsOpen((old) => !old);
  };

  const handelSelectedItem = async (item: IItem) => {
    try {
      if (setSelectedItem) setSelectedItem(item);
    } catch (error) {
      // router.push(`${logout_uri}api/auth/logout`);
      console.error(error, "err");
    }
  };

  return (
    <>
      <div
        className={` md:p-0  bg-transparent lg:bg-back lg:dark:bg-primary-0  dark:bg-[url('/images/sidebar-pattern-dark.png')] bg-[url('/images/sidebar-pattern.png')] 
          bg-cover bg-right bg-no-repeat fixed -right-2 -top-2 bottom-0
         lg:p-4 lg:w-[295px] z-20
          h-[calc(100%+20px)]
           ${
             navState === "desktop" ||
             navState === "mobile-close" ||
             navState === "tablet-small"
               ? "w-0 p-0 md:w-[125px] lg:w-[295px]"
               : " p-5"
           }

           ${
             navState === "tablet-large"
               ? "w-0 !p-0 md:p-5 md:w-[295px] lg:w-[295px]"
               : ""
           }
           ${
             navState === "mobile-large"
               ? "w-[295px] md:w-[125px] lg:w-[295px]"
               : ""
           }`}
      >
        <div className="w-full overflow-hidden">
          <BaseCollapser key={9999}>
            <BaseCollapserHeader
              id={9999}
              isOpen={profileIsOpen}
              clickOnHeader={(e) => clickOnProfileHeader()}
            >
              <div
                className={`w-full flex items-center justify-between rounded-lg px-4 text-sm cursor-pointer py-3 
                 ${
                   navState === "desktop" || navState === "tablet-small"
                     ? "pr-5"
                     : ""
                 }
                  `}
              >
                <div className="flex flex-col items-start gap-2 w-full">
                  <div
                    className={`${
                      navState === "desktop" || navState === "tablet-small"
                        ? " block md:mr-4.5 md:mt-4 mt-0"
                        : ""
                    }                             ${
                      navState === "mobile-large" || navState === "mobile-close"
                        ? "md:mr-4.5 md:mt-4 mt-0 "
                        : ""
                    }
                    `}
                  >
                    {/* <Image
                      width={32}
                      height={32}
                      src={"/images/avatar-image.png"}
                      className="rounded-lg"
                      alt="avatar-image"
                      quality={100}
                    /> */}
                  </div>
                  <div
                    className={`text-white-02 text-xs
                     ${
                       navState === "desktop" || navState === "tablet-small"
                         ? " hidden lg:block"
                         : ""
                     }
                              ${
                                navState === "desktop" ||
                                navState === "tablet-small"
                                  ? " block md:hidden lg:block"
                                  : ""
                              }
                              ${
                                navState === "mobile-large" ||
                                navState === "mobile-close"
                                  ? "block md:hidden lg:block"
                                  : ""
                              }
                    `}
                  >
                    نام کـاربـری
                  </div>
                  <div
                    className={`text-white-01 mr-4 ${
                      navState === "tablet-small" && "hidden lg:block"
                    }
                    
                      ${
                        navState === "desktop" || navState === "tablet-small"
                          ? " hidden lg:block"
                          : ""
                      }
                              ${
                                navState === "desktop" ||
                                navState === "tablet-small"
                                  ? "block md:hidden lg:block"
                                  : ""
                              }
                              ${
                                navState === "mobile-large" ||
                                navState === "mobile-close"
                                  ? "block md:hidden lg:block"
                                  : ""
                              }
                    `}
                  >
                    {user?.personelCode || ""}
                  </div>
                </div>
              </div>
            </BaseCollapserHeader>
            <BaseCollapserContent id={9999}>
              <div className=" text-sm rounded-lg ">
                {/* <Link
                  key={`BaseCollapserContent-${66}`}
                  className={`transition-colors rounded-lg px-4 w-full cursor-pointer text-sm block mb-2 py-3 `}
                  href={"/dashboard/profile"}
                  id="navbar-item"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div
                      className={`text-white-01 select-none 
                        ${
                          (navState === "desktop" ||
                            navState === "tablet-small") &&
                          "hidden lg:block"
                        }
                      `}
                    >
                      پروفایل
                    </div>
                  </div>
                </Link> */}
              </div>
            </BaseCollapserContent>
          </BaseCollapser>
          <div
            className={`w-10/12 mx-auto h-px bg-gradient-to-r from-transparent via-white to-transparent mb-3 mt-4 lg:ml-8`}
          />
          {items.map((item: INavbarItem, index: number) => {
            const isActive = selectedItem?.key === item.key;
            if (item.children && item.children.length > 0) {
              return (
                <BaseCollapser key={index}>
                  <BaseCollapserHeader
                    id={index}
                    isOpen={item.isOpen || false}
                    clickOnHeader={(e) => clickOnHeader(e)}
                  >
                    <div
                      className={`w-full flex items-center justify-between rounded-lg px-4 text-sm cursor-pointer py-3 `}
                    >
                      <div
                        className={`flex items-center gap-2 w-full
                                 ${
                                   navState === "desktop" ||
                                   navState === "tablet-small"
                                     ? " md:pr-4.5 lg:p-0"
                                     : ""
                                 }
                              ${
                                navState === "desktop" ||
                                navState === "tablet-small"
                                  ? " md:pr-4.5 lg:p-0"
                                  : ""
                              }
                              ${
                                navState === "mobile-large" ||
                                navState === "mobile-close"
                                  ? "md:pr-4.5 lg:p-0"
                                  : ""
                              }
                        `}
                      >
                        {item.iconComponent && (
                          <div className="">{item.iconComponent}</div>
                        )}
                        <div
                          className={`text-white-01 select-none ${
                            (navState === "desktop" ||
                              navState === "tablet-small" ||
                              navState === "mobile-close") &&
                            "hidden lg:block"
                          }
                        ${
                          navState === "mobile-large"
                            ? "md:hidden lg:block"
                            : ""
                        }
                      
                          `}
                        >
                          {item.label}
                        </div>
                      </div>
                      <div
                        className={`ml-10 origin-center block ${
                          item.isOpen ? "" : ""
                        }
                        ${
                          (navState === "desktop" ||
                            navState === "tablet-small" ||
                            navState === "mobile-close") &&
                          "hidden lg:block"
                        }
                        ${
                          navState === "mobile-large"
                            ? "md:hidden lg:block"
                            : ""
                        }
                        `}
                        style={
                          item.isOpen
                            ? {
                                transform: `rotate(90deg)`,
                                transition: `transform 300ms`,
                                transformOrigin: "center center",
                              }
                            : {
                                transform: `rotate(-90deg)`,
                                transition: `transform 300ms`,
                                transformOrigin: "center center",
                              }
                        }
                      >
                        <ArrowDownSvg
                          width={16}
                          height={16}
                          className={` ${
                            item.isOpen ? "fill-white-01" : "fill-white-03"
                          }`}
                        />
                      </div>
                    </div>
                  </BaseCollapserHeader>
                  <BaseCollapserContent id={index}>
                    <div className=" text-sm rounded-lg ">
                      {item.children &&
                        item.children.map(
                          (navbarItem: INavbarItem, idx: number) => {
                            const x = selectedItem?.key === navbarItem.key;
                            return (
                              <Link
                                key={`BaseCollapserContent-${idx}`}
                                className={`transition-colors rounded-lg px-4 w-full cursor-pointer text-sm block mb-2 py-3  ${
                                  x && `text-sm `
                                }`}
                                href={`/dashboard/${navbarItem.key}`}
                                onClick={() => handelSelectedItem(navbarItem)}
                                id="navbar-item"
                              >
                                <div
                                  className={`flex items-center gap-2 w-full 
                                                                  ${
                                                                    navState ===
                                                                      "desktop" ||
                                                                    navState ===
                                                                      "tablet-small"
                                                                      ? " md:pr-4.5 lg:p-0"
                                                                      : ""
                                                                  }
                              ${
                                navState === "desktop" ||
                                navState === "tablet-small"
                                  ? " md:pr-4.5 lg:p-0"
                                  : ""
                              }
                              ${
                                navState === "mobile-large" ||
                                navState === "mobile-close"
                                  ? "md:pr-4.5 lg:p-0"
                                  : ""
                              }
                                  `}
                                >
                                  {item.iconComponent && (
                                    <div className="">{item.iconComponent}</div>
                                  )}
                                  <div
                                    className={` select-none hover:text-Secondary-01  ${
                                      x ? "text-Secondary-02" : "text-white-01"
                                    }  ${
                                      (navState === "desktop" ||
                                        navState === "tablet-small" ||
                                        navState === "mobile-close") &&
                                      "hidden lg:block"
                                    }
                                  ${
                                    navState === "mobile-large"
                                      ? "md:hidden lg:block"
                                      : ""
                                  }
                                 mr-3`}
                                  >
                                    {item.children![idx].label}
                                  </div>
                                </div>
                              </Link>
                            );
                          }
                        )}
                    </div>
                  </BaseCollapserContent>
                </BaseCollapser>
              );
            } else {
              return (
                <div className="w-full" key={`navigation-${item.key}`}>
                  <Link
                    key={`navigationNavLink-${item.key}`}
                    className={`transition-colors rounded-lg px-4 w-full cursor-pointer text-sm block py-3.5 my-1 ${
                      isActive && ` text-sm `
                    } `}
                    href={item.key}
                    onClick={(e) => {
                      handelSelectedItem(item);
                    }}
                    id={`navbar-item`}
                  >
                    {item.label}
                  </Link>
                </div>
              );
            }
          })}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
