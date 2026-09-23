# F10 — prompt v1

## Références transmises

1. `assets/design/hero-sprites/cdi-137/validated-female-v1/warrior-female-10-v1.png`
   — autorité exclusive pour l'identité, la tenue, la palette et les
   proportions de F10.
2. `assets/design/hero-sprites/cdi-149/references/f10/for-honor-valkyrie-spear-shield.png`
   — garde stable, appuis et coordination lance-bouclier uniquement ; ne copier
   ni l'armure, ni le casque, ni le bouclier fantaisie.
3. `assets/design/hero-sprites/cdi-149/references/f10/met-zulu-warrior-oxhide-shield-2006.592.jpg`
   — autorité pour la silhouette ovale et l'échelle corporelle du bouclier ; ne
   copier ni le visage, ni la tenue, ni le décor photographique.
4. `assets/design/hero-sprites/cdi-149/references/f10/met-spearhead-2000.206.jpg`
   — autorité géométrique pour une tête de lance droite, symétrique et alignée
   sur sa douille ; simplifier les ornements.
5. `assets/design/hero-sprites/cdi-149/validated-female-v1/warrior-female-02-combat-idle-v1.png`
   — autorité de style CDI-149 pour la hampe, le raccord et le rendu peint de
   l'arme ; ne reprendre ni le personnage, ni la tenue, ni la pose exacte.

## Contraintes déterminantes

- recréer depuis zéro l'identité F10 exacte : visage, peau claire, coupe
  asymétrique brune avec côté rasé, col de fourrure, armure brune et verte,
  pantalon sombre et bottes inchangés ;
- expression sérieuse et concentrée, bouche fermée, regard fixé sur
  l'adversaire ;
- exactement une lance à une main et un bouclier ovale moyen ; aucune autre
  arme, aucun fourreau tenu et aucune dague ;
- vraie garde de combat compacte : corps légèrement de trois quarts, pieds
  décalés, genoux souples, poids stable ; bras au bouclier avancé et fléchi,
  bouclier actif devant le flanc et le torse ;
- la main d'arme tient la hampe dans son tiers arrière, près de la hanche
  arrière ; la lance traverse la silhouette en diagonale montante vers
  l'adversaire, avec la pointe plus haute que la main mais sans devenir
  verticale ; posture prête à pousser, pas une attaque déjà partie ;
- hampe parfaitement droite et continue de la main à la douille ; tête et
  douille exactement dans le même axe ; lame symétrique, pointe nette, deux
  bords cohérents, taille crédible ; aucun pli, coude, torsion ou raccord cassé ;
- bouclier ovale simple, légèrement bombé, face de cuir renforcée par un bord
  métallique discret ; prise et sangle plausibles, avant-bras réellement
  engagé derrière le bouclier ; pas de bouclier rond, de forme concave
  fantaisie, de pointe ou de découpe décorative ;
- rendu illustré CDI-149 : contours sombres propres, volumes peints, acier
  facetté, bois lisible, cuir et métal cohérents avec la tenue F10 ; ne copier
  aucun rendu photographique ni aucun design de franchise ;
- conserver exactement le gabarit féminin du neutre F10 et des Mages F06/F08 :
  mêmes rapports tête/épaules/tronc/bras/hanches/jambes ; la pose peut élargir
  le cadre, pas allonger ou amincir le personnage ;
- cadre assez large pour montrer tout le corps, les deux bottes, le bord entier
  du bouclier, le talon de hampe et la pointe sans rogner ni courber l'arme ;
- fond transparent ; aucun texte, logo, filigrane, décor, sol, ombre portée,
  halo opaque ou accessoire inutile.

## Résultat et contrôle

- Candidat : `exec-0db1c21a-7f84-4495-9337-0b1e1ad48222.png`.
- Dimensions : `1 422 × 1 106 px`.
- Poids : `1 074 153 octets`, `1 074,153 Ko`, `1,074153 Mo`.
- SHA-256 :
  `612426fb6c3aa8fc0d7e9a7026f1b733d106c897bee9cdac0b0b55d870199341`.
- Contrôle de proportions : `.tmp/cdi149-f10-v1-proportion-check.png` ;
  gabarit compatible.
- Contrôle de l'arme : `.tmp/cdi149-f10-v1-weapon-reference-check.png`.
- Rejet : l'axe global de la hampe change légèrement autour de la main et du
  passage devant le bouclier. La tête et la douille sont propres, mais la hampe
  n'est pas rectiligne de son talon à sa pointe. Défaut signalé par
  l'utilisateur et confirmé après réinspection.
- Le candidat rejeté ne sera pas transmis à la génération suivante.
