"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useLocaleHref } from "@/i18n/locale-path";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
};

/** 自动带上当前语言前缀的 Link */
export function LocaleLink({ href, children, ...rest }: Props) {
  const localeHref = useLocaleHref();
  return (
    <Link href={localeHref(href)} {...rest}>
      {children}
    </Link>
  );
}
