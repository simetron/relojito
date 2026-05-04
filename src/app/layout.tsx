import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relojito",
  description: "Minimalist time tracking app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.setAttribute('data-theme','dark');}}catch(e){}})();`,
        }}
      />
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
