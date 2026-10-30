import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pr: "rgb(var(--pr-rgb) / <alpha-value>)",
        "pr-d": "rgb(var(--pr-d-rgb) / <alpha-value>)",
        "pr-l": "rgb(var(--pr-l-rgb) / <alpha-value>)",
        rose: "rgb(var(--rose-rgb) / <alpha-value>)",
        sage: "rgb(var(--sage-rgb) / <alpha-value>)",
        ink: "rgb(var(--ink-rgb) / <alpha-value>)",
        bg: "rgb(var(--bg-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        text: "rgb(var(--text-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
      },
      borderRadius: {
        card: "10px",
        pill: "20px",
      },
    },
  },
  plugins: [],
}
export default config
