import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "'Figtree', sans-serif" },
        body: { value: "'Figtree', sans-serif" },
      },
      colors: {
        brand: {
          50: { value: "#FFF0E6" },
          100: { value: "#FFE0CC" },
          200: { value: "#FFBF99" },
          300: { value: "#FF9F66" },
          400: { value: "#FF7F33" },
          500: { value: "#FF5500" },
          600: { value: "#CC4400" },
          700: { value: "#993300" },
          800: { value: "#662200" },
          900: { value: "#331100" },
        },
        gray: {
          50: { value: "#F2F2F2" },
          100: { value: "#EBEBEB" },
          500: { value: "#9F9F9F" },
          900: { value: "#15151B" },
        },
      },
    },
    semanticTokens: {
      colors: {
        background: {
          default: { value: "{colors.gray.50}" },
          _dark: { value: "{colors.gray.900}" },
        },
        text: {
          default: { value: "{colors.gray.900}" },
          _dark: { value: "{colors.gray.50}" },
        },
        muted: {
          default: { value: "{colors.gray.500}" },
          _dark: { value: "{colors.gray.500}" },
        },
        primary: {
          default: { value: "{colors.brand.500}" },
          _dark: { value: "{colors.brand.500}" },
        },
        buttonBg: {
          default: { value: "{colors.brand.500}" },
          _dark: { value: "{colors.brand.500}" },
        },
        buttonHover: {
          default: { value: "{colors.brand.600}" },
          _dark: { value: "{colors.brand.400}" },
        },
        buttonText: {
          default: { value: "white" },
          _dark: { value: "white" },
        },
      },
    },
  },
});

export const system = createSystem(defaultConfig, config);
