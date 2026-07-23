---
title: Observer avec RemoteTerm
description: Transmettez à CoreScope les paquets d’une radio déjà gérée par RemoteTerm.
audience:
  - observer-operators
task: configure-remoteterm-observer
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

# Observer avec RemoteTerm

[RemoteTerm for MeshCore](https://github.com/jkingsman/Remote-Terminal-for-MeshCore)
peut transmettre les données de paquets d’une radio qu’il gère déjà. Il ne
déchiffre pas les messages privés.

## Cette méthode vous convient-elle?

<div class="mc-method-fit">
  <div><strong>Utilisez RemoteTerm si</strong>Il se connecte déjà à la radio par liaison série, TCP ou BLE.</div>
  <div><strong>Choisissez autre chose si</strong>Vous installeriez RemoteTerm uniquement pour observer.</div>
  <div><strong>Gardez en fonction</strong>L’hôte RemoteTerm, la connexion radio et l’accès Internet.</div>
</div>

RemoteTerm évolue rapidement. Si les libellés ne correspondent pas, consultez
les instructions du projet pour la version installée avant d’enregistrer les
changements.

## Avant de commencer

- [ ] RemoteTerm est installé à partir de sa source vérifiée.
- [ ] La connexion à la radio est stable.
- [ ] La radio utilise les paramètres du réseau maillé local.
- [ ] Vous avez choisi un véritable [code d’emplacement](iata-codes.md).
- [ ] Vous avez lu [Données des observateurs et vie privée](data-collection-access.md).

## Ce qui sera modifié

Vous ajouterez une entrée Community MQTT principale et une entrée de secours.
Elles transmettent les données de paquets par des connexions WebSocket chiffrées
et ne modifient pas le micrologiciel de la radio.

## Configuration

Ouvrez **Settings** → **MQTT & Automation**, ajoutez
**Community MQTT / meshcoretomqtt**, puis entrez :

| Champ | Valeur principale |
|---|---|
| Name | `MeshCore.ca 1` |
| Broker Host | `mqtt1.meshcore.ca` |
| Broker Port | `443` |
| Transport | `WebSockets` |
| Authentication | `Token` |
| WebSocket Path | `/` |
| Token Audience | `mqtt1.meshcore.ca` |
| Use TLS | Enabled |
| Verify TLS certificates | Enabled |
| Region Code | Le véritable code d’emplacement à trois lettres le plus près |
| Packet Topic Template | `meshcore/{IATA}/{PUBLIC_KEY}/packets` |

Laissez le champ facultatif de courriel du responsable vide, sauf s’il est
nécessaire à l’exploitation. Enregistrez l’entrée en la laissant activée.

Ajoutez une entrée de secours avec les mêmes valeurs, en ne modifiant que :

| Champ | Valeur de secours |
|---|---|
| Name | `MeshCore.ca 2` |
| Broker Host | `mqtt2.meshcore.ca` |
| Token Audience | `mqtt2.meshcore.ca` |

Utilisez le même code d’emplacement dans les deux entrées.

![Paramètres Community MQTT de RemoteTerm pour MeshCore Canada](../assets/mcterm.png)

!!! note "Diffusion MQTT sous Windows"
    Si les instructions actuelles de RemoteTerm exigent l’option Uvicorn `--loop none` pour la diffusion MQTT sous Windows, utilisez cette option de lancement. Confirmez-la dans les instructions correspondant à la version de RemoteTerm installée.

## Ce que vous devriez voir

Les deux entrées demeurent activées sans erreurs TLS ou de jeton répétées, et le
nombre de paquets dans RemoteTerm change lorsqu’il capte de l’activité à
proximité.

## Vérifier dans CoreScope

1. Ouvrez [CoreScope Observers](https://live.meshcore.ca/#/observers) et trouvez l’observateur RemoteTerm.
2. Produisez de l’activité normale à proximité, ou attendez qu’il y en ait.
3. Ouvrez [CoreScope Packets](https://live.meshcore.ca/#/packets) et confirmez qu’un paquet récent y apparaît.

Terminez avec [Vérifier votre observateur](verify.md). Une entrée connectée sans
paquet récent ne confirme pas que tout le parcours fonctionne.

## Récupération

Désactivez ou supprimez seulement les deux entrées Community MQTT que vous avez
ajoutées. Ne supprimez aucune autre automatisation de RemoteTerm. Confirmez que
RemoteTerm gère toujours la radio normalement.

## Si la vérification échoue

Consultez le [dépannage](troubleshooting.md). Si seule la connexion de secours
échoue, vérifiez que son hôte et l’audience de son jeton sont tous deux
`mqtt2.meshcore.ca`.
