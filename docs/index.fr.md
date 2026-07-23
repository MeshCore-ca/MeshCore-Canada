---
title: MeshCore Canada
description: Rejoignez, bâtissez, exploitez et coordonnez un réseau MeshCore local au Canada.
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
hide:
  - toc
---

# MeshCore Canada

Bienvenue! Nous améliorons activement ce site. Vous avez trouvé quelque chose
de difficile à comprendre ou de désuet?
[Signalez-le sur GitHub](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

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

| Paramètre | Valeur par défaut au Canada |
|---|---|
| Préréglage radio | **USA/Canada (Recommended)** |
| Valeurs radio détaillées | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Hachage des chemins | **3 octets** |
| Commande correspondante | `set path.hash.mode 2` |

## Trouver votre région

Recherchez une ville, un code d’aéroport ou une région.

<form class="mc-place-search" action="config/" method="get" role="search">
  <label for="mc-home-place">Ville, code d’aéroport ou région</label>
  <div>
    <input id="mc-home-place" name="place" type="search" autocomplete="address-level2" required>
    <button type="submit">Trouver ma région</button>
  </div>
</form>

Vous pouvez aussi consulter la [carte des régions](config/map.md).

Besoin d’aide dans votre région? [Parcourez les communautés](provinces/index.md),
posez votre question sur le [forum MeshCore Canada](https://forum.meshcore.ca/)
ou rejoignez [Discord](https://discord.gg/BESFVMt7yk).

## Utiliser les outils réseau

Configurez un répéteur, explorez les régions canadiennes, consultez CoreScope
ou mettez en service un observateur.

[:octicons-arrow-right-24: **Choisir un outil réseau**](tools/index.md){ .md-button }

## Améliorer MeshCore Canada

Quelque chose manque ou porte à confusion?
[Partagez une idée](submit-idea.md) ou
[mettez à jour une communauté](contributing.md).

## À propos du projet

MeshCore Canada est un projet communautaire indépendant.
[Apprenez-en plus](about.md) ou [contribuez au projet](contributing.md).
