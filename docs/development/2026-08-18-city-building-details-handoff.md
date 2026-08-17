# Handoff — détail des bâtiments et finition de la Cité

## Statut

Le 18 août 2026, le lot poursuit CDI-069 sur la page Cité. Il réorganise les
panneaux, ajoute les grands visuels des bâtiments, affine les cartes du menu et
termine plusieurs éléments de direction artistique : séparateurs de titre,
scrollbar en forme de lance, vélin de coût et barre d'immigration.

Les contrôles structurels et techniques ont été réalisés par Codex. Codex n'a
pas piloté Chrome pour cette validation. Les décisions de hauteur, de cadrage
et de rendu ont été contrôlées visuellement par l'utilisateur à partir de son
application locale, de sa capture `D:/idle/2026-08-17 225207.png` et des rendus
ImageGen affichés dans la conversation.

## Structure de la Cité

À partir du breakpoint `xl`, la Cité emploie deux colonnes flexibles :

- une colonne principale de ratio `2.2` contenant le bâtiment sélectionné puis
  les affectations ;
- une colonne Bâtiments de ratio `1`, étirée à la hauteur exacte de la colonne
  principale et dotée de son propre défilement interne.

La règle `.city-building-column > .ui-panel-skin` force explicitement le panneau
Bâtiments en position absolue. Elle est nécessaire car la règle générique
`.ui-panel-skin { position: relative; }` neutralisait auparavant la classe
Tailwind `xl:absolute` et produisait une colonne beaucoup trop haute.

`PageViewport` réserve l'espace de la scrollbar verticale desktop avec
`scrollbar-gutter: stable`, ce qui évite le déplacement horizontal du contenu
principal lorsqu'elle apparaît.

## Cartes et bâtiment sélectionné

Les cartes du menu affichent désormais, dans cet ordre : nom complet, niveau,
type et description. Le nom revient à la ligne au lieu d'être tronqué. Un trait
noir minimal et quatre ombres d'un pixel maintiennent les textes clairs lisibles
sur les illustrations lumineuses.

`buildingCardImages.ts` centralise deux collections distinctes :

- les quatorze cartes `1024 x 448 px` du menu ;
- les quatorze panoramas `1536 x 384 px`, au ratio exact `4:1`, réservés au
  panneau Bâtiment sélectionné.

Les panoramas gardent le sujet architectural à gauche et prolongent le décor à
droite sous le contenu DOM. Le Repaire et la Forge ont reçu une passe de fidélité
supplémentaire. L'Atelier runique a été redessiné en atelier bois/pierre
structurellement cohérent ; sa petite carte est dérivée du même master. Le Poste
de chasse utilise un décalage de recadrage de `80 px` vers le bas.

Le texte du bâtiment sélectionné reste en DOM au-dessus d'un fondu sombre. La
description et les coûts partagent un vélin nine-slice plus fin. Le bouton
`Bâtir` ou `Améliorer` reste à droite et aligné en bas. Les ressources utilisent
les libellés français partagés par `resourcePresentation.ts` : Or, Nourriture,
Bois, Pierre et Minerai.

## Habillage transversal

Chaque `Panel` emploie `panel-title-separator-v1.png` sous son titre. Ce
séparateur reprend les matériaux et les filets du cadre au lieu de la barre
marron historique.

La scrollbar native utilise trois segments verticaux et trois segments
horizontaux `v4`. Les pointes et le petit pic restent à taille fixe ; seule la
tige centrale est répétée entre les embouts, sans passer dessous.

La variante `Progress` nommée `immigration` conserve le `<progress>` natif et
accessible. Son habillage CSS ajoute une auge sombre, des embouts bois/laiton
rivetés et un remplissage ambre-vert. Les jauges PV, mana et expérience ne sont
pas modifiées.

## Assets et reproductibilité

Prompts versionnés :

- `assets/design/cdi-069/panel-title-separator-v1.prompt.md` ;
- `assets/design/cdi-069/scrollbar-thumb-v4.prompt.md` ;
- `assets/design/cdi-069/building-cost-vellum-v1.prompt.md` ;
- `assets/design/cdi-069/building-details-v1.prompt.md`.

Scripts de préparation :

- `scripts/prepare-panel-title-separator.ps1` ;
- `scripts/prepare-scrollbar-assets.ps1` ;
- `scripts/prepare-building-cost-vellum.ps1` ;
- `scripts/prepare-building-detail-assets.ps1`.

Les masters ImageGen restent volontairement ignorés sous
`assets/design/cdi-069/sources/`. Le manifeste CDI-069 référence les assets
runtime, leurs dimensions, les scripts et les invariants de rendu.

## Audit pré-push

Validations du 18 août 2026 :

- `npm.cmd test -- --run` : `109` fichiers, `786/786` tests réussis ;
- `npm.cmd run typecheck` : réussi ;
- `npm.cmd run lint` : réussi ;
- `npm.cmd run build -- --outDir tmp/codex-ui-handoff-build` : réussi, `1964`
  modules transformés ;
- manifeste CDI-069 : JSON valide ;
- panoramas : `14/14` présents, tous en `1536 x 384 px` ;
- petite carte Atelier runique : `1024 x 448 px` ;
- `git diff --check` : réussi, hors avertissements CRLF attendus sous Windows.

Le build a été dirigé vers un dossier temporaire parce que `dist/assets` était
verrouillé par un processus Windows lors des essais précédents. Le build Vite
lui-même est validé ; ce verrou n'est pas une erreur de compilation.

## Périmètre Git et reprise

Ne pas inclure dans ce lot les fichiers utilisateur sans rapport suivants :

- `src/assets/images/ui/secondary-navigation-rail/dungeon-class-plaque-novice-v1.png` ;
- `src/assets/images/ui/secondary-navigation-rail/dungeon-party-class-medallion-ring-v2.png` ;
- `tmp/`.

Aucun changement backend, schéma Supabase ou règle métier n'est inclus. Le lot
se publie par commit/push sur `main`, puis par le workflow frontend manuel
`.github/workflows/deploy-frontend.yml`. Après déploiement, l'utilisateur doit
encore confirmer visuellement la Cité dans Chrome, notamment la barre
d'immigration et les cadrages panoramiques.

À la reprise, lire `AGENTS.md`, ce handoff et
`docs/development/design-system.md`.
