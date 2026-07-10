import React, { useState, useEffect, useCallback } from "react";
import {
  Hero,
  Monster,
  Resources,
  ClassType,
  SkillInfo,
  StoredItemStack,
  StoredForgeMaterialStack,
  ForgeMaterial,
  HeroEquipment,
  Rarity,
  DamageType,
  DungeonEncounterType,
  ItemBlueprint,
  Modifier
} from "../types";
import {
  RACE_INFO_LIST,
  CLASS_INFO_LIST,
  MONSTERS_LIBRARY,
  BOSSES_LIBRARY,
  HERO_FIRST_NAMES,
  HERO_LAST_NAMES,
  MALE_FIRST_NAMES,
  FEMALE_FIRST_NAMES,
  SKILLS_LIBRARY,
  getSkillById,
  ITEM_LIBRARY
} from "../data/gameData";
import { BUILDINGS_LIST } from "../data/buildings";
import { getItemById } from "../data/items";
import { getHeroStats, getHeroAttributes, refreshHeroDerivedStats, generateNoviceStats, generateSingleNoviceHero as generateSingleNoviceHeroUtil, growHeroBaseStats, calculateXpNeeded, evaluateAutomaticClassChange, unequipItem, equipItem, addItemToStorage, calculateBasicAttackDamage, getHeroMainHandWeapon, getWeaponDamageTypes, rollWeaponDamage, applyMonsterDefenseOrResistance, scrapItemFromStorage, FORGE_MATERIALS, DEFAULT_UNLOCKED_ITEM_BLUEPRINTS, areModifiersEqual } from "../utils/gameCalculations";
import {
  rollEncounterForgeMaterial,
  getRandomDungeonEncounterType,
  getEncounterDetails,
  selectBestHeroForEncounter,
  applyLootModifiers
} from "../utils/dungeonHelpers";

