import type { Config } from "tailwindcss"

export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",

    // 👇 Add your base app components here
    "../core-frontend/src/**/*.{vue,js,ts,jsx,tsx}",
    "../core-frontend/components/**/*.{vue,js,ts,jsx,tsx}",
    "../core-frontend/dist/**/*.{js,css}", // 👈 Add built files

  ]
} satisfies Config