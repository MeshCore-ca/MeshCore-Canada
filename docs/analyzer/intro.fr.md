---
title: Configurer un observateur de réseau
description: Choisissez la méthode d’observation qui convient à votre installation actuelle, puis vérifiez-la dans CoreScope.
audience:
  - observer-operators
task: choose-observer-method
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 5 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-method-chooser.js?v=20260722-2
---

# Configurer un observateur de réseau

Un observateur transmet à CoreScope les données des paquets MeshCore captés à
proximité. Il ne déchiffre pas les messages privés et n’a pas besoin de relayer
le trafic.

## Comment les éléments communiquent

<ol class="mc-analyzer-flow">
  <li><strong>Radio</strong><span>capte les paquets MeshCore à proximité</span></li>
  <li><strong>Observateur</strong><span>transmet les données des paquets</span></li>
  <li><strong>MeshCore Canada</strong><span>les reçoit par deux points de terminaison communs</span></li>
  <li><strong>Outils en direct</strong><span>CoreScope affiche les observateurs et les paquets</span></li>
</ol>

Les points de terminaison communs utilisent MQTT, mais vous n’avez pas besoin
d’apprendre MQTT avant de choisir une méthode.

!!! warning "Les observateurs partagent ce qu’ils captent"
    Les renseignements sur l’observateur et les données des paquets captés peuvent apparaître dans CoreScope. Ne transmettez pas de renseignements sensibles. Lisez [Données des observateurs et vie privée](data-collection-access.md) avant d’en activer un.

## Choisir votre méthode

Commencez par l’outil qui gère déjà votre radio.

<div class="mc-method-chooser" id="observer-method-chooser">
  <label for="observer-method">
    <strong>Quel élément fait déjà partie de votre installation?</strong>
    <select id="observer-method">
      <option value="">Choisissez une option</option>
      <option value="remote-term">RemoteTerm gère la radio</option>
      <option value="home-assistant">Home Assistant utilise l’intégration MeshCore</option>
      <option value="pymc">Un service de répéteur PyMC est déjà en fonction</option>
      <option value="usb-host">Un ordinateur Linux ou macOS reste près d’une radio USB</option>
      <option value="wifi-board">Une carte LoRa Wi-Fi compatible peut servir uniquement d’observateur</option>
    </select>
  </label>
  <div class="mc-method-result" id="observer-method-result" role="status" tabindex="-1" hidden></div>
</div>

Les mêmes choix figurent dans ce tableau :

| Votre installation actuelle | Méthode recommandée | Hôte qui doit rester en fonction |
|---|---|---|
| RemoteTerm gère déjà la radio | [RemoteTerm](remoteterm.md) | L’hôte RemoteTerm |
| Home Assistant utilise déjà MeshCore | [Home Assistant](builds/meshcore-ha.md) | Home Assistant |
| PyMC gère déjà un répéteur | [PyMC](builds/pymc.md) | L’hôte PyMC |
| Un hôte Linux ou macOS est relié par USB | [MCtoMQTT](builds/mctomqtt.md) | L’hôte USB |
| Une carte LoRa Wi-Fi compatible peut y être consacrée | [Micrologiciel MQTT autonome](builds/mqtt-firmware.md) | Aucun hôte distinct |

Si aucune méthode ne convient, demandez conseil sur le
[forum de MeshCore Canada](https://forum.meshcore.ca/) avant d’installer un
nouvel outil.

## Ce qu’il faut pour chaque méthode

Quelle que soit la méthode choisie, il vous faut :

- une radio déjà configurée pour le réseau maillé local;
- un véritable [code d’emplacement](iata-codes.md) à trois lettres;
- les points de terminaison principal et de secours de MeshCore Canada;
- des connexions chiffrées avec validation des certificats;
- la publication des paquets, et non seulement de l’état;
- un hôte ou une carte qui reste en fonction.

La configuration canadienne de départ est **USA/Canada (Recommended)**,
`910.525 MHz / 62.5 kHz / SF7 / CR5`, avec le hachage des chemins sur
3 octets. Une configuration locale publiée a priorité.

Pour connaître les champs exacts du courtier, consultez la
[référence des points de terminaison](broker-reference.md).

## Terminer la vérification

L’installation n’est pas terminée dès qu’un écran indique « connected ». Elle
l’est lorsque :

1. votre observateur apparaît dans [CoreScope Observers](https://live.meshcore.ca/#/observers);
2. un paquet capté par votre radio apparaît dans [CoreScope Packets](https://live.meshcore.ca/#/packets).

Terminez avec [Vérifier votre observateur](verify.md). En cas de problème,
consultez le [dépannage](troubleshooting.md).
