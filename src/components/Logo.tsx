import logoIcon from "@/assets/logo-icon.png";
import logoFull from "@/assets/logo-full.png";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "icon" | "full";
  className?: string;
  size?: number;
};

export function Logo({ variant = "icon", className, size = 40 }: Props) {
  const src = variant === "full" ? logoFull : logoIcon;
  return (
    <img
      src={src}
      alt="SmartFlow Agenda"
      width={size}
      height={size}
      className={cn("select-none", className)}
      style={{ height: size, width: variant === "full" ? "auto" : size }}
      draggable={false}
    />
  );
}
