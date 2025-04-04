import * as React from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface CustomSwitchProps {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function CustomSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: CustomSwitchProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="space-y-1">
        {label && <p className="font-heading font-semibold text-sm">{label}</p>}
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative inline-flex h-6 w-12 items-center rounded-full transition-colors",
          "data-[state=checked]:bg-amber data-[state=unchecked]:bg-background-tertiary"
        )}
      />
    </div>
  );
}
