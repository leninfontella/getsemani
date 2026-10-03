import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Sparkles } from "lucide-react";
import {
  deleteNotification,
  ensureAutomaticNotifications,
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED,
  type AppNotification,
} from "@/lib/notifications";

export function NotificationCenter({ name }: { name: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [drag, setDrag] = useState<{ id: string; startX: number; offset: number }>();
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const refresh = () => setItems(loadNotifications());
    ensureAutomaticNotifications();
    refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [name]);

  useEffect(() => {
    if (!open) return;
    const positionPanel = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const isMobile = window.matchMedia("(max-width: 640px)").matches;
      setPanelStyle({
        top: Math.min(rect.bottom + 12, window.innerHeight - 120),
        ...(isMobile
          ? { left: "50%", right: "auto", transform: "translateX(-50%)" }
          : {
              left: "auto",
              right: Math.max(20, window.innerWidth - rect.right),
              transform: "none",
            }),
      });
    };
    positionPanel();
    window.addEventListener("resize", positionPanel);
    window.addEventListener("scroll", positionPanel, true);
    return () => {
      window.removeEventListener("resize", positionPanel);
      window.removeEventListener("scroll", positionPanel, true);
    };
  }, [open]);

  const unread = items.filter((item) => !item.read).length;
  const finishDrag = () => {
    if (!drag) return;
    if (drag.offset < -72) deleteNotification(drag.id);
    setDrag(undefined);
  };
  const startDrag = (event: PointerEvent, id: string) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ id, startX: event.clientX, offset: 0 });
  };
  const moveDrag = (event: PointerEvent, id: string) => {
    if (drag?.id !== id) return;
    setDrag({ ...drag, offset: Math.max(-96, Math.min(0, event.clientX - drag.startX)) });
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        className="relative grid h-11 w-11 place-items-center rounded-full text-white/90 transition hover:bg-white/10"
        aria-label={unread ? `Notificações, ${unread} não lidas` : "Notificações"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell className="h-6 w-6" />
        {unread > 0 && (
          <span className="absolute right-0 top-0 grid min-h-5 min-w-5 place-items-center rounded-full border-2 border-[#15111e] bg-[#b46cff] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <button
              type="button"
              className="fixed inset-0 z-30 cursor-default bg-black/25"
              aria-label="Fechar notificações"
              onClick={() => setOpen(false)}
            />
            <section
              className="notification-glass fixed z-40 w-[min(390px,calc(100vw-2.5rem))] overflow-hidden rounded-[24px] text-left"
              style={panelStyle}
            >
              <header className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Notificações</h3>
                  <p className="text-[10px] text-white/70">Deslize para a esquerda para apagar</p>
                </div>
                {unread > 0 && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-g-gold"
                    onClick={markAllNotificationsRead}
                  >
                    <CheckCheck className="h-4 w-4" /> Marcar todas
                  </button>
                )}
              </header>
              <div className="relative z-10 max-h-[min(520px,calc(100dvh-11rem))] overflow-y-auto overscroll-contain">
                {items.length ? (
                  items.map((item) => {
                    const offset = drag?.id === item.id ? drag.offset : 0;
                    return (
                      <div
                        key={item.id}
                        className="notification-item-shell relative mx-3 mb-2 overflow-hidden rounded-[18px] border border-white/10 first:mt-3 last:mb-3"
                      >
                        <button
                          type="button"
                          className={`notification-item-glass relative flex w-full touch-pan-y gap-3 px-4 py-3 text-left transition-transform ${item.read ? "opacity-65" : ""}`}
                          style={{
                            transform: `translateX(${offset}px)`,
                            opacity: 1 - Math.abs(offset) / 150,
                          }}
                          onPointerDown={(event) => startDrag(event, item.id)}
                          onPointerMove={(event) => moveDrag(event, item.id)}
                          onPointerUp={finishDrag}
                          onPointerCancel={() => setDrag(undefined)}
                          onClick={() => markNotificationRead(item.id)}
                        >
                          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-g-violet/20 text-g-gold">
                            <Sparkles className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block text-sm text-white">{item.title}</strong>
                            <span className="mt-0.5 block text-xs leading-relaxed text-white/75">
                              {item.message}
                            </span>
                            <time className="mt-1 block text-[10px] text-white/50">
                              {new Date(item.createdAt).toLocaleString("pt-BR", {
                                dateStyle: "short",
                                timeStyle: "short",
                              })}
                            </time>
                          </span>
                          {!item.read && (
                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-g-violet" />
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p className="px-5 py-8 text-center text-sm text-white/70">
                    Nenhuma notificação por enquanto.
                  </p>
                )}
              </div>
            </section>
          </>,
          document.body,
        )}
    </div>
  );
}
