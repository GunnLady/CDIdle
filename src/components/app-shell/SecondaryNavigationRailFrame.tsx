import railBackground from "../../assets/images/ui/secondary-navigation-rail/secondary-navigation-rail-background-v5.png";

export default function SecondaryNavigationRailFrame() {
  return (
    <div data-testid="secondary-navigation-rail-frame" className="pointer-events-none absolute inset-0 z-20 hidden min-[1440px]:block" aria-hidden="true">
      <img src={railBackground} alt="" draggable={false} className="absolute inset-0 h-[173px] w-[1440px]" />
    </div>
  );
}
