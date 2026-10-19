---
title: Qu’est-ce que MeshCore?
description: Découvrez le rôle des appareils MeshCore et par où commencer au Canada.
audience:
  - newcomer
  - meshcore-operator
task: understand-meshcore-roles
scope: canada-baseline
status: draft
owner: docs-ux
last_reviewed: 2026-09-02
review_by: 2026-10-17
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---
# Qu’est-ce que MeshCore?

MeshCore est un réseau maillé LoRa. Le micrologiciel d’un appareil lui attribue un rôle précis.

!!! warning "Scission du projet MeshCore : utilisez les liens officiels"
    À la suite d’événements récents au sein de l’équipe de développement de MeshCore, le projet s’est scindé. Pour rester sur la voie officielle, utilisez uniquement :

    - **Outil de programmation et blogue :** [meshcore.io](https://meshcore.io/){ target="_blank" rel="noopener" }
    - **Code source :** [github.com/meshcore-dev/MeshCore](https://github.com/meshcore-dev/MeshCore){ target="_blank" rel="noopener" }
    - **Discord (nommé « MeshCore.io ») :** [discord.com/invite/fUfWevRXAg](https://discord.com/invite/fUfWevRXAg){ target="_blank" rel="noopener" }

    Pour en savoir plus sur la scission : [The Split, blog.meshcore.io](https://blog.meshcore.io/2026/04/23/the-split){ target="_blank" rel="noopener" } (en anglais).

## Rôles des appareils

- Un **compagnon** envoie et reçoit des messages.
- Un **répéteur** relaie le trafic et étend la couverture.
- Un **serveur de salon** maintient un salon partagé accessible.
- Un **observateur** transmet à CoreScope les données réseau qu’il reçoit.

[Comparer les rôles des appareils](../start/choose-a-goal.md).

## Réglages au Canada

Consultez le [répertoire des communautés](../provinces/index.md) avant de configurer un
appareil. Utilisez les réglages locaux qui y sont indiqués; sinon, utilisez les
[réglages par défaut du Canada](../index.md#canada-baseline).

## Ressources officielles de MeshCore

MeshCore Canada présente les communautés, les réglages et les outils propres au
Canada. Pour obtenir les renseignements officiels sur le micrologiciel, les
applications et le protocole, consultez :

- la [documentation de MeshCore](https://docs.meshcore.io/){ target="_blank" rel="noopener" }
- le [programme de mise à jour MeshCore](https://flasher.meshcore.io/){ target="_blank" rel="noopener" }
- le [code source de MeshCore](https://github.com/meshcore-dev/MeshCore){ target="_blank" rel="noopener" }

[Choisir un rôle et commencer la configuration](../start/index.md){ .md-button .md-button--primary }
