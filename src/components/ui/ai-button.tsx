import { ButtonHTMLAttributes, forwardRef } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AIButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  showIcon?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

const AIButton = forwardRef<HTMLButtonElement, AIButtonProps>(
  ({ className, children, showIcon = true, variant = "default", size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "h-9 px-4 text-sm",
      default: "h-11 px-6 text-base",
      lg: "h-14 px-8 text-lg",
    };

    const baseClasses = "relative inline-flex items-center gap-2 font-semibold rounded-full transition-all duration-300 overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed";

    const variantClasses = {
      default: "ai-gradient text-primary-foreground ai-glow hover:scale-105 active:scale-95",
      outline: "border-2 border-primary bg-background/50 backdrop-blur-sm text-foreground hover:bg-primary/10 hover:border-ai-glow",
      ghost: "bg-transparent text-foreground hover:bg-primary/10",
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          className
        )}
        {...props}
      >
        {/* Shimmer overlay effect */}
        {variant === "default" && (
          <span className="absolute inset-0 ai-shimmer" />
        )}
        
        {/* Sparkle decorations */}
        {variant === "default" && (
          <>
            <span 
              className="absolute top-1 right-4 w-1 h-1 bg-ai-shimmer rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ animation: "sparkle 1.5s ease-in-out infinite" }}
            />
            <span 
              className="absolute bottom-2 left-6 w-1 h-1 bg-ai-shimmer rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ animation: "sparkle 1.5s ease-in-out infinite 0.3s" }}
            />
          </>
        )}

        {/* Content */}
        <span className="relative z-10 flex items-center gap-2">
          {showIcon && (
            <Sparkles 
              className={cn(
                "transition-transform duration-300 group-hover:rotate-12",
                size === "sm" ? "w-4 h-4" : size === "lg" ? "w-6 h-6" : "w-5 h-5"
              )} 
            />
          )}
          {children}
        </span>
      </button>
    );
  }
);

AIButton.displayName = "AIButton";

export { AIButton };
