import { component$, Slot } from "@builder.io/qwik";

export type CardVariant = "default" | "festive" | "outlined";

export interface CardProps {
  variant?: CardVariant;
  class?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const variantClasses: Record<CardVariant, string> = {
  default: "bg-white border border-gray-100 shadow-lg",
  festive:
    "bg-white border-2 border-christmas-red/20 shadow-[0_4px_20px_rgba(196,30,58,0.1)]",
  outlined: "bg-transparent border-2 border-gray-200",
};

const paddingClasses: Record<string, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export const Card = component$<CardProps>(
  ({ variant = "default", class: className = "", padding = "md" }) => {
    const baseClasses = "rounded-2xl";

    return (
      <div
        class={[
          baseClasses,
          variantClasses[variant],
          paddingClasses[padding],
          className,
        ].join(" ")}
      >
        <Slot />
      </div>
    );
  }
);

export interface CardHeaderProps {
  class?: string;
}

export const CardHeader = component$<CardHeaderProps>(
  ({ class: className = "" }) => {
    return (
      <div class={["mb-4", className].join(" ")}>
        <Slot />
      </div>
    );
  }
);

export interface CardTitleProps {
  class?: string;
  id?: string;
}

export const CardTitle = component$<CardTitleProps>(
  ({ class: className = "", id }) => {
    return (
      <h3 id={id} class={["text-2xl font-bold text-christmas-red", className].join(" ")}>
        <Slot />
      </h3>
    );
  }
);

export interface CardDescriptionProps {
  class?: string;
}

export const CardDescription = component$<CardDescriptionProps>(
  ({ class: className = "" }) => {
    return (
      <p class={["text-gray-600 mt-1", className].join(" ")}>
        <Slot />
      </p>
    );
  }
);

export interface CardContentProps {
  class?: string;
}

export const CardContent = component$<CardContentProps>(
  ({ class: className = "" }) => {
    return (
      <div class={className}>
        <Slot />
      </div>
    );
  }
);

export interface CardFooterProps {
  class?: string;
}

export const CardFooter = component$<CardFooterProps>(
  ({ class: className = "" }) => {
    return (
      <div class={["mt-6 flex items-center gap-4", className].join(" ")}>
        <Slot />
      </div>
    );
  }
);