"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox@1.1.4";
import { CheckIcon } from "lucide-react@0.487.0";

import { cn } from "./utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      // Base styling with prominent borders
      "peer size-4 shrink-0 rounded-[4px] transition-all duration-200 outline-none",
      "ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      "disabled:cursor-not-allowed disabled:opacity-50",
      
      // Enhanced border visibility - Light mode
      "border-2 border-border bg-background",
      "hover:border-primary/60 hover:bg-primary/5",
      
      // Dark mode enhanced borders
      "dark:border-border dark:bg-card",
      "dark:hover:border-primary/70 dark:hover:bg-primary/10",
      
      // Checked state with strong visual feedback
      "data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground",
      "data-[state=checked]:hover:bg-primary/90 data-[state=checked]:hover:border-primary/90",
      "dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary",
      
      // Invalid state
      "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
      "dark:aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40",
      
      // Enhanced shadow for better visibility
      "shadow-sm hover:shadow-md",
      "dark:shadow-lg dark:hover:shadow-xl",
      
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn(
        "flex items-center justify-center text-current transition-all duration-200",
        "data-[state=checked]:animate-in data-[state=checked]:zoom-in-75"
      )}
    >
      <CheckIcon className="size-3.5 stroke-[2.5]" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };