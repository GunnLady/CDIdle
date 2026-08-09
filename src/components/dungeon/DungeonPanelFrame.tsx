import Panel, { type PanelProps } from "../../ui/components/Panel";

export default function DungeonPanelFrame({
  title,
  subtitle,
  testId,
  className = "",
  contentClassName = "",
  contentTestId,
  children,
}: Omit<PanelProps, "variant">) {
  return <Panel title={title} subtitle={subtitle} testId={testId} className={className} contentClassName={contentClassName} contentTestId={contentTestId} variant="strong">{children}</Panel>;
}
