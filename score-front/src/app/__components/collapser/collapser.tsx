"use client";

import { useRef, useEffect, FC, ReactNode } from "react";

type BaseCollapserProps = {
  children: ReactNode;
};

type BaseCollapserHeaderProps = {
  id: number;
  isOpen: boolean | undefined;
  children: ReactNode;
  clickOnHeader: (id: number) => void;
  
};

type BaseCollapserContentProps = {
  id: number;
  children: ReactNode;
};

export const BaseCollapser: FC<BaseCollapserProps> = ({ children }) => {
  return <>{children}</>;
};

export const BaseCollapserHeader: FC<BaseCollapserHeaderProps> = (props) => {
  const { id, isOpen, children } = props;
  const openClose = useRef<string>("close");

  useEffect(() => {
    const el = document.getElementById(id.toString()) as HTMLElement;
    if (isOpen) {
      expandSection(el);
    } else {
      collapseSection(el);
    }
  }, [isOpen, id]);

  const expandSection = (element: HTMLElement) => {
    const sectionHeight = element.scrollHeight;
    element.style.height = sectionHeight + "px";
    openClose.current = "open";
  };

  const collapseSection = (element: HTMLElement) => {
    element.style.transition = "all 0.3s ease 0s";
    element.style.height = 0 + "px";
    openClose.current = "close";
  };

  const clickOnHeader = () => {
    const element = document.getElementById(id.toString()) as HTMLElement;
    props.clickOnHeader(id);

    if (openClose.current == "close") return expandSection(element);
    else if (openClose.current == "open") return collapseSection(element);
    else if (openClose.current === "close" && isOpen)
      return expandSection(element);
    else return collapseSection(element);
  };

  return (
    <div id={id + "-header"} onClick={() => clickOnHeader()}>
      {children}
    </div>
  );
};

export const BaseCollapserContent: FC<BaseCollapserContentProps> = ({
  id,
  children,
}) => {
  return (
    <div
      id={id.toString()}
      style={{ overflow: "hidden", transition: "all 0.3s ease-in-out" }}
    >
      {children}
    </div>
  );
};
