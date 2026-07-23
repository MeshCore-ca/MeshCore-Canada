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
  - assets/styles/analyzer.css?v=20260722-2
---

# Observer avec Home Assistant

Utilisez l’intégration MeshCore que vous exploitez déjà dans Home Assistant pour
publier la télémétrie des paquets auprès de MeshCore Canada.

## Cette méthode vous convient-elle?

<div class="mc-method-fit">
  <div><strong>Utilisez Home Assistant si</strong>Une intégration MeshCore fonctionnelle et une radio connectée y sont déjà configurées.</div>
  <div><strong>Choisissez autre chose si</strong>Vous installeriez Home Assistant uniquement pour observer.</div>
  <div><strong>Gardez en fonction</strong>Home Assistant, la connexion radio et l’accès Internet.</div>
</div>

## Vérifier votre écran

Les intégrations MeshCore actuelles utilisent ces champs :

| Contrôle des paquets | Contrôle de l’emplacement |
|---|---|
| **Payload Mode** = `packet` | Champ libre **Broker IATA Code** |

Si votre écran est différent, consultez
[L’écran de Home Assistant ne correspond pas au guide](../troubleshooting.md#home-assistant-screen-does-not-match-the-guide).
Mettez l’intégration à jour si elle n’accepte pas le bon code d’emplacement; ne
choisissez pas un code voisin pour contourner le problème.

## Avant de commencer

- [ ] Home Assistant et l’intégration MeshCore fonctionnent correctement.
- [ ] La radio est connectée par une liaison USB, BLE ou TCP compatible.
- [ ] La radio utilise les paramètres du réseau maillé local.
- [ ] Vous avez choisi un véritable [code d’emplacement](../iata-codes.md).
- [ ] Vous avez lu [Données des observateurs et vie privée](../data-collection-access.md).

## Ce qui sera modifié

Vous ajouterez deux entrées de courtier MQTT et activerez les paquets dans
**Payload Mode**. N’entrez ni mot de passe Wi-Fi ni mot de passe MQTT statique.

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

Réglez le champ d’emplacement de l’intégration au véritable code à trois
lettres le plus près de l’observateur.

Ajoutez l’entrée de secours avec les mêmes paramètres, en ne modifiant que :

| Champ | Valeur |
|---|---|
| Server | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Laissez les champs facultatifs du responsable vides, sauf s’ils sont
nécessaires. Enregistrez les deux entrées.

## Ce que vous devriez voir

Les deux entrées indiquent qu’elles sont connectées, et l’activité radio à
proximité fait changer le nombre de paquets. Si les courtiers se connectent,
mais qu’aucun paquet n’apparaît, le mode de paquets est peut-être désactivé ou
la radio ne capte aucune activité.

## Vérifier dans CoreScope

1. Trouvez l’observateur dans [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Attendez de l’activité MeshCore normale à proximité.
3. Confirmez la présence d’un paquet récent dans [CoreScope Packets](https://live.meshcore.ca/#/packets).

Terminez avec [Vérifier votre observateur](../verify.md). Le badge de connexion
de Home Assistant ne confirme pas que les paquets se sont rendus à CoreScope.

## Récupération

Désactivez ou supprimez seulement les deux entrées de courtier MeshCore Canada
que vous avez ajoutées. Ne modifiez pas les autres intégrations de Home
Assistant ni la connexion radio. Confirmez que l’intégration MeshCore d’origine
fonctionne toujours.

## Si la vérification échoue

Consultez le [dépannage](../troubleshooting.md). Indiquez les versions de Home
Assistant et de l’intégration MeshCore, la première étape qui a échoué et une
erreur caviardée. Examinez toute archive de diagnostics avant de la partager.
