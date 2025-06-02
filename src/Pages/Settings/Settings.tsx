import {
  Button,
  RadioGroup,
  Select,
  SelectItem,
  Spacer,
  Tab,
  Tabs,
  useRadio,
  VisuallyHidden,
  Input,
  Switch,
  cn,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import React from "react";
import { useCustomTheme } from "../../providers/ThemeProvider";

// Interface for ThemeCustomRadio props
interface ThemeCustomRadioProps {
  value: string;
  variant: "light" | "dark";
  children: React.ReactNode;
}

// Data arrays for selects
const timeZoneOptions = [
  { value: "utc-12", label: "(UTC-12:00) Baker Island" },
  { value: "utc-11", label: "(UTC-11:00) Niue" },
  { value: "utc-10", label: "(UTC-10:00) Hawaii" },
  { value: "utc-9", label: "(UTC-09:00) Alaska" },
  { value: "utc-8", label: "(UTC-08:00) Pacific Time" },
  { value: "utc-7", label: "(UTC-07:00) Mountain Time" },
  { value: "utc-6", label: "(UTC-06:00) Central Time" },
  { value: "utc-5", label: "(UTC-05:00) Eastern Time" },
  { value: "utc-4", label: "(UTC-04:00) Atlantic Time" },
  { value: "utc-3", label: "(UTC-03:00) Argentina" },
  { value: "utc-2", label: "(UTC-02:00) South Georgia" },
  { value: "utc-1", label: "(UTC-01:00) Azores" },
  { value: "utc+0", label: "(UTC+00:00) London, Dublin" },
  { value: "utc+1", label: "(UTC+01:00) Rome, Paris, Berlin" },
  { value: "utc+2", label: "(UTC+02:00) Cairo, Helsinki" },
  { value: "utc+3", label: "(UTC+03:00) Moscow, Istanbul" },
  { value: "utc+4", label: "(UTC+04:00) Dubai, Baku" },
  { value: "utc+5", label: "(UTC+05:00) Karachi, Tashkent" },
  { value: "utc+6", label: "(UTC+06:00) Almaty, Dhaka" },
  { value: "utc+7", label: "(UTC+07:00) Bangkok, Jakarta" },
  { value: "utc+8", label: "(UTC+08:00) Beijing, Singapore" },
  { value: "utc+9", label: "(UTC+09:00) Tokyo, Seoul" },
  { value: "utc+10", label: "(UTC+10:00) Sydney, Melbourne" },
  { value: "utc+11", label: "(UTC+11:00) Solomon Islands" },
  { value: "utc+12", label: "(UTC+12:00) Fiji, New Zealand" },
];

const fontSizeOptions = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "extra-large", label: "Extra Large" },
];

// Settings component props interface
interface SettingsProps {
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  isCollapsed?: boolean;
  setIsCollapsed?: (collapsed: boolean) => void;
  onOpenChange?: () => void;
}

