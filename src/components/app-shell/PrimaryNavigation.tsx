import type { ActiveTab } from "../../domain/activeTabPreference";

interface PrimaryNavigationProps {
  activeTab: ActiveTab;
  authenticated: boolean;
  onChange: (tab: ActiveTab) => void;
}

const tabs: Array<{ id: ActiveTab; icon: string; label: string; activeClass: string }> = [
  { id: "city", icon: "🏰", label: "Cité", activeClass: "from-[#944415] to-[#ae561c] border-[#a15124]" },
  { id: "heroes", icon: "⚔️", label: "Aventuriers", activeClass: "from-[#ae8650] to-[#cba374] border-[#d4af37]" },
  { id: "dungeon", icon: "🛡️", label: "Donjon", activeClass: "from-[#701a1a] to-[#991b1b] border-[#b91c1c]" },
  { id: "storage", icon: "📦", label: "Coffre", activeClass: "from-[#5c402b] to-[#785437] border-[#caa050]" },
];

export default function PrimaryNavigation({ activeTab, authenticated, onChange }: PrimaryNavigationProps) {
  return (
    <nav aria-label="Navigation principale" className="h-full bg-[#20150d] p-1.5 rounded-xl border border-[#2c1d12] select-none shrink-0 xl:rounded-none xl:border-0 xl:bg-transparent xl:p-0">
      <div className="flex h-full flex-row gap-1">
        {tabs.map((tab) => {
          const disabled = !authenticated;
          return (
            <button key={tab.id} type="button" aria-label={tab.label} onClick={() => !disabled && onChange(tab.id)} disabled={disabled} aria-current={activeTab === tab.id ? "page" : undefined}
              className={`min-h-11 flex-1 py-2.5 sm:py-3 px-2 sm:px-4 rounded-lg font-bold text-center flex items-center justify-center gap-1.5 sm:gap-2 transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#caa050] ${disabled ? "opacity-35 cursor-not-allowed text-[#a39080]/60" : activeTab === tab.id ? `bg-gradient-to-r ${tab.activeClass} text-[#fbf7f0] shadow-md border cursor-pointer` : "text-[#a39080] hover:text-[#fdf9f2] hover:bg-[#2c1d12]/50 cursor-pointer"}`}>
              <span className="text-sm" aria-hidden="true">{disabled ? "🔒" : tab.icon}</span><span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
