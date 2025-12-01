import { component$ } from "@builder.io/qwik";
import { type DocumentHead, Link, routeLoader$ } from "@builder.io/qwik-city";
import { useRequireAuth } from "./layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { FestiveGnome } from "~/components/ui/festive-gnome";
import {
  PlusIcon,
  UsersIcon,
  GiftIcon,
  TreeIcon,
  StarIcon,
} from "~/components/icons";
import { listExchangesByOrganizer, countParticipantsByExchange, countCompletedQuestionnaires } from "~/lib/db";
import type { Env, Exchange } from "~/lib/db/types";

/**
 * Exchange with computed participant stats
 */
interface ExchangeWithStats extends Exchange {
  participantCount: number;
  completedCount: number;
}

/**
 * Load exchanges for the current user with participant stats
 */
export const useExchanges = routeLoader$(async (requestEvent) => {
  const env = requestEvent.platform?.env as Env | undefined;
  const db = env?.DB;

  if (!db) {
    return { exchanges: [] as ExchangeWithStats[] };
  }

  // Get user from parent loader
  const user = await requestEvent.resolveValue(useRequireAuth);
  
  // Fetch exchanges for this organizer
  const exchanges = await listExchangesByOrganizer(db, user.id);
  
  // Fetch participant counts for each exchange
  const exchangesWithStats: ExchangeWithStats[] = await Promise.all(
    exchanges.map(async (exchange) => {
      const [participantCount, completedCount] = await Promise.all([
        countParticipantsByExchange(db, exchange.id),
        countCompletedQuestionnaires(db, exchange.id),
      ]);
      return {
        ...exchange,
        participantCount,
        completedCount,
      };
    })
  );

  return { exchanges: exchangesWithStats };
});

/**
 * Map database status to badge variant
 */
function getStatusBadge(status: Exchange["status"]) {
  const config: Record<Exchange["status"], { label: string; variant: "default" | "info" | "warning" | "success" | "festive" }> = {
    draft: { label: "Draft", variant: "default" },
    collecting: { label: "Collecting Responses", variant: "info" },
    ready: { label: "Ready to Shuffle", variant: "warning" },
    shuffled: { label: "Shuffled", variant: "success" },
    complete: { label: "Complete", variant: "festive" },
  };
  return config[status];
}

/**
 * Format exchange date for display
 */
