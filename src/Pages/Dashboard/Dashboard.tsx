"use client";

import { Icon } from "@iconify/react";

export default function Dashboard() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Icon
              icon="solar:home-2-linear"
              className="text-primary"
              width={28}
            />
          </div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Icon
            icon="solar:widget-linear"
            className="text-default-300 mx-auto mb-4"
            width={64}
            height={64}
          />
          <p className="text-xl font-medium text-default-500">
            Dashboard in costruzione
          </p>
          <p className="text-sm text-default-400 mt-2">
            Contenuto in arrivo...
          </p>
        </div>
      </div>
    </div>
  );
}
