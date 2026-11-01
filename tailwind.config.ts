import type { Config } from "tailwindcss"

// Colors come from CSS variables in app/globals.css (DESIGN.md §2)
const c = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: c("bg"),
        surface: c("surface"),
        "surface-alt": c("surface-alt"),
        "surface-hover": c("surface-hover"),
        border: c("border"),
        "border-hover": c("border-hover"),
        text: c("text"),
        muted: c("text-secondary"),
        faint: c("text-tertiary"),
        brand: c("brand"),
        "brand-hover": c("brand-hover"),
        "brand-soft": c("brand-soft"),
        ink: c("ink"),
        success: c("success"),
        error: c("error"),
        warning: c("warning"),
        // Legacy aliases kept so older pages keep working
        pr: c("brand"),
        "pr-d": c("brand-hover"),
        "pr-l": c("brand-soft"),
        rose: c("error"),
        sage: c("success"),
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Times New Roman", "serif"],
      },
      borderRadius: {
        card: "12px",
        pill: "8px",
      },
      boxShadow: {
        float: "var(--shadow-float)",
        pop: "var(--shadow-pop)",
      },
    },
  },
  plugins: [],
}
export default config
