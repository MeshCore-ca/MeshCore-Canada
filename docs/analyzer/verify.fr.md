---
title: Vérifier votre observateur
description: Vérifiez que la radio capte le trafic, que l’observateur le transmet et que CoreScope le reçoit.
audience:
  - observer-operators
task: verify-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 10 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Vérifier votre observateur

Une connexion au courtier confirme seulement l’accès Internet. Votre
observateur fonctionne lorsqu’un véritable paquet radio se rend jusqu’à
CoreScope.

## Suivre un paquet en quatre étapes

<ol class="mc-steps">
  <li>
    <strong>Radio :</strong> confirmez que l’appareil utilise les paramètres du réseau local et qu’il capte l’activité à proximité.
    <br>Un compteur de paquets, un journal ou une application connectée devrait changer lorsqu’un nœud à proximité transmet.
  </li>
  <li>
    <strong>Observateur :</strong> vérifiez l’état du service, de l’intégration ou de l’appareil utilisé par votre méthode.
    <br>Il devrait indiquer une connexion chiffrée à au moins un point de terminaison principal, sans erreurs d’authentification répétées.
  </li>
  <li>
    <strong>Vue des observateurs :</strong> ouvrez <a href="https://live.meshcore.ca/#/observers">CoreScope Observers</a>.
    <br>Le nom de l’observateur et son code d’emplacement à trois lettres devraient apparaître avec une heure récente.
  </li>
  <li>
    <strong>Vue des paquets :</strong> produisez de l’activité MeshCore à proximité, puis ouvrez <a href="https://live.meshcore.ca/#/packets">CoreScope Packets</a>.
    <br>Un paquet récent attribué à l’observateur devrait apparaître en quelques minutes.
  </li>
</ol>

Ne produisez pas de trafic inutile sur un réseau maillé occupé. Une annonce
normale ou l’activité déjà présente à proximité suffit.

## Vérifier les détails

| Vérification | Ce que vous devriez voir |
|---|---|
| Nom | Un nom de service clair comme `YOW-Repeater-01`, sans adresse résidentielle |
| Emplacement | Le véritable code d’aéroport à trois lettres le plus près, et non `CAN`, `XXX` ou `HOME` |
| Parcours principal | Connexion à `mqtt1.meshcore.ca` avec validation du certificat TLS |
| Parcours de secours | Connexion à `mqtt2.meshcore.ca` si la méthode accepte deux entrées |
| Mode de paquets | Publication des paquets activée, et non seulement celle de l’état |
| Heure du paquet | Un paquet récent apparaît après que la radio a capté de l’activité à proximité |
| Radio | Les paramètres locaux sont utilisés; les paramètres par défaut du Canada s’appliquent seulement en l’absence d’une configuration locale |

## Conserver une note d’entretien

Conservez une courte note d’entretien privée. Gardez les libellés du modèle
ci-dessous pour faciliter le soutien :

```text
Observer:
Method and version:
Location code:
Checked at (include time zone):
Radio heard a packet: yes / no
Primary connected: yes / no
Backup connected: yes / no / not supported
Observer visible: yes / no
Packet visible: yes / no
```

N’y inscrivez pas d’identifiants, de clés privées, de noms de réseaux Wi-Fi ou
de mots de passe Wi-Fi.

## Commencer par le premier échec

Consultez le guide qui correspond au premier élément qui a échoué :

| Premier échec | Point de départ |
|---|---|
| La radio ne capte aucune activité | [L’observateur apparaît, mais aucun paquet n’arrive](troubleshooting.md#observer-appears-but-no-packets-arrive) |
| L’observateur ne peut pas se connecter | [L’observateur n’apparaît jamais](troubleshooting.md#observer-never-appears) |
| L’observateur est visible, mais la vue des paquets reste vide | [L’observateur apparaît, mais aucun paquet n’arrive](troubleshooting.md#observer-appears-but-no-packets-arrive) |
| Seule la connexion de secours échoue | [Seule la connexion de secours échoue](troubleshooting.md#only-the-backup-connection-fails) |
| Le lieu ou le nom est incorrect | [L’observateur apparaît au mauvais endroit](troubleshooting.md#observer-appears-in-the-wrong-place) |

Pour obtenir des commandes sûres et un modèle de demande d’aide caviardée,
consultez le [dépannage](troubleshooting.md).
