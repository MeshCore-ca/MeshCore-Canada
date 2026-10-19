---
title: Paramètres de connexion des observateurs
description: Trouvez l’adresse du courtier et les paramètres de sécurité, de sujet et de paquets des observateurs de MeshCore Canada.
audience:
  - observer-operators
  - service-operators
task: reference-observer-endpoints
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-09-02
review_by: 2026-12-01
difficulty: advanced
estimated_time: 8 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Paramètres de connexion des observateurs

Consultez cette page après avoir [choisi une méthode d’observation](intro.md).
Utilisez ensuite le guide de cette méthode; ne copiez pas ces valeurs sans leur
contexte.

## Paramètres du courtier

Ces valeurs proviennent de la [configuration commune des observateurs](observer-config.json).

<div class="mc-generated-reference" id="broker-reference" data-source="../observer-config.json">
  <div class="mc-location-table-wrap">
    <table>
      <thead>
        <tr>
          <th scope="col">Utilisation</th>
          <th scope="col">Hôte</th>
          <th scope="col">Port</th>
          <th scope="col">Transport</th>
          <th scope="col">TLS</th>
          <th scope="col">Audience du jeton</th>
        </tr>
      </thead>
      <tbody id="broker-reference-body"></tbody>
    </table>
  </div>
</div>

## Accès en lecture seule

La [liste des comptes MQTT en lecture seule](data-collection-access.md#read-only-mqtt-accounts) indique les abonnés autorisés, dont QuinteMesh. Pour demander un accès, contactez un administrateur ci-dessous.

Les réglages JWT de cette page concernent les **observateurs qui publient des paquets**. Les abonnés en lecture seule utilisent les identifiants et les instructions fournis par un administrateur. N’utilisez pas la clé privée d’un observateur pour cet accès.

## Administrateurs des courtiers

Communiquez avec un administrateur pour demander un accès en lecture seule ou signaler un problème de compte. N’envoyez jamais de mot de passe ni de jeton.

| Administrateur | Contact |
|---|---|
| n30nex | [GitHub : @n30nex](https://github.com/n30nex) |
| Mr. Alderson | [GitHub : @MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [GitHub : @446564](https://github.com/446564) |
| Kranic | [Forum MeshCore : @djkranic](https://forum.meshcore.ca/u/djkranic) |

## Modèles de sujets

```text
meshcore/{IATA}/{PUBLIC_KEY}/packets
meshcore/{IATA}/{PUBLIC_KEY}/status
```

`{IATA}` est le véritable code d’emplacement à trois lettres de l’observateur.
`{PUBLIC_KEY}` est fourni par la radio ou l’intégration. Ne le remplacez jamais
par une clé privée.

## Authentification et transport

- Utilisez WebSockets sur le port `443`.
- Exigez TLS et validez les certificats.
- Utilisez l’option de jeton JWT de MeshCore lorsqu’elle est offerte.
- Faites correspondre l’audience de chaque jeton à l’adresse de son serveur.
- Ne mettez jamais un jeton ou un mot de passe dans une URL, une capture d’écran,
  un billet ou un ensemble de diagnostics.

## Mode de paquets selon la méthode

| Méthode | Paramètre de paquets requis |
|---|---|
| Micrologiciel MQTT | `mqtt.packets on`, `bridge.enabled on`, et `mqtt.rx on` |
| MCtoMQTT / capture d’un compagnon | Configurez le sujet `/packets` |
| PyMC | `format: letsmesh` |
| Home Assistant | **Payload Mode** = `packet` |
| RemoteTerm | Activez le sujet de paquets Community MQTT |

## Ce que chaque vérification confirme

| État | Ce qu’il confirme |
|---|---|
| DNS ou port accessible | L’hôte peut joindre le serveur |
| Connexion au courtier | Le transport et l’authentification fonctionnent |
| Observateur visible | Son état s’est rendu au service en direct |
| Paquet récent visible | Le parcours complet de la radio jusqu’à l’affichage fonctionne |

Seul un paquet récent permet de terminer [la vérification de l’observateur](verify.md).
