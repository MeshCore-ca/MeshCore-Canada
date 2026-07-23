---
title: Référence des points de terminaison pour observateurs
description: Consultez les paramètres de courtier, de sécurité, de sujet et de paquets utilisés par les observateurs de MeshCore Canada.
audience:
  - observer-operators
  - service-operators
task: reference-observer-endpoints
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 8 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-broker-reference.js?v=20260722-2
---

# Référence des points de terminaison pour observateurs

Utilisez cette référence après avoir [choisi une méthode d’observation](intro.md).
Suivez le guide de cette méthode plutôt que de copier séparément les valeurs
présentées ici.

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
  <p class="mc-location-status" id="broker-reference-status" role="status">Chargement des valeurs officielles des points de terminaison…</p>
</div>

Si le tableau ne s’affiche pas, ouvrez [observer-config.json](observer-config.json).

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
- Faites correspondre l’audience de chaque jeton à l’hôte de son point de terminaison.
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
| DNS ou port accessible | L’hôte peut joindre le point de terminaison |
| Connexion au courtier | Le transport et l’authentification fonctionnent |
| Observateur visible | Son état s’est rendu au service en direct |
| Paquet récent visible | Le parcours complet de la radio jusqu’à l’affichage fonctionne |

Seul un paquet récent permet de terminer [la vérification de l’observateur](verify.md).
