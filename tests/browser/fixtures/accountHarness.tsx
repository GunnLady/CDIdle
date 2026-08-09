import { useState } from "react";
import { createRoot } from "react-dom/client";
import AccountPage from "../../../src/components/account/AccountPage";
import "../../../src/index.css";

const pending = new URLSearchParams(window.location.search).get("pending") === "1";

function Harness() {
  const [mutationCount, setMutationCount] = useState(0);
  const recordMutation = async () => { setMutationCount((count) => count + 1); };
  return <main className="mx-auto w-full max-w-[1440px] p-3 sm:p-6">
    <output data-testid="mutation-count" className="sr-only">{mutationCount}</output>
    <AccountPage
      currentUser={{ id: "account-test", email: "souverain@example.test" }}
      isSyncing={false}
      isCommandPending={pending}
      canMutate={!pending}
      canUseDangerActions
      mutationBlockReason={pending ? "Une commande canonique est en attente." : undefined}
      resources={{ gold: 12450, food: 8760, wood: 6320, stone: 4210, ore: 1290 }}
      buildings={{ farm: 2, sawmill: 3, forge: 1 }}
      totalCitizensCount={20}
      heroesCount={4}
      highestFloorReached={8}
      onSaveCloud={recordMutation}
      onHardReset={recordMutation}
      onDeleteAccount={recordMutation}
      onSignOut={recordMutation}
      systemLogs={[{ id: "sync", timestamp: "10:00", message: "Synchronisation terminée", type: "info" }]}
      onClearSystemLogs={() => setMutationCount((count) => count + 1)}
    />
  </main>;
}

createRoot(document.getElementById("root")!).render(<Harness />);
