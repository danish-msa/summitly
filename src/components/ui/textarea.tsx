import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.ComponentProps<"textarea"> {
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, value, defaultValue, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const textareaRef = React.useRef<HTMLTextAreaElement>(null)
    
    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current as HTMLTextAreaElement)

    // Check if textarea has value
    const [hasValue, setHasValue] = React.useState(() => {
      if (value !== undefined) return String(value).trim() !== ''
      if (defaultValue !== undefined) return String(defaultValue).trim() !== ''
      return false
    })

    // Update hasValue when value changes
    React.useEffect(() => {
      if (value !== undefined) {
        setHasValue(String(value).trim() !== '')
      }
    }, [value])

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value.trim() !== '')
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setHasValue(e.target.value.trim() !== '')
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue

    if (label) {
      // Remove placeholder when label is present to avoid overlap
      const { placeholder, ...textareaProps } = props
      
      return (
        <div className="relative">
          <textarea
            {...textareaProps}
            value={value}
            defaultValue={defaultValue}
            ref={textareaRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              "flex min-h-[80px] w-full rounded-2xl border-[1.5px] border-zinc-400 bg-transparent px-4 pt-6 pb-4 text-base text-foreground transition-[border] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:border-[#3b82f6] resize-y",
              isFloating && "border-[#3b82f6]",
              className
            )}
          />
          <label
            className={cn(
              "absolute left-4 pointer-events-none text-zinc-500 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left",
              isFloating
                ? "top-0 -translate-y-1/2 scale-[0.8] bg-background px-2 text-[#3b82f6]"
                : "top-4"
            )}
          >
            {label}
          </label>
        </div>
      )
    }

    // Fallback to simple textarea if no label
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
