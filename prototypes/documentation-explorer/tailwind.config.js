/** @type {import('tailwindcss').Config} */
import { baseTailwindConfig } from '@proto-portal/design-tokens'

export default {
  ...baseTailwindConfig,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../../shared/design-tokens/**/*.{js,ts,jsx,tsx}"
  ]
}