# Domaine inventaire et équipement

`src/domain/inventory.ts` expose des mutations immuables sur les héros et le
stock :

- `addStack` empile un objet sans muter l’état source ;
- `removeStack` refuse les retraits partiels impossibles ;
- `equipStoredItem` vérifie le héros, le stock, les slots et les incompatibilités ;
- `unequipStoredItem` rend l’objet au stock et recalcule les stats.

La forge et le recyclage restent dans CDI-013. Les commandes autoritaires
d'inventaire et d'équipement sont raccordées dans CDI-027 ; la preuve HTTP
Edge/Supabase/RLS réelle reste différée vers CDI-041/staging.
