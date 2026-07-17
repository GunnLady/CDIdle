# Audit global CDIdle

Ce document est l’index de référence des audits d’architecture et de domaine.
Il sert à préparer les tickets suivants sans perdre les écarts déjà identifiés.

## Audits référencés

| Audit | Sujet | Tickets concernés |
| --- | --- | --- |
| [game-state-v1.md](game-state-v1.md) | État canonique, reset, persistant/transitoire | CDI-007, CDI-020 |
| [api-command-contracts.md](api-command-contracts.md) | Commandes, révision, idempotence, erreurs | CDI-008, CDI-021, CDI-022 |
| [clock-rng.md](clock-rng.md) | Horloge et RNG injectables | CDI-009, CDI-037 |
| [town-domain.md](town-domain.md) | Ville, citoyens, bâtiments, districts | CDI-010, CDI-025 |
| [hero-domain.md](hero-domain.md) | XP, stats, PV, évolution des héros | CDI-011, CDI-026 |
| [hero-domain-audit.md](hero-domain-audit.md) | Invariants et écarts héros | CDI-011, CDI-026, CDI-038 |
| [inventory-domain.md](inventory-domain.md) | Stock, équipement, déséquipement | CDI-012, CDI-027 |
| [inventory-equipment-audit.md](inventory-equipment-audit.md) | Gaps inventaire, tests et intégration | CDI-012, CDI-013, CDI-027, CDI-029, CDI-037 |

## État de la fondation

Les tickets CDI-001 à CDI-012 sont terminés et validés par la CI. Les contrats
de domaine existent, mais leur intégration autoritaire reste planifiée dans les
tickets verticaux CDI-025 à CDI-030.

## Écarts transverses à surveiller

- Les hooks React utilisent encore plusieurs helpers mutables directement.
- La génération aléatoire métier n’est pas entièrement injectée.
- Les mutations serveur atomiques restent à implémenter.
- Les audits de couverture, hardening et exploitation restent planifiés dans
  CDI-034 à CDI-036.
- CDI-037 et CDI-038 sont des extensions d’analyse hors première vague P1.

## Règle de création des prochains tickets

Avant de créer un ticket, consulter cet index et l’audit spécialisé associé.
Un sujet déjà couvert par CDI-013, CDI-027, CDI-029 ou CDI-037 ne doit pas être
dupliqué ; il faut compléter le ticket existant ou le référencer.
