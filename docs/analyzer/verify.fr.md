---
title: Vérifier votre observateur
description: Vérifiez que la radio capte le trafic, que l’observateur le transmet et que Beacon le reçoit.
audience:
  - observer-operators
task: verify-observer
scope: canada-baseline
status: draft
status_notice: false
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 10 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Vérifier votre observateur

Après avoir configuré votre observateur (un [répéteur observateur](../config/index.md?type=observer),
[MCtoMQTT](builds/mctomqtt.md), [PyMC](builds/pymc.md),
[Home Assistant](builds/meshcore-ha.md) ou [RemoteTerm](remoteterm.md)),
utilisez ces liens pour confirmer qu’il est en ligne et qu’il transmet.

<div class="grid cards" markdown>

-   :material-eye:{ .lg .middle } **Observateurs**

    ---

    Voyez tous les observateurs connectés et leur état.

    [:octicons-arrow-right-24: Voir les observateurs](https://live.meshcore.ca/?tab=Observers)

-   :material-swap-horizontal:{ .lg .middle } **Paquets**

    ---

    Suivez en direct les paquets transmis par les observateurs.

    [:octicons-arrow-right-24: Voir les paquets](https://live.meshcore.ca/)

-   :material-map-marker:{ .lg .middle } **Carte**

    ---

    Voyez les observateurs et les nœuds sur la carte.

    [:octicons-arrow-right-24: Voir la carte](https://live.meshcore.ca/?tab=Map)

-   :material-wrench:{ .lg .middle } **Dépannage**

    ---

    Il n’apparaît pas? Des solutions pour chaque type d’observateur.

    [:octicons-arrow-right-24: Dépannage](troubleshooting.md)

</div>

Votre observateur devrait apparaître quelques minutes après sa mise en ligne.
Être connecté ne veut pas dire que les paquets ont atteint Beacon : il
fonctionne dès qu’un paquet récent de votre observateur apparaît.

## Liste de vérification

| Vérification | Ce que vous devriez voir |
|---|---|
| Nom de l’observateur | Un nom clair comme `YOW-Repeater-01` |
| Région | Le code en majuscules indiqué par [Trouver votre zone](../config/map.md), pas `CAN`, `XXX` ni `HOME` |
| Serveurs | Serveur principal et de secours configurés, si la méthode prend les deux en charge |
| Paquets | Des paquets récents dans Beacon après de l’activité à proximité |
| Radio | Le préréglage **Canada** avec des parcours de 3 octets, sauf si la page de votre communauté indique autre chose |

## Premières vérifications

S’il n’apparaît pas, commencez par la première chose qui a échoué :

| Ce que vous voyez | Première vérification |
|---|---|
| Aucune entrée d’observateur | MQTT est connecté et le code de région est un vrai code de [Trouver votre zone](../config/map.md) |
| L’observateur apparaît, mais aucun paquet | La publication des paquets est activée : `mqtt.packets` sur le répéteur observateur, **Payload Mode** = `packet` dans Home Assistant, ou `format: letsmesh` dans PyMC |
| Le serveur de secours ne se connecte pas | L’audience du jeton correspond à l’hôte du serveur (`mqtt2.meshcore.ca` pour le serveur 2) |
| L’observateur apparaît dans la mauvaise ville | Chaque entrée de serveur utilise le même code de région; n’utilisez pas `CAN` pour le Canada |

Pour les commandes propres à chaque méthode et les réglages de Home Assistant, consultez le [dépannage](troubleshooting.md).
