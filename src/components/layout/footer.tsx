import { component$ } from "@builder.io/qwik";
import { GiftIcon } from "../icons";

export const Footer = component$(() => {
  const currentYear = new Date().getFullYear();

  return (
    <footer class="bg-white border-t border-christmas-red/10 mt-auto relative z-10" role="contentinfo">
      <div class="max-w-6xl mx-auto px-4 py-6">
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div class="flex items-center gap-2 text-christmas-red">
            <GiftIcon size={20} aria-hidden="true" />
            <span class="font-display text-sm font-bold">
              Secret Santa Shuffler
            </span>
          </div>
          <p class="text-sm text-gray-500">
            © {currentYear} No reindeer were harmed.
          </p>
        </div>
      </div>
    </footer>
  );
});
