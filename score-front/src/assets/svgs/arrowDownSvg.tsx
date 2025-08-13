import { SVGProps } from 'react';

function ArrowDownSvg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 16 16'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M10.5469 11.9465V7.79317V4.05317C10.5469 3.41317 9.77354 3.09317 9.32021 3.5465L5.86688 6.99983C5.31354 7.55317 5.31354 8.45317 5.86688 9.0065L7.18021 10.3198L9.32021 12.4598C9.77354 12.9065 10.5469 12.5865 10.5469 11.9465Z'
        fill='#919191'
        className={props.className}
      />
    </svg>
  );
}
export default ArrowDownSvg;
