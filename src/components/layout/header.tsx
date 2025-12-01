import { component$, useSignal, $ } from "@builder.io/qwik";
import { Link, useLocation } from "@builder.io/qwik-city";
import { GiftIcon, LogOutIcon } from "../icons";

export interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export const Header = component$<HeaderProps>(
  ({ isLoggedIn = false, userName }) => {
    const location = useLocation();
    const isActive = (path: string) => location.url.pathname === path;
    const mobileMenuOpen = useSignal(false);

    const toggleMenu = $(() => {
      mobileMenuOpen.value = !mobileMenuOpen.value;
    });

    const closeMenu = $(() => {
      mobileMenuOpen.value = false;
    });

    return (
      <header class="bg-white/80 backdrop-blur-sm border-b border-christmas-red/10 sticky top-0 z-40">
        <div class="max-w-6xl mx-auto px-4">
          <div class="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              class="flex items-center gap-2 text-christmas-red hover:text-christmas-red-dark transition-colors"
              aria-label="Secret Santa Shuffler - Home"
            >
              <GiftIcon size={32} class="text-christmas-red animate-float" aria-hidden="true" />
              <span class="font-display text-xl font-bold hidden sm:inline">
                Secret Santa Shuffler
              </span>
              <span class="font-display text-xl font-bold sm:hidden">
                Santa Shuffler
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav class="hidden md:flex items-center gap-4" aria-label="Main navigation">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/dashboard"
                    class={[
                      "px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center",
                      isActive("/dashboard/")
                        ? "bg-christmas-red/10 text-christmas-red"
                        : "text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5",
                    ].join(" ")}
                  >
                    My Exchanges
                  </Link>
                  <Link
                    href="/exchanges/new"
                    class={[
                      "px-3 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px] flex items-center",
                      isActive("/exchanges/new/")
                        ? "bg-christmas-red/10 text-christmas-red"
                        : "text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5",
                    ].join(" ")}
                  >
                    New Exchange
                  </Link>
                  <div class="h-6 w-px bg-gray-200" aria-hidden="true" />
                  <div class="flex items-center gap-3">
                    {userName && (
                      <span class="text-sm text-gray-600">
                        Hi, {userName}!
                      </span>
                    )}
                    <Link
                      href="/auth/logout"
                      class="px-4 py-2 rounded-full text-sm font-medium text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5 transition-colors min-h-[44px] flex items-center gap-2"
                    >
                      <LogOutIcon size={16} aria-hidden="true" />
                      Sign Out
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    class="px-4 py-2 rounded-full text-sm font-medium bg-christmas-red text-white border-2 border-white hover:bg-white hover:text-christmas-red hover:border-christmas-red focus:bg-white focus:text-christmas-red focus:border-christmas-red transition-colors min-h-[44px] flex items-center"
                  >
                    Plan a gift exchange
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              type="button"
              class="md:hidden p-2 rounded-lg text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              onClick$={toggleMenu}
              aria-expanded={mobileMenuOpen.value}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen.value ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen.value ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen.value && (
          <div
            id="mobile-menu"
            class="md:hidden border-t border-christmas-red/10 bg-white/95 backdrop-blur-sm"
          >
            <nav class="px-4 py-3 space-y-1" aria-label="Mobile navigation">
              {isLoggedIn ? (
                <>
                  {userName && (
                    <p class="px-3 py-2 text-sm text-gray-500 font-handwritten">
                      Hi, {userName}!
                    </p>
                  )}
                  <Link
                    href="/dashboard"
                    onClick$={closeMenu}
                    class={[
                      "block px-3 py-3 rounded-lg text-base font-medium transition-colors",
                      isActive("/dashboard/")
                        ? "bg-christmas-red/10 text-christmas-red"
                        : "text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5",
                    ].join(" ")}
                  >
                    My Exchanges
                  </Link>
                  <Link
                    href="/exchanges/new"
                    onClick$={closeMenu}
                    class={[
                      "block px-3 py-3 rounded-lg text-base font-medium transition-colors",
                      isActive("/exchanges/new/")
                        ? "bg-christmas-red/10 text-christmas-red"
                        : "text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5",
                    ].join(" ")}
                  >
                    New Exchange
                  </Link>
                  <div class="border-t border-gray-200 my-2" aria-hidden="true" />
                  <Link
                    href="/auth/logout"
                    onClick$={closeMenu}
                    class="flex items-center gap-2 px-3 py-3 rounded-lg text-base font-medium text-gray-600 hover:text-christmas-red hover:bg-christmas-red/5 transition-colors"
                  >
                    <LogOutIcon size={18} aria-hidden="true" />
                    Sign Out
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    onClick$={closeMenu}
                    class="block px-3 py-3 rounded-lg text-base font-medium bg-christmas-red text-white text-center border-2 border-white hover:bg-white hover:text-christmas-red hover:border-christmas-red focus:bg-white focus:text-christmas-red focus:border-christmas-red transition-colors"
                  >
                    Plan a gift exchange
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}

        {/* Festive decoration line */}
        <div class="h-1 bg-gradient-to-r from-christmas-red via-forest-green to-christmas-red opacity-30" aria-hidden="true" />
      </header>
    );
  }
);
