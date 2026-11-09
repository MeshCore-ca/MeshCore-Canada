---
title: Données des observateurs et vie privée
description: Voyez ce qu’un observateur envoie, où ces données apparaissent et comment éviter d’y inclure des renseignements privés.
audience:
  - observer-operators
  - community-members
task: understand-observer-data
scope: canada-baseline
status: draft
status_notice: false
owner: meshcore-canada
last_reviewed: 2026-09-03
review_by: 2026-12-01
difficulty: beginner
estimated_time: 6 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Données des observateurs et vie privée

!!! warning "Considérez le trafic radio MeshCore comme public"
    Le trafic MeshCore est destiné à un usage partagé, et les réseaux peuvent
    utiliser des préréglages ou des fréquences différents. Considérez tous les
    canaux qui utilisent une clé partagée, et les canaux privés aussi, comme non
    sécurisés : tout nœud qui utilise les mêmes réglages peut être capté par les
    observateurs de ce réseau. Le trafic relayé par MQTT doit être considéré comme
    public. N’envoyez pas de noms, d’emplacements, de notes ou d’autres
    renseignements personnels que vous ne voudriez pas voir conservés et affichés
    publiquement. Partez du principe que même un canal privé pourrait être
    recueilli et déchiffré par quelqu’un qui en a les moyens et le savoir-faire.

## Ce que nous recueillons

Les serveurs MQTT de MeshCore Canada reçoivent des données de paquets des
observateurs qui captent les paquets MeshCore et relaient la télémétrie.

Les observateurs écoutent tout le trafic MeshCore qu’ils peuvent capter avec
leurs réglages. Si un observateur capte un paquet et que la publication des
paquets est activée, ce paquet peut être envoyé aux serveurs de MeshCore Canada.

## Où vont les données

| Étape | Ce qui se passe |
|---|---|
| Trafic radio | Les nœuds envoient des paquets MeshCore sur les fréquences et réglages de leur réseau local. |
| Captation par l’observateur | Les observateurs écoutent tout le trafic qu’ils peuvent capter avec leurs réglages. |
| Publication MQTT | Les observateurs publient les données des paquets sur les serveurs de MeshCore Canada. |
| Stockage et affichage | Les données sont conservées sur l’infrastructure de MeshCore Canada et peuvent être affichées par Beacon et d’autres sites publics exploités par MeshCore Canada ou des exploitants approuvés. |

Aucune durée de conservation n’a encore été publiée : ne présumez pas que les
données sont supprimées après un certain temps.

## Qui peut s’abonner

Les abonnements MQTT directs ne sont pas offerts à tous. Ils sont réservés aux
administrateurs des réseaux locaux, aux outils approuvés et aux personnes
approuvées par les administrateurs de MeshCore Canada. Les données restent tout
de même publiques par Beacon et les autres sites ci-dessous.

## Comptes MQTT en lecture seule { #read-only-mqtt-accounts }

| Service | Exploitant | Utilisation |
|---|---|---|
| Beacon (`live.meshcore.ca`) | Exploitants de MeshCore Canada | Outils publics pour les observateurs, les paquets, les nœuds et la carte |
| API Beacon (`dev.meshcore.ca`) | Exploitants de MeshCore Canada | Totaux du réseau et vérification des identifiants de répéteur sur ce site |
| [Canadaverse](https://canadaverse.org/) | [n30nex@gmail.com](mailto:n30nex@gmail.com) | Outils régionaux du Grand Toronto et carte CartoLive |
| [Quinte Mesh](https://quintemesh.ca/) | hansimgamr | Services du réseau communautaire de la région de Quinte |

Les administrateurs de l’infrastructure doivent mettre ce tableau à jour chaque
fois qu’ils créent ou retirent un compte en lecture seule. [Signalez une entrée manquante ou périmée](https://github.com/MeshCore-ca/MeshCore-Canada/issues/new/choose).

## Administrateurs de l’infrastructure

Les administrateurs de l’infrastructure de MeshCore Canada gèrent les serveurs
MQTT et l’infrastructure connexe. Adressez-leur vos questions sur la vie privée,
l’accès MQTT ou le projet.

| Administrateur | Contact |
|---|---|
| Mr. Alderson | [github.com/MrAlders0n](https://github.com/MrAlders0n) |
| Ded | [github.com/446564](https://github.com/446564) |
| n30nex | [github.com/n30nex](https://github.com/n30nex) |
| Kranic | [forum.meshcore.ca/u/djkranic](https://forum.meshcore.ca/u/djkranic) |

Discussion générale et aide : [forum.meshcore.ca](https://forum.meshcore.ca/).

## Si vous exploitez un observateur

- Utilisez un nom d’observateur général, pas votre adresse ni votre nom.
- Ne collez jamais de mot de passe Wi-Fi, de jeton MQTT, de clé privée ni de
  journal non caviardé dans un message d’aide.