function formatExchangeDate(dateStr: string | null): string {
  if (!dateStr) return "Not set";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/**
 * Format budget range for display
 */
function formatBudget(min: number | null, max: number | null): string {
  if (min === null && max === null) return "No budget set";
  if (min !== null && max !== null) {
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  }
  if (min !== null) return `$${min}+`;
  return `Up to $${max}`;
}

export default component$(() => {
  const user = useRequireAuth();
  const exchangesData = useExchanges();
  const exchanges = exchangesData.value.exchanges;
  const hasExchanges = exchanges.length > 0;

  return (
    <div class="relative">
      {/* Decorative elements */}
      <div class="absolute top-0 right-0 opacity-10 pointer-events-none hidden lg:block" aria-hidden="true">
        <TreeIcon size={120} class="text-forest-green" />
      </div>

      {/* Welcome header */}
      <header class="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-3xl md:text-4xl mb-2">
            {user.value.name
              ? `Welcome back, ${user.value.name}!`
              : "Welcome to your Dashboard!"}
          </h1>
          <p class="text-gray-600">
            Manage your Secret Santa exchanges and spread holiday cheer
          </p>
        </div>
        {hasExchanges && (
          <Link href="/exchanges/new">
            <Button variant="secondary">
              <PlusIcon size={18} aria-hidden="true" />
              <span>New Exchange</span>
            </Button>
          </Link>
        )}
      </header>

      {!hasExchanges ? (
        /* Empty state - no exchanges yet */
        <Card variant="festive" class="text-center">
          <CardContent class="py-12">
            <FestiveGnome variant="classic" size="lg" class="mb-4" />
            <CardHeader class="mb-0">
              <CardTitle class="text-2xl">No Exchanges Yet</CardTitle>
            </CardHeader>
            <p class="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first Secret Santa exchange and invite your friends, 
              family, or coworkers to join the gift exchange fun!
            </p>
            <Link href="/exchanges/new">
              <Button variant="secondary" size="lg">
                <StarIcon size={18} class="animate-twinkle" aria-hidden="true" />
                <span>Create Your First Exchange</span>
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        /* Exchange list */
        <div class="space-y-4">
          {exchanges.map((exchange) => {
            const statusConfig = getStatusBadge(exchange.status);
            const progressPercent = exchange.participantCount > 0
              ? Math.round((exchange.completedCount / exchange.participantCount) * 100)
              : 0;

            return (
              <Link key={exchange.id} href={`/exchanges/${exchange.id}`} class="block">
                <Card class="hover:shadow-xl transition-shadow duration-200 cursor-pointer">
                  <CardHeader>
                    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <CardTitle class="text-xl">{exchange.title}</CardTitle>
                        {exchange.description && (
                          <CardDescription class="line-clamp-2">
                            {exchange.description}
                          </CardDescription>
                        )}
                      </div>
                      <Badge variant={statusConfig.variant} class="shrink-0">
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      {/* Participants */}
                      <div>
                        <p class="text-gray-500 mb-1">Participants</p>
                        <p class="font-semibold text-forest-green">
                          {exchange.participantCount === 0 ? (
                            "None yet"
                          ) : (
                            <span>
                              {exchange.participantCount} {exchange.participantCount === 1 ? "person" : "people"}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Questionnaire Progress */}
                      <div>
                        <p class="text-gray-500 mb-1">Questionnaires</p>
                        <p class="font-semibold">
                          {exchange.participantCount === 0 ? (
                            <span class="text-gray-400">—</span>
                          ) : (
                            <span class={exchange.completedCount === exchange.participantCount ? "text-forest-green" : "text-christmas-red"}>
                              {exchange.completedCount}/{exchange.participantCount} ({progressPercent}%)
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Budget */}
                      <div>
                        <p class="text-gray-500 mb-1">Budget</p>
                        <p class="font-semibold">
                          {formatBudget(exchange.budget_min, exchange.budget_max)}
                        </p>
                      </div>

                      {/* Exchange Date */}
                      <div>
                        <p class="text-gray-500 mb-1">Exchange Date</p>
                        <p class="font-semibold">
                          {formatExchangeDate(exchange.exchange_date)}
                        </p>
                      </div>
                    </div>

                    {/* Progress bar for questionnaires */}
                    {exchange.participantCount > 0 && (
                      <div class="mt-4">
                        <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            class={[
                              "h-full transition-all duration-500",
                              progressPercent === 100 ? "bg-forest-green" : "bg-christmas-red",
                            ].join(" ")}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter class="text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <span>
                      Created {new Date(exchange.created_at * 1000).toLocaleDateString()}
                    </span>
                    <span class="ml-auto text-forest-green font-medium">
                      View Details →
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Quick tips - show when there are exchanges */}
      {hasExchanges && (
        <section class="mt-8" aria-labelledby="tips-heading">
          <h2 id="tips-heading" class="sr-only">Quick Tips</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card padding="sm" class="group hover:shadow-md transition-shadow">
              <CardContent>
                <div class="w-10 h-10 rounded-full bg-forest-green/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <GiftIcon size={20} class="text-forest-green" aria-hidden="true" />
                </div>
                <h3 class="font-bold text-forest-green mb-1">Create an Exchange</h3>
                <p class="text-sm text-gray-600">
                  Set up your gift exchange with a title, budget, and date.
                </p>
              </CardContent>
            </Card>

            <Card padding="sm" class="group hover:shadow-md transition-shadow">
              <CardContent>
                <div class="w-10 h-10 rounded-full bg-christmas-red/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UsersIcon size={20} class="text-christmas-red" aria-hidden="true" />
                </div>
                <h3 class="font-bold text-forest-green mb-1">Invite Participants</h3>
                <p class="text-sm text-gray-600">
                  Add friends and family to receive questionnaire invites.
                </p>
              </CardContent>
            </Card>

            <Card padding="sm" class="group hover:shadow-md transition-shadow">
              <CardContent>
                <div class="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <StarIcon size={20} class="text-gold-dark" aria-hidden="true" />
                </div>
                <h3 class="font-bold text-forest-green mb-1">Shuffle & Send</h3>
                <p class="text-sm text-gray-600">
                  Randomly assign Secret Santas and notify everyone!
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Account info */}
      <footer class="mt-8 text-center text-sm text-gray-500">
        <p>
          Signed in as <strong>{user.value.email}</strong>
        </p>
      </footer>
    </div>
  );
});

export const head: DocumentHead = {
  title: "Dashboard - Secret Santa Shuffler",
  meta: [
    {
      name: "description",
      content:
        "Manage your Secret Santa exchanges, invite participants, and spread holiday cheer.",
    },
  ],
};
