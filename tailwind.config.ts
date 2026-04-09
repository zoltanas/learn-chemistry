import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    dark: "#0a0e1a",
                    darker: "#060912",
                    card: "#111827",
                    border: "#1e293b",
                    cyan: "#06b6d4",
                    purple: "#a855f7",
                    green: "#22c55e",
                    orange: "#f97316",
                    pink: "#ec4899",
                },
            },
            fontFamily: {
                sans: ["Inter", "sans-serif"],
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
            },
        },
    },
    plugins: [],
};
export default config;
