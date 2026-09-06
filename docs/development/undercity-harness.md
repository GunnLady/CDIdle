# Les Dessous de la Cité — harness de 50 étages

Version actuelle : undercity-theme-pools-v1, avec progression personnelle, farm, pools de loot thématiques et série du Roi des Rats recalibrée. La campagne undercity-50-v3 reste la validation historique du contenu de base. Uniquement scripts de simulation ; aucune intégration front, backend ou sauvegarde. Les expériences précédentes à quatre zones et les groupes collectifs restent des résultats historiques, pas la définition actuelle.

Le harness éprouve les règles fonctionnelles validées. Les taux, coûts, quantités et autres paramètres d'équilibrage peuvent varier lorsqu'ils sont signalés comme expérimentaux. Une modification de comportement fonctionnel doit être discutée et validée avant d'être introduite dans un profil de test ; un résultat du harness ne vaut jamais validation produit par lui-même.

## Structure et récit

Le Roi des Rats est un souverain intelligent devenu monstrueux, protecteur des exclus et maître de la vermine. Les passeurs lui versent un tribut. Les citernes et le bastion révèlent l'organisation des rejetés avant la confrontation avec sa Cour. Les textes narratifs ne sont pas encore des dialogues jouables.

| Étages | Zone | Rencontres ordinaires | Boss |
| --- | --- | --- | --- |
| 1–10 | Égouts infestés | Meute de rats (3), Nuée de scarabées (3), Limon des conduits (1), Rat colossal (1) | La Mère des nuisibles (1) |
| 11–20 | Galeries des contrebandiers | Escorte des passeurs (3), Récupérateurs gobelins (2), Dresseur et molosse (2), Coupe-jarret du tribut (1) | Le Collecteur du tribut et son escorte (3) |
| 21–30 | Citernes oubliées | Colonie de parasites (3), Limon des réservoirs (1), Gardien des refuges (1), Sangsues des citernes (2) | Le Gardien des eaux mortes (1) |
| 31–40 | Bastion des Exclus | Sentinelle bannie (1), Patrouille des exilés (2), Défenseurs du bastion (3), Colosse des barricades (1) | Le Porte-étendard des Exclus et son escorte (3) |
| 41–50 | Cour du Roi des Rats | Garde des exclus (3), Vermine de la Cour (3), Escorte du chambellan (3), Champion de la Cour (1) | Le Roi des Rats et ses deux gardes (3) |

20 modèles de rencontres ordinaires et cinq rencontres de boss. Les chiffres indiquent le nombre de cibles indépendantes. Chaque zone contient des solos et des groupes. Les élites utilisent les mêmes compositions, avec le budget élite canonique. Les noms individuels sont explicites et propres à leur région ; aucun suffixe numérique générique ni réemploi des passeurs dans la Cour.

Les rencontres ordinaires sont choisies uniformément parmi les quatre modèles de la zone. Cela donne une proportion théorique de solos de 50 %, 25 %, 50 %, 50 %, 25 % hors boss/élites. Ce sont des paramètres du prototype, pas des objectifs de rendement arbitraires.

## Comportements réellement simulés

- Essaims : chaque mort retire un attaquant. Les solos conservent une place dans le catalogue.
- Protection : le protecteur vivant renforce les deux défenses du groupe de 15 %. Après sa mort, elles sont réduites de 15 %, actualisées au round suivant. Le coupe-jarret et la sentinelle solo gardent leur protection pendant les deux premiers rounds. Dresseur et molosse n'ont pas de protecteur dédié et utilisent le profil exposé.
- Soutiens : les soigneurs/apothicaires des escortes peuvent soigner au troisième round, puis tous les trois rounds. Ils ciblent l'allié vivant ayant le plus de PV manquants. Le soin vaut au maximum 8 % de ses PV max ; le budget total de soins de la rencontre est limité à 15 % des PV initiaux du groupe. Soigner remplace toutes les attaques du soutien pour ce tour. Aucun soin sur un mort, aucune résurrection.
- Attaque périodique : deux rounds à 65 % d'attaque, puis un round à 115 %. Les intentions sont exposées dans le transcript avant les actions des héros.
- Roi : deux gardes ont leurs PV propres. Tant qu'un garde vit, le Roi possède des défenses à 115 % et une attaque à 75 %. Au round suivant la mort des deux gardes : défenses à 85 %, attaque à 110 %. Aucun PV ajouté ; une victoire rapide peut sauter cette phase.
- Cour : reprend les comportements rencontrés auparavant.

