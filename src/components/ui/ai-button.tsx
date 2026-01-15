import Image from "next/image";
import { cn } from "@/lib/utils";

export interface AIButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg";
  width?: number;
  height?: number;
}

const AIButton = ({ className, size = "default", width, height }: AIButtonProps) => {
  const imageWidth = width || (size === "sm" ? 32 : size === "lg" ? 56 : 40);
  const imageHeight = height || (size === "sm" ? 32 : size === "lg" ? 56 : 40);

  return (
    <Image
      src="/images/logo/ai-icon.png"
      alt="AI"
      width={imageWidth}
      height={imageHeight}
      className={cn("object-contain", className)}
    />
  );
};

AIButton.displayName = "AIButton";

export { AIButton };
