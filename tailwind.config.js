/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  darkMode: "class",
  theme: {
    // Keep project tokens here (so utilities like bg-primary-600 exist)
    extend: {
      colors: {
        primary: {

          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        secondary: {
          50: "#F8FAFC",
          100: "#EEF2F7",
          200: "#E5E7EB",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1F2937",
          900: "#0F172A",
        },
      },

      borderRadius: {
        premium: "1rem",
      },

      boxShadow: {
        premium: "0 10px 25px -10px rgba(59, 130, 246, 0.35), 0 4px 10px -6px rgba(2, 6, 23, 0.35)",
      },

      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica", "Arial", "sans-serif"],
      },

      // Explicitly defined to satisfy the “MUST exist” requirement
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        28: "7rem",
      },

      maxWidth: {
        premium: "72rem",
      },
    },
  },
  plugins: [],
};
