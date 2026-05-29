"use client";

import Link from "next/link";
import { HOME_RESET_EVENT } from "./constants";

export default function HomeLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href="/"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent(HOME_RESET_EVENT));
      }}
    >
      {children}
    </Link>
  );
}
