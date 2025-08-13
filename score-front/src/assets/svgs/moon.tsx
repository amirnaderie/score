import { SVGProps } from "react";

function Moon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className="h-4 w-4 text-white"
      fill="currentColor"
      viewBox="0 0 20 20"
      {...props}
    >
      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
    </svg>
  );
}
export default Moon;
