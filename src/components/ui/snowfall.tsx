import { component$ } from "@builder.io/qwik";

interface SnowflakeProps {
  delay: number;
  duration: number;
  left: number;
  size: number;
  opacity: number;
}

const Snowflake = component$<SnowflakeProps>(
  ({ delay, duration, left, size, opacity }) => {
    return (
      <div
        class="absolute pointer-events-none select-none"
        style={{
          left: `${left}%`,
          top: "-20px",
          fontSize: `${size}px`,
          opacity: opacity,
          animation: `snowfall ${duration}s linear ${delay}s infinite`,
        }}
        aria-hidden="true"
      >
        ❄
      </div>
    );
  }
);

interface SnowfallProps {
  density?: "light" | "medium" | "heavy";
  class?: string;
}

const densityMap = {
  light: 15,
  medium: 25,
  heavy: 40,
};

export const Snowfall = component$<SnowfallProps>(
  ({ density = "light", class: className = "" }) => {
    const count = densityMap[density];

    // Generate snowflakes with varied properties
    const snowflakes = Array.from({ length: count }, (_, i) => ({
      id: i,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 12, // 8-20 seconds
      left: Math.random() * 100,
      size: 10 + Math.random() * 20, // 10-30px
      opacity: 0.3 + Math.random() * 0.5, // 0.3-0.8
    }));

    return (
      <div
        class={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        aria-hidden="true"
        role="presentation"
      >
        {snowflakes.map((flake) => (
          <Snowflake
            key={flake.id}
            delay={flake.delay}
            duration={flake.duration}
            left={flake.left}
            size={flake.size}
            opacity={flake.opacity}
          />
        ))}
      </div>
    );
  }
);

// Lighter version using CSS-only for better performance
export const SnowfallCSS = component$<{ class?: string }>(
  ({ class: className = "" }) => {
    return (
      <div
        class={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${className}`}
        aria-hidden="true"
        role="presentation"
      >
        <style>
          {`
          .snowflake {
            position: absolute;
            top: -20px;
            color: var(--color-cream-dark);
            pointer-events: none;
            user-select: none;
            animation: snowfall linear infinite;
          }
          .snowflake:nth-child(1) { left: 5%; font-size: 18px; animation-duration: 12s; animation-delay: 0s; opacity: 0.4; }
          .snowflake:nth-child(2) { left: 15%; font-size: 14px; animation-duration: 15s; animation-delay: 2s; opacity: 0.5; }
          .snowflake:nth-child(3) { left: 25%; font-size: 20px; animation-duration: 10s; animation-delay: 4s; opacity: 0.3; }
          .snowflake:nth-child(4) { left: 35%; font-size: 16px; animation-duration: 18s; animation-delay: 1s; opacity: 0.6; }
          .snowflake:nth-child(5) { left: 45%; font-size: 22px; animation-duration: 11s; animation-delay: 3s; opacity: 0.4; }
          .snowflake:nth-child(6) { left: 55%; font-size: 12px; animation-duration: 14s; animation-delay: 5s; opacity: 0.5; }
          .snowflake:nth-child(7) { left: 65%; font-size: 24px; animation-duration: 16s; animation-delay: 0.5s; opacity: 0.3; }
          .snowflake:nth-child(8) { left: 75%; font-size: 15px; animation-duration: 13s; animation-delay: 2.5s; opacity: 0.5; }
          .snowflake:nth-child(9) { left: 85%; font-size: 19px; animation-duration: 17s; animation-delay: 4.5s; opacity: 0.4; }
          .snowflake:nth-child(10) { left: 95%; font-size: 13px; animation-duration: 12s; animation-delay: 1.5s; opacity: 0.6; }
          .snowflake:nth-child(11) { left: 10%; font-size: 17px; animation-duration: 19s; animation-delay: 3.5s; opacity: 0.35; }
          .snowflake:nth-child(12) { left: 30%; font-size: 21px; animation-duration: 11s; animation-delay: 0.2s; opacity: 0.45; }
          .snowflake:nth-child(13) { left: 50%; font-size: 11px; animation-duration: 20s; animation-delay: 2.2s; opacity: 0.55; }
          .snowflake:nth-child(14) { left: 70%; font-size: 23px; animation-duration: 9s; animation-delay: 4.2s; opacity: 0.35; }
          .snowflake:nth-child(15) { left: 90%; font-size: 16px; animation-duration: 14s; animation-delay: 1.2s; opacity: 0.5; }
        `}
        </style>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
        <span class="snowflake">❄</span>
      </div>
    );
  }
);
