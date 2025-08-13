import ProfileSvg from "@/assets/svgs/profileSvg";
import SettingsSvg from "@/assets/svgs/settingsSvg";
import { FC } from "react";

interface Props {
  parentClassname?: string;
  classname?: string;
}

const ProfileIcon: FC<Props> = (props) => {
  const {
    classname = "fill-Secondary-01 group-hover:fill-white-01",
    parentClassname = "bg-Secondary-03 hover:bg-Secondary-01",
  } = props;
  return (
    <>
      <div
        className={`group rounded-xl p-2 cursor-pointer w-max ${parentClassname}`}
      >
        <ProfileSvg className={`${classname}`} width={18} height={18} />
      </div>
    </>
  );
};

export default ProfileIcon;
