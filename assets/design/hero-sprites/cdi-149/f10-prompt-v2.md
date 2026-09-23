# F10 — prompt v2

## Reprise

Nouvelle génération depuis zéro. F10 v1 est exclue des références. La seule
correction ciblée est de rendre la rectitude de la hampe immédiatement
contrôlable : la lance passe entièrement devant le bouclier et suit un axe
géométrique unique de son talon à sa pointe.

## Références transmises

Identiques à v1 : neutre F10 pour le personnage, garde *For Honor* pour les
appuis, photographie du Met pour le bouclier ovale, tête de lance `2000.206`
pour la géométrie et F02 validée pour le langage graphique CDI-149. Aucun
candidat rejeté n'est transmis.

## Contraintes déterminantes

- conserver toutes les contraintes d'identité, de tenue, de proportions,
  d'expression et de garde de `f10-prompt-v1.md` ;
- dessiner d'abord une seule ligne droite ininterrompue entre le centre du
  talon de hampe, le centre de la prise, le centre de la douille et la pointe ;
- tous ces centres doivent être strictement colinéaires, sans changement
  d'angle à la main, au bord du bouclier ou à la douille ;
- la hampe complète passe visiblement au premier plan, devant le bouclier :
  aucun segment caché ne doit permettre un faux raccord ;
- la main se referme naturellement autour de cette ligne droite sans casser
  l'axe ; la tête de lance reste symétrique et centrée sur la douille ;
- génération intégralement nouvelle, fond transparent et équipement entier.

## Résultat et contrôle

- Candidat : `exec-397bfa37-2ecf-4a5c-b287-809ea7bdcebe.png`.
- Dimensions : `1 422 × 1 106 px`.
- Poids : `1 104 638 octets`, `1 104,638 Ko`, `1,104638 Mo`.
- SHA-256 :
  `8530d3bbda8857fc1ed5a504a72b8a51a1dc8acffc91f0d2e5339d24b68a5921`.
- Contrôle de proportions : `.tmp/cdi149-f10-v2-proportion-check.png` ;
  rapports tête/épaules/tronc/bras/hanches/jambes compatibles avec le neutre
  F10 et les Mages F06/F08.
- Contrôle de la lance : `.tmp/cdi149-f10-v2-weapon-reference-check.png` ;
  hampe rectiligne et continue, prise dans le même axe, douille alignée, arme
  entière. La petite épaule asymétrique de la lame est visible, cohérente et
  acceptée par la validation visuelle utilisateur.
- Contrôle du bouclier : `.tmp/cdi149-f10-v2-shield-reference-check.png` ; forme
  ovale, échelle et protection du flanc cohérentes.
- Cadre : aucun pixel opaque sur les bords gauche, droit ou supérieur ; `19`
  pixels opaques touchent le bord inférieur sous une semelle, sans rognage
  visuel de la botte. Ajouter une marge lors de la normalisation finale.
- Verdict utilisateur : validé le 20 septembre 2026.
- Source validée archivée :
  `validated-female-v1/warrior-female-10-combat-idle-v1.png`.
- L'empreinte de l'archive est identique à celle du candidat.