Les PV et l'attaque de base sont répartis en entiers entre les membres. Défenses, résistances et profils de frappes sont appliqués individuellement. Cette répartition ne garantit pas une difficulté équivalente : armure et minimum de dégâts sont non linéaires. Les intentions et soins ajoutent des logs et participent donc à la durée simulée selon le driver existant.

## Héros, ciblage et récompenses

Chaque ennemi possède un identifiant, ses PV et ses effets. Un ennemi mort ne joue plus. La sélection automatique prend le premier vivant ; protecteurs et gardes sont placés devant.

Les compétences all_enemies de dégâts touchent toutes les cibles vivantes. Les frappes répétées d'une compétence single_enemy restent sur une cible et s'arrêtent à sa mort. Les frappes d'arme peuvent reprendre une cible vivante. Mana et cooldown sont payés une fois par activation. Les debuffs de zone couvrent le groupe ; les effets expirent une fois par round après tous les tours ennemis.

La tactique additionne les dégâts utiles d'une zone et la menace de tous les ennemis. Une zone capable de tuer plusieurs ennemis n'est plus écartée systématiquement au profit d'une attaque normale tuant une seule cible. Les autres heuristiques historiques ne constituent pas une optimisation exhaustive du combat de groupe.

Or, XP, objets et matériaux normaux sont attribués une seule fois à la rencontre entière. Les boss conservent une clé vers leur table canonique. Le profil Journey ajoute ensuite les primes personnelles, les modificateurs thématiques et le tirage signature expérimental, chacun avec un reçu distinct et sans multiplier le loot normal par le nombre de héros.

## Fidélité du scénario

Le mode --stage=undercity s'arrête sur une preuve explicite : victoire dans la dernière salle de l'étage 50. Il ne requiert pas quatre héros de niveau 40 et ne boucle pas sur les zones. Une demande de résolution après l'étage 50 échoue. Le domaine canonique peut indiquer l'étage 51 comme prochain étage débloqué dans l'état final, mais aucun combat de cet étage n'est simulé.

La courbe XP est importée du calcul canonique actuel. Ville progressive, recrutement, changement de classe, équipement, forge, repos, RNG et formules de combat restent ceux du driver et du domaine existants. Les compétences sont tirées normalement, sans sort de zone gratuit. Les choix de gestion sont ceux d'un automate de test, pas ceux d'un joueur réel.

Le temps repose sur le transcript selon le driver existant. Les résultats mesurent la progression de ce scénario, pas des heures de jeu garanties. Les résultats précédents jusqu'au niveau 40 ne sont pas directement comparables à cette nouvelle fin de donjon.

## Architecture

- scripts/helpers/undercity-experiment.mjs : catalogue, compositions et emplacement des cinq zones.
- scripts/helpers/undercity-groups.mjs : état des ennemis, ciblage, phases, soins bornés et résolution des frappes.
- scripts/helpers/undercity-group-patch.mjs : adaptations du combat et de la tactique dans le bundle esbuild, avec ancres vérifiées.
- scripts/helpers/undercity-signatures.mjs : catalogue injecté, modificateurs de zone, loot du Roi, plans, Marques et recettes expérimentales.
- scripts/run-loot-economy-harness.mjs : orchestration, critère de victoire, logs et métriques.
- scripts/analyze-undercity-idle-harness.mjs : projection des retours joueur, cadence signature et pression d'inventaire.
- scripts/analyze-bestiary-harness.mjs et scripts/audit-loot-idle-results.mjs : audits adaptés au critère de fin.

Le code du jeu n'importe aucun de ces modules. Le résultat expérimental contient une liste enemies en plus de la synthèse historique enemy. Une intégration produit devra remplacer les injections par des contrats typés du domaine partagé.

## Tests reproductibles

PowerShell depuis la racine, sans service :

