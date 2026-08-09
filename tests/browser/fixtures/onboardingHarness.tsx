import { useState } from "react";
import { createRoot } from "react-dom/client";
import AuthenticationPage from "../../../src/components/auth/AuthenticationPage";
import RecruitmentOfferDialog from "../../../src/components/heroes/RecruitmentOfferDialog";
import OnboardingPage from "../../../src/components/onboarding/OnboardingPage";
import { makeHero } from "../../fixtures/game";
import "../../../src/index.css";

const params = new URLSearchParams(window.location.search);
const step = params.get("step") ?? "city";
const readOnly = params.get("readonly") === "1";
const candidates = Array.from({ length: 5 }, (_, index) => makeHero({
  id: `candidate-${index}`,
  name: `Novice ${index + 1}`,
  gender: index % 2 === 0 ? "Male" : "Female",
  baseStats: { str: 10 - index, agi: 4, end: 7, int: 3, wiz: 1, dex: 5, luk: 2 },
}));

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const [recruitName, setRecruitName] = useState(candidates[0].name);
  const record = async () => { setMutationCount((count) => count + 1); return true; };
  const content = step === "auth"
    ? <AuthenticationPage sessionLoading={false} onAuthenticate={async () => { await record(); }} />
    : step === "recruit"
      ? <RecruitmentOfferDialog
          candidate={candidates[0]}
          editedName={recruitName}
          heroCount={2}
          pending={false}
          readOnly={readOnly}
          blockReason={readOnly ? "Mode observateur" : undefined}
          onNameChange={setRecruitName}
          onConfirm={() => { void record(); }}
          onCancel={() => { void record(); }}
        />
      : <OnboardingPage
          candidates={step === "founders" ? candidates : []}
          pendingCityName={step === "founders" ? "Valbois" : ""}
          canMutate={!readOnly}
          mutationBlockReason={readOnly ? "Mode observateur" : undefined}
          onRequestCandidates={record}
          onConfirmFounders={record}
        />;
  return <>
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    {content}
  </>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
