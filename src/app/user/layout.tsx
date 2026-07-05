import { UserAccountShell } from "@/components/user/user-account-shell";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <UserAccountShell>{children}</UserAccountShell>;
}
