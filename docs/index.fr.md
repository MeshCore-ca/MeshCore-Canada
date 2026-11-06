---
title: MeshCore Canada
description: Découvrez MeshCore et rejoignez un réseau local au Canada.
audience:
  - newcomer
  - meshcore-operator
task: choose-a-goal
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2027-07-19
tested_with:
  content_baseline: origin-main-cbbe9c0-pr66
difficulty: beginner
estimated_time: 1-2 minutes
destructive: false
page_styles:
  - assets/styles/home.css?v=20261105-1
hide:
  - toc
---

# MeshCore Canada

<div class="mc-home-hero" markdown>

<div class="mc-home-hero__art" aria-hidden="true"><img src="../assets/canada-network-motif.svg" alt="" width="960" height="420" fetchpriority="high"></div>

**Un projet communautaire pour les déploiements MeshCore au Canada.** Nous
sommes des bénévoles, sans affiliation avec le projet MeshCore officiel. Ce site
explique comment MeshCore est déployé au Canada : communautés locales, matériel
recommandé, paramètres radio et configuration des répéteurs.

[Rejoindre le Discord MeshCore Canada](https://discord.gg/GBCP4xdgNv){ .md-button .md-button--primary } [Forum](https://forum.meshcore.ca/){ .md-button }

<p class="mc-home-hero__credit">Réseau illustratif · <a href="../assets/regions/NOTICE.txt">Sources cartographiques</a></p>

</div>

## Où voulez-vous aller? { #where-to-go }

<div class="grid cards" markdown>

-   :material-rocket-launch:{ .lg .middle } **Commencer**

    Nouveau? Choisissez un appareil et rejoignez le réseau.

    [:octicons-arrow-right-24: Commencer la configuration](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Trouver une communauté**

    Groupes locaux, contacts et paramètres près de chez vous.

    [:octicons-arrow-right-24: Parcourir les communautés](provinces/index.md)

-   :material-map-search:{ .lg .middle } **Trouver votre zone**

    Voyez quelle zone couvre votre emplacement.

    [:octicons-arrow-right-24: Trouver ma zone](config/map.md)

-   :material-radio-tower:{ .lg .middle } **Configurer un répéteur**

    Générez les commandes de configuration de votre répéteur.

    [:octicons-arrow-right-24: Ouvrir l’outil des répéteurs](config/index.md)

-   :material-chip:{ .lg .middle } **Matériel**

    Quelles radios et antennes acheter ou monter.

    [:octicons-arrow-right-24: Choisir du matériel](hardware/index.md)

-   :material-access-point-network:{ .lg .middle } **Réseau en direct**

    Voyez qui est sur le réseau en ce moment.

    [:octicons-arrow-right-24: Ouvrir live.meshcore.ca](https://live.meshcore.ca/)

</div>

## Paramètres radio par défaut au Canada { #canada-baseline }

Utilisez ces paramètres, sauf si votre communauté en indique d’autres.

<div class="mc-baseline-table" markdown>

| Paramètre | Valeur par défaut au Canada |
|---|---|
| Préréglage radio | **Canada** |
| Valeurs radio détaillées | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Hachage des chemins | **3 octets** |
| Commande correspondante | `set path.hash.mode 2` |

</div>

<p class="mc-preset-note">Pas de préréglage Canada dans votre application? <a href="provinces/#canada-baseline">Détails et anciennes applications</a>.</p>
