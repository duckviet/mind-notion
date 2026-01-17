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
          "SF Pro Display",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
        mono: ["SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "monospace"],
      },
      colors: {
        /* Modern & Minimal Theme Colors */
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          elevated: "var(--surface-elevated)",
          lowered: "var(--surface-lowered)",
        },
        border: {
          DEFAULT: "var(--border)",
          subtle: "var(--border-subtle)",
        },
        foreground: "var(--foreground)",
        muted: {
          DEFAULT: "var(--muted-foreground)",
          foreground: "var(--muted-foreground)",
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
          DEFAULT: "rgb(var(--accent-rgb) / <alpha-value>)",
          50: "var(--accent-50)",
          100: "var(--accent-100)",
          500: "var(--accent-500)",
          600: "var(--accent-600)",
          700: "var(--accent-700)",
          foreground: "#ffffff",
        },
        /* Interactive State Colors */
        hover: "var(--hover-overlay)",
        active: "var(--active-overlay)",

        /* Semantic Colors */
        primary: {
          DEFAULT: "var(--accent-600)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--surface-elevated)",
          foreground: "var(--text-primary)",
        },
        destructive: {
          DEFAULT: "#ef4444",
          foreground: "#ffffff",
        },

        /* Legacy colors for compatibility */
        glass: {
          bg: "rgba(255, 255, 255, 0.85)",
          border: "rgba(148, 163, 184, 0.2)",
          hover: "rgba(255, 255, 255, 0.95)",
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
        "glass-hover": "0 8px 32px rgba(102, 126, 234, 0.15)",

        /* Focus ring */
        focus: "var(--focus-ring)",
      },
      backdropBlur: {
        glass: "12px",
        search: "10px",
      },
      borderRadius: {
        glass: "12px",
        search: "24px",
        lg: "12px",
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
            "--tw-prose-links": "var(--accent-600)",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};

export default config;
