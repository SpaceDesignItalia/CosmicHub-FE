"use client";

import { Icon } from "@iconify/react";
import PageHeader from "../../Components/Layout/PageHeader";

export default function Dashboard() {
  return (
    <div className="w-full flex-1 flex flex-col p-4 gap-6">
      <PageHeader
        title="Dashboard"
        description="Panoramica generale del sistema"
        icon="solar:home-2-bold-duotone"
        size="md"
      />

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