export function useDungeonSystem({
  buildings,
  resources,
  setResources,
  addLog,
  currentUser,
  highestFloorReached,
  setHighestFloorReached
}: {
  buildings: { [key: string]: number };
  resources: Resources;
  setResources: React.Dispatch<React.SetStateAction<Resources>>;
  addLog: (message: string, type?: "info" | "victory" | "defeat" | "loot" | "combat-hero" | "combat-enemy") => void;
  currentUser: any;
  highestFloorReached: number;
  setHighestFloorReached: React.Dispatch<React.SetStateAction<number>>;
}) {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [storedItems, setStoredItems] = useState<StoredItemStack[]>([]);
  const [forgeMaterials, setForgeMaterials] = useState<StoredForgeMaterialStack[]>([]);
  const [itemBlueprints, setItemBlueprints] = useState<ItemBlueprint[]>(DEFAULT_UNLOCKED_ITEM_BLUEPRINTS);
  const [activeDungeonFloor, setActiveDungeonFloor] = useState<number>(1);
  const [activeDungeonRoom, setActiveDungeonRoom] = useState<number>(1);
  const [autoExplore, setAutoExplore] = useState<boolean>(true);
  const [currentMonster, setCurrentMonster] = useState<Monster | null>(null);
  const [currentEncounterType, setCurrentEncounterType] = useState<DungeonEncounterType | null>(null);
  const currentEncounterTypeRef = React.useRef<DungeonEncounterType | null>(null);
  
  const setEncounterType = useCallback((type: DungeonEncounterType | null) => {
    setCurrentEncounterType(type);
    currentEncounterTypeRef.current = type;
  }, []);

  const addXpToHero = useCallback((hero: Hero, xpEarned: number): Hero => {
    let newXp = (hero.xp || 0) + xpEarned;
    let newLvl = hero.level || 1;
    let needed = hero.xpNeeded || 100;
    let currentBaseStats = { ...hero.baseStats };

    addLog(`✨ ${hero.name} gagne +${xpEarned} EXP.`, "info");

    let leveledUp = false;
    while (newXp >= needed) {
      newXp -= needed;
      newLvl += 1;
      currentBaseStats = growHeroBaseStats(currentBaseStats, hero.classType);
      needed = calculateXpNeeded(newLvl + 1, hero.classType);
      leveledUp = true;
      addLog(`🌟 NIVEAU SUPÉRIEUR ! ${hero.name} passe niveau ${newLvl} ! Sa santé et sa force augmentent massivement.`, "victory");
    }

    const leveledHeroStub = {
      ...hero,
      level: newLvl,
      xp: newXp,
      xpNeeded: needed,
      baseStats: currentBaseStats
    };
    const fullyUpgradedHero = refreshHeroDerivedStats(leveledHeroStub);
    if (leveledUp) {
      fullyUpgradedHero.currentHp = Math.min(fullyUpgradedHero.calculatedStats.maxHp, hero.currentHp + Math.floor(fullyUpgradedHero.calculatedStats.maxHp * 0.2));

      if (fullyUpgradedHero.classType === "Novice" && fullyUpgradedHero.level >= 10) {
        const evaluation = evaluateAutomaticClassChange(fullyUpgradedHero, buildings);
        if (evaluation.newClass) {
          fullyUpgradedHero.classType = evaluation.newClass;
          const finalEvolvedHero = refreshHeroDerivedStats(fullyUpgradedHero);
          finalEvolvedHero.currentHp = finalEvolvedHero.calculatedStats.maxHp;
          finalEvolvedHero.currentMana = finalEvolvedHero.calculatedStats.maxMana;

          addLog(`🔮 VOCATION RÉVÉLÉE ! ${hero.name} s'est spécialisé automatiquement en [${evaluation.newClass}] ! (${evaluation.reason})`, "victory");
          return finalEvolvedHero;
        } else {
          addLog(`ℹ️ ${hero.name} reste Novice pour l'instant : ${evaluation.reason}`, "info");
        }
      }
    } else {
      fullyUpgradedHero.currentHp = Math.min(fullyUpgradedHero.calculatedStats.maxHp, hero.currentHp);
    }

    return fullyUpgradedHero;
  }, [addLog, buildings]);

  const [combatTimer, setCombatTimer] = useState<number>(2);
  const [unlockedRaces, setUnlockedRaces] = useState<string[]>(["Humain"]);
  const [combatTurnIndex, setCombatTurnIndex] = useState<number>(0);
  const [nonFightStep, setNonFightStep] = useState<number>(0);
  const [combatVictoryStep, setCombatVictoryStep] = useState<number>(0);
  const [challengeSuccess, setChallengeSuccess] = useState<boolean | null>(null);

  // Synchronization refs to avoid stale closures in the interval tick
  const heroesRef = React.useRef(heroes);
  const activeDungeonFloorRef = React.useRef(activeDungeonFloor);
  const activeDungeonRoomRef = React.useRef(activeDungeonRoom);
  const currentMonsterRef = React.useRef(currentMonster);
  const combatTimerRef = React.useRef(combatTimer);
  const autoExploreRef = React.useRef(autoExplore);
  const combatTurnIndexRef = React.useRef(combatTurnIndex);
  const nonFightStepRef = React.useRef(nonFightStep);
  const combatVictoryStepRef = React.useRef(combatVictoryStep);
  const challengeSuccessRef = React.useRef(challengeSuccess);

  React.useEffect(() => { heroesRef.current = heroes; }, [heroes]);
  React.useEffect(() => { activeDungeonFloorRef.current = activeDungeonFloor; }, [activeDungeonFloor]);
  React.useEffect(() => { activeDungeonRoomRef.current = activeDungeonRoom; }, [activeDungeonRoom]);
  React.useEffect(() => { currentMonsterRef.current = currentMonster; }, [currentMonster]);
  React.useEffect(() => { currentEncounterTypeRef.current = currentEncounterType; }, [currentEncounterType]);
  React.useEffect(() => { combatTimerRef.current = combatTimer; }, [combatTimer]);
  React.useEffect(() => { autoExploreRef.current = autoExplore; }, [autoExplore]);
  React.useEffect(() => { combatTurnIndexRef.current = combatTurnIndex; }, [combatTurnIndex]);
  React.useEffect(() => { nonFightStepRef.current = nonFightStep; }, [nonFightStep]);
  React.useEffect(() => { combatVictoryStepRef.current = combatVictoryStep; }, [combatVictoryStep]);
  React.useEffect(() => { challengeSuccessRef.current = challengeSuccess; }, [challengeSuccess]);

  // Helper to safely advance room / floor and set heroes
  const advanceDungeon = useCallback((floorVal: number, roomVal: number, nextHeroesVal: Hero[]) => {
    if (roomVal === 50) {
      const nextFloorVal = floorVal + 1;
      addLog(`🌟 EXPLOIT FLAMBANT ! Vous venez de sécuriser totalement l'Étage ${floorVal} ! L'Étage ${nextFloorVal} vous ouvre ses portes.`, "victory");
      setActiveDungeonFloor(nextFloorVal);
      setActiveDungeonRoom(1);
      setHighestFloorReached((highest) => Math.max(highest, nextFloorVal));
    } else {
      setActiveDungeonRoom(roomVal + 1);
    }
    setHeroes(nextHeroesVal);
  }, [setHighestFloorReached, addLog]);

  const runCombatTick = useCallback(() => {
    const currentHeroes = heroesRef.current;
    const activeSlayers = currentHeroes.filter((h) => h.isActive && h.currentHp > 0);

    if (activeSlayers.length === 0) {
      // Party decimated or unselected
      setCurrentMonster(null);
      setEncounterType(null);
      return;
    }

    const prevTimer = combatTimerRef.current;
    const nextTimer = prevTimer - 1;

    if (nextTimer > 0) {
      setCombatTimer(nextTimer);
      return;
    }

    // At nextTimer <= 0: Resolve combat action round or encounter!
    let updatedHeroes = currentHeroes.map(h => ({ ...h, cooldowns: { ...(h.cooldowns || {}) } }));
    const floor = activeDungeonFloorRef.current;
    const room = activeDungeonRoomRef.current;
    const encType = currentEncounterTypeRef.current;

    const vicStep = combatVictoryStepRef.current;
    if (vicStep > 0) {
      const monster = currentMonsterRef.current;
      if (!monster) {
        setCombatVictoryStep(0);
        return;
      }

      if (vicStep === 1) {
        // Step 1: Gold & Material Loot
        const goldBonusMult = 1 + (updatedHeroes.some(h => h.race === "Gobelin") ? 0.25 : 0);
        const chefBuilding = BUILDINGS_LIST.find(b => b.id === "maison_chef");
        const chefBonus = chefBuilding?.bonusPerLevel ?? 0.03;
        const chefLvl = buildings["maison_chef"] || 0;
        const baseGoldLoot = Math.floor(monster.goldYield * goldBonusMult * (1 + chefLvl * chefBonus));
        const finalGoldLoot = Math.floor(applyLootModifiers("goldGain", baseGoldLoot, updatedHeroes));

        setResources((res) => ({ ...res, gold: res.gold + finalGoldLoot }));
        addLog(`💰 Pillage : +${finalGoldLoot} pièces d'Or trouvées sur le cadavre.`, "loot");

        // Award forge materials for successful combat encounter (35% chance to drop)
        if (Math.random() < 0.35) {
          const matReward = rollEncounterForgeMaterial(floor);
          setForgeMaterials(prev => {
            const updated = prev.map(m => ({ ...m }));
            const existing = updated.find(m => m.materialId === matReward.materialId && m.rarity === matReward.rarity);
            if (existing) {
              existing.count += matReward.count;
            } else {
              updated.push({ materialId: matReward.materialId, rarity: matReward.rarity, count: matReward.count });
            }
            return updated;
          });
          addLog(`⚙️ Matériau : +${matReward.count} [${matReward.name}] (${matReward.rarity}) trouvé sur l'ennemi.`, "loot");
        } else {
          addLog(`💨 Aucun matériau exploitable n'a été trouvé sur l'ennemi.`, "info");
        }

        setCombatVictoryStep(2);
        setCombatTimer(2);
        return;
      }

      if (vicStep === 2) {
        // Step 2: XP Gains & Level-up check
        const finalXpLoot = monster.xpYield;
        const eligibleHeroesCount = updatedHeroes.filter(h => h.isActive && h.currentHp > 0).length;

        updatedHeroes = updatedHeroes.map((hero) => {
          if (hero.isActive && hero.currentHp > 0) {
            // Split the monster XP evenly between eligible heroes.
            const baseShare = eligibleHeroesCount > 0 ? (finalXpLoot / eligibleHeroesCount) : 0;
            // Human bonus XP (+15%)
            const humanBonus = hero.race === "Humain" ? 1.15 : 1.0;
            const xpEarned = Math.round(baseShare * humanBonus);
            
            let newXp = (hero.xp || 0) + xpEarned;
            let newLvl = hero.level || 1;
            let needed = hero.xpNeeded || 100;
            let currentBaseStats = { ...hero.baseStats };

            addLog(`✨ ${hero.name} gagne +${xpEarned} EXP.`, "info");

            // Level Up Loop checker
            let leveledUp = false;
            while (newXp >= needed) {
              newXp -= needed;
              newLvl += 1;
              currentBaseStats = growHeroBaseStats(currentBaseStats, hero.classType);
              needed = calculateXpNeeded(newLvl + 1, hero.classType);
              leveledUp = true;
              addLog(`🌟 NIVEAU SUPÉRIEUR ! ${hero.name} passe niveau ${newLvl} ! Sa santé et sa force augmentent massivement.`, "victory");
            }

            // Re-evaluate updated stats
            const leveledHeroStub = {
              ...hero,
              level: newLvl,
              xp: newXp,
              xpNeeded: needed,
              baseStats: currentBaseStats
            };
            const fullyUpgradedHero = refreshHeroDerivedStats(leveledHeroStub);
            if (leveledUp) {
              fullyUpgradedHero.currentHp = Math.min(fullyUpgradedHero.calculatedStats.maxHp, hero.currentHp + Math.floor(fullyUpgradedHero.calculatedStats.maxHp * 0.2)); // minor recovery on level up

              // Check for automatic class change from Novice to Tier 1
              if (fullyUpgradedHero.classType === "Novice" && fullyUpgradedHero.level >= 10) {
                const evaluation = evaluateAutomaticClassChange(fullyUpgradedHero, buildings);
                if (evaluation.newClass) {
                  fullyUpgradedHero.classType = evaluation.newClass;
                  const finalEvolvedHero = refreshHeroDerivedStats(fullyUpgradedHero);
                  // Restore to max health and mana on automatic class change
                  finalEvolvedHero.currentHp = finalEvolvedHero.calculatedStats.maxHp;
                  finalEvolvedHero.currentMana = finalEvolvedHero.calculatedStats.maxMana;

                  addLog(`🔮 VOCATION RÉVÉLÉE ! ${hero.name} s'est spécialisé automatiquement en [${evaluation.newClass}] ! (${evaluation.reason})`, "victory");
                  return finalEvolvedHero;
                } else {
                  addLog(`ℹ️ ${hero.name} reste Novice pour l'instant : ${evaluation.reason}`, "info");
                }
              }
            } else {
              fullyUpgradedHero.currentHp = Math.min(fullyUpgradedHero.calculatedStats.maxHp, hero.currentHp);
            }

            return fullyUpgradedHero;
          }
          return hero;
        });

        setHeroes(updatedHeroes);
        setCombatVictoryStep(3);
        setCombatTimer(2);
        return;
      }

      if (vicStep === 3) {
        // Step 3: Advance dungeon and clean up
        advanceDungeon(floor, room, updatedHeroes);

        // Commit hero XP and level-up changes on monster defeat
        setCurrentMonster(null);
        setEncounterType(null);
        setCombatTurnIndex(0);
        setCombatVictoryStep(0);
        setCombatTimer(2);
        return;
      }
    }

    // 1. DETERMINE ENCOUNTER TYPE IF NONE EXISTS
    if (encType === null) {
      const isBossFloorRound = room === 50;
      let rolledType: DungeonEncounterType = "fight";
      if (isBossFloorRound) {
        rolledType = "fight";
      } else {
        rolledType = getRandomDungeonEncounterType();
      }

      setEncounterType(rolledType);

      if (rolledType !== "fight") {
        setCurrentMonster(null); // Clear any lingering monster state for non-fight encounters
        setNonFightStep(1);
        if (rolledType === "treasure") {
          addLog(`📦 Vos héros entrent dans la chambre ${room} et découvrent un coffre au trésor caché !`, "info");
        } else if (rolledType === "rest") {
          addLog(`⛺ Vos héros entrent dans la chambre ${room} et découvrent une zone calme idéale pour se reposer.`, "info");
        } else {
          const details = getEncounterDetails(rolledType);
          if (details) {
            const bestSelection = selectBestHeroForEncounter(activeSlayers, details.statA, details.statB);
            if (bestSelection) {
              addLog(`⚠️ Vos héros entrent dans la chambre ${room} [${details.name}]. ${details.desc}`, "info");
              addLog(`🔍 ${bestSelection.bestHero.name} semble être le plus qualifié pour cette épreuve (Score estimé : ${bestSelection.bestScore}).`, "info");
            }
          }
        }
        setCombatTimer(2);
        return;
      }
    }

    // 2. RESOLVE NON-FIGHT ENCOUNTER
    const activeEncType = encType || currentEncounterTypeRef.current;
    if (activeEncType && activeEncType !== "fight") {
      const step = nonFightStepRef.current;

      if (activeEncType === "treasure" || activeEncType === "rest") {
        if (step === 1) {
          if (activeEncType === "treasure") {
            addLog(`🔑 L'escouade s'approche et examine le coffre orné de runes anciennes...`, "info");
          } else {
            addLog(`🔥 Vos héros s'installent confortablement autour du feu de camp pour panser leurs plaies.`, "info");
          }
          setNonFightStep(2);
          setCombatTimer(2);
          return;
        }

        if (step === 2) {
          if (activeEncType === "treasure") {
            const rand = Math.random();
            addLog(`🔑 Coffre déverrouillé ! L'escouade examine et ouvre le coffre orné de runes anciennes.`, "victory");
            if (rand < 0.5) {
              const goldReward = Math.max(1, Math.round(floor * 5));
              setResources((res) => ({ ...res, gold: res.gold + goldReward }));
              addLog(`🪙 Pillage : +${goldReward} pièces d'Or trouvées.`, "loot");
            } else {
              if (ITEM_LIBRARY && ITEM_LIBRARY.length > 0) {
                const randomItem = ITEM_LIBRARY[Math.floor(Math.random() * ITEM_LIBRARY.length)];
                setStoredItems((prev) => {
                  const updated = [...prev];
                  addItemToStorage(updated, randomItem.id, "rare", 1);
                  return updated;
                });
                addLog(`💎 Butin : ${randomItem.name} [Rare] obtenu !`, "loot");
              } else {
                addLog(`📦 Le coffre était vide.`, "loot");
              }
            }
          } else {
            addLog(`⛺ Halte de répit ! L'escouade s'installe confortablement autour d'un feu de camp pour panser ses plaies.`, "victory");
            updatedHeroes = updatedHeroes.map((hero) => {
              if (hero.isActive && hero.currentHp > 0) {
                const hpRestored = Math.max(1, Math.round(hero.calculatedStats.maxHp * 0.20));
                const manaRestored = Math.max(1, Math.round(hero.calculatedStats.maxMana * 0.20));
                const nextHp = Math.min(hero.calculatedStats.maxHp, hero.currentHp + hpRestored);
                const maxMana = hero.calculatedStats.maxMana || 20;
                const nextMana = Math.min(maxMana, (hero.currentMana || 0) + manaRestored);
                return { ...hero, currentHp: nextHp, currentMana: nextMana };
              }
              return hero;
            });
            setHeroes(updatedHeroes);
            addLog(`💚 Récupération : Vos héros reprennent des forces (+20% PV / +20% PM).`, "victory");
          }

          setNonFightStep(3);
          setCombatTimer(2);
          return;
        }

        if (step === 3) {
          if (activeEncType === "treasure") {
            const matReward = rollEncounterForgeMaterial(floor);
            const chestCount = matReward.count; // No extra +1 bonus to avoid inflating scrap counts
            setForgeMaterials(prev => {
              const updated = prev.map(m => ({ ...m }));
              const existing = updated.find(m => m.materialId === matReward.materialId && m.rarity === matReward.rarity);
              if (existing) {
                existing.count += chestCount;
              } else {
                updated.push({ materialId: matReward.materialId, rarity: matReward.rarity, count: chestCount });
              }
              return updated;
            });
            addLog(`⚙️ Matériau : +${chestCount} [${matReward.name}] (${matReward.rarity}) extrait du coffre.`, "loot");
            
            setNonFightStep(4);
            setCombatTimer(2);
            return;
          } else {
            // Rest Peaceful XP
            const xpReward = Math.round(10 * (1 + (floor - 1) * 0.15));
            const eligibleHeroesCount = updatedHeroes.filter(h => h.isActive && h.currentHp > 0).length;
            updatedHeroes = updatedHeroes.map((hero) => {
              if (hero.isActive && hero.currentHp > 0) {
                const baseShare = eligibleHeroesCount > 0 ? (xpReward / eligibleHeroesCount) : 0;
                const humanBonus = hero.race === "Humain" ? 1.15 : 1.0;
                const xpEarned = Math.max(1, Math.round(baseShare * humanBonus));
                return addXpToHero(hero, xpEarned);
              }
              return hero;
            });
            setHeroes(updatedHeroes);
            
            setNonFightStep(5);
            setCombatTimer(1);
            return;
          }
        }

        if (step === 4) {
          // Only treasure reaches here
          const xpReward = Math.round(15 * (1 + (floor - 1) * 0.15));
          const eligibleHeroesCount = updatedHeroes.filter(h => h.isActive && h.currentHp > 0).length;
          updatedHeroes = updatedHeroes.map((hero) => {
            if (hero.isActive && hero.currentHp > 0) {
              const baseShare = eligibleHeroesCount > 0 ? (xpReward / eligibleHeroesCount) : 0;
              const humanBonus = hero.race === "Humain" ? 1.15 : 1.0;
              const xpEarned = Math.max(1, Math.round(baseShare * humanBonus));
              return addXpToHero(hero, xpEarned);
            }
            return hero;
          });
          setHeroes(updatedHeroes);
          
          setNonFightStep(5);
          setCombatTimer(2);
          return;
        }

        if (step === 5) {
          advanceDungeon(floor, room, updatedHeroes);
          setEncounterType(null);
          setNonFightStep(0);
          setCombatTimer(2);
          return;
        }
      }

      // It's a Stat Check encounter (trap, enigma, ambush, ritual, obstacle, negotiation)
      const details = getEncounterDetails(activeEncType);
      if (details) {
        const bestSelection = selectBestHeroForEncounter(activeSlayers, details.statA, details.statB);
        if (bestSelection) {
          const { bestHero, bestScore } = bestSelection;

          if (step === 1) {
            addLog(`🎲 ${bestHero.name} prend les devants et tente de surmonter l'épreuve...`, "info");
            setNonFightStep(2);
            setCombatTimer(2);
            return;
          }

          if (step === 2) {
            const bestHeroAttrs = getHeroAttributes(bestHero);
            const lukVal = bestHeroAttrs.luk || 1;
            const luckRoll = Math.floor(Math.random() * Math.max(1, lukVal)) + 1;
            const difficulty = 10 + floor * 2;
            const isSuccess = luckRoll + bestScore >= difficulty;
            setChallengeSuccess(isSuccess);

            if (isSuccess) {
              let goldReward = 0;

              if (activeEncType === "trap") {
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} désamorce le piège de manière magistrale et sécurise la voie !`, "victory");
              } else if (activeEncType === "enigma") {
                goldReward = Math.round(25 * (1 + (floor - 1) * 0.18));
                setResources((res) => ({ ...res, gold: res.gold + goldReward }));
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const maxMana = h.calculatedStats.maxMana || 20;
                    return { ...h, currentMana: Math.min(maxMana, (h.currentMana || 0) + 15) };
                  }
                  return h;
                });
                setHeroes(updatedHeroes);
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} décrypte l'énigme et restaure l'énergie du groupe !`, "victory");
                addLog(`🔮 Récupération : Toute la troupe récupère +15 PM.`, "victory");
              } else if (activeEncType === "ambush") {
                goldReward = Math.round(15 * (1 + (floor - 1) * 0.15));
                setResources((res) => ({ ...res, gold: res.gold + goldReward }));
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} évente l'embuscade à temps ! Vos héros contournent adroitement le danger.`, "victory");
              } else if (activeEncType === "ritual") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const maxMana = h.calculatedStats.maxMana || 20;
                    const restoreAmt = Math.max(15, Math.round(maxMana * 0.20));
                    return { ...h, currentMana: Math.min(maxMana, (h.currentMana || 0) + restoreAmt) };
                  }
                  return h;
                });
                setHeroes(updatedHeroes);
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} harmonise le rituel runique avec brio !`, "victory");
                addLog(`🔮 Récupération : Toute la troupe regagne +20% de PM.`, "victory");
              } else if (activeEncType === "obstacle") {
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} détruit l'obstacle par sa force brute et ouvre la voie !`, "victory");
              } else if (activeEncType === "negotiation") {
                goldReward = Math.round(35 * (1 + (floor - 1) * 0.20));
                setResources((res) => ({ ...res, gold: res.gold + goldReward }));
                addLog(`🍀 RÉUSSITE ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} >= Difficulté : ${difficulty}]`, "victory");
                addLog(`✨ ${bestHero.name} négocie habilement et obtient un accord pacifique !`, "victory");
              }

              if (goldReward > 0) {
                addLog(`💰 Pillage : +${goldReward} pièces d'Or trouvées.`, "loot");
              }

              setNonFightStep(3);
              setCombatTimer(2);
              return;
            } else {
              // FAILURE OUTCOMES
              if (activeEncType === "trap") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const dmg = Math.max(1, Math.round(h.calculatedStats.maxHp * 0.45));
                    const nextHp = Math.max(1, h.currentHp - dmg);
                    return { ...h, currentHp: nextHp };
                  }
                  return h;
                });
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 Le piège s'active brutalement ! L'escouade subit de lourdes blessures (45% de PV perdus).`, "defeat");
              } else if (activeEncType === "enigma") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    return { ...h, currentMana: Math.max(0, (h.currentMana || 0) - 10) };
                  }
                  return h;
                });
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 L'énigme reste scellée. Un contrecoup psychique draine -10 PM à vos héros.`, "defeat");
              } else if (activeEncType === "ambush") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const dmg = Math.max(1, Math.round(h.calculatedStats.maxHp * 0.20));
                    const nextHp = Math.max(1, h.currentHp - dmg);
                    return { ...h, currentHp: nextHp };
                  }
                  return h;
                });
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 Pris par surprise ! Vos héros subissent un assaut furtif (20% de PV perdus).`, "defeat");
              } else if (activeEncType === "ritual") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const dmg = Math.max(1, Math.round(h.calculatedStats.maxHp * 0.10));
                    const nextHp = Math.max(1, h.currentHp - dmg);
                    return { ...h, currentMana: Math.max(0, (h.currentMana || 0) - 15), currentHp: nextHp };
                  }
                  return h;
                });
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 Fluctuation d'énergie magique ! Vos héros perdent -15 PM et 10% de leurs PV.`, "defeat");
              } else if (activeEncType === "obstacle") {
                updatedHeroes = updatedHeroes.map((h) => {
                  if (h.isActive && h.currentHp > 0) {
                    const dmg = Math.max(1, Math.round(h.calculatedStats.maxHp * 0.20));
                    const nextHp = Math.max(1, h.currentHp - dmg);
                    return { ...h, currentHp: nextHp };
                  }
                  return h;
                });
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 Vos aventuriers forcent le passage au prix d'un épuisement intense (20% de PV perdus).`, "defeat");
              } else if (activeEncType === "negotiation") {
                const goldLoss = Math.min(resources.gold, 20);
                setResources((res) => ({ ...res, gold: Math.max(0, res.gold - goldLoss) }));
                addLog(`❌ ÉCHEC ! [Jet de Chance : ${luckRoll} + Score : ${bestScore} < Difficulté : ${difficulty}]`, "defeat");
                addLog(`💥 Refus de négocier ! L'entité hostile détrousse l'escouade de ${goldLoss} Or avant de fuir.`, "defeat");
              }

              setHeroes(updatedHeroes);

              const survivingSlayers = updatedHeroes.filter(h => h.isActive && h.currentHp > 0);
              if (survivingSlayers.length === 0) {
                addLog("❌ Tous vos aventuriers ont été décimés ! L'escouade doit se replier.", "defeat");
                setAutoExplore(false);
              }

              // Failure ends encounter, go directly to step 5 (advance)
              setNonFightStep(5);
              setCombatTimer(2);
              return;
            }
          }

          if (step === 3) {
            // Material reward for successful check (50% chance to drop)
            if (Math.random() < 0.50) {
              const matReward = rollEncounterForgeMaterial(floor);
              setForgeMaterials(prev => {
                const updated = prev.map(m => ({ ...m }));
                const existing = updated.find(m => m.materialId === matReward.materialId && m.rarity === matReward.rarity);
                if (existing) {
                  existing.count += matReward.count;
                } else {
                  updated.push({ materialId: matReward.materialId, rarity: matReward.rarity, count: matReward.count });
                }
                return updated;
              });
              addLog(`⚙️ Matériau : +${matReward.count} [${matReward.name}] (${matReward.rarity}) obtenu pour la réussite.`, "loot");
            } else {
              addLog(`💨 Aucun composant de forge récupérable sur le lieu du défi.`, "info");
            }

            setNonFightStep(4);
            setCombatTimer(2);
            return;
          }

          if (step === 4) {
            // XP reward for the successful solver hero
            const xpReward = Math.round(20 * (1 + (floor - 1) * 0.15));
            updatedHeroes = updatedHeroes.map((h) => {
              if (h.id === bestHero.id) {
                return addXpToHero(h, xpReward);
              }
              return h;
            });
            setHeroes(updatedHeroes);

            setNonFightStep(5);
            setCombatTimer(2);
            return;
          }

          if (step === 5) {
            advanceDungeon(floor, room, updatedHeroes);
            setEncounterType(null);
            setNonFightStep(0);
            setChallengeSuccess(null);
            setCombatTimer(2);
            return;
          }
        }
      }
    }

    // 3. COMBAT ENCOUNTER
    const monster = currentMonsterRef.current;
    if (!monster) {
      // SPAWN A DYNAMIC MONSTER CARD MATCHING FLOOR RANK
      const isBossFloorRound = room === 50;
      let selectedRaw: any;

      if (isBossFloorRound) {
        if (floor <= 5) selectedRaw = BOSSES_LIBRARY[0];
        else if (floor <= 10) selectedRaw = BOSSES_LIBRARY[1];
        else if (floor <= 20) selectedRaw = BOSSES_LIBRARY[2];
        else if (floor <= 30) selectedRaw = BOSSES_LIBRARY[3];
        else selectedRaw = BOSSES_LIBRARY[4]; // primordial god dragon
      } else {
        let subLib = [];
        if (floor <= 5) subLib = MONSTERS_LIBRARY.slice(0, 4);
        else if (floor <= 15) subLib = MONSTERS_LIBRARY.slice(2, 8);
        else if (floor <= 29) subLib = MONSTERS_LIBRARY.slice(6, 12);
        else subLib = MONSTERS_LIBRARY.slice(10);

        selectedRaw = subLib[Math.floor(Math.random() * subLib.length)];
      }

      const scaleMultiplier = 1 + (floor - 1) * 0.18;
      const generatedHp = Math.floor(selectedRaw.isBoss ? (selectedRaw.atk * 24 * scaleMultiplier) : (selectedRaw.atk * 13 * scaleMultiplier));

      const scaledResistances: any = {};
      if (selectedRaw.resistances) {
        for (const [key, val] of Object.entries(selectedRaw.resistances)) {
          const resVal = val as number;
          if (resVal > 0) {
            scaledResistances[key] = Math.min(90, Math.round(resVal * scaleMultiplier));
          } else {
            scaledResistances[key] = resVal;
          }
        }
      }

      const spawnedMonster: Monster = {
        id: Math.random().toString(),
        name: selectedRaw.name,
        maxHp: generatedHp,
        hp: generatedHp,
        atk: Math.floor(selectedRaw.atk * scaleMultiplier),
        damageType: selectedRaw.damageType,
        def: Math.floor(selectedRaw.def * scaleMultiplier),
        magicDef: Math.floor(selectedRaw.magicDef * scaleMultiplier),
        resistances: scaledResistances,
        skills: selectedRaw.skills,
        xpYield: Math.floor(selectedRaw.xpYield * scaleMultiplier),
        goldYield: Math.floor(selectedRaw.goldYield * scaleMultiplier),
        image: selectedRaw.image,
        isBoss: selectedRaw.isBoss
      };

      setCurrentMonster(spawnedMonster);
      setCombatTurnIndex(0);
      addLog(`⚠️ Vos héros entrent dans la chambre ${room} et font face à un ${spawnedMonster.name} !`, "info");
      setCombatTimer(2);
      return;
    }

    // Monster is present: INDIVIDUAL ACTOR TURN STRIKE!
    let totalStrikeDmg = 0;

    // Copy updatedHeroes to handle mutable turn changes, ensuring cooldowns record is present
    let roundHeroes = updatedHeroes.map(h => ({ ...h, cooldowns: { ...(h.cooldowns || {}) } }));

    // Re-evaluate current slayers
    const currentSlayers = roundHeroes.filter(h => h.isActive && h.currentHp > 0);
    if (currentSlayers.length === 0) return;

    // Determine whose turn it is
    let turnIdx = combatTurnIndexRef.current;
    if (turnIdx > currentSlayers.length) {
      setCombatTurnIndex(0);
      turnIdx = 0;
    }

    // Reduce cooldowns safely by 1 at the start of each combat round for active, alive heroes
    if (turnIdx === 0) {
      roundHeroes = roundHeroes.map((h) => {
        if (h.isActive && h.currentHp > 0) {
          const nextCooldowns = { ...(h.cooldowns || {}) };
          let changed = false;
          for (const sId in nextCooldowns) {
            if (nextCooldowns[sId] > 0) {
              nextCooldowns[sId] -= 1;
              changed = true;
              if (nextCooldowns[sId] <= 0) {
                delete nextCooldowns[sId];
              }
            }
          }
          return changed ? { ...h, cooldowns: nextCooldowns } : h;
        }
        return h;
      });
    }

    if (turnIdx < currentSlayers.length) {
      // Execute a single slayer's turn
      const slayerRef = currentSlayers[turnIdx];
      const heroIndex = roundHeroes.findIndex(h => h.id === slayerRef.id);
      if (heroIndex !== -1) {
        const hero = roundHeroes[heroIndex];
        if (hero.currentHp > 0) {
          const calculatedStats = getHeroStats(hero);
          let skillUsed = false;
          const activeSkillIds = hero.activeSkills || [];

          // Evaluate active skills
          for (const skillId of activeSkillIds) {
            const skill = getSkillById(skillId);
            if (!skill || skill.type !== "active") continue;

            const manaCost = skill.manaCost || 0;
            if (hero.currentMana < manaCost) continue;

            const currentCooldown = hero.cooldowns?.[skillId] || 0;
            if (currentCooldown > 0) continue;

            const effect = skill.effect;
            if (!effect) continue;

            if (effect.type === "damage") {
              const statValue = calculatedStats[effect.scalingStat as keyof typeof calculatedStats] as number || calculatedStats.physicalDamage || 10;
              const skillDmg = Math.floor(statValue * effect.power);
              const finalSkillDmg = applyMonsterDefenseOrResistance(skillDmg, effect.damageType, monster);
              const hitCount = effect.hitCount || 1;
              const totalSkillDmg = finalSkillDmg * hitCount;

              const willKill = totalSkillDmg >= monster.hp;
              const isBoss = monster.isBoss;
              const isStrongThreat = monster.atk > 45;
              const isHighHp = monster.hp > monster.maxHp * 0.55;
              const expectLongFight = monster.hp > (calculatedStats.physicalDamage * 3);

              if (willKill || isBoss || isStrongThreat || isHighHp || expectLongFight) {
                skillUsed = true;
                hero.currentMana = Math.max(0, hero.currentMana - manaCost);
                if (skill.cooldownRounds) {
                  hero.cooldowns = { ...(hero.cooldowns || {}), [skillId]: skill.cooldownRounds };
                }
                totalStrikeDmg += totalSkillDmg;
                addLog(`✨ [Compétence] ${hero.name} déclenche '${skill.name}' ! Il inflige ${totalSkillDmg} dégâts de type ${effect.damageType} à ${monster.name}.`, "combat-hero");
                break;
              }
            } else if (effect.type === "heal") {
              const statValue = calculatedStats[effect.scalingStat as keyof typeof calculatedStats] as number || calculatedStats.magicDamage || 10;
              const healAmount = Math.floor(statValue * effect.power);

              if (skill.target === "all_allies") {
                const aliveAllies = roundHeroes.filter(h => h.isActive && h.currentHp > 0);
                const criticalAllies = aliveAllies.filter(h => h.currentHp / h.calculatedStats.maxHp < 0.4);
                const injuredAllies = aliveAllies.filter(h => h.currentHp / h.calculatedStats.maxHp < 0.7);

                const isUseful = criticalAllies.length > 0 || injuredAllies.length >= 2;
                if (isUseful) {
                  skillUsed = true;
                  hero.currentMana = Math.max(0, hero.currentMana - manaCost);
                  if (skill.cooldownRounds) {
                    hero.cooldowns = { ...(hero.cooldowns || {}), [skillId]: skill.cooldownRounds };
                  }

                  aliveAllies.forEach((ally) => {
                    const idx = roundHeroes.findIndex(h => h.id === ally.id);
                    if (idx !== -1) {
                      const actualHeal = Math.min(roundHeroes[idx].calculatedStats.maxHp - roundHeroes[idx].currentHp, healAmount);
                      roundHeroes[idx].currentHp = Math.min(roundHeroes[idx].calculatedStats.maxHp, roundHeroes[idx].currentHp + healAmount);
                      if (actualHeal > 0) {
                        addLog(`💚 [Compétence] ${hero.name} utilise '${skill.name}' ! Soigne ${roundHeroes[idx].name} de +${actualHeal} PV.`, "combat-hero");
                      }
                    }
                  });
                  break;
                }
              } else {
                const aliveAllies = roundHeroes.filter(h => h.isActive && h.currentHp > 0);
                let lowestAlly = aliveAllies[0];
                let minPercent = 1.0;
                aliveAllies.forEach((ally) => {
                  const pct = ally.currentHp / ally.calculatedStats.maxHp;
                  if (pct < minPercent) {
                    minPercent = pct;
                    lowestAlly = ally;
                  }
                });

                const missingHp = lowestAlly.calculatedStats.maxHp - lowestAlly.currentHp;
                const isUseful = minPercent < 0.4 || (minPercent < 0.7 && missingHp >= healAmount * 0.4);

                if (isUseful) {
                  skillUsed = true;
                  hero.currentMana = Math.max(0, hero.currentMana - manaCost);
                  if (skill.cooldownRounds) {
                    hero.cooldowns = { ...(hero.cooldowns || {}), [skillId]: skill.cooldownRounds };
                  }

                  const targetIdx = roundHeroes.findIndex(h => h.id === lowestAlly.id);
                  if (targetIdx !== -1) {
                    const actualHeal = Math.min(roundHeroes[targetIdx].calculatedStats.maxHp - roundHeroes[targetIdx].currentHp, healAmount);
                    roundHeroes[targetIdx].currentHp = Math.min(roundHeroes[targetIdx].calculatedStats.maxHp, roundHeroes[targetIdx].currentHp + healAmount);
                    addLog(`💚 [Compétence] ${hero.name} utilise '${skill.name}' sur ${lowestAlly.name} ! Soigne +${actualHeal} PV (${roundHeroes[targetIdx].currentHp}/${roundHeroes[targetIdx].calculatedStats.maxHp} PV).`, "combat-hero");
                  }
                  break;
                }
              }
            } else if (effect.type === "buff") {
              const isBoss = monster.isBoss;
              const isStrongThreat = monster.atk > 45;
              const isHighHp = monster.hp > monster.maxHp * 0.6;
              const expectLongFight = monster.hp > (calculatedStats.physicalDamage * 3);

              if (isBoss || isStrongThreat || isHighHp || expectLongFight) {
                skillUsed = true;
                hero.currentMana = Math.max(0, hero.currentMana - manaCost);
                if (skill.cooldownRounds) {
                  hero.cooldowns = { ...(hero.cooldowns || {}), [skillId]: skill.cooldownRounds };
                }

                addLog(`✨ [Compétence] ${hero.name} active '${skill.name}' ! Ses capacités offensives et défensives sont renforcées.`, "combat-hero");
                break;
              }
            } else if (effect.type === "debuff") {
              const isBoss = monster.isBoss;
              const isStrongThreat = monster.atk > 45;
              const isHighHp = monster.hp > monster.maxHp * 0.6;
              const expectLongFight = monster.hp > (calculatedStats.physicalDamage * 3);

              if (isBoss || isStrongThreat || isHighHp || expectLongFight) {
                skillUsed = true;
                hero.currentMana = Math.max(0, hero.currentMana - manaCost);
                if (skill.cooldownRounds) {
                  hero.cooldowns = { ...(hero.cooldowns || {}), [skillId]: skill.cooldownRounds };
                }

                addLog(`🎯 [Compétence] ${hero.name} lance '${skill.name}' ! Affaiblit temporairement ${monster.name}.`, "combat-hero");
                break;
              }
            }
          }

          if (!skillUsed) {
            const weapon = getHeroMainHandWeapon(hero);
            const weaponDamageRoll = rollWeaponDamage(weapon);
            const rawDamage = calculatedStats.physicalDamage + weaponDamageRoll;

            const critChance = calculatedStats.criticalChance / 100;
            const isCrit = Math.random() < critChance;
            let damageAfterCrit = rawDamage;
            if (isCrit) {
              damageAfterCrit = Math.floor(rawDamage * 1.5);
            }

            let damageType: DamageType = "physical";
            if (weapon) {
              const dTypes = getWeaponDamageTypes(weapon);
              if (dTypes && dTypes.length > 0) {
                damageType = dTypes[0];
              }
            }

            const finalDmg = applyMonsterDefenseOrResistance(damageAfterCrit, damageType, monster);
            totalStrikeDmg += finalDmg;

            if (isCrit) {
              addLog(`⚔️ [Coup critique 🍀] ${hero.name} assène un coup dévastateur à ${monster.name} pour ${finalDmg} dégâts.`, "combat-hero");
            } else {
              addLog(`🗡️ ${hero.name} attaque ${monster.name} pour ${finalDmg} dégâts.`, "combat-hero");
            }
          }
        }
      }

      // Commit the updated roundHeroes state back to updatedHeroes
      updatedHeroes = roundHeroes;

      const nextMonsterHp = Math.max(0, monster.hp - totalStrikeDmg);

      // Check monster death!
      if (nextMonsterHp <= 0) {
        addLog(`🏆 Victoire ! ${monster.name} est terrassé sous vos coups !`, "victory");

        // Set HP to 0 to show visual indicator of defeat, keep monster on screen temporarily
        setCurrentMonster({ ...monster, hp: 0 });
        setHeroes(updatedHeroes);
        setCombatVictoryStep(1);
        setCombatTimer(2);
        return;
      } else {
        // Monster is still alive, save progress
        setCurrentMonster({ ...monster, hp: nextMonsterHp });
        setHeroes(updatedHeroes);
        setCombatTurnIndex(turnIdx + 1);
        setCombatTimer(2);
        return;
      }
    } else {
      // Monster is alive: MONSTER RETALIATES ON AN ACTIVE COMBATANT!
      let totalStrikes = 1;
      if (monster.isBoss) {
        if (floor >= 30) {
          totalStrikes = 3;
        } else if (floor >= 10) {
          totalStrikes = Math.random() < 0.4 ? 3 : 2;
        } else {
          totalStrikes = 2;
        }
      } else {
        const multiStrikeChance = Math.min(0.5, (floor - 1) * 0.015);
        if (Math.random() < multiStrikeChance) {
          totalStrikes = 2;
        }
      }

      // Execute monster attacks sequentially
      for (let strikeNum = 1; strikeNum <= totalStrikes; strikeNum++) {
        // Re-evaluate alive active heroes for this strike
        const currentSlayers = updatedHeroes.filter(h => h.isActive && h.currentHp > 0);
        if (currentSlayers.length === 0) {
          break; // No heroes left to target
        }

        const targetedIndex = Math.floor(Math.random() * currentSlayers.length);
        const targetHero = currentSlayers[targetedIndex];
        
        const calculatedHeroStats = targetHero.calculatedStats;
        const heroDefense = monster.damageType !== "physical" ? calculatedHeroStats.magicDefense : calculatedHeroStats.physicalDefense;
        const finalMonsterDmg = Math.max(1, monster.atk - heroDefense);

        // Agility + Luck dodge check
        const dodgeCheckChance = calculatedHeroStats.dodgeChance / 100;
        const isDodged = Math.random() < dodgeCheckChance;

        const strikePrefix = totalStrikes > 1 ? `[Attaque ${strikeNum}/${totalStrikes}] ` : "";

        // Deduct targeted hero's vitality
        updatedHeroes = updatedHeroes.map((h) => {
          if (h.id === targetHero.id) {
            if (isDodged) {
              addLog(`🛡️ ${strikePrefix}${h.name} esquive avec brio l'attaque de ${monster.name} ! 🍀`, "combat-enemy");
              return h;
            }
            const remainingHp = Math.max(0, h.currentHp - finalMonsterDmg);
            if (remainingHp <= 0) {
              addLog(`💀 ${strikePrefix}${h.name} s'est écroulé sous la violence du coup ! Il est évacué vers les dortoirs pour panser ses plaies.`, "defeat");
              return { ...h, currentHp: 0, isActive: false, status: "resting" as const };
            } else {
              addLog(`💥 ${strikePrefix}${monster.name} inflige ${finalMonsterDmg} dégâts à ${h.name} (${remainingHp}/${h.calculatedStats.maxHp} PV restants).`, "combat-enemy");
              return { ...h, currentHp: remainingHp };
            }
          }
          return h;
        });
      }

      // Check total party defeat!
      const survivingSlayers = updatedHeroes.filter(h => h.isActive && h.currentHp > 0);
      if (survivingSlayers.length === 0) {
        addLog("❌ Tous vos aventuriers ont été décimés ! L'escouade doit se replier.", "defeat");
        setAutoExplore(false); // halt exploration
      }

      // Commit hero survival state change and monster damage
      setHeroes(updatedHeroes);
      setCurrentMonster(monster);
      setCombatTurnIndex(0);
      setCombatTimer(2);
      return;
    }
  }, [setHeroes, setCurrentMonster, setEncounterType, setCombatTimer, setResources, setStoredItems, setForgeMaterials, setAutoExplore, setActiveDungeonFloor, setActiveDungeonRoom, setHighestFloorReached, advanceDungeon, addLog, buildings, setCombatTurnIndex]);

  // COMBAT SIMULATION TICK PROCESSOR
  useEffect(() => {
    if (!currentUser) return;
    let battleHandle: NodeJS.Timeout;

    if (autoExplore) {
      battleHandle = setInterval(() => {
        runCombatTick();
      }, 1000);
    }

    return () => clearInterval(battleHandle);
  }, [autoExplore, runCombatTick, currentUser]);

  const handleRetreatParty = useCallback(() => {
    setCurrentMonster(null);
    setEncounterType(null);
    setCombatTurnIndex(0);
    setNonFightStep(0);
    setCombatVictoryStep(0);
    setChallengeSuccess(null);
    setHeroes((prev) =>
      prev.map((h) => (h.isActive ? { ...h, isActive: false, status: "resting" as const } : h))
    );
    setAutoExplore(false);
    addLog("🏹 Repli tactique : Votre groupe bat en retraite vers le havre de la colonie.", "defeat");
  }, [addLog, setEncounterType, setHeroes, setAutoExplore, setCombatTurnIndex, setNonFightStep, setCombatVictoryStep, setChallengeSuccess]);

  const generateSingleNoviceHero = useCallback((): Hero => {
    return generateSingleNoviceHeroUtil(unlockedRaces);
  }, [unlockedRaces]);

  const handleRecruitHero = useCallback(() => {
    const recruitmentCost = 100 + heroes.length * 150;
    if (resources.gold < recruitmentCost) {
      addLog("❌ Vous n'avez pas assez d'Or pour attirer de nouvelles recrues héroïques.", "defeat");
      return;
    }

    if ((buildings["guilde"] || 0) < 1) {
      addLog("❌ Construisez le Campement d'Aventuriers pour héberger vos champions.", "defeat");
      return;
    }

    const maxCapacity = (buildings["guilde"] || 0) + 2;
    if (heroes.length >= maxCapacity) {
      addLog(`❌ Capacité de dortoir saturée (${heroes.length}/${maxCapacity}). Agrandissez le Campement pour plus de places !`, "defeat");
      return;
    }

    // Deduct
    setResources((prev) => ({ ...prev, gold: prev.gold - recruitmentCost }));

    const tempHero = generateSingleNoviceHeroUtil();

    setHeroes((prev) => [...prev, tempHero]);
    if (tempHero.isElite) {
      addLog(`🔥 NOVICE ÉLITE RECRUTÉ ! [${tempHero.race}] ${tempHero.name} s'installe au Campement avec un potentiel d'exception !`, "victory");
    } else {
      addLog(`🍻 NOUVEAU RECRUTEMENT ! [${tempHero.race} ${tempHero.classType}] ${tempHero.name} s'installe au Campement de votre colonie !`, "victory");
    }
  }, [heroes.length, resources.gold, buildings, activeDungeonFloor, addLog, setResources]);

  const handleRecruitCustomHero = useCallback((customHero: Hero, cost: number) => {
    if (resources.gold < cost) {
      addLog("❌ Vous n'avez pas assez d'Or pour attirer de nouvelles recrues héroïques.", "defeat");
      return;
    }

    if ((buildings["guilde"] || 0) < 1) {
      addLog("❌ Construisez le Campement d'Aventuriers pour héberger vos champions.", "defeat");
      return;
    }

    const maxCapacity = (buildings["guilde"] || 0) + 2;
    if (heroes.length >= maxCapacity) {
      addLog(`❌ Capacité de dortoir saturée (${heroes.length}/${maxCapacity}). Agrandissez le Campement pour plus de places !`, "defeat");
      return;
    }

    setResources((prev) => ({ ...prev, gold: prev.gold - cost }));
    setHeroes((prev) => [...prev, customHero]);

    if (customHero.isElite) {
      addLog(`🔥 NOVICE ÉLITE RECRUTÉ ! [${customHero.race}] ${customHero.name} s'installe au Campement avec un potentiel d'exception !`, "victory");
    } else {
      addLog(`🍻 NOUVEAU RECRUTEMENT ! [${customHero.race} ${customHero.classType}] ${customHero.name} s'installe au Campement de votre colonie !`, "victory");
    }
  }, [heroes.length, resources.gold, buildings, addLog, setResources]);

  const handleDismissHero = useCallback((heroId: string) => {
    const target = heroes.find((h) => h.id === heroId);
    if (!target) return;
    setHeroes((prev) => prev.filter((h) => h.id !== heroId));
    addLog(`📢 CHAMPION LIBÉRÉ : [${target.classType}] ${target.name} quitte définitivement votre colonie.`, "defeat");
  }, [heroes, addLog]);

  const handleToggleHeroActive = useCallback((heroId: string) => {
    setHeroes((prev) => {
      const target = prev.find((h) => h.id === heroId);
      if (!target) return prev;

      const activeList = prev.filter((h) => h.isActive);
      if (!target.isActive && activeList.length >= 4) {
        addLog("⚠️ Groupe au complet ! Vous ne pouvez escorter que 4 champions simultanément.", "defeat");
        return prev;
      }

      const nextActiveVal = !target.isActive;
      if (nextActiveVal && target.currentHp <= 0) {
        addLog(`❌ Impossible d'emmener ${target.name} : Il est trop affaibli et doit se reposer au dortoir !`, "defeat");
        return prev;
      }

      if (nextActiveVal) {
        addLog(`🏹 ESCOUADE : ${target.name} rejoint le groupe actif pour progresser en donjon.`, "info");
      } else {
        addLog(`🏡 RETOUR : ${target.name} réintègre la garnison paisiblement.`, "info");
      }

      return prev.map((h) => {
        if (h.id === heroId) {
          return { ...h, isActive: nextActiveVal, status: nextActiveVal ? "exploring" as const : "idle" as const };
        }
        return h;
      });
    });
  }, [addLog]);

  const handleChangeFloor = useCallback((direction: "prev" | "next") => {
    if (direction === "prev" && activeDungeonFloor > 1) {
      setActiveDungeonFloor((f) => f - 1);
      setActiveDungeonRoom(1);
      setCurrentMonster(null);
      setEncounterType(null);
      addLog(`🧗 ASCENSION PARASITE : Vos héros remontent prudemment à l'Étage ${activeDungeonFloor - 1}.`, "info");
    } else if (direction === "next" && activeDungeonFloor < highestFloorReached) {
      setActiveDungeonFloor((f) => f + 1);
      setActiveDungeonRoom(1);
      setCurrentMonster(null);
      setEncounterType(null);
      addLog(`🕳️ PLONGÉE ABYSSALE : Vos héros descendent d'un pas ferme à l'Étage ${activeDungeonFloor + 1}.`, "info");
    }
  }, [activeDungeonFloor, highestFloorReached, addLog, setEncounterType]);

  const handleUnequipItem = useCallback((heroId: string, slot: keyof HeroEquipment) => {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero || !hero.equipment || !hero.equipment[slot]) return;

    const nextStoredItems = storedItems.map((item) => ({ ...item }));
    const updatedHero = unequipItem(hero, nextStoredItems, slot);

    const nextHeroes = heroes.map((h) => (h.id === heroId ? updatedHero : h));

    setHeroes(nextHeroes);
    setStoredItems(nextStoredItems);

    addLog(`🛡️ Équipement retiré avec succès et renvoyé au coffre global.`, "info");
  }, [heroes, storedItems, addLog]);

  const handleEquipItem = useCallback((heroId: string, itemId: string, rarity: Rarity, modifiers?: Modifier[]) => {
    const hero = heroes.find((h) => h.id === heroId);
    if (!hero) {
      addLog(`⚠️ Héros introuvable.`, "defeat");
      return;
    }

    const nextStoredItems = storedItems.map((item) => ({ ...item }));
    
    const stack = nextStoredItems.find(s => s.itemId === itemId && s.rarity === rarity && areModifiersEqual(s.modifiers, modifiers));
    if (!stack || stack.count <= 0) {
      addLog(`⚠️ Cet objet n'est pas disponible en stock.`, "defeat");
      return;
    }

    const updatedHero = equipItem(hero, nextStoredItems, itemId, rarity, modifiers);
    if (updatedHero === hero) {
      addLog(`⚠️ Impossible d'équiper cet objet. Vérifiez les conditions du héros.`, "defeat");
      return;
    }

    const nextHeroes = heroes.map((h) => (h.id === heroId ? updatedHero : h));

    setHeroes(nextHeroes);
    setStoredItems(nextStoredItems);

    addLog(`🗡️ Équipement équipé avec succès !`, "victory");
  }, [heroes, storedItems, addLog]);

  const handleScrapItem = useCallback((itemId: string, rarity: Rarity, modifiers?: Modifier[]) => {
    const forgeLevel = buildings["forge"] || 0;
    if (forgeLevel < 1) {
      addLog("⚠️ La forge doit être débloquée pour recycler des objets.", "defeat");
      return;
    }

    setStoredItems((prevStoredItems) => {
      const result = scrapItemFromStorage(prevStoredItems, forgeMaterials, itemId, rarity, modifiers);
      
      if (result.rewards.length === 0) {
        addLog("⚠️ Impossible de recycler cet objet.", "defeat");
        return prevStoredItems;
      }

      setForgeMaterials(result.forgeMaterials);
      
      const rewardsStr = result.rewards
        .map(r => {
          const mat = FORGE_MATERIALS.find(m => m.id === r.materialId);
          const matName = mat ? mat.name : r.materialId;
          return `+${r.count} ${matName}`;
        })
        .join(", ");
      
      const item = getItemById(itemId);
      const itemName = item ? item.name : itemId;
      addLog(`♻️ Recyclage de '${itemName}' (${rarity}) : Obtenu ${rewardsStr}`, "loot");

      return result.storedItems;
    });
  }, [buildings, forgeMaterials, addLog]);

  const resetDungeonSystem = useCallback(() => {
    setHeroes([]);
    setStoredItems([]);
    setForgeMaterials([]);
    setItemBlueprints(DEFAULT_UNLOCKED_ITEM_BLUEPRINTS);
    setActiveDungeonFloor(1);
    setActiveDungeonRoom(1);
    setHighestFloorReached(1);
    setAutoExplore(true);
    setCurrentMonster(null);
    setCombatTurnIndex(0);
    setNonFightStep(0);
    setCombatTimer(4);
    setUnlockedRaces(["Humain"]);
  }, []);

  const handleResetLevel = useCallback(() => {
    setActiveDungeonRoom(1);
    setCurrentMonster(null);
    setEncounterType(null);
    setCombatTurnIndex(0);
    setNonFightStep(0);
    setCombatTimer(0);
    addLog(`🔄 Reset Level : Exploration réinitialisée à la Chambre 1 pour cet Étage.`, "info");
  }, [addLog, setEncounterType, setCombatTurnIndex, setNonFightStep]);

  return {
    heroes,
    setHeroes,
    storedItems,
    setStoredItems,
    activeDungeonFloor,
    setActiveDungeonFloor,
    activeDungeonRoom,
    setActiveDungeonRoom,
    highestFloorReached,
    setHighestFloorReached,
    autoExplore,
    setAutoExplore,
    currentMonster,
    setCurrentMonster,
    currentEncounterType,
    setEncounterType,
    combatTimer,
    setCombatTimer,
    unlockedRaces,
    setUnlockedRaces,
    handleRetreatParty,
    generateSingleNoviceHero,
    handleRecruitHero,
    handleRecruitCustomHero,
    handleDismissHero,
    handleToggleHeroActive,
    handleChangeFloor,
    handleUnequipItem,
    handleEquipItem,
    handleScrapItem,
    forgeMaterials,
    setForgeMaterials,
    itemBlueprints,
    setItemBlueprints,
    resetDungeonSystem,
    handleResetLevel
  };
}
