import { component$ } from "@builder.io/qwik";

/**
 * Gnome variants based on the reference PDF - each has unique personality!
 * - stripey: Red/white striped hat, leans left, chill vibes
 * - holly: Green hat, holding a wreath, festive energy
 * - dotty: Red hat with white hearts, sweet and cheerful  
 * - classic: Solid red hat, leans right, traditional
 */
export type GnomeVariant = "stripey" | "holly" | "dotty" | "classic";

interface FestiveGnomeProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: GnomeVariant;
  class?: string;
  animated?: boolean;
}

const sizeMap = {
  sm: { width: 50, height: 70 },
  md: { width: 80, height: 110 },
  lg: { width: 120, height: 165 },
  xl: { width: 160, height: 220 },
};

// Stripey gnome - red/white horizontal stripes, leaning left
const StripeyGnome = component$<{ animated: boolean }>(({ animated }) => (
  <g class={animated ? "animate-float" : ""} style="animation-delay: 0.1s">
    {/* Hat - striped */}
    <path
      d="M45 8 L20 70 L70 70 Z"
      fill="#c41e3a"
    />
    {/* Stripes */}
    <path d="M42 18 L24 58" stroke="white" stroke-width="6" stroke-linecap="round" />
    <path d="M46 28 L30 62" stroke="white" stroke-width="6" stroke-linecap="round" />
    <path d="M50 38 L38 66" stroke="white" stroke-width="6" stroke-linecap="round" />
    <path d="M54 48 L46 68" stroke="white" stroke-width="6" stroke-linecap="round" />
    {/* Pom pom */}
    <circle cx="45" cy="10" r="8" fill="white" />
    {/* Big nose */}
    <circle cx="45" cy="78" r="12" fill="#f0b8a8" />
    <circle cx="42" cy="75" r="3" fill="#f8d4c8" opacity="0.8" />
    {/* Beard */}
    <ellipse cx="45" cy="100" rx="32" ry="28" fill="#e8e4e0" />
    <ellipse cx="45" cy="102" rx="28" ry="24" fill="#f5f2ef" />
    {/* Beard texture */}
    <path d="M25 95 Q28 108 24 120" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M38 92 Q40 108 36 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M52 92 Q50 108 54 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M65 95 Q62 108 66 120" stroke="#ddd9d5" stroke-width="2" fill="none" />
  </g>
));

// Holly gnome - green hat, holding wreath, arms out
const HollyGnome = component$<{ animated: boolean }>(({ animated }) => (
  <g class={animated ? "animate-float" : ""} style="animation-delay: 0.3s">
    {/* Hat - solid green with curl */}
    <path
      d="M50 5 L25 70 L75 70 Z"
      fill="#228b22"
    />
    {/* Hat curl/flop */}
    <path
      d="M50 5 Q65 10 58 25"
      stroke="#228b22"
      stroke-width="10"
      fill="none"
      stroke-linecap="round"
    />
    {/* Pom pom */}
    <circle cx="58" cy="25" r="7" fill="white" />
    {/* Arms holding wreath */}
    <ellipse cx="50" cy="85" rx="20" ry="15" fill="none" stroke="#228b22" stroke-width="5" />
    <circle cx="35" cy="78" r="3" fill="#c41e3a" />
    <circle cx="65" cy="78" r="3" fill="#c41e3a" />
    <circle cx="50" cy="72" r="3" fill="#c41e3a" />
    <circle cx="42" cy="92" r="3" fill="#c41e3a" />
    <circle cx="58" cy="92" r="3" fill="#c41e3a" />
    {/* Big nose */}
    <circle cx="50" cy="82" r="12" fill="#f0b8a8" />
    <circle cx="47" cy="79" r="3" fill="#f8d4c8" opacity="0.8" />
    {/* Beard */}
    <ellipse cx="50" cy="105" rx="32" ry="26" fill="#e8e4e0" />
    <ellipse cx="50" cy="107" rx="28" ry="22" fill="#f5f2ef" />
    {/* Beard texture */}
    <path d="M28 100 Q32 115 28 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M42 98 Q44 115 40 128" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M58 98 Q56 115 60 128" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M72 100 Q68 115 72 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
  </g>
));

