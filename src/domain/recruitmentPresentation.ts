import type { Hero } from "../types";
import { recruitmentCost } from "../../shared/domain/hero";
import { createHeroCandidateSummary, type HeroCandidateSummaryView } from "./heroCandidatePresentation";

export interface RecruitmentOfferView extends HeroCandidateSummaryView {
  cost: number;
  genderText: string;
}

export function createRecruitmentOfferView(candidate: Hero, heroCount: number, editedName = candidate.name): RecruitmentOfferView {
  const summary = createHeroCandidateSummary(candidate, editedName);
  return {
    ...summary,
    maxMana: summary.maxMana || 20,
    cost: recruitmentCost(heroCount),
    genderText: `${summary.genderSymbol} ${summary.genderLabel}`,
  };
}
