import { describe, expect, it } from "vitest";
import {
  applyAuthoritativeCommandSuccess,
  getAuthoritativeFailurePresentation,
} from "../src/lib/authoritativeCommandDispatch";

describe("authoritative command dispatch", () => {
  it.each([
    { replayed: false, expected: "committed" },
    { replayed: true, expected: "replayed" },
  ] as const)("applies an authoritative $expected response through the same boundary", async ({ replayed, expected }) => {
    const order: string[] = [];
    const outcome = await applyAuthoritativeCommandSuccess(
      { replayed },
      () => order.push("acknowledge"),
      async () => { order.push("apply"); },
    );

    expect(outcome).toBe(expected);
    expect(order).toEqual(["acknowledge", "apply"]);
  });

  it.each([
    {
      failure: { isBusinessRefusal: true, message: "Ressources insuffisantes" },
      expectedLog: "❌ Ressources insuffisantes.",
      expectedNotice: "Action refusée : Ressources insuffisantes. L’état précédent a été restauré.",
    },
    {
      failure: { isBusinessRefusal: false, message: "Backend unavailable" },
      expectedLog: "❌ Backend unavailable.",
      expectedNotice: "Service indisponible : l’action a été annulée et le dernier état confirmé a été restauré.",
    },
    {
      failure: { isBusinessRefusal: false },
      expectedLog: "❌ Mutation autoritaire indisponible.",
      expectedNotice: "Service indisponible : l’action a été annulée et le dernier état confirmé a été restauré.",
    },
  ])("presents rollback information for refusal or outage", ({ failure, expectedLog, expectedNotice }) => {
    expect(getAuthoritativeFailurePresentation(failure)).toEqual({
      logMessage: expectedLog,
      notice: expectedNotice,
    });
  });
});
