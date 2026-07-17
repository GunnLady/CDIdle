# Audit inventaire et équipement

Ce document recense les écarts observés autour de CDI-012 et sert de base de
travail pour créer les prochains tickets sans dupliquer les sujets existants.

## Déjà couvert par un ticket

| Sujet | Ticket | État |
| --- | --- | --- |
| Contrats purs de stock, équipement et déséquipement | CDI-012 | Done |
| Forge et recyclage | CDI-013 | Later |
| Migration globale vers `Clock`/`Rng` | CDI-037 | Later |
| Intégration autoritaire inventaire/équipement | CDI-027 | Later |
| Usage inventaire dans le donjon et le combat | CDI-029 | Later |

## Écarts ou détails non encore suivis explicitement

### Matrice de tests équipement

- slot déjà occupé ;
- arme à deux mains qui libère automatiquement la main secondaire ;
- main secondaire bloquée par une arme à deux mains ;
- déséquipement et retour exact au stock ;
- conservation et comparaison des modificateurs ;
- objet ou héros introuvable ;
- retrait supérieur à la quantité disponible.

### Compatibilité et intégrité

- vérifier qu’un identifiant d’objet inconnu ne peut pas être ajouté au stock ;
- vérifier que les stacks identiques fusionnent sans perdre leurs modificateurs ;
- garantir qu’une mutation refusée ne modifie ni le héros ni le stock ;
- documenter les slots autorisés par type d’objet.

### Intégration restante

- le hook React appelle encore directement les helpers mutables ;
- la déduction du stock et la mise à jour du héros ne sont pas encore une
  commande serveur atomique ;
- la génération d’objets aléatoires doit être raccordée au RNG injectable ;
- la forge et le recyclage doivent préserver les mêmes invariants.

## Décision à prendre pour les prochains tickets

Avant de créer un ticket, vérifier s’il relève de CDI-013, CDI-027, CDI-029 ou
CDI-037. Les seuls sujets réellement non attribués ici sont la matrice de tests
équipement et l’audit d’intégrité des identifiants/stacks ; ils pourront former
un ticket additionnel P2 si leur priorité le justifie.
