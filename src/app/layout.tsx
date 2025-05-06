"use client";

import React from "react";
import MobileNavBar from "@/Components/Layout/MobileNavBar";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>
        {children}
        <MobileNavBar />
      </body>
    </html>
  );
} 