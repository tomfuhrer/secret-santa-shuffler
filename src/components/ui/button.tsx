import { component$, Slot, type QRL } from "@builder.io/qwik";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  loading?: boolean;
  class?: string;
  onClick$?: QRL<() => void>;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-christmas-red text-white border-2 border-white hover:bg-white hover:text-christmas-red hover:border-christmas-red focus:bg-white focus:text-christmas-red focus:border-christmas-red focus:ring-christmas-red",
  secondary:
    "bg-forest-green text-white border-2 border-white hover:bg-white hover:text-forest-green hover:border-forest-green focus:bg-white focus:text-forest-green focus:border-forest-green focus:ring-forest-green",
  outline:
    "border-2 border-christmas-red text-christmas-red bg-transparent hover:bg-christmas-red hover:text-white focus:ring-christmas-red",
  ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-400",
  destructive:
    "bg-transparent text-christmas-red hover:bg-christmas-red/10 focus:ring-christmas-red",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

export const Button = component$<ButtonProps>(
  ({
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    class: className = "",
    onClick$,
  }) => {
    const baseClasses =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
      <button
        type={type}
        disabled={disabled || loading}
        onClick$={onClick$}
        class={[
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(" ")}
      >
        {loading && (
          <svg
            class="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        <Slot />
      </button>
    );
  }
);