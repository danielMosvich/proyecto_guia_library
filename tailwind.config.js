/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ios: {
          bg: "#F2F2F7",          // System Grouped Background
          card: "#FFFFFF",        // Secondary System Grouped Background
          elevated: "#FFFFFF",
          border: "#E5E5EA",      // Separator / Border
          borderDark: "#D1D1D6",
          blue: "#007AFF",        // iOS System Blue
          blueLight: "#E5F2FF",
          green: "#34C759",       // iOS System Green
          greenLight: "#EBF9EE",
          orange: "#FF9500",      // iOS System Orange
          orangeLight: "#FFF4E5",
          red: "#FF3B30",         // iOS System Red
          redLight: "#FFEBEA",
          purple: "#AF52DE",      // iOS System Purple
          purpleLight: "#F5EAFB",
          teal: "#30B0C7",
          gray1: "#8E8E93",
          gray2: "#AEAEB2",
          gray3: "#C7C7CC",
          gray4: "#D1D1D6",
          gray5: "#E5E5EA",
          gray6: "#F2F2F7",
          text: "#1C1C1E",        // Primary Label
          subtext: "#3A3A3C",     // Secondary Label
          tertiary: "#8E8E93",    // Tertiary Label
        }
      },
      screens: {
        'xs': '375px',
      }
    },
  },
  plugins: [],
}
