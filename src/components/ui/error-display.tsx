import { component$, type QRL } from "@builder.io/qwik";
import { Link } from "@builder.io/qwik-city";
import { FestiveGnome } from "./festive-gnome";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { AlertCircleIcon, GiftIcon, UsersIcon, MailIcon } from "../icons";

interface ErrorDisplayProps {
  title?: string;
  message?: string;
  showHomeLink?: boolean;
  showRetry?: boolean;
  onRetry$?: QRL<() => void>;
  variant?: "page" | "inline" | "card";
}

export const ErrorDisplay = component$<ErrorDisplayProps>(
  ({
    title = "Oops! Something went wrong",
    message = "We're sorry, but something unexpected happened. Please try again.",
    showHomeLink = true,
    showRetry = false,
    onRetry$,
    variant = "page",
  }) => {
    if (variant === "inline") {
      return (
        <div
          class="flex items-center gap-3 p-4 bg-christmas-red/10 border border-christmas-red/20 rounded-lg"
          role="alert"
        >
          <AlertCircleIcon size={20} class="text-christmas-red flex-shrink-0" aria-hidden="true" />
          <div class="flex-1">
            <p class="font-medium text-christmas-red">{title}</p>
            <p class="text-sm text-gray-600">{message}</p>
          </div>
          {showRetry && onRetry$ && (
            <Button variant="outline" size="sm" onClick$={onRetry$}>
              Try Again
            </Button>
          )}
        </div>
      );
    }

    if (variant === "card") {
      return (
        <Card class="text-center">
          <CardContent class="py-8">
            <div class="w-12 h-12 rounded-full bg-christmas-red/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircleIcon size={24} class="text-christmas-red" aria-hidden="true" />
            </div>
            <h3 class="font-display text-lg text-christmas-red mb-2">{title}</h3>
            <p class="text-gray-600 text-sm mb-4">{message}</p>
            <div class="flex justify-center gap-3">
              {showRetry && onRetry$ && (
                <Button variant="outline" size="sm" onClick$={onRetry$}>
                  Try Again
                </Button>
              )}
              {showHomeLink && (
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    Go Home
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    // Full page error
    return (
      <div class="min-h-[60vh] flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <FestiveGnome variant="classic" size="lg" class="mb-6" />
          <h1 class="font-display text-3xl text-christmas-red mb-3">{title}</h1>
          <p class="text-gray-600 mb-6">{message}</p>
          <div class="flex flex-col sm:flex-row justify-center gap-3">
            {showRetry && onRetry$ && (
              <Button variant="secondary" onClick$={onRetry$}>
                Try Again
              </Button>
            )}
            {showHomeLink && (
              <Link href="/">
                <Button variant="outline">Return Home</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// 404 Not Found error display
export const NotFoundError = component$<{ message?: string }>(
  ({ message = "The page you're looking for doesn't exist or has been moved." }) => {
    return (
      <div class="min-h-[60vh] flex items-center justify-center px-4">
        <div class="text-center max-w-md">
          <FestiveGnome variant="dotty" size="xl" class="mb-6" />
          <h1 class="font-display text-4xl text-christmas-red mb-2">404</h1>
          <h2 class="font-display text-xl text-forest-green mb-3">Page Not Found</h2>
          <p class="text-gray-600 mb-6">{message}</p>
          <div class="flex justify-center gap-3">
            <Link href="/">
              <Button variant="secondary">Go Home</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
);

// Empty state display
export const EmptyState = component$<{
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  icon?: "gift" | "users" | "mail" | "gnome";
}>(({ title, message, actionLabel, actionHref, icon = "gnome" }) => {
  return (
    <div class="text-center py-12">
      {icon === "gnome" ? (
        <FestiveGnome variant="stripey" size="md" class="mb-4" />
      ) : (
        <div class="w-16 h-16 rounded-full bg-cream-dark flex items-center justify-center mx-auto mb-4">
          {icon === "gift" && <GiftIcon size={32} class="text-christmas-red" />}
          {icon === "users" && <UsersIcon size={32} class="text-forest-green" />}
          {icon === "mail" && <MailIcon size={32} class="text-forest-green" />}
        </div>
      )}
      <h3 class="font-display text-xl text-christmas-red mb-2">{title}</h3>
      <p class="text-gray-600 mb-4 max-w-sm mx-auto">{message}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button variant="secondary">{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
});

// Loading error with retry
export const LoadingError = component$<{
  message?: string;
  onRetry$?: QRL<() => void>;
}>(({ message = "Failed to load data. Please try again.", onRetry$ }) => {
  return (
    <div
      class="flex flex-col items-center justify-center py-12 text-center"
      role="alert"
      aria-live="polite"
    >
      <div class="w-12 h-12 rounded-full bg-christmas-red/10 flex items-center justify-center mb-4">
        <AlertCircleIcon size={24} class="text-christmas-red" aria-hidden="true" />
      </div>
      <p class="text-gray-600 mb-4">{message}</p>
      {onRetry$ && (
        <Button variant="outline" onClick$={onRetry$}>
          Try Again
        </Button>
      )}
    </div>
  );
});