// Dotty gnome - red hat with white hearts/dots
const DottyGnome = component$<{ animated: boolean }>(({ animated }) => (
  <g class={animated ? "animate-float" : ""} style="animation-delay: 0.5s">
    {/* Hat - red with hearts */}
    <path
      d="M50 8 L25 70 L75 70 Z"
      fill="#c41e3a"
    />
    {/* Hearts/dots pattern */}
    <circle cx="42" cy="30" r="4" fill="white" opacity="0.9" />
    <circle cx="55" cy="38" r="3" fill="white" opacity="0.9" />
    <circle cx="38" cy="50" r="4" fill="white" opacity="0.9" />
    <circle cx="52" cy="55" r="3" fill="white" opacity="0.9" />
    <circle cx="45" cy="42" r="3" fill="white" opacity="0.9" />
    <circle cx="60" cy="52" r="3" fill="white" opacity="0.9" />
    {/* Pom pom */}
    <circle cx="50" cy="10" r="7" fill="white" />
    {/* Big nose */}
    <circle cx="50" cy="78" r="12" fill="#f0b8a8" />
    <circle cx="47" cy="75" r="3" fill="#f8d4c8" opacity="0.8" />
    {/* Beard */}
    <ellipse cx="50" cy="100" rx="32" ry="28" fill="#e8e4e0" />
    <ellipse cx="50" cy="102" rx="28" ry="24" fill="#f5f2ef" />
    {/* Beard texture */}
    <path d="M26 95 Q30 110 26 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M40 92 Q42 110 38 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M60 92 Q58 110 62 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M74 95 Q70 110 74 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
  </g>
));

// Classic gnome - solid red, leaning right
const ClassicGnome = component$<{ animated: boolean }>(({ animated }) => (
  <g class={animated ? "animate-float" : ""} style="animation-delay: 0.7s">
    {/* Hat - solid red, leaning right */}
    <path
      d="M55 8 L30 70 L80 70 Z"
      fill="#c41e3a"
    />
    {/* Subtle highlight on hat */}
    <path
      d="M52 20 L42 50"
      stroke="#e63950"
      stroke-width="4"
      stroke-linecap="round"
      opacity="0.4"
    />
    {/* Pom pom */}
    <circle cx="55" cy="10" r="7" fill="white" />
    {/* Big nose */}
    <circle cx="55" cy="78" r="12" fill="#f0b8a8" />
    <circle cx="52" cy="75" r="3" fill="#f8d4c8" opacity="0.8" />
    {/* Beard */}
    <ellipse cx="55" cy="100" rx="32" ry="28" fill="#e8e4e0" />
    <ellipse cx="55" cy="102" rx="28" ry="24" fill="#f5f2ef" />
    {/* Beard texture */}
    <path d="M32 95 Q36 110 32 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M48 92 Q50 110 46 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M62 92 Q60 110 64 125" stroke="#ddd9d5" stroke-width="2" fill="none" />
    <path d="M78 95 Q74 110 78 122" stroke="#ddd9d5" stroke-width="2" fill="none" />
  </g>
));

export const FestiveGnome = component$<FestiveGnomeProps>(
  ({ size = "md", variant = "classic", class: className = "", animated = true }) => {
    const { width, height } = sizeMap[size];

    return (
      <div
        class={`inline-block ${className}`}
        role="img"
        aria-label={`Festive ${variant} gnome`}
      >
        <svg
          width={width}
          height={height}
          viewBox="0 0 100 130"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {variant === "stripey" && <StripeyGnome animated={animated} />}
          {variant === "holly" && <HollyGnome animated={animated} />}
          {variant === "dotty" && <DottyGnome animated={animated} />}
          {variant === "classic" && <ClassicGnome animated={animated} />}
        </svg>
      </div>
    );
  }
);

// Group of all 4 gnomes together like in the PDF header
export const GnomeSquad = component$<{
  size?: "sm" | "md" | "lg";
  class?: string;
}>(({ size = "md", class: className = "" }) => {
  return (
    <div class={`flex items-end justify-center gap-1 ${className}`} role="img" aria-label="Four festive gnomes">
      <FestiveGnome variant="stripey" size={size} />
      <FestiveGnome variant="holly" size={size} />
      <FestiveGnome variant="dotty" size={size} />
      <FestiveGnome variant="classic" size={size} />
    </div>
  );
});

// Single gnome with optional message
export const GnomeMascot = component$<{
  message?: string;
  variant?: GnomeVariant;
  class?: string;
}>(({ message, variant = "classic", class: className = "" }) => {
  return (
    <div class={`flex flex-col items-center gap-3 ${className}`}>
      <FestiveGnome variant={variant} size="lg" />
      {message && (
        <p class="font-handwritten text-lg text-christmas-red text-center max-w-xs">
          {message}
        </p>
      )}
    </div>
  );
});
