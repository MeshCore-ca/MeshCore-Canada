---
title: Données des observateurs et vie privée
description: Voyez ce qu’un observateur envoie, où ces données apparaissent et comment éviter d’y inclure des renseignements privés.
audience:
  - observer-operators
  - community-members
task: understand-observer-data
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 6 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Données des observateurs et vie privée

Considérez comme publiques toutes les données captées par un observateur. Un
observateur ne déchiffre pas les messages privés, mais il peut transmettre les
détails des paquets et des renseignements sur son état. N’inscrivez pas de noms,
d’emplacements, d’identifiants ou d’autres renseignements sensibles dans les
messages MeshCore.

<div class="mc-method-fit">
  <div><strong>Observateur</strong>Transmet les données de paquets et l’état provenant des paramètres radio qu’il utilise.</div>
  <div><strong>CoreScope</strong>Peut afficher publiquement les observateurs, les paquets et les données cartographiques.</div>
  <div><strong>Courtier</strong>Les abonnements directs sont restreints, mais les données affichées dans CoreScope demeurent publiques.</div>
</div>

## Résumé de la politique

| Question | Réponse |
|---|---|
| Qui gère le service? | Les administrateurs de l’infrastructure de MeshCore Canada |
| Où puis-je poser mes questions? | [Forum de MeshCore Canada](https://forum.meshcore.ca/) |
| Combien de temps les données sont-elles conservées? | Aucune période de conservation publique n’a encore été annoncée |

Ne présumez pas que les données seront supprimées après une période précise.
Communiquez avec l’équipe d’infrastructure si vous devez connaître l’échéancier
de conservation ou de suppression.

## Parcours des données

<ol class="mc-analyzer-flow">
  <li><strong>Paquet radio</strong><span>transmis sur le réseau maillé configuré</span></li>
  <li><strong>Observateur</strong><span>capte et transmet la télémétrie</span></li>
  <li><strong>Infrastructure</strong><span>la reçoit et peut la conserver</span></li>
  <li><strong>CoreScope</strong><span>peut l’afficher publiquement</span></li>
</ol>

Changer le préréglage radio modifie ce que l’observateur peut capter. Le choix
d’un canal public ou privé ne rend pas privée la télémétrie qui accompagne les
paquets.

## Collecte, accès et conservation

| Donnée | Pourquoi elle est utilisée | Où elle peut apparaître | Qui peut y accéder | Conservation |
|---|---|---|---|---|
| État de l’observateur | Indiquer si un observateur est en ligne | CoreScope | Visiteurs; exploitants de l’infrastructure | Non précisée publiquement |
| Télémétrie des paquets captés | Montrer l’activité du réseau et aider à diagnostiquer la couverture | Vues de paquets et cartes de CoreScope | Visiteurs; abonnés autorisés; exploitants de l’infrastructure | Non précisée publiquement |
| Code d’emplacement | Regrouper un observateur près d’un lieu connu | Listes d’observateurs, sujets et cartes | Visiteurs et utilisateurs du courtier | Suit la conservation de l’observateur ou des paquets |
| Coordonnées facultatives du responsable | Aider à identifier un service | Données d’état selon l’intégration | Peuvent être transmises à l’infrastructure et à CoreScope | Non précisée publiquement |
| Identifiants du courtier | Authentifier l’observateur | Devraient rester dans l’intégration locale | Exploitant local et service d’authentification | Ne jamais les inclure dans des diagnostics publics |

MeshCore Canada n’offre pas d’abonnement direct général au courtier. L’accès
direct est limité à CoreScope, aux administrateurs des réseaux maillés locaux
et aux personnes autorisées par les administrateurs de l’infrastructure.

## Où les données apparaissent

[CoreScope](https://live.meshcore.ca/) affiche des renseignements sur les
observateurs, les paquets et la carte. D’autres services autorisés de MeshCore
Canada peuvent utiliser le même flux.

Les contrôles d’accès au courtier ne rendent pas les renseignements privés une
fois que CoreScope les affiche.

## Avant d’exploiter un observateur

- [ ] Informez les personnes qui utilisent le réseau local qu’un observateur est actif.
- [ ] Utilisez un nom général pour l’observateur, et non une adresse résidentielle ou le nom d’une personne.
- [ ] Laissez les champs facultatifs de courriel du responsable vides, sauf s’ils sont nécessaires à l’exploitation.
- [ ] Ne collez jamais de mots de passe Wi-Fi, de jetons MQTT, de clés privées ou de journaux non caviardés dans une demande d’aide.
- [ ] Lisez les étapes de vérification et de récupération propres à la méthode avant d’apporter des changements.

Retournez à [Choisir une méthode d’observation](intro.md), ou voyez
[quoi retirer avant de demander de l’aide](troubleshooting.md#what-to-share-when-asking-for-help).
