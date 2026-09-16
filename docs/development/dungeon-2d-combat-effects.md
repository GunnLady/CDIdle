# Effets de combat 2D — CDI-113

> Révision du 15 septembre 2026 : CDI-113 fournit le contrat de chronologie et
> le pilote de contact Novice. Voir le [plan de production des actions](dungeon-2d-action-production-plan.md)
> pour les gestes et effets que les tickets de famille doivent encore livrer.

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
| Mêlée | événement de frappe direct, ou identifiant stable de geste de contact (`heavy_blow`, `cleaving_strike`, `quick_shiv`, `double_cut`, `earthen_fist`, `zephyr_strike`, `rapid_combo`) | déplacement court existant, réaction et nombre |
| Projectile | identifiant stable de tir ou d'appareil (`precise_shot`, `piercing_arrow`, `flame_thrower`, `lightning_arc`) | recul léger, preuve de trajet source → cible, impact et nombre |
| Magie offensive | identifiant stable de sort de dégâts (`fire_bolt`, `ice_shard`, `water_lance`, `stone_spike`, `wind_blade`, `lightning_bolt`, `holy_smite`) | concentration, preuve de trajet source → cible, impact et nombre |
| Soin allié | `hero.skill.heal` | concentration, flux or/vert vers la cible, gain de PV rouge et coût de PM bleu |
| Soutien ennemi | `enemy.support` | aura rouge de l'auteur, flux vert sombre vers la cible et gain de PV |
| Neutre | données anciennes ou insuffisantes | résumé fidèle et impacts prouvés, sans trajectoire inventée |

Les noms traduits, messages, classes supposées et le seul `damageType` ne
participent pas au choix. Une compétence de dégâts inconnue reste neutre au lieu
d'inventer un geste ; les tickets de famille complètent ce manifeste.
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
L'attente individuelle reste active sous la couche d'action ponctuelle. La
couche d'action revient à son transform neutre à 400 ms ; le dernier auteur ne
dépend donc pas d'une action suivante pour retrouver son attente et les acteurs
ne sont pas resynchronisés entre eux.

## Pilote de contact Novice

Le pilote économe réutilise les sprites Novice validés, leur alpha, leur boîte
visible et leur ancrage de production. Il n'ajoute aucun bitmap ni détourage :
la préparation recule légèrement le sprite, l'émission lance le mouvement, le
contact avance brièvement l'auteur, puis la récupération le ramène sur son pivot.

Repères communs du contact dans le pas logique inchangé :

| Phase | Repère | Responsabilité |
|---|---:|---|
| Préparation | 0 ms | auteur identifiable, début du recul |
| Émission | 72 ms | départ du geste |
| Contact | 160 ms | maximum d'allonge, impact, nombre et PV |
| Récupération | 248 ms | retrait vers le pivot |
| Attente | 400 ms | transform d'action neutre, attente individuelle visible |

Comparaison retenue avant validation visuelle : le mouvement simple coûte zéro
asset, conserve exactement taille alpha/ancrage/arme et couvre le contact de
base. Une pose ciblée coûterait au minimum une nouvelle image par identité
concernée, avec revue alpha, pivot, arme et visage. Aucune pose n'est donc créée
tant que la validation visuelle du pilote n'a pas démontré un gain de lecture
insuffisant avec le mouvement simple.

## Cadence, borne et nettoyage

- contact simple complet : 400 ms, selon les cinq repères ci-dessus ;
- action avancée existante : 720 ms, à spécialiser dans les tickets de famille ;
- trajet projectile/magie/soin/soutien et impact distant : 430 ms ;
- réaction, nombre et changement visible de PV démarrent au contact ; le coût
  de PM reste visible dès le lancement ;
- bulle : 1 000 ms ;
- impacts successifs sur une même cible : départs espacés de 600 ms ;
- trajectoires et bulles partagent une limite stricte de 16 éléments visibles ;
- le flux conserve brièvement les bulles entre les pas de lecture de 400 ms,
  déduplique les identifiants, conserve leur nœud de rendu et supprime chaque
  entrée après sa durée visuelle ;
- un nouveau pas du même combat remplace la piste d'action de l'acteur et peut
  chevaucher les bulles encore lisibles ; une entrée de replay, un résultat ou
  un changement d'identifiant de rencontre vide au contraire l'ancien flux ;
- les mises à jour retardées des jauges survivent au pas suivant ; une mise à
  jour autoritaire plus récente empêche une ancienne temporisation de régresser
  la valeur affichée ;
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
a été confié à Terser. La mesure actualisée après intégration des gardes Novice
et du pilote de contact est de 254 618 octets gzip pour l'ensemble du
JavaScript, avec un plus gros chunk de 118 347 octets.

Terser est une dépendance de build uniquement. `npm audit --omit=dev` ne relève
aucune vulnérabilité de production ; les huit alertes de l'audit complet
concernent l'outillage de test préexistant et aucune ne passe par Terser.

## Preuves attendues

Les tests de projection vérifient ordre, critiques, cible létale, cibles
explicites et PM. Les tests du modèle de scène vérifient les six familles,
réactions et borne combinée. Les tests du composant vérifient accessibilité,
provenance, chevauchement et nettoyage. Le harness
`combat-scene=1&integrated=1&contact-pilot=1&novice-review=1` lit
automatiquement, à 400 ms, la mise en place, le contact de base, l'esquive, le
critique, le létal avec survivants et le résultat dans le vrai
`CurrentEncounterPanel`. Il expose seulement `Rejouer` ; aucun pas-à-pas n'est
nécessaire. Le harness avancé historique reste disponible pour les tickets de
famille, sans constituer leur validation finale.
