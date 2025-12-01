import { component$, type QRL } from "@builder.io/qwik";

export interface TextareaProps {
  id: string;
  name: string;
  label?: string;
  placeholder?: string;
  value?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  rows?: number;
  maxlength?: number;
  minlength?: number;
  class?: string;
  onInput$?: QRL<(value: string) => void>;
  onBlur$?: QRL<() => void>;
}

export const Textarea = component$<TextareaProps>(
  ({
    id,
    name,
    label,
    placeholder,
    value,
    error,
    required = false,
    disabled = false,
    readonly = false,
    rows = 4,
    maxlength,
    minlength,
    class: className = "",
    onInput$,
    onBlur$,
  }) => {
    const hasError = !!error;

    const textareaClasses = [
      "w-full px-4 py-3 rounded-lg border-2 transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-forest-green/20",
      "resize-y min-h-[100px]",
      hasError
        ? "border-christmas-red focus:border-christmas-red"
        : "border-gray-200 focus:border-forest-green",
      disabled ? "bg-gray-100 cursor-not-allowed opacity-60" : "bg-white",
      className,
    ].join(" ");

    return (
      <div class="input-group">
        {label && (
          <label for={id} class="input-label">
            {label}
            {required && <span class="text-christmas-red ml-1">*</span>}
          </label>
        )}
        <textarea
          id={id}
          name={name}
          placeholder={placeholder}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          rows={rows}
          maxLength={maxlength}
          minLength={minlength}
          class={textareaClasses}
          onInput$={(e) => {
            if (onInput$) {
              onInput$((e.target as HTMLTextAreaElement).value);
            }
          }}
          onBlur$={onBlur$}
          aria-invalid={hasError}
          aria-describedby={hasError ? `${id}-error` : undefined}
        />
        {error && (
          <p id={`${id}-error`} class="input-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);