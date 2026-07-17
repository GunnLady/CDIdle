# Domaine inventaire et équipement

`src/domain/inventory.ts` expose des mutations immuables sur les héros et le
stock :

- `addStack` empile un objet sans muter l’état source ;
- `removeStack` refuse les retraits partiels impossibles ;
- `equipStoredItem` vérifie le héros, le stock, les slots et les incompatibilités ;
- `unequipStoredItem` rend l’objet au stock et recalcule les stats.

La forge et le recyclage restent dans CDI-013. L’intégration atomique serveur/UI
reste dans CDI-027.
