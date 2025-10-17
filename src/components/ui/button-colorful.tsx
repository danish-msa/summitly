import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ButtonColorfulProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
    href?: string;
    variant?: 'default' | 'gradient';
}

export function ButtonColorful({
    className,
    label = "Explore Components",
    href,
    variant = 'default',
    ...props
}: ButtonColorfulProps) {
    const buttonContent = (
        <Button
            className={cn(
                "rounded-full relative h-10 px-6 overflow-hidden",
                "transition-all duration-200",
                "group",
                // Default variant (original style)
                variant === 'default' && "bg-zinc-900 dark:bg-zinc-100",
                // Gradient variant (new style)
                variant === 'gradient' && "bg-black-900 dark:bg-zinc-100",
                className
            )}
            {...props}
        >
            {/* Gradient background effect - only for default variant */}
            {variant === 'default' && (
                <div
                    className={cn(
                        "absolute inset-0",
                        "bg-brand-slate",
                        "opacity-40 group-hover:opacity-80",
                        "blur transition-opacity duration-500"
                    )}
                />
            )}

            {/* Gradient background effect - only for default variant */}
            {variant === 'gradient' && (
                <div
                    className={cn(
                        "absolute inset-0",
                        "bg-brand-midnight",
                        "opacity-90 group-hover:opacity-50",
                        "blur transition-opacity duration-500"
                    )}
                />
            )}

            {/* Content */}
            <div className="relative flex items-center justify-center gap-2">
                <span className={cn(
                    variant === 'default' && "text-white dark:text-zinc-900",
                    variant === 'gradient' && "text-white"
                )}>
                    {label}
                </span>
                <ArrowUpRight className={cn(
                    "w-3.5 h-3.5",
                    variant === 'default' && "text-white/90 dark:text-zinc-900/90",
                    variant === 'gradient' && "text-white/90"
                )} />
            </div>
        </Button>
    );

    if (href) {
        return (
            <a href={href} className="inline-block">
                {buttonContent}
            </a>
        );
    }

    return buttonContent;
}

