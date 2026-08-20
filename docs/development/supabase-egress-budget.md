# Budget egress Supabase

## Objectif

Maintenir le cycle de facturation sous 4,5 Go, soit une marge de 10 % sous la
limite gratuite de 5 Go observée dans le courriel Supabase et les captures du
20 août 2026. Le tableau de bord Supabase reste la source autoritaire : le
modèle local mesure les charges JSON applicatives, pas les octets réseau
facturés exacts.

## Réductions structurelles

- CDI-091 et CDI-092 suppriment le polling périodique. L'immigration est
  déclenchée par un changement local, la récupération des héros par une
  échéance unique, et un retour d'onglet visible lance un rattrapage.
- CDI-093 remplace les réponses PostgREST contenant l'état canonique complet
  après chaque écriture par une réponse de commit compacte. L'état déjà calculé
  dans la fonction Edge est réutilisé.
- CDI-094 regroupe exploration et résolution automatiques dans une seule
  commande autoritaire, une transaction et une réponse Edge. La boucle est
  suspendue lorsque l'onglet est masqué et reprend au retour visible.
- CDI-095 fournit une mesure reproductible et un seuil de régression.

## Baseline observée

Les captures Supabase fournies par l'utilisateur le 20 août 2026 montrent
8,03 Go sur 5 Go, 127 187 invocations Edge sur 500 000 et 10 MAU. Le détail
du 4 août montre 544,027 Mo PostgREST (64,9 %), 243,321 Mo Functions
(29,0 %) et 50,882 Mo Auth (6,1 %). Ce sont des preuves utilisateur ; elles
ne constituent pas encore une mesure après déploiement.

Sur la fenêtre graphique du 28 juillet au 20 août, 127 187 invocations
représentent environ 5 300 appels par jour. Si Auth reste stable et si les
commits compacts divisent la composante PostgREST nominale par deux, atteindre
4,5 Go exige que les appels variables tombent sous 81,3 % de la baseline, soit
au moins 18,7 % de réduction. Le seuil équivalent est environ 103 400
invocations sur la même période, ou 4 310 par jour. Cette projection est une
inférence documentée ; le tableau de bord après déploiement doit la confirmer.

## Mesure locale

Exécuter depuis PowerShell, à la racine du dépôt :

    npm.cmd run test:egress-budget

Le harness mesure trois profils canoniques : petit (un héros, cinq objets,
aucun historique), médian (quatre héros, cinquante objets, huit historiques)
et haut (quatre héros, cent objets, quinze historiques). La projection d'usage
représentatif utilise le profil médian ; le profil haut reste un garde-fou de
croissance et n'est pas écarté du contrôle. Le harness vérifie :

- des plages distinctes de 2 à 10 Ko, 30 à 50 Ko et 60 à 80 Ko ;
- une réponse de commit PostgREST inférieure à 200 octets et à 1 % de
  l'ancienne réponse ;
- une projection de 31 jours avec 10 % de marge sous 4,5 Go ;
- au moins 1 350 commandes par jour dans le budget retenu ;
- le dépassement du budget avec l'ancien heartbeat et les deux commandes par
  rencontre automatique.

Au 20 août 2026, les valeurs exactes du harness sont 2 371, 37 072 et
67 184 octets pour les profils petit, médian et haut. Le commit compact mesure
83 octets. Le scénario médian projette 3,486 Go sur 31 jours, marge de
1,014 Go sous la cible opérationnelle et de 1,514 Go sous le quota. Le profil
haut au même trafic ne respecte pas la cible ; sa croissance non bornée est
tracée par CDI-096 et le seuil de 80 Ko reste bloquant.

Le calcul additionne, par route, PostgREST, Functions et Auth :

    octets_cycle = octets_jour * jours_cycle * facteur_securite

Le scénario actif représente une charge alpha agrégée de 20 bootstraps
planifiés, 100 commandes manuelles et 1 250 rencontres automatiques par jour.
À une seconde d'attente minimale par rencontre, ces 1 250 rencontres
correspondent à environ 21 minutes d'auto-exploration active. Le scénario
masqué autorise zéro rencontre automatique et zéro polling temporel ; une
réconciliation unique est lancée au retour visible.

Les réponses JSON de la fonction Edge exposent aussi x-response-bytes. Cet
en-tête contient uniquement la taille UTF-8 du corps JSON sérialisé, jamais son
contenu. Il sert à agréger les tailles par route dans les outils de diagnostic
du navigateur ou dans des tests ; il ne doit contenir aucun jeton ni donnée
sensible.

## Contrôle après déploiement

Pendant sept jours complets après publication :

1. relever chaque jour PostgREST Egress, Functions Egress et Auth Egress dans
   le tableau de bord Supabase ;
2. comparer les deltas quotidiens à la projection locale et consigner le volume
   de commandes ;
3. alerter si la projection du cycle dépasse 4,5 Go, si Auth représente plus de
   10 % du total, si les invocations dépassent 4 310 par jour sur une moyenne
   de sept jours, ou si un snapshot représentatif dépasse 80 Ko ;
4. si un seuil est franchi, identifier la route avec x-response-bytes, réduire
   sa fréquence ou sa charge, puis rejouer le harness avant publication.

La validation distante de sept jours est distincte de la preuve locale et ne
peut être déclarée acquise avant d'avoir observé les métriques Supabase.

## Ordre de publication

La migration ajoutant commit_idle_transition_v2 et
commit_game_transition_v2 doit être appliquée avant le déploiement de la
fonction game-api qui les appelle. Les anciennes fonctions sont conservées
pendant la transition pour les instances déjà en vol.
