import type { Hero } from "../../types";
import type { StartingFounderChoice } from "../../domain/onboardingPresentation";
import CityCreationStep from "./CityCreationStep";
import FounderSelectionStep from "./FounderSelectionStep";

export interface OnboardingPageProps {
  candidates: Hero[];
  pendingCityName: string;
  canMutate: boolean;
  mutationBlockReason?: string;
  controlTransferPending?: boolean;
  onRequestControl?: () => void;
  onRequestCandidates: (cityName: string) => Promise<boolean>;
  onConfirmFounders: (founders: StartingFounderChoice[]) => Promise<boolean>;
}

export default function OnboardingPage(props: OnboardingPageProps) {
  return <div data-testid="onboarding-stage">
    {props.candidates.length > 0
      ? <FounderSelectionStep cityName={props.pendingCityName} candidates={props.candidates} canMutate={props.canMutate} blockReason={props.mutationBlockReason} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} onConfirm={props.onConfirmFounders} />
      : <CityCreationStep initialName={props.pendingCityName} canMutate={props.canMutate} blockReason={props.mutationBlockReason} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} onContinue={props.onRequestCandidates} />}
  </div>;
}
