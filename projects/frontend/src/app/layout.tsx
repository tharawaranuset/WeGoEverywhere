import type { Metadata } from "next";
import { Karla, Urbanist } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import { ConfirmProvider } from "@/components/popup/ConfirmProvider";
import { Toaster } from "react-hot-toast";
import Link from "next/link";
import { NotificationProvider } from "@/components/notification/NotificationContext";

const urbanist = Urbanist({
  variable: "--font-urbanist",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "WeGoEveryWhere",
  description: "by WeGoEveryWhere SE Project Group 2",
  icons: "images/circlelogoinvert.png",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </head>
      <body
        className={`${urbanist.variable} antialiased min-h-dvh bg-black text-white`}
      >
        <NotificationProvider>
          <ConfirmProvider>
            {/* Make Phone at the middle */}
            <div className="min-h-dvh flex items-center justify-center p-2 bg-black">
              {/* Phone Frame */}
              <div
                className="
                relative w-[390px] h-[844px] max-h-[calc(100dvh-1rem)]
                overflow-hidden rounded-2xl border shadow-2xl pt-2 pl-2 pr-2 pb-0
              "
                style={{
                  background: "var(--color-brand-background)",
                  borderColor: "var(--foreground)",
                  color: "var(--foreground)",
                }}
              >
                <div className="size-full flex flex-col overflow-hidden pt-[2px] pb-0 pl-[5px] pr-[3px]">
                  <div className="bg-brand-primary">
                    <header className="bg-[var(--color-brand-secondary)] rounded-b-[50px] px-3 py-5 overflow-hidden" id="default-header">
                      <div className="flex items-center justify-between">
                        <Link href={"/"}>
                          <h1 className="text-xl font-alt sm:text-2xl font-extrabold leading-none -translate-y-0.5 sm:-translate-y-1  ml-2 sm:ml-4">
                            <span className="block text-[var(--color-brand-tertiary)]">
                              WeGo
                            </span>
                            <span className="block text-[var(--color-brand-tertiary)]">
                              EveryWhere
                            </span>
                          </h1>
                        </Link>
                        <Link href={"/"}>
                          <Image
                            src="/images/logo.png"
                            alt="Logo"
                            width={100}
                            height={100}
                          />
                        </Link>
                      </div>
                    </header>
                  </div>
                  <div className="font-alt flex-1 overflow-auto scrollbar-hide">
                    {children}
                  </div>
                  {/* <footer className="mt-auto">
                  <Navbar />
                </footer> */}
                  <Toaster position="top-center" reverseOrder={false} />
                </div>
              </div>
            </div>
          </ConfirmProvider>
        </NotificationProvider>
      </body>
    </html>
  );
}
