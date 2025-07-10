// sample booking durations
export enum DurationEnum {
  FifteenMinutes = "15m",
  ThirtyMinutes = "30m",
}

export const durations = [
  {key: DurationEnum.FifteenMinutes, label: "15m"},
  {key: DurationEnum.ThirtyMinutes, label: "30m"},
];

// sample time zone options
export const timeZoneOptions = [
  { label: "Europe/Rome", value: "Europe/Rome" },
  { label: "Europe/London", value: "Europe/London" },
  { label: "Europe/Paris", value: "Europe/Paris" },
  { label: "America/New_York", value: "America/New_York" },
  { label: "America/Los_Angeles", value: "America/Los_Angeles" },
  { label: "Asia/Tokyo", value: "Asia/Tokyo" },
];

export enum TimeFormatEnum {
  TwelveHour = "12h",
  TwentyFourHour = "24h",
}

export const timeFormats = [
  {key: TimeFormatEnum.TwelveHour, label: "12h"},
  {key: TimeFormatEnum.TwentyFourHour, label: "24h"},
];

export interface TimeSlot {
  value: string;
  label: string;
} 