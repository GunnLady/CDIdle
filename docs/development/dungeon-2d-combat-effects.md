# Effets de combat 2D — CDI-113

> Révision du plan, 13 septembre 2026 : ce document décrit la première version
> technique, pas la cible désormais validée à l’écrit. Voir le [plan de production
> des actions](dungeon-2d-action-production-plan.md) pour le routage par geste,
> les retouches artistiques ciblées et la stratégie simple/économe. Les profils
> génériques et timings ci-dessous restent à vérifier en lecture continue ;
> leurs tests antérieurs ne prouvent pas la couverture du nouveau périmètre.

## But et limites

Ce catalogue présente les actions déjà présentes dans le transcript autoritaire.
Il ne décide ni cible, ni valeur, ni coût de mana, ni résultat. Les
buffs/debuffs persistants restent à CDI-114 ; intentions/protections à
CDI-126, Roi à CDI-127. Les gestes avancés appartiennent à CDI-118–125,
les réactions à CDI-128 et la couverture continue à CDI-135. La recette actuelle
vise le mode PC ; le cadrage mobile est différé conformément au plan produit.

## Entrées structurées

`encounterSceneProjection.ts` conserve sur chaque pas `type`, `skillId` et
`damageType`, puis garde pour chaque impact son ordre (`hit`, `hitCount`), son
critique, sa cible et ses variations exactes de PV/PM. Le profil visuel est
choisi par `dungeonCombatActionProfile.ts` :

| Profil | Preuve structurée | Présentation |
|---|---|---|
| Mêlée | événement de frappe direct, ou compétence de dégâts `physical` non répertoriée comme tir | déplacement court existant, réaction et nombre |
| Projectile | `hero.skill.damage` avec identifiant stable `precise_shot` ou `piercing_arrow` | recul léger, projectile doré en arc source → cible, impact et nombre |
| Magie offensive | `hero.skill.damage` avec `damageType` non physique | concentration, flux violet source → cible, impact et nombre |
| Soin allié | `hero.skill.heal` | concentration, flux or/vert vers la cible, gain de PV rouge et coût de PM bleu |
| Soutien ennemi | `enemy.support` | aura rouge de l'auteur, flux vert sombre vers la cible et gain de PV |
| Neutre | données anciennes ou insuffisantes | résumé fidèle et impacts prouvés, sans trajectoire inventée |

Les noms traduits, messages et classes supposées ne participent pas au choix.
Une action multicible reste répartie selon les événements reçus ; seul l'acteur
portant un impact réel réagit. Les impacts multiples d'un même événement gardent
l'ordre fourni par `hitResults`.

## Provenance et poids

Les quatre nouveaux profils utilisent uniquement SVG et CSS du composant
`DungeonCombatScene`. Ils ajoutent donc **0 octet d'image téléchargée**. Ils sont
enregistrés dans `encounterVisuals.ts` avec les clés `effect:projectile`,
`effect:magic`, `effect:healing` et `effect:support`. Le fallback est le résumé
HTML accessible et la bulle chiffrée ; aucune image distante ni dépendance n'est
requise à l'exécution.

Les trajectoires prennent comme ancrages les positions PC calculées des acteurs,
avec un point relevé et borné vers leur centre visuel. Les nombres restent
ancrés à la cible. Les commandes demeurent hors du calque d'effets, qui ignore
les événements de pointeur.

La chorégraphie prend
[Slime Team Manager](https://github.com/Arias1101/Slime-Team-Manager) comme
référence d'animation uniquement : geste propre à l'auteur, projectile ou effet
séparé, résolution au contact, réaction de la cible, puis retour à l'attente.
L'identité visuelle, les sprites et la composition restent ceux de CDIdle.
L'attente individuelle est suspendue pendant l'action de l'auteur et reprend
ensuite sans synchroniser les acteurs entre eux.

## Cadence, borne et nettoyage

- action complète de l'auteur : 720 ms ;
- trajet projectile/magie/soin/soutien et contact : 430 ms ;
- réaction, nombre et changement visible de PV démarrent au contact ; le coût
  de PM reste visible dès le lancement ;
- bulle : 1 000 ms ;
- impacts successifs sur une même cible : départs espacés de 600 ms ;
- trajectoires et bulles partagent une limite stricte de 16 éléments visibles ;
- le flux conserve brièvement les bulles entre les pas de lecture de 400 ms,
  déduplique les identifiants et supprime chaque entrée après sa durée visuelle ;
- masquer l'onglet vide le flux ; le démontage annule le minuteur courant ;
- `prefers-reduced-motion` et `animationsEnabled=false` suppriment animations et
  transitions tout en laissant les valeurs et liens source/cible visibles.

La progression, les commandes réseau et la cadence du moteur ne dépendent
jamais de la fin d'une animation CSS.

## Budget et chargement

L'audit de production a détecté un dépassement initial de 2 129 octets par
rapport au plafond inchangé de 250 KiB. Le plafond n'a pas été relevé : la
projection légère de l'en-tête Donjon a été séparée du moteur de rencontre afin
que ce dernier reste dans le chunk lazy du Donjon, puis le build de production
a été confié à Terser. Le résultat final mesure 252 797 octets gzip pour
l'ensemble du JavaScript, avec un plus gros chunk de 118 347 octets.

Terser est une dépendance de build uniquement. `npm audit --omit=dev` ne relève
aucune vulnérabilité de production ; les huit alertes de l'audit complet
concernent l'outillage de test préexistant et aucune ne passe par Terser.

## Preuves attendues

Les tests de projection vérifient ordre, critiques, cible létale, cibles
explicites et PM. Les tests du modèle de scène vérifient les six familles,
réactions et borne combinée. Les tests du composant vérifient accessibilité,
provenance, chevauchement et nettoyage. Le harness
`integrated=1&advanced-combat=1&scenario=1` ouvre une mise en place préchargée,
puis expose les actions dans le vrai `CurrentEncounterPanel` avec les commandes
Précédente, Rejouer et Suivante pour la validation visuelle PC. La suite
Playwright correspondante requiert l'autorisation explicite d'inspecter
l'application locale.
