# Domaine forge et recyclage

`src/domain/forge.ts` formalise les coûts et refus atomiques de la forge. La
forge verrouillée, un plan verrouillé ou des matériaux insuffisants ne modifient
jamais le stock source.

La génération aléatoire de la qualité et la finalisation de l’objet restent à
raccorder au RNG injectable et à intégrer côté serveur dans CDI-028.
