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
            "group toast !border-[#f4d875]/50 !bg-[#7650a8] !text-[#ffe884] !shadow-[0_12px_40px_rgba(96,55,145,.55)]",
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
