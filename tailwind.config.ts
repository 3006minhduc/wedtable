import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pr: "var(--pr)",
        "pr-d": "var(--pr-d)",
        "pr-l": "var(--pr-l)",
        rose: "var(--rose)",
        sage: "var(--sage)",
        ink: "var(--ink)",
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
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
