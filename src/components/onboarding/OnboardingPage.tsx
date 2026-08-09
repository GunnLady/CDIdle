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
  return <section data-testid="onboarding-stage" aria-labelledby="onboarding-page-title">
    <h1 id="onboarding-page-title" className="sr-only">Fondation du royaume</h1>
    {props.candidates.length > 0
      ? <FounderSelectionStep cityName={props.pendingCityName} candidates={props.candidates} canMutate={props.canMutate} blockReason={props.mutationBlockReason} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} onConfirm={props.onConfirmFounders} />
      : <CityCreationStep initialName={props.pendingCityName} canMutate={props.canMutate} blockReason={props.mutationBlockReason} controlTransferPending={props.controlTransferPending} onRequestControl={props.onRequestControl} onContinue={props.onRequestCandidates} />}
  </section>;
}
