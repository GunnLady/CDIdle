# Domaine ville

`src/domain/town.ts` porte les mutations pures de la ville :

- `allocateCitizen` vérifie le bâtiment requis et conserve le total des citoyens ;
- `upgradeBuilding` vérifie le niveau maximal et débite les ressources atomiquement ;
- `unlockDistrict` vérifie l’existence, l’unicité et le coût du district ;
- `townRates` dérive les taux depuis l’état canonique et les bonus de district.

Le hook React conserve pour l’instant l’orchestration UI et les journaux. La migration complète vers ces fonctions sera faite lors de l’intégration autoritaire prévue par les tickets backend.