~~~powershell
node scripts/test-undercity-harness.mjs
node scripts/test-undercity-groups.mjs
node scripts/test-bestiary-harness.mjs
node scripts/run-loot-economy-harness.mjs --stage=undercity --seeds=10 --workers=10 --profiles=baseline,bestiaryUndercityNames,bestiaryUndercityGroupsSingle,bestiaryUndercityGroups --town=progressive --experiment=undercity-50-v3
node scripts/analyze-bestiary-harness.mjs test-results/loot-economy/undercity/undercity-50-v3/baseline-bestiaryUndercityNames-bestiaryUndercityGroupsSingle-bestiaryUndercityGroups-city
~~~

Catalogue : 5 000 cas étage/tirage, 40 000 vérifications de round, solos/groupes par zone, cinq boss et noms UTF-8. Le résolveur compilé teste AoE, multi-frappes, changement de cible, morts, mana, cooldown, récompense unique et effets ciblés. Tests supplémentaires : soins, budget, absence de résurrection, intentions et priorité des éliminations multiples. Régression des anciens profils : 20 000 cas.

Campagne : dix seeds appariées et dix processus. Témoin canonique, noms seuls, groupes avec dégâts de zone limités à une cible, groupes avec zone active. Les debuffs restent multi-cibles dans les deux profils de groupes. Rapports : fin réelle, durée, repos, défaites, équipements, solos/duos/trios par région, soins et sorts de zone utilisés. Une absence d'AoE observée est signalée comme absence de couverture ; les fixtures ne la remplacent pas silencieusement.

## Limites et suites

- Interface : aucune validation visuelle ni intégration du rendu de plusieurs ennemis. Les intentions existent comme événements de transcript.
- Boss/loot : tables encore canoniques. Définir signatures, chances et provenance, puis vérifier leur concurrence avec la forge.
- Décisions : premier vivant ciblé ; pas de libre sélection optimale. Tester d'autres équipes et comportements de joueur avant toute affirmation générale d'équilibrage.
- Produit : intégration partagée, sauvegardes, replay/idempotence, contrats de transport et présentation nécessitent un travail distinct.
- Narration et salles non-combat : récit défini, résolutions existantes conservées ; pas de nouveaux dialogues ni événements spéciaux.

Historique : les campagnes undercity-v1 et undercity-groups-v2 validaient quatre zones et un parcours jusqu'au niveau 40. Leurs manifests décrivent leur code d'origine. Le pilote groupes avait révélé une absence de sort de zone sur sa seed ; la campagne à dix seeds en a ensuite observé 57, sur les cinq équipes ayant obtenu ces compétences.

## Résultats vérifiés — undercity-50-v3

40/40 campagnes terminées par une victoire dans la dernière salle de l'étage 50. Aucune rencontre après 50 ; les cinq boss ont été vaincus dans chaque run des profils thématiques. Les noms seuls reproduisent exactement le témoin sur les métriques fonctionnelles et l'économie finale. Audits de conservation et de temps réussis.

| Variante | Durée moyenne simulée | Repos moyen | Défaites combat moyennes | Crafts utiles moyens |
| --- | ---: | ---: | ---: | ---: |
| Témoin canonique | 4,479 h | 0,433 h | 40,5 | 62,3 |
| Noms seuls | 4,479 h | 0,433 h | 40,5 | 62,3 |
| Groupes, zone limitée à une cible | 4,864 h | 0,228 h | 22,6 | 63,0 |
| Groupes, zone active | 4,845 h | 0,234 h | 22,9 | 62,7 |

Dans le profil complet : 5 374 combats solo, 2 976 duos et 5 321 trios, soit environ 39,3 % / 21,8 % / 38,9 %. Chaque zone a présenté des solos et des groupes dans chacun des dix runs. Les 67 soins ennemis prouvent l'exécution des soutiens en campagne ; les fixtures vérifient leur remplacement du tour d'attaque et leur budget.

120 compétences ont touché plusieurs ennemis dans trois runs. Cinq runs avaient rencontré une compétence de dégâts de zone, mais deux ne l'ont pas utilisée sur plusieurs cibles ; l'accès au sort n'implique pas son choix par la tactique. Les autres compétences de zone, dont les debuffs, disposent de tests de résolveur séparés. Les phases du Roi ont été observées : 21 rounds protégés et 9 rounds monstrueux dans le profil complet.

