"use client";

import Moon from "@/assets/svgs/moon";
import Sun from "@/assets/svgs/sun";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`
        relative inline-flex h-8 w-14 items-center rounded-full gap-x-2 cursor-pointer
        transition-colors duration-200 ease-in-out focus:outline-none outline-none 
        ${
          isDark
            ? "bg-slate-400 focus:ring-slate-500"
            : "bg-Secondary-02 focus:ring-bg-Secondary-02"
        }
      `}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full transition-transform duration-200 ease-in-out
          ${
            isDark
              ? "-translate-x-7 bg-blue-950"
              : "-translate-x-1 bg-orange-500"
          }
        `}
      >
        <span className="flex h-full w-full items-center justify-center">
          {isDark ? (
            // Moon icon for dark mode
            <Moon />
          ) : (
            // Sun icon for light mode
            <Sun />
          )}
        </span>
      </span>
      <span
        className={`
          inline-block h-6 w-6 transform rounded-full transition-transform duration-200 ease-in-out
          ${
            isDark
              ? "translate-x-7 bg-transparent"
              : "translate-x-0 bg-transparent"
          }
        `}
      >
        <span className="flex h-full w-full items-center justify-center">
          {isDark ? (
            // Sun icon for dark mode
            <Sun />
          ) : (
            // Moon icon for light mode
            <Moon />
          )}
        </span>
      </span>
    </button>
  );
}
