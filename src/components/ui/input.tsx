import { component$, type QRL } from "@builder.io/qwik";

export interface InputProps {
  id: string;
  name: string;
  type?: "text" | "email" | "number" | "date" | "password" | "tel" | "url";
  label?: string;
  placeholder?: string;
  value?: string | number;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  pattern?: string;
  autocomplete?: string;
  class?: string;
  onInput$?: QRL<(value: string) => void>;
  onBlur$?: QRL<() => void>;
}

export const Input = component$<InputProps>(
  ({
    id,
    name,
    type = "text",
    label,
    placeholder,
    value,
    error,
    required = false,
    disabled = false,
    readonly = false,
    min,
    max,
    step,
    pattern,
    autocomplete,
    class: className = "",
    onInput$,
    onBlur$,
  }) => {
    const hasError = !!error;

    const inputClasses = [
      "w-full px-4 py-2 rounded-lg border-2 transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-forest-green/20",
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
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          required={required}
          disabled={disabled}
          readOnly={readonly}
          min={min}
          max={max}
          step={step}
          pattern={pattern}
          autoComplete={autocomplete}
          class={inputClasses}
          onInput$={(e) => {
            if (onInput$) {
              onInput$((e.target as HTMLInputElement).value);
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