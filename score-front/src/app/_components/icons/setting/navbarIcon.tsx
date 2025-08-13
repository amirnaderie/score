import NavbarSvg from "@/assets/svgs/navbarSvg";
import { FC } from "react";

interface Props {
  id: string;
  className: string;
}

const NavbarIcon: FC<Props> = (props: Props) => {
  return (
    <>
      <div
        id={props.id}
        className={`group bg-back dark:bg-primary-0 hover:bg-primary-03 rounded-xl p-2 cursor-pointer w-max ${props.className}`}
      >
        <NavbarSvg
          className="fill-black-03  group-hover:fill-white-01"
          width={16}
          height={16}
          id={props.id}
        />
      </div>
    </>
  );
};

export default NavbarIcon;
