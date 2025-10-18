import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import clsx from "clsx";
import { Button } from "./button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  primaryAction?: ReactNode;
  contentClassName?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  primaryAction,
  contentClassName,
}: ModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur">
      <div
        className={clsx(
          "w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-slate-950/70",
          contentClassName,
        )}
      >
        <header className="mb-6 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {description ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 rounded-full p-0"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>
        <div className="space-y-6">{children}</div>
        {primaryAction ? <div className="mt-6 flex justify-end">{primaryAction}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
