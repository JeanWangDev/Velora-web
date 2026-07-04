"use client";

import Link, { type LinkProps } from "next/link";
import type { ReactNode } from "react";
import { useLocaleHref } from "@/i18n/locale-path";

type Props = Omit<LinkProps, "href"> & {
  href: string;
  children: ReactNode;
  className?: string;
};

/** 自动带上当前语言前缀的 Link */
export function LocaleLink({ href, children, className, ...rest }: Props) {
  const localeHref = useLocaleHref();
  return (
    <Link href={localeHref(href)} className={className} {...rest}>
      {children}
    </Link>
  );
}
