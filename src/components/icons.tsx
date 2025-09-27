import type { SVGProps } from "react";

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      aria-label="MediReportAI Logo"
      {...props}
    >
      <path
        fill="hsl(var(--primary))"
        d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24Zm0 192a88 88 0 1 1 88-88a88.1 88.1 0 0 1-88 88Z"
      />
      <path
        fill="hsl(var(--primary))"
        d="M178.29 94.29a8 8 0 0 1-11.32 0L128 55.59l-39 38.69a8 8 0 0 1-11.31-11.32l44.66-44.66a8 8 0 0 1 11.32 0Z"
        transform="translate(0 32)"
      />
      <path
        fill="hsl(var(--primary))"
        d="M128 112a8 8 0 0 1-8-8V72a8 8 0 0 1 16 0v32a8 8 0 0 1-8 8Z"
        transform="translate(0 32)"
      />
       <path
        fill="hsl(var(--foreground))"
        d="M168 152h-24v-16a8 8 0 0 0-16 0v16h-24a8 8 0 0 0 0 16h24v16a8 8 0 0 0 16 0v-16h24a8 8 0 0 0 0-16Z"
      />
    </svg>
  );
}
