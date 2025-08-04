import SpinnerSVG from "@/app/assets/svgs/spinnerSvg";

export default function Loading() {
  return (
    <div className="h-full w-full flex justify-center items-center">
      <SpinnerSVG className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );
} 