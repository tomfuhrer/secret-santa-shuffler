import { component$ } from "@builder.io/qwik";
import { Form, type ActionStore } from "@builder.io/qwik-city";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle
} from "~/components/ui/card";
import { StarIcon, TreeIcon } from "~/components/icons";
import type { Questionnaire } from "~/lib/db/types";

type QuestionnaireActionStore = ActionStore<any, any, any>;

export interface QuestionnaireFormProps {
  action: QuestionnaireActionStore;
  existingData?: Questionnaire | null;
  participantName?: string | null;
}

/**
 * Questionnaire Form Component
 * 
 * A festive multi-section form for participants to fill out their gift preferences.
 * Matches the PDF design with grouped fields for better organization.
 */
export const QuestionnaireForm = component$<QuestionnaireFormProps>(
  ({ action, existingData, participantName }) => {
    const isUpdate = !!existingData;

    return (
      <Form action={action} class="space-y-8">
        {/* Error display */}
        {action.value?.error && (
          <div class="p-4 bg-christmas-red/10 border border-christmas-red/30 rounded-lg text-christmas-red">
            {action.value.error}
          </div>
        )}

        {/* Success message */}
        {action.value?.success && (
          <div class="p-4 bg-forest-green/10 border border-forest-green/30 rounded-lg text-forest-green">
            {action.value.message || "Your preferences have been saved!"}
          </div>
        )}

        {/* Section 1: About You */}
        <Card variant="festive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">👤</span>
              About You
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <Input
              id="name"
              name="name"
              type="text"
              label="Your Name"
              placeholder="What should we call you?"
              value={existingData?.name ?? participantName ?? ""}
              required
              error={action.value?.fieldErrors?.name?.[0]}
            />

            <Textarea
              id="never_buy_myself"
              name="never_buy_myself"
              label="Something I'd love but would never buy for myself"
              placeholder="That fancy thing you've been eyeing but can't justify buying..."
              value={existingData?.never_buy_myself ?? ""}
              rows={3}
              error={action.value?.fieldErrors?.never_buy_myself?.[0]}
            />

            <Textarea
              id="please_no"
              name="please_no"
              label="Please, no..."
              placeholder="Allergies, dislikes, things you have too many of..."
              value={existingData?.please_no ?? ""}
              rows={3}
              error={action.value?.fieldErrors?.please_no?.[0]}
            />
          </CardContent>
        </Card>

        {/* Section 2: How You Spend Your Time */}
        <Card variant="festive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">🎯</span>
              Your Interests
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <Textarea
              id="spare_time"
              name="spare_time"
              label="In my spare time I like to..."
              placeholder="Hobbies, activities, ways you like to unwind..."
              value={existingData?.spare_time ?? ""}
              rows={3}
              error={action.value?.fieldErrors?.spare_time?.[0]}
            />

            <Textarea
              id="other_loves"
              name="other_loves"
              label="Other things I love"
              placeholder="Anything else that makes you happy!"
              value={existingData?.other_loves ?? ""}
              rows={3}
              error={action.value?.fieldErrors?.other_loves?.[0]}
            />
          </CardContent>
        </Card>

        {/* Section 3: Favorites */}
        <Card variant="festive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <StarIcon size={24} class="text-gold" />
              Your Favorites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="favorite_color"
                name="favorite_color"
                type="text"
                label="Favorite Color"
                placeholder="e.g., Forest green, Navy blue"
                value={existingData?.favorite_color ?? ""}
                error={action.value?.fieldErrors?.favorite_color?.[0]}
              />

              <Input
                id="favorite_sports_team"
                name="favorite_sports_team"
                type="text"
                label="Favorite Sports Team"
                placeholder="e.g., Cubs, Lakers, Arsenal"
                value={existingData?.favorite_sports_team ?? ""}
                error={action.value?.fieldErrors?.favorite_sports_team?.[0]}
              />

              <Input
                id="favorite_pattern"
                name="favorite_pattern"
                type="text"
                label="Favorite Pattern"
                placeholder="e.g., Plaid, Stripes, Floral"
                value={existingData?.favorite_pattern ?? ""}
                error={action.value?.fieldErrors?.favorite_pattern?.[0]}
              />

              <Input
                id="favorite_supplies"
                name="favorite_supplies"
                type="text"
                label="Favorite Office/Craft Supplies"
                placeholder="e.g., Fancy pens, Washi tape"
                value={existingData?.favorite_supplies ?? ""}
                error={action.value?.fieldErrors?.favorite_supplies?.[0]}
              />

              <Input
                id="favorite_restaurant"
                name="favorite_restaurant"
                type="text"
                label="Favorite Restaurant"
                placeholder="e.g., Local cafe, Olive Garden"
                value={existingData?.favorite_restaurant ?? ""}
                error={action.value?.fieldErrors?.favorite_restaurant?.[0]}
              />

              <Input
                id="favorite_store"
                name="favorite_store"
                type="text"
                label="Favorite Store"
                placeholder="e.g., Target, Barnes & Noble"
                value={existingData?.favorite_store ?? ""}
                error={action.value?.fieldErrors?.favorite_store?.[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Food & Drinks */}
        <Card variant="festive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <span class="text-2xl">🍪</span>
              Food & Drinks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="favorite_snacks"
                name="favorite_snacks"
                type="text"
                label="Favorite Snacks"
                placeholder="e.g., Popcorn, Trail mix, Chips"
                value={existingData?.favorite_snacks ?? ""}
                error={action.value?.fieldErrors?.favorite_snacks?.[0]}
              />

              <Input
                id="favorite_beverages"
                name="favorite_beverages"
                type="text"
                label="Favorite Beverages"
                placeholder="e.g., Coffee, Tea, Hot cocoa"
                value={existingData?.favorite_beverages ?? ""}
                error={action.value?.fieldErrors?.favorite_beverages?.[0]}
              />

              <Input
                id="favorite_candy"
                name="favorite_candy"
                type="text"
                label="Favorite Candy"
                placeholder="e.g., Chocolate, Gummy bears"
                value={existingData?.favorite_candy ?? ""}
                error={action.value?.fieldErrors?.favorite_candy?.[0]}
              />

              <Input
                id="favorite_fragrances"
                name="favorite_fragrances"
                type="text"
                label="Favorite Fragrances"
                placeholder="e.g., Vanilla, Pine, Lavender"
                value={existingData?.favorite_fragrances ?? ""}
                error={action.value?.fieldErrors?.favorite_fragrances?.[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Holiday Spirit */}
        <Card variant="festive">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <TreeIcon size={24} class="text-forest-green" />
              Holiday Spirit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="favorite_christmas_movie"
                name="favorite_christmas_movie"
                type="text"
                label="Favorite Christmas Movie"
                placeholder="e.g., Elf, Home Alone, Die Hard"
                value={existingData?.favorite_christmas_movie ?? ""}
                error={action.value?.fieldErrors?.favorite_christmas_movie?.[0]}
              />

              <Input
                id="favorite_christmas_song"
                name="favorite_christmas_song"
                type="text"
                label="Favorite Christmas Song"
                placeholder="e.g., All I Want for Christmas"
                value={existingData?.favorite_christmas_song ?? ""}
                error={action.value?.fieldErrors?.favorite_christmas_song?.[0]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit button */}
        <div class="flex justify-center pt-4">
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            loading={action.isRunning}
            class="min-w-[200px]"
          >
            {action.isRunning
              ? "Saving..."
              : isUpdate
                ? "Update My Preferences"
                : "Save My Preferences"}
          </Button>
        </div>

        {/* Helper text */}
        <p class="text-center text-sm text-gray-500">
          Don't worry, you can update your answers anytime before the shuffle!
        </p>
      </Form>
    );
  }
);
