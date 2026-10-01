import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      mobileOffset={{
        top: "max(18px, calc(env(safe-area-inset-top, 0px) + 12px))",
        right: 16,
        left: 16,
      }}
      toastOptions={{
        classNames: {
          toast: "notification-glass notification-toast group toast !text-white",
          title: "!font-semibold !text-white",
          description: "!text-white/70",
          icon: "!text-g-gold",
          actionButton: "!bg-g-gold !text-g-bg",
          cancelButton: "!border-white/15 !bg-white/5 !text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
