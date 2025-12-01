import { component$, Slot } from "@builder.io/qwik";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "error"
  | "info"
  | "festive";

export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  class?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-forest-green/10 text-forest-green",
  warning: "bg-gold/20 text-amber-700",
  error: "bg-christmas-red/10 text-christmas-red",
  info: "bg-gold/20 text-amber-700",
  festive:
    "bg-gradient-to-r from-christmas-red/10 to-forest-green/10 text-christmas-red border border-christmas-red/20",
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

export const Badge = component$<BadgeProps>(
  ({ variant = "default", size = "md", class: className = "" }) => {
    const baseClasses = "inline-flex items-center rounded-full font-medium";

    return (
      <span
        class={[
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
      >
        <Slot />
      </span>
    );
  }
);

export interface StatusBadgeProps {
  status: "draft" | "active" | "shuffled" | "sent" | "completed";
  size?: BadgeSize;
  class?: string;
}

const statusConfig: Record<
  StatusBadgeProps["status"],
  { label: string; variant: BadgeVariant }
> = {
  draft: { label: "Draft", variant: "default" },
  active: { label: "Collecting Responses", variant: "info" },
  shuffled: { label: "Shuffled", variant: "warning" },
  sent: { label: "Secrets Sent", variant: "success" },
  completed: { label: "Completed", variant: "festive" },
};

export const StatusBadge = component$<StatusBadgeProps>(
  ({ status, size = "md", class: className = "" }) => {
    const config = statusConfig[status];

    return (
      <Badge variant={config.variant} size={size} class={className}>
        {config.label}
      </Badge>
    );
  }
);