export default function Settings({
  className,
  ref,
  isCollapsed,
  setIsCollapsed,
  onOpenChange,
  ...props
}: SettingsProps) {
  // Get theme from provider
  const { theme, setTheme } = useCustomTheme();

  const ThemeCustomRadio = (props: ThemeCustomRadioProps) => {
    const { variant } = props;
    const {
      Component,
      children,
      // isSelected,
      description,
      getBaseProps,
      getWrapperProps,
      getInputProps,
      getLabelProps,
      getLabelWrapperProps,
      getControlProps,
    } = useRadio(props);
    const wrapperProps = getWrapperProps();

    return (
      <Component
        {...getBaseProps()}
        className={cn(
          "group inline-flex flex-row-reverse justify-between overflow-visible hover:bg-content2",
          "max-w-[300px] cursor-pointer gap-4 rounded-large border-1 border-default-200 px-4 py-2.5 shadow-md",
          "relative h-[132px] flex-1 overflow-hidden"
        )}
      >
        <VisuallyHidden>
          <input {...getInputProps()} />
        </VisuallyHidden>
        <span
          {...getWrapperProps()}
          className={cn(
            wrapperProps["className"],
            "border-2 border-default",
            "group-data-[selected=true]:border-default-foreground"
          )}
        >
          <span
            {...getControlProps()}
            className={cn(
              "z-10 h-2 w-2 origin-center scale-0 rounded-full bg-default-foreground text-primary-foreground opacity-0 transition-transform-opacity group-data-[selected=true]:scale-100 group-data-[selected=true]:opacity-100 motion-reduce:transition-none"
            )}
          />
        </span>
        <div {...getLabelWrapperProps()}>
          {children && <span {...getLabelProps()}>{children}</span>}
          {description && (
            <span className="text-small text-foreground opacity-70">
              {description}
            </span>
          )}
        </div>
        <div
          className={cn("absolute left-[32px] top-[37px]", {
            hidden: variant === "light",
          })}
        >
          <svg
            fill="none"
            height="117"
            viewBox="0 0 240 117"
            width="240"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0.5H228C234.351 0.5 239.5 5.64873 239.5 12V116.5H0.5V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
              fill="black"
            />
            <path
              d="M12 0.5H228C234.351 0.5 239.5 5.64873 239.5 12V116.5H0.5V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
              stroke="#3F3F46"
            />
            <path
              d="M32 48.5C32 45.4624 34.4624 43 37.5 43H67.5C70.5376 43 73 45.4624 73 48.5V48.5C73 51.5376 70.5376 54 67.5 54H37.5C34.4624 54 32 51.5376 32 48.5V48.5Z"
              fill="#27272A"
            />
            <path
              d="M17 105C17 101.686 19.6863 99 23 99H67C70.3137 99 73 101.686 73 105V105C73 108.314 70.3137 111 67 111H23C19.6863 111 17 108.314 17 105V105Z"
              fill="#27272A"
            />
            <path
              d="M88 25.5C88 22.4624 90.4624 20 93.5 20H207.5C210.538 20 213 22.4624 213 25.5V25.5C213 28.5376 210.538 31 207.5 31H93.5C90.4624 31 88 28.5376 88 25.5V25.5Z"
              fill="#3F3F46"
            />
            <path
              d="M88 105C88 101.686 90.6863 99 94 99H189C192.314 99 195 101.686 195 105V105C195 108.314 192.314 111 189 111H94C90.6863 111 88 108.314 88 105V105Z"
              fill="#27272A"
            />
            <path
              d="M88 51C88 46.5817 91.5817 43 96 43H221C225.418 43 229 46.5817 229 51V85C229 89.4183 225.418 93 221 93H96C91.5817 93 88 89.4183 88 85V51Z"
              fill="#27272A"
            />
            <path
              d="M17 48.5C17 45.4624 19.4624 43 22.5 43V43C25.5376 43 28 45.4624 28 48.5V48.5C28 51.5376 25.5376 54 22.5 54V54C19.4624 54 17 51.5376 17 48.5V48.5Z"
              fill="#27272A"
            />
            <path
              d="M17 66.5C17 63.4624 19.4624 61 22.5 61V61C25.5376 61 28 63.4624 28 66.5V66.5C28 69.5376 25.5376 72 22.5 72V72C19.4624 72 17 69.5376 17 66.5V66.5Z"
              fill="#27272A"
            />
            <path
              d="M17 86.5C17 83.4624 19.4624 81 22.5 81V81C25.5376 81 28 83.4624 28 86.5V87.5C28 90.5376 25.5376 93 22.5 93V93C19.4624 93 17 90.5376 17 87.5V86.5Z"
              fill="#27272A"
            />
            <path
              d="M32 25.5C32 22.4624 34.4624 20 37.5 20H67.5C70.5376 20 73 22.4624 73 25.5V25.5C73 28.5376 70.5376 31 67.5 31H37.5C34.4624 31 32 28.5376 32 25.5V25.5Z"
              fill="#3F3F46"
            />
            <path
              d="M32 66.5C32 63.4624 34.4624 61 37.5 61H67.5C70.5376 61 73 63.4624 73 66.5V66.5C73 69.5376 70.5376 72 67.5 72H37.5C34.4624 72 32 69.5376 32 66.5V66.5Z"
              fill="#27272A"
            />
            <path
              d="M32 87C32 83.6863 34.6863 81 38 81H67C70.3137 81 73 83.6863 73 87V87C73 90.3137 70.3137 93 67 93H38C34.6863 93 32 90.3137 32 87V87Z"
              fill="#27272A"
            />
            <circle cx="22.5" cy="25.5" fill="#3F3F46" r="5.5" />
          </svg>
        </div>

        <div
          className={cn("absolute left-[32px] top-[37px]", {
            hidden: variant === "dark",
          })}
        >
          <svg
            fill="none"
            height="117"
            viewBox="0 0 240 117"
            width="240"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 0.5H228C234.351 0.5 239.5 5.64873 239.5 12V116.5H0.5V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
              fill="white"
            />
            <path
              d="M12 0.5H228C234.351 0.5 239.5 5.64873 239.5 12V116.5H0.5V12C0.5 5.64873 5.64873 0.5 12 0.5Z"
              stroke="#E4E4E7"
            />
            <path
              d="M32 48.5C32 45.4624 34.4624 43 37.5 43H67.5C70.5376 43 73 45.4624 73 48.5V48.5C73 51.5376 70.5376 54 67.5 54H37.5C34.4624 54 32 51.5376 32 48.5V48.5Z"
              fill="#F4F4F5"
            />
            <path
              d="M17 105C17 101.686 19.6863 99 23 99H67C70.3137 99 73 101.686 73 105V105C73 108.314 70.3137 111 67 111H23C19.6863 111 17 108.314 17 105V105Z"
              fill="#F4F4F5"
            />
            <path
              d="M88 25.5C88 22.4624 90.4624 20 93.5 20H207.5C210.538 20 213 22.4624 213 25.5V25.5C213 28.5376 210.538 31 207.5 31H93.5C90.4624 31 88 28.5376 88 25.5V25.5Z"
              fill="#E4E4E7"
            />
            <path
              d="M88 105C88 101.686 90.6863 99 94 99H189C192.314 99 195 101.686 195 105V105C195 108.314 192.314 111 189 111H94C90.6863 111 88 108.314 88 105V105Z"
              fill="#F4F4F5"
            />
            <path
              d="M88 51C88 46.5817 91.5817 43 96 43H221C225.418 43 229 46.5817 229 51V85C229 89.4183 225.418 93 221 93H96C91.5817 93 88 89.4183 88 85V51Z"
              fill="#F4F4F5"
            />
            <path
              d="M17 48.5C17 45.4624 19.4624 43 22.5 43V43C25.5376 43 28 45.4624 28 48.5V48.5C28 51.5376 25.5376 54 22.5 54V54C19.4624 54 17 51.5376 17 48.5V48.5Z"
              fill="#F4F4F5"
            />
            <path
              d="M17 66.5C17 63.4624 19.4624 61 22.5 61V61C25.5376 61 28 63.4624 28 66.5V66.5C28 69.5376 25.5376 72 22.5 72V72C19.4624 72 17 69.5376 17 66.5V66.5Z"
              fill="#F4F4F5"
            />
            <path
              d="M17 86.5C17 83.4624 19.4624 81 22.5 81V81C25.5376 81 28 83.4624 28 86.5V87.5C28 90.5376 25.5376 93 22.5 93V93C19.4624 93 17 90.5376 17 87.5V86.5Z"
              fill="#F4F4F5"
            />
            <path
              d="M32 25.5C32 22.4624 34.4624 20 37.5 20H67.5C70.5376 20 73 22.4624 73 25.5V25.5C73 28.5376 70.5376 31 67.5 31H37.5C34.4624 31 32 28.5376 32 25.5V25.5Z"
              fill="#E4E4E7"
            />
            <path
              d="M32 66.5C32 63.4624 34.4624 61 37.5 61H67.5C70.5376 61 73 63.4624 73 66.5V66.5C73 69.5376 70.5376 72 67.5 72H37.5C34.4624 72 32 69.5376 32 66.5V66.5Z"
              fill="#F4F4F5"
            />
            <path
              d="M32 87C32 83.6863 34.6863 81 38 81H67C70.3137 81 73 83.6863 73 87V87C73 90.3137 70.3137 93 67 93H38C34.6863 93 32 90.3137 32 87V87Z"
              fill="#F4F4F5"
            />
            <circle cx="22.5" cy="25.5" fill="#E4E4E7" r="5.5" />
          </svg>
        </div>
      </Component>
    );
  };

  return (
    <div className="w-full max-w-2xl flex-1 p-4">
      {/* Title */}
      <div className="flex items-center gap-x-3">
        <Button
          isIconOnly
          className="sm:hidden"
          size="sm"
          variant="flat"
          onPress={() => {
            setIsCollapsed?.(false);
            onOpenChange?.();
          }}
        >
          <Icon
            className="text-default-500"
            icon="solar:sidebar-minimalistic-linear"
            width={20}
          />
        </Button>
        <h1 className="text-3xl font-bold leading-9 text-default-foreground">
          Settings
        </h1>
      </div>
      <h2 className="mt-2 text-small text-default-500">
        Customize settings, email preferences, and web appearance.
      </h2>
      {/*  Tabs */}
      <Tabs color="primary" fullWidth>
        <Tab key="account" title="Account">
          <div ref={ref} className={cn("p-2", className)} {...props}>
            {/* Full name */}
            <div>
              <p className="text-base font-medium text-default-700">
                Full name
              </p>
              <p className="mt-1 text-sm font-normal text-default-400">
                Name to be used for emails.
              </p>
              <Input className="mt-2" placeholder="e.g Kate Moore" />
            </div>
            <Spacer y={2} />
            {/* Username */}
            <div>
              <p className="text-base font-medium text-default-700">Username</p>
              <p className="mt-1 text-sm font-normal text-default-400">
                Nickname or first name.
              </p>
              <Input className="mt-2" placeholder="kate.moore" />
            </div>
            <Spacer y={2} />
            {/* Email Address */}
            <div>
              <p className="text-base font-medium text-default-700">
                Email Address
              </p>
              <p className="mt-1 text-sm font-normal text-default-400">
                The email address associated with your account.
              </p>
              <Input className="mt-2" placeholder="e.g kate.moore@acme.com" />
            </div>
            <Spacer y={2} />
            {/* Timezone */}
            <section>
              <div>
                <p className="text-base font-medium text-default-700">
                  Timezone
                </p>
                <p className="mt-1 text-sm font-normal text-default-400">
                  Set your current timezone.
                </p>
              </div>
              <Select className="mt-2" defaultSelectedKeys={["utc-3"]}>
                {timeZoneOptions.map((timeZoneOption) => (
                  <SelectItem key={timeZoneOption.value}>
                    {timeZoneOption.label}
                  </SelectItem>
                ))}
              </Select>
            </section>
            <Spacer y={2} />
            <Button
              className="mt-4 bg-default-foreground text-background"
              size="sm"
            >
              Update Account
            </Button>
          </div>
        </Tab>
        <Tab key="theme" title="Tema">
          <div ref={ref} className={cn("p-2", className)} {...props}>
            {/* Theme */}
            <div>
              <p className="text-base font-medium text-default-700">Theme</p>
              <p className="mt-1 text-sm font-normal text-default-400">
                Change the appearance of the web.
              </p>
              {/* Theme radio group */}
              <RadioGroup
                className="mt-4 flex-wrap"
                orientation="horizontal"
                value={theme}
                onValueChange={(value) => setTheme(value as "light" | "dark")}
              >
                <ThemeCustomRadio value="light" variant="light">
                  Light
                </ThemeCustomRadio>
                <ThemeCustomRadio value="dark" variant="dark">
                  Dark
                </ThemeCustomRadio>
              </RadioGroup>
            </div>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
