import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Snake Game",
  description: "Modern Snake Game created by Paras Varankar",
  applicationName: "Snake Game",
  authors: [
    {
      name: "Paras Varankar",
    },
  ],
  creator: "Paras Varankar",
  keywords: ["Snake Game", "Next.js", "React", "Game"],

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}

        <footer
          style={{
            textAlign: "center",
            padding: "12px",
            fontSize: "14px",
            color: "#94a3b8",
            background: "#020617",
          }}
        >
          🐍 Created by <strong>Paras Varankar</strong>
        </footer>
      </body>
    </html>
  );
}