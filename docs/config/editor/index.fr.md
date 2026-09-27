---
title: Modifier une région MeshMapper
description: Demandez une modification de zone IATA dans MeshMapper ou téléchargez les brouillons de l’ancien éditeur.
audience:
  - region-maintainer
task: update-meshmapper-region
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2027-03-24
evidence: tests/editor/legacy-draft-export.test.mjs
page_modules:
  - assets/regions/modules/legacy-draft-export.js?v=20260924-1
---

# Les régions se modifient maintenant dans MeshMapper

La carte et le configurateur de MeshCore Canada utilisent les mêmes zones IATA
que MeshMapper. Demandez les nouvelles zones et les changements de limites dans
MeshMapper pour garder les deux outils cohérents. L’ancien éditeur fondé sur les
secteurs de recensement est retiré.

Pour les [régions initiales de MeshCore Canada](../standard.md#starter-regions),
[envoyez une proposition communautaire](../../submit-idea.md). Ces ajouts sont
identifiés séparément et ne modifient pas les zones publiées par MeshMapper.

[Ouvrir MeshMapper](https://meshmapper.net/){ .md-button .md-button--primary }
[Trouver votre zone IATA](../map.md){ .md-button }

## Brouillons enregistrés

Vous pouvez télécharger les brouillons de l’ancien éditeur conservés dans ce
navigateur. Rien n’est envoyé ni supprimé. Ces fichiers servent de référence;
ils ne constituent pas des limites approuvées dans MeshMapper.

<button type="button" class="md-button" data-legacy-draft-export>Télécharger les brouillons</button>
<p data-legacy-draft-status role="status" aria-live="polite"></p>

## Fiches des communautés

Pour modifier les coordonnées ou la description d’une communauté,
[envoyez une mise à jour](../../submit-idea.md). Ce formulaire reste indépendant
des limites régionales.

[Consulter le guide des portées IATA](../standard.md).