La différence de durée appariée moyenne entre zone active et contrôle mono-cible est -0,371 %. Le repos est légèrement supérieur de 0,343 minute en moyenne ; on ne peut donc pas annoncer un gain uniforme de confort grâce à l'AoE. Le résultat varie avec les équipements, classes et décisions de progression.

Face au témoin, le profil complet réduit les défaites et le repos, mais allonge la durée simulée moyenne. Les intentions par ennemi ajoutent des événements comptés par le chronomètre du driver ; cette différence n'est pas un ralentissement de jeu validé. Le critère pertinent ici est un donjon complet, varié et automatiquement résolvable, sans blocage sur les dix seeds. Ni le plaisir ni l'équilibrage de toutes les équipes ne sont prouvés.

[Analyse détaillée](../../test-results/loot-economy/undercity/undercity-50-v3/baseline-bestiaryUndercityNames-bestiaryUndercityGroupsSingle-bestiaryUndercityGroups-city/bestiary-analysis.json) · [Manifest et version du code](../../test-results/loot-economy/undercity/undercity-50-v3/baseline-bestiaryUndercityNames-bestiaryUndercityGroupsSingle-bestiaryUndercityGroups-city/manifest.json) · [Audit final](../../test-results/loot-economy/undercity/undercity-50-v3/baseline-bestiaryUndercityNames-bestiaryUndercityGroupsSingle-bestiaryUndercityGroups-city/dungeon-50-audit.json)

## Progression personnelle et farm — application du prompt validé

Référence normative : [prompt complet](undercity-progression-prompt.md). Cette section remplace les anciennes hypothèses « progression au compte » et « arrêt définitif après le Roi » pour la variante bestiaryUndercityJourney. Les témoins conservent leur scénario d'arrêt à 50.

### Données et règles

undercity-journey.mjs sépare :
- héros : étage terminé séquentiellement, identifiants des premières victoires ;
- groupe : liste des membres, sans formations sauvegardées ni seconde expédition ;
- expédition : progression/farm, étage, salle, zone, nombre de boucles ;
- reçus : rencontres traitées et primes personnelles déjà attribuées.

Jalons tous les cinq étages terminés. Le repli et le wipe reprennent au jalon commun, ou à l'étage 1 avant le premier. La reprise après un changement de membres ne supprime aucun acquis individuel. Un membre absent de la victoire finale ne reçoit pas l'étage ; la progression du groupe ne saute pas son retard. Les héros présents au début d'un combat gagné reçoivent leur première prime, même KO à la fin.

Gardiens fixes : 5/15/25/35/45. Boss fixes : 10/20/30/40/50. Les identifiants de prime sont undercity:elite:05, undercity:boss:10, etc., indépendants des noms et des instances. Les autres élites n'ouvrent aucune nouvelle prime personnelle.

La variante personnelle remplace les anciennes primes de première sécurisation liées au plus haut étage du compte par les primes individuelles des dix rencontres fixes. Les récompenses normales de rencontre restent inchangées et attribuées une seule fois.

Le farm exige le Roi vaincu par chaque membre. Le groupe choisit une zone, la parcourt jusqu'à son boss, recommence au début, et revient également au début après un wipe. Le repos utilise le moteur existant. Les défis non combattants ratés gardent leur avancement canonique ; ils ne sont pas assimilés à un wipe.

### Paramètres économiques d'essai

Ces valeurs ne sont pas des décisions produit définitives :
- XP personnelle : 50 % du budget XP de l'ennemi pour un gardien fixe ; 100 % pour un boss fixe, par héros éligible, sans partage.
- Lot personnel : ceil(étage/10) débris métalliques pour un gardien ; même quantité de métal raffiné pour un boss.
- Les gains d'XP passent par la progression canonique, après l'XP de combat normale. Le hasard de classe/statistiques/compétences est conservé.
- Les matériaux sont ajoutés à l'inventaire réel de simulation et peuvent financer la forge.
- Le mélange équipements/matériaux est présent via le loot canonique répétable et les primes. Le profil Journey applique également les modificateurs de zone et les signatures décrits plus bas ; leurs valeurs restent expérimentales.

### Ciblage

