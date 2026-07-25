# Convergence des Novices — CDI-038

| Niveau | Score minimal | Écart minimal |
| --- | ---: | ---: |
| 10 | 55 | 6 |
| 11 | 45 | 4 |
| 12 | 30 | 2 |
| 13+ | 0 | 0 |

Au niveau 13, la meilleure classe admissible est choisie même si le score est
faible ou si les scores sont proches. Sans classe admissible, le Novice reste
en attente. Le tri existant conserve l’ordre déterministe des classes en cas
d’égalité.

## Compétences lors de la vocation

Une vocation acceptée consomme les rolls de compétences après les rolls de
croissance du niveau :

- classe T1 ordinaire : actif, puis passif, soit deux rolls ;
- Mage : deux actifs élémentaires distincts sans remise, puis un passif, soit
  trois rolls ;
- Acolyte : `minor_heal` sans roll, puis un autre actif et un passif, soit deux
  rolls.

Le passif obtenu comme Novice est conservé. L’actif Novice est remplacé et les
cooldowns antérieurs sont effacés.
