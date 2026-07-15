import { validateBoard } from "../lib/board.mjs";

const validation = await validateBoard();
for (const warning of validation.warnings) console.warn(`WARN  ${warning}`);
if (!validation.ok) {
  for (const error of validation.errors) console.error(`ERROR ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Workboard valide: ${validation.ticketCount} ticket(s), 0 erreur.`);
}