Protecteurs/gardes prioritaires tant qu'ils protègent. Parmi les cibles accessibles : élimination estimée possible par attaque normale, sinon soutien, sinon premier vivant. La tactique de compétences évalue ensuite AoE et mana. Cette politique reste une approximation ; l'intention « groupe légèrement plus difficile sans compétence adaptée » doit encore être démontrée par l'équilibrage.

### Scénarios et validation

~~~powershell
node scripts/test-undercity-journey.mjs
node scripts/test-undercity-groups.mjs
node scripts/test-undercity-signatures.mjs
node scripts/run-loot-economy-harness.mjs --stage=undercity --seeds=10 --workers=10 --profiles=baseline,bestiaryUndercityGroups,bestiaryUndercityJourney --town=progressive --experiment=undercity-journey-v1
~~~

Le scénario personnel recrute via la ville existante, termine le donjon avec les acquis individuels, puis effectue deux boucles dans une zone choisie de façon déterministe par la seed. Les dix seeds couvrent les cinq zones. Les formations mixtes, sauvegardes, reçus, changements de groupe et repli volontaire sont aussi testés séparément.

Les tests du résolveur vérifient quatre gains d'XP et quatre lots effectifs, puis zéro lot supplémentaire lorsque les héros ne sont plus éligibles. Les tests du modèle vérifient les identifiants uniques, le reload et le replay. Ils ne remplacent pas un test d'idempotence de la vraie API ni une migration de sauvegarde du jeu.

Limites conservées : aucune interface, aucun déploiement, une seule expédition ; équilibre produit des signatures et des groupes, formations enregistrées et expéditions simultanées différés avec les critères de clôture du prompt.

### Résultats et audit final

Campagne undercity-journey-v1 : 30/30 runs terminés, dix seeds et dix processus. Les dix variantes personnelles ont chacune terminé la progression puis deux boucles de farm. Les cinq zones de farm ont été couvertes, deux seeds par zone.

- 40 premières primes par campagne personnelle : quatre héros × dix rencontres fixes, aucune clé dupliquée.
- Aucune nouvelle prime après le premier Roi ; le farm conserve ses récompenses répétables.
- 550 à 1 000 rencontres de farm selon la longueur de la zone ; 71 à 133 objets et 434 à 839 unités de matériaux récupérés pendant les deux boucles.
- Durée totale progression + farm : 6,285 à 17,516 heures simulées (moyenne 11,698 h). Elle n'est pas comparable directement aux témoins arrêtés au premier Roi.
- Repos total moyen : 0,283 h ; défaites de combat moyennes : 25,5. Les nouveaux héros recrutés en cours de parcours imposent leurs jalons personnels, ce qui fait partie du scénario.
- Conservation or/matériaux/rencontres/temps et unicité des primes : audits réussis.

Un garde-fou supplémentaire a été corrigé après les campagnes : l'auto-farm teste maintenant les acquis des membres actuels, et non un indicateur historique de première victoire. Le test du driver « vétéran + nouveau héros après farm » passe. Les campagnes ne changeaient pas de composition après leur premier Roi ; ce correctif ne change pas leur chemin exécuté. Le manifest conserve honnêtement le hash antérieur à ce correctif ; une relance exige un nouvel identifiant d'expérience.

Le prompt est appliqué aux règles fonctionnelles de progression, primes et farm. Le désavantage des groupes sans compétences adaptées reste à calibrer. Les signatures et identités de loot sont désormais implémentées dans le harness, mais leurs paramètres ne valent pas encore équilibrage produit, validation du rendu ou preuve de la vraie API.

[Rapport](../../test-results/loot-economy/undercity/undercity-journey-v1/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/bestiary-analysis.json) · [Manifest](../../test-results/loot-economy/undercity/undercity-journey-v1/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/manifest.json) · [Audit primes et farm](../../test-results/loot-economy/undercity/undercity-journey-v1/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/journey-audit.json)

## Extension signatures et récompenses personnelles

Le profil bestiaryUndercityJourney arrête désormais l'expédition sur wipe ou repli. À l'itération suivante, après la récupération existante, le bot émet une commande de reprise comptée séparément. Chaque première victoire personnelle de boss ajoute un accessoire ordinaire rare de niveau immédiatement utilisable ; une élite fixe conserve XP et matériaux sans objet.

