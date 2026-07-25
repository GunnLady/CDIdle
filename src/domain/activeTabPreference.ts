export const ACTIVE_TAB_STORAGE_KEY = "cdidle:active-tab";
export const ACTIVE_TABS = ["city", "heroes", "dungeon", "storage", "account"] as const;
export type ActiveTab = typeof ACTIVE_TABS[number];

export function parseActiveTabPreference(value: string | null): ActiveTab {
  return (ACTIVE_TABS as readonly string[]).includes(value ?? "")
    ? value as ActiveTab
    : "city";
}
