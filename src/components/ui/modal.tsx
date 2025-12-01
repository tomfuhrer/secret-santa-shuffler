import { component$, Slot, useSignal, type QRL, useTask$, $ } from "@builder.io/qwik";

export interface ModalProps {
  open: boolean;
  onClose$?: QRL<() => void>;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
  class?: string;
}

const sizeClasses: Record<string, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export const Modal = component$<ModalProps>(
  ({
    open,
    onClose$,
    size = "md",
    closeOnBackdrop = true,
    closeOnEscape = true,
    class: className = "",
  }) => {
    const dialogRef = useSignal<HTMLDialogElement>();

    useTask$(({ track }) => {
      track(() => open);
      const dialog = dialogRef.value;
      if (!dialog) return;

      if (open) {
        dialog.showModal();
      } else {
        dialog.close();
      }
    });

    const handleBackdropClick$ = $((e: MouseEvent) => {
      if (closeOnBackdrop && e.target === dialogRef.value) {
        onClose$?.();
      }
    });

    const handleKeyDown$ = $((e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape") {
        e.preventDefault();
        onClose$?.();
      }
    });

    return (
      <dialog
        ref={dialogRef}
        class={[
          "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
          "bg-transparent p-0 m-0",
          "fixed inset-0 z-50",
          "open:flex open:items-center open:justify-center",
          "w-full h-full max-w-none max-h-none",
        ].join(" ")}
        onClick$={handleBackdropClick$}
        onKeyDown$={handleKeyDown$}
      >
        <div
          class={[
            "bg-white rounded-2xl shadow-2xl",
            "p-6 m-4",
            "w-full",
            sizeClasses[size],
            "animate-in fade-in zoom-in-95 duration-200",
            "border-2 border-christmas-red/10",
            className,
          ].join(" ")}
          onClick$={(e) => e.stopPropagation()}
        >
          <Slot />
        </div>
      </dialog>
    );
  }
);

export interface ModalHeaderProps {
  class?: string;
}

export const ModalHeader = component$<ModalHeaderProps>(
  ({ class: className = "" }) => {
    return (
      <div class={["mb-4", className].join(" ")}>
        <Slot />
      </div>
    );
  }
);

export interface ModalTitleProps {
  class?: string;
}

export const ModalTitle = component$<ModalTitleProps>(
  ({ class: className = "" }) => {
    return (
      <h2
        class={["text-2xl font-bold text-christmas-red font-display", className].join(
          " "
        )}
      >
        <Slot />
      </h2>
    );
  }
);

export interface ModalDescriptionProps {
  class?: string;
}

export const ModalDescription = component$<ModalDescriptionProps>(
  ({ class: className = "" }) => {
    return (
      <p class={["text-gray-600 mt-2", className].join(" ")}>
        <Slot />
      </p>
    );
  }
);

export interface ModalContentProps {
  class?: string;
}

export const ModalContent = component$<ModalContentProps>(
  ({ class: className = "" }) => {
    return (
      <div class={["py-4", className].join(" ")}>
        <Slot />
      </div>
    );
  }
);

export interface ModalFooterProps {
  class?: string;
}

export const ModalFooter = component$<ModalFooterProps>(
  ({ class: className = "" }) => {
    return (
      <div class={["mt-6 flex items-center justify-end gap-3", className].join(" ")}>
        <Slot />
      </div>
    );
  }
);

export interface ModalCloseButtonProps {
  onClose$?: QRL<() => void>;
  class?: string;
}

export const ModalCloseButton = component$<ModalCloseButtonProps>(
  ({ onClose$, class: className = "" }) => {
    return (
      <button
        type="button"
        onClick$={onClose$}
        class={[
          "absolute top-4 right-4",
          "p-2 rounded-full",
          "text-gray-400 hover:text-gray-600",
          "hover:bg-gray-100 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-christmas-red/20",
          className,
        ].join(" ")}
        aria-label="Close modal"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    );
  }
);