Le loot canonique obtenu dans chaque zone reçoit un modificateur tiré de manière déterministe dans un pool thématique : Égouts — PV, défense physique, résistance au poison ou esquive ; Contrebandiers — vitesse, critique, esquive ou dégâts physiques ; Citernes — PV, défense physique, résistance à l'eau ou au poison ; Bastion — défenses physique/magique, résistance aux ténèbres ou PV ; Cour — critique, vitesse, dégâts physiques/magiques ou mana. Un seul bonus est ajouté par objet. Les bonus de dégâts incompatibles avec le type d'une arme sont retirés de son pool. Cette traduction utilise uniquement des statistiques existantes ; elle ne prétend pas implémenter une aura de commandement ou une attaque multi-cible sur l'équipement.

Le Roi donne 1–2 Marques garanties. Paramètres d'essai : trois plans indépendants, 20 % de découverte d'un plan manquant, 15 % de signature directe, recette à 6 Marques + 18 débris + 3 métaux raffinés, craft légendaire à 4 %. Les objets injectés ne sont visibles que dans le bundle du harness. Les instances portent leurs modificateurs finaux afin que le malus épique disparaisse réellement en légendaire sans modifier le résolveur produit.

Campagne undercity-signatures-v3 vérifiée : 30/30 parcours terminés, dix seeds et dix processus. Dans les dix parcours Journey : 400 primes personnelles, 200 objets personnels, 168 reprises explicites, 6 046 objets modifiés par leur zone, 15 victoires sur le Roi et 22 Marques. Les tirages ont produit quatre blueprints et trois signatures directes, dont une légendaire. La conservation de tous les matériaux, l'unicité des primes et les comptes de rencontre/temps passent l'audit.

Aucune fabrication n'apparaît naturellement dans ces dix parcours courts. Le seul run réunissant six Marques et un blueprint obtient son plan lors de la dernière victoire, au moment où les deux boucles de farm prévues se terminent. Le chemin de forge est couvert séparément par un test déterministe qui vérifie le niveau 7, les trois plans, la consommation exacte et le retrait des malus en légendaire. Ce résultat ne justifie ni pity ni changement de coût ; il montre que la fréquence de fabrication demandera une campagne de farm plus longue avant une décision d'équilibrage.

~~~powershell
node scripts/run-loot-economy-harness.mjs --stage=undercity --seeds=10 --workers=10 --profiles=baseline,bestiaryUndercityGroups,bestiaryUndercityJourney --town=progressive --experiment=undercity-signatures-v3
node scripts/analyze-bestiary-harness.mjs test-results/loot-economy/undercity/undercity-signatures-v3/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city
~~~

[Analyse](../../test-results/loot-economy/undercity/undercity-signatures-v3/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/bestiary-analysis.json) · [Audit progression et signatures](../../test-results/loot-economy/undercity/undercity-signatures-v3/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/journey-audit.json) · [Manifest](../../test-results/loot-economy/undercity/undercity-signatures-v3/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/manifest.json)

### Recalibrage de puissance et pools thématiques — campagne actuelle

La comparaison dédiée place chaque signature épique et légendaire au-dessus du 90e percentile des objets ordinaires de niveau 35 dans son rôle. Le test des thèmes vérifie plusieurs statistiques accessibles dans chacun des cinq pools, un choix déterministe, un seul bonus par objet et le rejet des dégâts physiques pour une arme magique. La campagne `undercity-theme-pools-v1` rejoue ensuite dix seeds sur dix processus pour les profils témoin, groupes et Journey : 30/30 parcours terminés, audits de conservation, rencontres et temps réussis.

Les dix parcours Journey terminent progression et farm en 6,436 à 13,734 heures actives, moyenne 10,062 heures. Ils conservent 400 primes personnelles, 200 objets personnels, 172 reprises explicites et 6 369 objets thématiques. Les trajectoires donnent un blueprint et trois signatures directes ; aucune fabrication naturelle dans cet horizon court. Ces tirages ne calibrent pas les probabilités sur dix seeds.

