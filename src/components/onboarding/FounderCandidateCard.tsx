import type { FounderCandidateView } from "../../domain/onboardingPresentation";
import HeroCandidateCard from "../heroes/HeroCandidateCard";

export default function FounderCandidateCard(props: {
  candidate: FounderCandidateView;
  selected: boolean;
  onToggle: () => void;
  onRename: (name: string) => void;
}) {
  return <HeroCandidateCard candidate={props.candidate} nameLabel={`Nom de ${props.candidate.name}`} selected={props.selected} selectable onToggle={props.onToggle} onRename={props.onRename} />;
}
