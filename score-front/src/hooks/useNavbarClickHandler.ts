import { useCallback, useEffect } from "react";

export type NavbarAction =
  | "arrowSidebar-sm"
  | "arrowSidebar-md"
  | "arrowSidebar-lg"
  | "arrowSidebar-xl"
  | "arrowSidebar-2xl"
  | "navbarIcon";

export type sizeResponsive = "sm" | "md" | "lg" | "xl" | "2xl";
interface UseNavbarClickHandlerProps {
  onAction: (action: NavbarAction) => void;
}

export function useNavbarClickHandler({
  onAction,
}: UseNavbarClickHandlerProps) {
  const breakpoints: [number, string][] = [
    [1536, "2xl"],
    [1280, "xl"],
    [1024, "lg"],
    [768, "md"],
    [640, "sm"],
  ];

  const getTailwindBreakpoint = (width: number): sizeResponsive => {
    const bp = breakpoints.find(([minWidth]) => width >= minWidth);
    return bp ? (bp[1] as sizeResponsive) : "sm";
  };

  const handleClick = useCallback(
    (e: MouseEvent): void => {
      const target = e.target as HTMLElement;
      const elId = target.id;
      const parentId = target.parentElement?.id;

      const screenWidth = window.innerWidth;
      const breakpoint: sizeResponsive = getTailwindBreakpoint(screenWidth);
      console.log(screenWidth, breakpoint, "screenWidth");

      if (elId === "arrowSidebar") {
        onAction(`arrowSidebar-${breakpoint}`);
        // onAction(`arrowSidebar`);
      }

      if (elId === "navbarIcon") {
        onAction("navbarIcon");
      }
    },
    [onAction]
  );

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, [handleClick]);
}
