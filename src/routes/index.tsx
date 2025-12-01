import { component$, useSignal, useComputed$, $ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { GnomeSquad } from "~/components/ui/festive-gnome";

import {
  GiftIcon,
  ShuffleIcon,
  UsersIcon,
  SparklesIcon,
  SnowflakeIcon,
  TreeIcon,
  StarIcon,
  CopyIcon,
  CheckCircleIcon,
} from "~/components/icons";
import { createQuickShuffleAssignments } from "~/lib/shuffle/index";

export default component$(() => {
  // Quick shuffle state
  const namesInput = useSignal("");
  const assignments = useSignal<Array<{ santa: string; recipient: string }> | null>(null);
  const error = useSignal("");
  const showResults = useSignal(false);
  const copied = useSignal(false);

  // Parse names from input
  const parsedNames = useComputed$(() => {
    const text = namesInput.value.trim();
    if (!text) return [];

    return text
      .split(/[\n,]+/)
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
  });

  // Handle shuffle
  const handleShuffle$ = $(() => {
    error.value = "";

    const names = parsedNames.value;

    if (names.length < 2) {
      error.value = "Please enter at least 2 names to shuffle!";
      return;
    }

    if (names.length !== new Set(names).size) {
      error.value = "Please make sure all names are unique!";
      return;
    }

    try {
      assignments.value = createQuickShuffleAssignments(names);
      showResults.value = true;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Something went wrong!";
    }
  });

  // Reset to shuffle again
  const handleReset$ = $(() => {
    assignments.value = null;
    showResults.value = false;
    error.value = "";
    copied.value = false;
  });

  // Copy assignments to clipboard
  const handleCopy$ = $(async () => {
    if (!assignments.value) return;

    const text = assignments.value
      .map((a) => `${a.santa} → ${a.recipient}`)
      .join("\n");

    await navigator.clipboard.writeText(text);
    copied.value = true;

    // Reset after 2 seconds
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  });

  return (
    <div class="h-full overflow-hidden">
      {/* Hero + Form Section */}
      <section class="relative overflow-hidden bg-gradient-to-b from-cream to-white h-full flex flex-col justify-center py-4">
        {/* Decorative snowflakes */}
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <SnowflakeIcon
            size={40}
            class="absolute top-10 left-[10%] text-christmas-red/10 animate-float"
          />
          <SnowflakeIcon
            size={24}
            class="absolute top-20 right-[15%] text-forest-green/10 animate-float"
            style="animation-delay: 0.5s"
          />
          <TreeIcon
            size={48}
            class="absolute bottom-10 right-[10%] text-forest-green/10"
          />
          <StarIcon
            size={28}
            class="absolute top-32 left-[40%] text-gold/30 animate-twinkle"
          />
        </div>

        <div class="max-w-2xl mx-auto px-4 relative z-10">
          {/* Header */}
          <div class="text-center mb-8">
            <GnomeSquad size="sm" class="mb-4" />

            <h1 class="text-3xl md:text-5xl font-display text-christmas-red text-shadow mb-4">
              Secret Santa Shuffler
            </h1>
            <p class="text-lg md:text-xl text-gray-600 font-handwritten">
              Stop drawing names from a hat like it's 1995. Do it mathemagically!
            </p>
          </div>


          {/* Form / Results */}
          {!showResults.value ? (
            <div class="space-y-4">
              <textarea
                value={namesInput.value}
                onInput$={(e) => {
                  namesInput.value = (e.target as HTMLTextAreaElement).value;
                  error.value = "";
                }}
                placeholder="Alice&#10;Bob&#10;Charlie&#10;Diana"
                class="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-forest-green focus:outline-none focus:ring-2 focus:ring-forest-green/20 min-h-[140px] resize-y transition-all font-handwritten text-lg bg-white"
                rows={5}
              />

              <div class="flex items-center justify-between">
                {parsedNames.value.length > 0 ? (
                  <p class="text-sm text-gray-500 flex items-center gap-2">
                    <UsersIcon size={16} />
                    {parsedNames.value.length} participant{parsedNames.value.length !== 1 ? "s" : ""}
                  </p>
                ) : (
                  <p class="text-sm text-gray-400">One name per line</p>
                )}
              </div>

              {error.value && (
                <p class="text-sm text-christmas-red bg-christmas-red/10 rounded-lg px-4 py-2">
                  {error.value}
                </p>
              )}

              <Button
                variant="primary"
                size="lg"
                class="w-full"
                onClick$={handleShuffle$}
                disabled={parsedNames.value.length < 2}
              >
                <ShuffleIcon size={20} />
                Shuffle!
              </Button>
            </div>
          ) : (
            <div class="relative">
              <Card variant="festive">
                <CardContent>
                  <div class="space-y-6">
                    <div class="text-center">
                      <h2 class="text-2xl font-display text-forest-green mb-2 flex items-center justify-center gap-2 pt-3">
                        <SparklesIcon size={24} class="text-gold animate-twinkle" aria-hidden="true" />
                        Your Assignments!
                        <SparklesIcon size={24} class="text-gold animate-twinkle" style="animation-delay: 0.5s" aria-hidden="true" />
                      </h2>
                      {/* Not very secret callout with CTA */}
                      <div class="mt-3 flex flex-col items-center gap-2">
                        <p class="font-handwritten text-gray-600 text-lg handwriting-reveal pr-1">
                          Not very secret to just dump them all out here, is it?
                        </p>
                        <div class="flex items-center gap-2">
                          {/* Left arrow */}
                          <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"
                            class="text-christmas-red animate-bounce-x"
                            style="opacity: 0; animation: fade-in 0.4s ease-out 2.4s forwards, bounce-x 1s ease-in-out 2.8s infinite"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          <a
                            href="/auth/login"
                            class="inline-flex items-center gap-1 text-christmas-red hover:text-forest-green transition-colors font-semibold font-handwritten text-lg"
                            style="opacity: 0; animation: fade-in 0.4s ease-out 2s forwards"
                          >
                            Plan a gift exchange
                          </a>
                          {/* Right arrow */}
                          <svg 
                            width="24" 
                            height="24" 
                            viewBox="0 0 24 24" 
                            fill="none" 
                            stroke="currentColor" 
                            stroke-width="2" 
                            stroke-linecap="round" 
                            stroke-linejoin="round"
                            class="text-christmas-red animate-bounce-x-reverse"
                            style="opacity: 0; animation: fade-in 0.4s ease-out 2.4s forwards, bounce-x-reverse 1s ease-in-out 2.8s infinite"
                          >
                            <path d="M19 12H5M12 19l-7-7 7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div class="space-y-2 max-h-64 overflow-y-auto">
                      {assignments.value?.map((assignment, index) => (
                        <div
                          key={index}
                          class="flex items-center justify-between bg-cream rounded-lg px-4 py-2 border border-christmas-red/10"
                        >
                          <span class="font-semibold text-gray-800 font-handwritten">
                            {assignment.santa}
                          </span>
                          <GiftIcon size={18} class="text-christmas-red" />
                          <span class="font-semibold text-forest-green font-handwritten">
                            {assignment.recipient}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div class="flex gap-3">
                      <Button
                        variant="secondary"
                        size="lg"
                        class="flex-1"
                        onClick$={handleReset$}
                      >
                        <ShuffleIcon size={18} />
                        Shuffle Again
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick$={handleCopy$}
                      >
                        {copied.value ? (
                          <CheckCircleIcon size={18} />
                        ) : (
                          <CopyIcon size={18} />
                        )}
                        {copied.value ? "Copied!" : "Copy"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>


    </div>
  );
});

export const head: DocumentHead = {
  title: "Secret Santa Shuffler - Easy Gift Exchange Organizer",
  meta: [
    {
      name: "description",
      content:
        "Organize your Secret Santa gift exchange with ease! Free tool to shuffle names, collect wishlists, and send secret assignments via email.",
    },
    {
      name: "keywords",
      content:
        "secret santa, gift exchange, christmas, holiday, shuffle, wishlist, organizer",
    },
    {
      property: "og:title",
      content: "Secret Santa Shuffler - Easy Gift Exchange Organizer",
    },
    {
      property: "og:description",
      content:
        "Organize your Secret Santa gift exchange with ease! Free tool to shuffle names, collect wishlists, and send secret assignments.",
    },
    {
      property: "og:type",
      content: "website",
    },
  ],
};
