import LogoutSvg from "@/assets/svgs/logoutSvg";
import NotificationSvg from "@/assets/svgs/notificationSvg";
import { FC } from "react";

const NotificationIcon: FC = () => {
  return (
    <>
      <div className="group bg-back dark:bg-primary-0 hover:bg-primary-03 rounded-xl p-2 cursor-pointer w-max">
        <NotificationSvg
          className="fill-black-03 group-hover:fill-white-01"
          width={18}
          height={18}
        />
      </div>
    </>
  );
};

export default NotificationIcon;
