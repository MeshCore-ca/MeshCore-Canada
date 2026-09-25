---
title: Confidentialité chez MeshCore Canada
description: Découvrez ce que le site, les outils et les formulaires publics de MeshCore Canada transmettent ou enregistrent.
audience:
  - site-visitor
  - contributor
task: understand-site-privacy
scope: canada-baseline
status: draft
owner: site-maintainers
last_reviewed: 2026-07-22
review_by: 2027-01-15
difficulty: beginner
estimated_time: 3 minutes
destructive: false
---

# Confidentialité chez MeshCore Canada

Vous pouvez consulter ce site sans compte MeshCore Canada ni compte GitHub.

## Quand des données quittent votre navigateur

| Action | Données transmises | Destination |
|---|---|---|
| Rechercher dans cette documentation | Vos mots de recherche restent dans le navigateur | Nulle part |
| Trouver des communautés à proximité | La ville recherchée | API Géolocalisateur de Ressources naturelles Canada; les distances sont calculées dans votre navigateur |
| Charger les totaux du réseau dans l’en-tête | Votre adresse IP et les renseignements habituels d’une requête Web, sans texte de recherche | Beacon à dev.meshcore.ca |
| Rechercher un lieu dans les outils de région | Le lieu, le code d’aéroport ou le code postal saisi | Vérification locale d’abord, puis OpenStreetMap ou geocoder.ca au besoin |
| Ouvrir la carte interactive des régions | Votre adresse IP et la partie visible de la carte | OpenStreetMap |
| Vérifier un identifiant de parcours de répéteur | Le premier octet de la clé publique | Beacon à dev.meshcore.ca; les comparaisons régionales et des préfixes plus longs restent dans votre navigateur |
| Charger le nombre d’étoiles GitHub | Votre adresse IP et les renseignements habituels d’une requête Web | GitHub |
| Ouvrir un lien externe | Les renseignements habituels d’une requête Web | Le service externe indiqué |
| Soumettre une idée communautaire | Le texte et les détails affichés lors de la révision, ainsi que la vérification antipourriel | Le service de soumission de MeshCore Canada, Cloudflare Turnstile et un billet GitHub public |

## Soumissions publiques

Les idées et les propositions de limites deviennent des billets GitHub publics.
Relisez l’aperçu avant de soumettre. N’incluez aucun mot de passe, aucune clé
privée, aucune adresse résidentielle, aucune coordonnée privée ni aucun autre
renseignement personnel.

Le service de soumission peut conserver des journaux de sécurité et de
limitation du débit. Aucune période de conservation n’a encore été publiée.

## Données enregistrées sur votre appareil

Changer de langue ou passer entre la carte et le configurateur conserve votre
sélection dans l’URL de destination. Elle peut contenir les coordonnées saisies,
un lieu, des scopes de ville et de province et un profil radio. Ces URL peuvent apparaître dans
l’historique du navigateur et les journaux du serveur. Ne partagez pas un lien qui
contient un emplacement privé. Les résumés téléchargés omettent les coordonnées
exactes et les identifiants de connexion.

Les listes de configuration, les brouillons d’idées et le dernier code de
région Beacon choisi dans l’outil de vérification sont enregistrés uniquement
dans votre navigateur lorsque vous utilisez ces fonctions. Les clés publiques
des répéteurs, les mots de passe, les clés privées, les jetons antipourriel et
les recherches d’emplacement n’y sont pas enregistrés.

Les totaux de l’en-tête sont mis en cache pendant cinq minutes dans l’onglet courant.
La ville recherchée dans le répertoire apparaît dans l’URL pour partager ou retrouver les résultats.

Vous pouvez effacer les données enregistrées par ce site dans les paramètres de
votre navigateur. Le formulaire d’idée offre aussi l’action
**Effacer le brouillon enregistré**.

L’ancien éditeur de régions peut télécharger les brouillons conservés dans ce
navigateur. Le téléchargement ne les envoie ni ne les supprime; ces brouillons
ne sont pas des limites approuvées dans MeshMapper.

## Services externes

CoreScope, les services MQTT, les outils de reprogrammation et les sites
communautaires ont leurs propres responsables et politiques de confidentialité.

## Mesure d’audience

MeshCore Canada n’utilise aucun outil d’analyse d’audience.

## Questions ou corrections

[Signalez une correction liée à la confidentialité](submit-idea.md) sans compte
GitHub ou [ouvrez un billet sur GitHub](https://github.com/MeshCore-ca/MeshCore-Canada/issues).
