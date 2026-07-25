# Domaine ville

L'autorité Ville est exclusivement
`supabase/functions/game-api/town-authority.ts`. L'ancien moteur local
`src/domain/town.ts` a été supprimé : il dupliquait partiellement les règles
serveur et n'était appelé par aucun runtime.

Le hook React ne porte plus de mutation,
de timer ou de validation métier Ville ; il contient uniquement l'état rendu,
les setters utilisés par les snapshots canoniques et le calcul d'affichage des
taux. Les règles de bâtiments partagées proviennent de
`src/data/buildings.ts` et les invariants d'entrée de
`src/domain/authoritativeTownValidation.ts`.

La commande historique `district.unlock` reste reconnue par le contrat afin de
retourner explicitement `DISTRICTS_DISABLED`. Aucune opération District
n'existe dans le domaine client et les données persistées restent inertes.

Le détail de la comparaison Git et des corrections est conservé dans
`docs/architecture/town-authoritative-parity-audit.md`.
