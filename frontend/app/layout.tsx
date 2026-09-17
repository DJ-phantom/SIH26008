import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { TelemetryProvider } from "@/lib/TelemetryContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "SRIJAN • SIH26008 | Conveyor Health Monitoring Platform",
  description: "SRIJAN Smart India Hackathon platform for conveyor belt and splice health monitoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <TelemetryProvider>
          <div className="app-shell">
            <AppSidebar />
            <div className="main-wrapper">
              <AppHeader />
              <div className="page-container">{children}</div>
            </div>
          </div>
        </TelemetryProvider>
      </body>
    </html>
  );
}
