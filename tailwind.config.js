/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        warehouse: {
          bg: "#F8FAFC",
          card: "#FFFFFF",
          pending: "#64748B",    // Slate
          partial: "#D97706",    // Amber
          observed: "#DC2626",   // Red
          extra: "#7C3AED",      // Purple
          complete: "#16A34A",   // Green
        }
      },
      screens: {
        'xs': '375px',
      }
    },
  },
  plugins: [],
}
