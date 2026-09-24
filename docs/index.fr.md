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
  - assets/styles/home.css?v=20260905-1
hide:
  - toc
---

# MeshCore Canada

<div class="mc-home-hero" markdown>

<div class="mc-home-hero__art" aria-hidden="true"><img src="../assets/canada-network-motif.svg" alt="" width="960" height="420" fetchpriority="high"></div>

Bienvenue! Nous améliorons activement ce site. Vous avez trouvé quelque chose
de difficile à comprendre ou de désuet?
[Signalez-le sur GitHub](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

<p class="mc-home-hero__credit">Réseau illustratif · <a href="../assets/regions/NOTICE.txt">Sources cartographiques</a></p>

</div>

## Que cherchez-vous? { #start-with-your-goal }

<div class="grid cards" markdown>

-   :material-message-text:{ .lg .middle } **Vous découvrez MeshCore?**

    ---

    Configurez votre radio LoRa et rejoignez un réseau MeshCore au Canada.

    [:octicons-arrow-right-24: Commencer la configuration guidée](start/index.md)

-   :material-map-marker-radius:{ .lg .middle } **Trouver des gens près de chez vous**

    ---

    Trouvez des communautés, des contacts et les paramètres radio de votre région.

    [:octicons-arrow-right-24: Trouver une communauté](provinces/index.md)

-   :material-map-search:{ .lg .middle } **Trouver votre région MeshCore**

    ---

    Voyez quelle région MeshCore canadienne couvre votre emplacement.

    [:octicons-arrow-right-24: Trouver ma région](config/map.md)

</div>

## Quel type d’appareil configurez-vous? { #choose-a-role }

<div class="grid cards" markdown>

-   :material-cellphone-link:{ .lg .middle } **Appareil compagnon**

    Envoyez et recevez des messages.

    [:octicons-arrow-right-24: Configurer un compagnon](start/companion.md)

-   :material-radio-tower:{ .lg .middle } **Répéteur**

    Améliorez la couverture locale.

    [:octicons-arrow-right-24: Configurer un répéteur](start/repeater.md)

-   :material-forum:{ .lg .middle } **Serveur de salon**

    Gardez un salon partagé accessible.

    [:octicons-arrow-right-24: Configurer un serveur de salon](start/room-server.md)

-   :material-chart-timeline-variant:{ .lg .middle } **Observateur**

    Transmettez des données du réseau à CoreScope.

    [:octicons-arrow-right-24: Configurer un observateur](start/observer.md){ .mc-observer-link }

</div>

Vous hésitez? [Comparez les types d’appareils](start/choose-a-goal.md).

Besoin de parler à quelqu’un? Rejoignez le
[Discord national](https://discord.gg/BESFVMt7yk), posez votre question sur le
[forum communautaire](https://forum.meshcore.ca/) ou consultez le
[réseau canadien en direct](https://live.meshcore.ca/).

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

<p class="mc-preset-note">Le préréglage <strong>Canada</strong> de l’application conserve les paramètres radio de l’ancien USA/Canada et choisit des parcours de <strong>3 octets</strong>. Le préréglage distinct <strong>USA</strong> ne modifie pas la taille du hachage. <a href="provinces/#canada-baseline">Détails et anciennes applications</a> · <a href="https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579">Annonce du changement</a>.</p>

## Améliorer MeshCore Canada

Quelque chose manque ou porte à confusion?
[Partagez une idée](submit-idea.md) ou
[mettez à jour une communauté](contributing.md).

## À propos du projet

MeshCore Canada est un projet communautaire indépendant.
[Apprenez-en plus](about.md) ou [contribuez au projet](contributing.md).
