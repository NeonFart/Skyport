import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"
import * as React from "react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer size-4 shrink-0 rounded-md border border-input bg-background/95 text-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all outline-none data-[state=checked]:border-[#d92400]/35 data-[state=checked]:bg-[#d92400]/10 data-[state=checked]:text-[#d92400] data-[state=indeterminate]:border-[#d92400]/35 data-[state=indeterminate]:bg-[#d92400]/10 data-[state=indeterminate]:text-[#d92400] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:data-[state=checked]:border-[#ff5a36]/35 dark:data-[state=checked]:bg-[#ff5a36]/12 dark:data-[state=checked]:text-[#ff8a6d] dark:data-[state=indeterminate]:border-[#ff5a36]/35 dark:data-[state=indeterminate]:bg-[#ff5a36]/12 dark:data-[state=indeterminate]:text-[#ff8a6d] dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex items-center justify-center text-current transition-none"
      >
        {props.checked === 'indeterminate' ? (
          <MinusIcon className="size-3" strokeWidth={3} />
        ) : (
          <CheckIcon className="size-3" strokeWidth={3} />
        )}
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
