import type { ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  icon: ReactNode;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function LiquidConfirmDialog({
  open,
  icon,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading = false,
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open || typeof document === "undefined") return null;
  return createPortal(
    <div className="liquid-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-6">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="liquid-dialog w-full max-w-sm rounded-[32px] p-6 text-center text-g-text"
      >
        <span
          className={`liquid-icon mx-auto grid h-16 w-16 place-items-center rounded-full ${destructive ? "text-red-200" : "text-g-gold"}`}
        >
          {icon}
        </span>
        <h2 className="mt-5 text-xl font-semibold">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-g-muted">{description}</div>
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="liquid-button rounded-full py-3 font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-full py-3 font-semibold shadow-lg transition active:scale-95 disabled:opacity-50 ${destructive ? "bg-gradient-to-r from-red-500/90 to-rose-400/90 text-white shadow-red-500/25" : "g-cta text-g-bg"}`}
          >
            {loading ? "Aguarde…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
