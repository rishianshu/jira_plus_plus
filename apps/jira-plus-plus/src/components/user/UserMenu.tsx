import { Menu, LogOut, UserCircle } from "lucide-react";
import { useState } from "react";
import type { AuthUser } from "../../providers/AuthProvider";
import { useAuth } from "../../providers/AuthProvider";

interface UserMenuProps {
  user: AuthUser;
}

export function UserMenu({ user }: UserMenuProps) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const initials = user.displayName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleToggle = () => setOpen((prev) => !prev);

  const handleSignOut = async () => {
    await logout();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          {initials}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-xs uppercase tracking-wide text-slate-400 dark:text-slate-500">Welcome</span>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">{user.displayName}</span>
        </span>
        <Menu className="h-4 w-4 text-slate-400" />
      </button>

      {open ? (
        <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-100 px-3 py-2 text-sm dark:bg-slate-800">
            <UserCircle className="h-5 w-5 text-slate-400" />
            <div>
              <p className="font-medium text-slate-700 dark:text-slate-200">{user.displayName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
