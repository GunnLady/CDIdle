import type { ActiveTab } from "../../domain/activeTabPreference";
import NavigationTabs from "../../ui/patterns/NavigationTabs";

interface PrimaryNavigationProps {
  activeTab: ActiveTab;
  authenticated: boolean;
  onChange: (tab: ActiveTab) => void;
}

const tabs: Array<{ id: ActiveTab; icon: string; label: string }> = [
  { id: "city", icon: "🏰", label: "Cité" },
  { id: "heroes", icon: "⚔️", label: "Aventuriers" },
  { id: "dungeon", icon: "🛡️", label: "Donjon" },
  { id: "storage", icon: "📦", label: "Coffre" },
];

export default function PrimaryNavigation({ activeTab, authenticated, onChange }: PrimaryNavigationProps) {
  return <NavigationTabs
    label="Navigation principale"
    activeId={activeTab}
    onChange={onChange}
    className="h-full shrink-0 select-none xl:rounded-none xl:border-0 xl:bg-transparent"
    items={tabs.map((tab) => ({ ...tab, icon: authenticated ? tab.icon : "🔒", disabled: !authenticated }))}
  />;
}