[Analyse de puissance](../../scripts/analyze-rat-king-signature-power.mjs) · [Analyse de campagne](../../test-results/loot-economy/undercity/undercity-theme-pools-v1/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/bestiary-analysis.json) · [Audit Journey](../../test-results/loot-economy/undercity/undercity-theme-pools-v1/baseline-bestiaryUndercityGroups-bestiaryUndercityJourney-city/journey-audit.json)

## Audit idle prolongé — Cour sur vingt boucles

Le profil bestiaryUndercityJourneyCourt20 conserve les règles de combat, progression, forge et reprise du profil Journey. Il fixe la zone de farm à la Cour et termine après vingt boucles, soit 21 victoires attendues sur le Roi après la première progression. Il sert à observer une durée idle, les signatures et l'inventaire ; il ne remplace pas le parcours court de validation fonctionnelle.

~~~powershell
node scripts/run-loot-economy-harness.mjs --stage=undercity --seeds=10 --workers=10 --profiles=baseline,bestiaryUndercityJourneyCourt20 --town=progressive --experiment=undercity-idle-court20-v1
node scripts/analyze-bestiary-harness.mjs test-results/loot-economy/undercity/undercity-idle-court20-v1/baseline-bestiaryUndercityJourneyCourt20-city
node scripts/analyze-undercity-idle-harness.mjs test-results/loot-economy/undercity/undercity-idle-court20-v1/baseline-bestiaryUndercityJourneyCourt20-city
~~~

20/20 rapports appariés terminés et audits de conservation, temps et rencontres réussis. Les parcours Journey durent 23,601 à 35,917 heures actives, moyenne 27,314 heures, pour 13 197 à 20 470 explorations. Ils subissent 5 à 50 wipes nécessitant une reprise explicite, moyenne 20,3.

La projection suppose des visites fixes et une interruption uniformément placée entre deux visites. Le délai moyen est donc la moitié de la cadence. Elle ajoute en moyenne 5,075 heures à une cadence de 30 minutes, 20,3 heures à deux heures et 81,2 heures à huit heures. La part calendaire moyenne passée à attendre la reprise atteint respectivement 14,5 %, 38,9 % et 69,8 %. Cette projection ne rejoue pas le combat pendant l'arrêt.

Le farm long couvre le cycle signature : 211 victoires sur le Roi, 317 Marques, 27 plans, 27 drops directs et 46 crafts. Chaque run fabrique quatre ou cinq signatures. Le premier craft arrive 1 010 à 8 501 explorations après la première victoire, médiane 2 884. Un run ne reçoit aucun drop direct et un run ne découvre qu'un plan sur l'horizon testé ; cela reste cohérent avec l'absence de pity, mais confirme une forte variance.

Avec la politique d'équipement et de recyclage automatiques du bot du harness, qui n'existe pas dans le jeu, l'inventaire contient au maximum 14 à 28 objets après une rencontre et finit sans surplus stocké. En moyenne, 2 022 objets sont recyclés par run, environ 61,8 % des objets de rencontre et de forge considérés. Le harness n'a pas de capacité d'inventaire finie : ce résultat prouve que l'autogestion évite l'accumulation dans ce scénario, pas qu'une limite produit ne serait jamais atteinte.

La campagne groupes appariée undercity-50-v3 reste la preuve AoE : 120 activations multi-cibles dans trois runs sur dix. Face au même profil limité à une cible, la durée moyenne varie de -0,371 % et le repos de +0,343 minute. L'AoE fonctionne et peut aider localement, mais son accès aléatoire ne produit pas un avantage global important sur cet échantillon.

Aucun farm automatique après un wipe ou un repli n'est une règle validée. Le comportement retenu reste un arrêt de l'expédition, un retour au dernier jalon commun et une reprise déclenchée manuellement par le joueur. Avant le premier jalon, la reprise repart de l'étage 1.

[Analyse idle](../../test-results/loot-economy/undercity/undercity-idle-court20-v1/baseline-bestiaryUndercityJourneyCourt20-city/idle-analysis.json) · [Analyse combats et progression](../../test-results/loot-economy/undercity/undercity-idle-court20-v1/baseline-bestiaryUndercityJourneyCourt20-city/bestiary-analysis.json) · [Audit Journey](../../test-results/loot-economy/undercity/undercity-idle-court20-v1/baseline-bestiaryUndercityJourneyCourt20-city/journey-audit.json)
