/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        crm: {
          bg: "#0b0f17",
          surface: "#141a24",
          surfaceElevated: "#1c2533",
          border: "#2a3645",
          text: "#f2f6fb",
          textMuted: "#93a1b5",
          accent: "#0EA5E9",
          accentHover: "#38bdf8",
          danger: "#ef5350",
          warning: "#f5a623",
          success: "#34d399",
        },
      },
    },
  },
  plugins: [],
};
