import type { ActiveTab } from "../../domain/activeTabPreference";
import NavigationTabs from "../../ui/patterns/NavigationTabs";
import normalButtonBackground from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-button-normal-v2.png";
import selectedButtonBackground from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-button-selected-v2.png";
import cityNavigationIcon from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-city-v2.png";
import dungeonNavigationIcon from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-dungeon-v1.png";
import heroesNavigationIcon from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-heroes-v2.png";
import storageNavigationIcon from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-storage-v1.png";
import junctionLower from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-junction-lower-v2.png";
import junctionUpper from "../../assets/images/ui/secondary-navigation-rail/primary-navigation-junction-upper-v2.png";

interface PrimaryNavigationProps {
  activeTab: ActiveTab;
  authenticated: boolean;
  onChange: (tab: ActiveTab) => void;
}

const tabs: Array<{ id: ActiveTab; icon: string; iconImage?: string; iconImageClassName?: string; label: string; labelClassName?: string }> = [
  {
    id: "city",
    icon: "🏰",
    iconImage: cityNavigationIcon,
    iconImageClassName: "h-5 w-5 object-fill min-[1440px]:h-[55px] min-[1440px]:w-[60px] min-[1440px]:-translate-x-[2px] min-[1440px]:-translate-y-1",
    label: "Cité",
    labelClassName: "min-[1440px]:-translate-y-1",
  },
  {
    id: "heroes",
    icon: "⚔️",
    iconImage: heroesNavigationIcon,
    iconImageClassName: "h-5 w-5 object-contain min-[1440px]:h-16 min-[1440px]:w-16 min-[1440px]:translate-x-[3px] min-[1440px]:-translate-y-[9px]",
    label: "Aventuriers",
    labelClassName: "min-[1440px]:-translate-y-[7px]",
  },
  {
    id: "dungeon",
    icon: "🛡️",
    iconImage: dungeonNavigationIcon,
    iconImageClassName: "h-5 w-5 object-contain min-[1440px]:h-16 min-[1440px]:w-16 min-[1440px]:-translate-x-[2px] min-[1440px]:translate-y-[3px]",
    label: "Donjon",
    labelClassName: "min-[1440px]:-translate-y-[7px]",
  },
  {
    id: "storage",
    icon: "📦",
    iconImage: storageNavigationIcon,
    iconImageClassName: "h-5 w-5 object-contain min-[1440px]:h-16 min-[1440px]:w-16 min-[1440px]:translate-x-[3px] min-[1440px]:translate-y-px",
    label: "Coffre",
    labelClassName: "min-[1440px]:-translate-y-[7px]",
  },
];

export default function PrimaryNavigation({ activeTab, authenticated, onChange }: PrimaryNavigationProps) {
  return <NavigationTabs
    label="Navigation principale"
    activeId={activeTab}
    onChange={onChange}
    className="h-full shrink-0 select-none xl:rounded-none xl:border-0 xl:bg-transparent min-[1440px]:w-[496px] min-[1440px]:p-0"
    listClassName="min-[1440px]:h-full min-[1440px]:w-full min-[1440px]:gap-0 min-[1440px]:[&>button]:h-full"
    junctionLowerImage={junctionLower}
    junctionUpperImage={junctionUpper}
    items={tabs.map((tab) => ({
      ...tab,
      icon: authenticated
        ? tab.iconImage
          ? <img
              src={tab.iconImage}
              alt=""
              aria-hidden="true"
              data-testid={`primary-navigation-${tab.id}-icon`}
              className={tab.iconImageClassName ?? "h-5 w-5 object-contain min-[1440px]:h-16 min-[1440px]:w-16"}
              draggable={false}
            />
          : tab.icon
        : "🔒",
      disabled: !authenticated,
      backgroundImage: normalButtonBackground,
      activeBackgroundImage: selectedButtonBackground,
    }))}
  />;
}
