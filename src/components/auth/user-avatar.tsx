import { User } from "lucide-react";

interface UserAvatarProps {
  nickname: string;
  className?: string;
}

export function UserAvatar({ nickname, className = "" }: UserAvatarProps) {
  const initial = nickname.trim().charAt(0).toUpperCase();

  return (
    <span
      className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-accent/10 ${className}`}
      aria-hidden
    >
      {initial ? (
        <span className="text-sm font-semibold text-accent">{initial}</span>
      ) : (
        <User className="h-4 w-4 text-accent" />
      )}
    </span>
  );
}
