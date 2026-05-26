import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./page/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--app-font-family)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        serif: [
          "var(--font-anthropic-serif)",
          "Lora",
          "Georgia",
          "serif",
        ],
        mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
      },
      colors: {
        vellum: {
          white: "var(--color-vellum-white)",
        },
        ink: {
          black: "var(--color-ink-black)",
        },
        onyx: "var(--color-onyx)",
        graphite: "var(--color-graphite)",
        stone: "var(--color-stone)",
        parchment: "var(--color-parchment)",
        "dusty-gray": "var(--color-dusty-gray)",
        "snow-white": "var(--color-snow-white)",
        "pale-azure": "var(--color-pale-azure)",
        "terra-cotta": "var(--color-terra-cotta)",
        /* Modern & Minimal Theme Colors */
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          50: "var(--surface-50)",
          100: "var(--surface-100)",
          200: "var(--surface-200)",
          elevated: "var(--surface-elevated)",
          lowered: "var(--surface-lowered)",
          hover: "var(--surface-hover)",
        },

        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
        },
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-hover)",
        },

        /* Text Colors */
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
          inverse: "var(--text-inverse)",
        },

        /* Accent Colors (Dynamic based on user preference) */
        accent: {
          DEFAULT: "var(--accent)",
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          foreground: "#ffffff",
          hover: "var(--accent-hover)",
          light: "var(--accent-light)",
          lighter: "var(--accent-lighter)",
        },
        /* Interactive State Colors */
        hover: "var(--hover-overlay)",
        active: "var(--active-overlay)",

        /* Semantic Colors */
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },

        /* Legacy colors for compatibility */
        glass: {
          bg: "var(--surface-elevated)",
          border: "var(--border-subtle)",
          hover: "var(--surface-hover)",
        },
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",

        /* Glass effects */
        "glass-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glass-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
        "glass-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "glass-xl":
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "glass-hover": "var(--shadow-md)",

        /* Focus ring */
        focus: "var(--focus-ring)",
      },
      backdropBlur: {
        glass: "12px",
        search: "10px",
      },
      borderRadius: {
        glass: "9.6px",
        search: "24px",
        lg: "9.6px",
        md: "8px",
        sm: "6px",
      },
      animation: {
        "card-hover": "cardHover 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "glass-shimmer": "shimmer 2s infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
        in: "fadeIn 0.5s ease-in-out",
        spinner: "spin 3s linear infinite",
      },
      keyframes: {
        cardHover: {
          "0%": { transform: "translateY(0) scale(1)" },
          "100%": { transform: "translateY(-2px) scale(1.02)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        spinner: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
      },
      typography: {
        DEFAULT: {
          css: {
            "--tw-prose-headings": "var(--text-primary)",
            "--tw-prose-body": "var(--text-secondary)",
            "--tw-prose-links": "var(--brand-600)",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
