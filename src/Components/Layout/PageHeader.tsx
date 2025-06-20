import { Icon } from "@iconify/react";
import { Button, Chip } from "@heroui/react";
import type { ReactNode } from "react";

interface PageHeaderAction {
  label: string;
  icon: string;
  color?:
    | "primary"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "default";
  variant?:
    | "solid"
    | "flat"
    | "bordered"
    | "light"
    | "faded"
    | "shadow"
    | "ghost";
  onClick?: () => void;
  href?: string;
  to?: string;
  as?: any;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon: string;
  iconColor?: string;
  gradient?: boolean;
  subtitle?: string;
  actions?: PageHeaderAction[];
  indicators?: {
    label: string;
    value: string;
    icon?: string;
    color?:
      | "primary"
      | "secondary"
      | "success"
      | "warning"
      | "danger"
      | "default";
  }[];
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export default function PageHeader({
  title,
  description,
  icon,
  iconColor = "text-primary",
  gradient = false,
  subtitle,
  actions = [],
  indicators = [],
  children,
  size = "md",
}: PageHeaderProps) {
  const sizeConfig = {
    sm: {
      iconSize: "w-10 h-10",
      iconWidth: 20,
      titleSize: "text-xl",
      descriptionSize: "text-sm",
      padding: "p-4",
      gap: "gap-4",
    },
    md: {
      iconSize: "w-12 h-12",
      iconWidth: 24,
      titleSize: "text-2xl",
      descriptionSize: "text-sm",
      padding: "p-6",
      gap: "gap-6",
    },
    lg: {
      iconSize: "w-14 h-14",
      iconWidth: 32,
      titleSize: "text-3xl",
      descriptionSize: "text-base",
      padding: "p-8",
      gap: "gap-8",
    },
  };

  const config = sizeConfig[size];

  return (
    <div className={`flex flex-col ${config.gap}`}>
      {/* Main Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-4">
          <div
            className={`${config.iconSize} rounded-2xl ${
              gradient
                ? "bg-gradient-to-br from-primary-500 to-secondary-500"
                : "bg-primary/10"
            } flex items-center justify-center shadow-large`}
          >
            <Icon
              icon={icon}
              className={gradient ? "text-white" : iconColor}
              width={config.iconWidth}
            />
          </div>
          <div>
            <h1
              className={`${config.titleSize} font-bold ${
                gradient
                  ? "bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent"
                  : "text-foreground"
              }`}
            >
              {title}
            </h1>
            {description && (
              <p className={`${config.descriptionSize} text-default-500 mt-1`}>
                {description}
              </p>
            )}
            {subtitle && (
              <p
                className={`${config.descriptionSize} text-default-600 font-medium mt-1`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                color={action.color || "primary"}
                variant={action.variant || "flat"}
                startContent={<Icon icon={action.icon} width={18} />}
                onPress={action.onClick}
                as={action.as}
                href={action.href}
                to={action.to}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Indicators */}
      {indicators.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          {indicators.map((indicator, index) => (
            <div key={index} className="flex items-center gap-2">
              {indicator.icon && (
                <Icon
                  icon={indicator.icon}
                  className={`${
                    indicator.color ? `text-${indicator.color}` : iconColor
                  }`}
                  width={16}
                />
              )}
              <span className="text-sm text-default-600">
                {indicator.label}:{" "}
                <span
                  className={`font-medium ${
                    indicator.color ? `text-${indicator.color}` : "text-primary"
                  }`}
                >
                  {indicator.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Custom children content */}
      {children}
    </div>
  );
}
