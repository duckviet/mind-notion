import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    "./page/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "SF Pro Display",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      colors: {
        // MyMind Design System Colors
        glass: {
          bg: "rgba(255, 255, 255, 0.85)",
          border: "rgba(148, 163, 184, 0.2)",
          hover: "rgba(255, 255, 255, 0.95)",
        },
        background: {
          gradient: "linear-gradient(135deg, #f0f4ff 0%, #e2e8ff 100%)",
          primary: "#f0f4ff",
          secondary: "#e2e8ff",
        },
        text: {
          primary: "#1e293b",
          secondary: "#64748b",
          muted: "#94a3b8",
        },
        accent: {
          blue: "#667eea",
          purple: "#764ba2",
        },
      },
      boxShadow: {
        "glass-sm": "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        "glass-md":
          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)",
        "glass-lg":
          "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
        "glass-xl":
          "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        "glass-hover": "0 8px 32px rgba(102, 126, 234, 0.15)",
      },
      backdropBlur: {
        glass: "12px",
        search: "10px",
      },
      borderRadius: {
        glass: "12px",
        search: "24px",
      },
      animation: {
        "card-hover": "cardHover 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        "glass-shimmer": "shimmer 2s infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
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
            "--tw-prose-headings": "#1e293b",
            "--tw-prose-body": "#64748b",
            "--tw-prose-links": "#667eea",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
