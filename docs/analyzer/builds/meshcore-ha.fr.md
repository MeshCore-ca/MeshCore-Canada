---
title: Observer avec Home Assistant
description: Transmettez à CoreScope les paquets d’une intégration MeshCore déjà configurée dans Home Assistant.
audience:
  - observer-operators
  - home-assistant-users
task: configure-home-assistant-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: intermediate
estimated_time: 15 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Observer avec Home Assistant

Utilisez l’intégration MeshCore déjà configurée dans Home Assistant pour envoyer
la télémétrie des paquets à MeshCore Canada.

## Vérifier votre écran

Les intégrations MeshCore actuelles utilisent ces champs :

| Contrôle des paquets | Contrôle de l’emplacement |
|---|---|
| **Payload Mode** = `packet` | Champ libre **Broker IATA Code** |

Si votre écran est différent, consultez
[L’écran de Home Assistant ne correspond pas au guide](../troubleshooting.md#home-assistant-screen-does-not-match-the-guide).
Mettez l’intégration à jour si elle n’accepte pas le bon code d’emplacement; ne
choisissez pas un code voisin pour contourner le problème.

## Ce qu’il vous faut

- Home Assistant et l’intégration MeshCore fonctionnent correctement.
- La radio est connectée par une liaison USB, BLE ou TCP compatible.
- La radio utilise les paramètres du réseau maillé local.
- Vous avez choisi un véritable [code d’emplacement](../../config/map.md).
- Vous avez lu [Données des observateurs et vie privée](../data-collection-access.md).

## Configuration

Ouvrez :

**Settings** → **Devices & Services** → **MeshCore** → **Configure** → **Manage MQTT Brokers**

Ajoutez l’entrée principale :

| Champ | Valeur |
|---|---|
| Server | `mqtt1.meshcore.ca` |
| Port | `443` |
| Transport | `websockets` |
| Use TLS | Enabled |
| TLS Verify | Enabled |
| Username / Password | Leave blank |
| Use MeshCore Auth Token | Enabled |
| Token Audience | `mqtt1.meshcore.ca` |
| Payload Mode | `packet` |
| Status Topic | `meshcore/{IATA}/{PUBLIC_KEY}/status` |
| Packets Topic | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

Réglez le champ d’emplacement de l’intégration sur le code en majuscules de la page
[Trouver votre zone](../../config/map.md).

Ajoutez l’entrée de secours avec les mêmes paramètres, en ne modifiant que :

| Champ | Valeur |
|---|---|
| Server | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Laissez les champs facultatifs du responsable vides, sauf s’ils sont
nécessaires. Enregistrez les deux entrées.

## Vérifier { #check-in-corescope }

Votre observateur devrait apparaître en quelques minutes dans la [liste des observateurs](https://live.meshcore.ca/?tab=Observers), avec des paquets récents dans les [Live packets](https://live.meshcore.ca/). Être connecté ne prouve pas que les paquets sont arrivés : terminez avec [Vérifier votre observateur](../verify.md). Il n’apparaît pas? Consultez le [dépannage](../troubleshooting.md).

## Récupération

Désactivez ou supprimez seulement les deux entrées de courtier MeshCore Canada
que vous avez ajoutées. Ne modifiez pas les autres intégrations de Home
Assistant ni la connexion radio. Confirmez que l’intégration MeshCore d’origine
fonctionne toujours.

