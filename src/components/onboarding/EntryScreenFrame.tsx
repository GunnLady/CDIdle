import type { ReactNode } from "react";
import EntryScreen from "../../ui/patterns/EntryScreen";

export default function EntryScreenFrame(props: { children: ReactNode; wide?: boolean; testId: string }) {
  return <EntryScreen testId={props.testId} wide={props.wide}>{props.children}</EntryScreen>;
}
