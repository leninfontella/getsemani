import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-right"
      mobileOffset={{ top: 18, right: 16, left: 16 }}
      toastOptions={{
        classNames: {
          toast:
            "liquid-toast group toast !border-white/25 !bg-[#68448a]/55 !text-[#ffe884] !shadow-[0_18px_55px_rgba(40,18,72,.55)] !backdrop-blur-2xl",
          title: "!font-semibold !text-[#ffe884]",
          description: "!text-[#fff0a8]",
          icon: "!text-[#ffe884]",
          actionButton: "!bg-[#ffe884] !text-[#352044]",
          cancelButton: "!bg-[#5b3c82] !text-[#ffe884]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
