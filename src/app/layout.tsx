import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
    title: "Chemija – Interaktyvus chemijos mokymasis",
    description:
        "Interaktyvi chemijos mokymosi programa 12 klasės mokiniams. Reakcijos kinetika, pusiausvyra, organinė chemija, elektrochemija ir daugiau.",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="lt">
            <body className="animated-bg particle-bg min-h-screen">
                <Sidebar />
                <main className="lg:ml-72 min-h-screen">
                    <div className="relative z-10 p-4 md:p-8 pt-16 lg:pt-8 max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </body>
        </html>
    );
}
