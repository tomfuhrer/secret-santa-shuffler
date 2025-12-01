import {
  component$,
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  $,
  type Signal,
  type QRL,
  Slot,
} from "@builder.io/qwik";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  GnomeIcon,
  SparklesIcon,
} from "../icons";

export type ToastType = "success" | "error" | "info" | "festive";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Signal<Toast[]>;
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

export const ToastContext = createContextId<ToastContextType>("toast-context");

export const ToastProvider = component$(() => {
  const toasts = useSignal<Toast[]>([]);

  const addToast = $((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };
    toasts.value = [...toasts.value, newToast];

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toasts.value = toasts.value.filter((t) => t.id !== id);
      }, newToast.duration);
    }
  });

  const removeToast = $((id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  });

  useContextProvider(ToastContext, {
    toasts,
    addToast,
    removeToast,
  });

  return (
    <>
      <Slot />
      <ToastContainer />
    </>
  );
});

const ToastContainer = component$(() => {
  const { toasts, removeToast } = useContext(ToastContext);

  return (
    <div
      class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.value.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose$={() => removeToast(toast.id)} />
      ))}
    </div>
  );
});

const typeStyles: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: {
    bg: "bg-forest-green/10",
    icon: "text-forest-green",
    border: "border-forest-green/30",
  },
  error: {
    bg: "bg-christmas-red/10",
    icon: "text-christmas-red",
    border: "border-christmas-red/30",
  },
  info: {
    bg: "bg-cream",
    icon: "text-gray-600",
    border: "border-gray-300",
  },
  festive: {
    bg: "bg-gradient-to-r from-christmas-red/10 to-forest-green/10",
    icon: "text-gold",
    border: "border-gold/30",
  },
};

const ToastItem = component$<{
  toast: Toast;
  onClose$: QRL<() => void>;
}>(({ toast, onClose$ }) => {
  const isVisible = useSignal(false);
  const isExiting = useSignal(false);
  const styles = typeStyles[toast.type];
  const closeHandler = onClose$;

  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      isVisible.value = true;
    });
  });

  const handleClose = $(() => {
    isExiting.value = true;
    setTimeout(() => {
      closeHandler();
    }, 200);
  });

  const IconComponent = {
    success: CheckCircleIcon,
    error: AlertCircleIcon,
    info: AlertCircleIcon,
    festive: toast.type === "festive" ? GnomeIcon : SparklesIcon,
  }[toast.type];

  return (
    <div
      class={[
        "pointer-events-auto flex items-start gap-3 p-4 rounded-lg shadow-lg border-2",
        "transform transition-all duration-200 ease-out",
        styles.bg,
        styles.border,
        isVisible.value && !isExiting.value
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0",
      ].join(" ")}
      role="alert"
      aria-live="assertive"
    >
      <div class={`flex-shrink-0 ${styles.icon}`}>
        <IconComponent size={20} />
      </div>
      <p class="flex-1 text-sm text-gray-700 font-medium">{toast.message}</p>
      <button
        type="button"
        onClick$={handleClose}
        class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 -m-1 rounded-full hover:bg-black/5"
        aria-label="Dismiss notification"
      >
        <svg
          width="14"
          height="14"
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
    </div>
  );
});

// Hook for using toasts in components
export const useToast = () => {
  return useContext(ToastContext);
};
