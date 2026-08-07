# Handlers de commandes autoritaires

`applyTownCommand` est le point d'entrée d'application des commandes canoniques.
Il migre et valide l'état reçu, restaure le RNG, construit le contexte commun,
puis délègue au handler enregistré dans `town-command-registry.ts`.

## Responsabilités

- `command-handler.ts` définit l'interface commune, le contexte, l'erreur métier
  partagée et le dispatcher.
- `town-state.ts` possède l'initialisation, la migration et la validation de
  l'état ; `town-authority.ts` ne conserve que l'orchestration d'une commande.
- `forge-blueprints.ts` possède les blueprints initiaux partagés par l'état et
  les migrations, sans créer de dépendance vers le moteur de commandes forge.
- `town-command-registry.ts` associe explicitement chaque type canonique à un
  unique handler.
- `*-command-handlers.ts` possèdent les règles d'une famille : ville, citoyens,
  onboarding, héros/vocations, inventaire, forge ou donjon.
- Les moteurs existants d'inventaire, de forge et de donjon restent propriétaires
  de leurs transitions détaillées.
- L'adaptateur Supabase conserve la transaction, la révision, le claim, le replay
  et le rate limit. Les handlers n'écrivent jamais directement en base.

## Invariants

Un handler reçoit l'état canonique déjà migré et validé. Il retourne une
`CanonicalStateTransition` sans muter l'état d'entrée. Il doit préserver les
codes d'erreur, les événements publics et l'ordre de consommation du RNG.

Le contexte expose trois opérations RNG :

- `nextSeedKey` consomme un sous-seed sur le flux canonique ;
- `forkRng` crée le flux isolé attendu par les moteurs concernés ;
- `withRng` place le snapshot courant dans l'état retourné.

Un handler qui n'utilisait pas `withRng` avant la découpe ne doit pas l'ajouter,
car cela changerait le snapshot produit.

## Ajouter une commande

1. Ajouter son type et son payload à `CanonicalGameCommand`, à la validation du
   contrat et à `CANONICAL_COMMAND_TYPES`.
2. Implémenter un handler typé dans la famille propriétaire, ou créer une
   nouvelle famille si sa responsabilité est réellement distincte.
3. Ajouter exactement une entrée explicite à `TOWN_COMMAND_HANDLERS`.
4. Ajouter les tests métier, erreur, événement et RNG de la commande.
5. Rejouer le test d'exhaustivité du registre, les golden tests, les tests de
   replay/révision et `npm.cmd run check:determinism`.

Le type `TownCommandHandlerRegistry` fait échouer la compilation si un type du
contrat n'est pas enregistré. Le test runtime compare aussi les clés du registre
à `CANONICAL_COMMAND_TYPES`, afin de détecter un écart entre contrat et câblage.
