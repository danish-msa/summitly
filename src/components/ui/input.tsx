import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, value, defaultValue, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    // Check if input has value
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

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true)
      props.onFocus?.(e)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false)
      setHasValue(e.target.value.trim() !== '')
      props.onBlur?.(e)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(e.target.value.trim() !== '')
      props.onChange?.(e)
    }

    const isFloating = isFocused || hasValue

    if (label) {
      // Remove placeholder when label is present to avoid overlap
      const { placeholder: _placeholder, ...inputProps } = props
      
      return (
        <div className="relative">
          <input
            type={type}
            {...inputProps}
            value={value}
            defaultValue={defaultValue}
            ref={inputRef}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            className={cn(
              "w-full h-12 rounded-2xl border-[1.5px] border-zinc-400 bg-transparent px-4 py-4 text-base text-foreground transition-[border] duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] focus:outline-none focus:border-[#3b82f6]",
              isFloating && "border-[#3b82f6]",
              className
            )}
          />
          <label
            className={cn(
              "absolute left-4 pointer-events-none text-zinc-500 transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] origin-left",
              isFloating
                ? "top-0 -translate-y-1/2 scale-[0.8] bg-white px-2 text-[#3b82f6]"
                : "top-3"
            )}
          >
            {label}
          </label>
        </div>
      )
    }

    // Fallback to simple input if no label — must pass value/defaultValue so controlled inputs work
    const controlledProps =
      value !== undefined ? { value } : defaultValue !== undefined ? { defaultValue } : {}
    return (
      <input
        type={type}
        {...controlledProps}
        className={cn(
          "flex h-11 sm:h-10 w-full rounded-lg border border-input bg-transparent px-3 sm:px-3 py-2.5 sm:py-1 text-xs sm:text-base md:text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
