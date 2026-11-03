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
last_reviewed: 2026-11-02
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
| Trouver des communautés à proximité | La ville recherchée | L’outil de recherche de lieux du gouvernement du Canada (geo.ca); les distances sont calculées dans votre navigateur |
| Charger les totaux du réseau dans l’en-tête | Votre adresse IP et les renseignements habituels d’une requête Web, sans texte de recherche | Beacon à dev.meshcore.ca |
| Rechercher un lieu dans les outils de région | Le lieu, le code d’aéroport ou le code postal saisi | Codes IATA vérifiés localement. Noms de lieux transmis à l’outil de recherche de lieux du gouvernement du Canada (geo.ca); codes postaux transmis à OpenStreetMap ou geocoder.ca |
| Rechercher une ville ou une adresse dans l’[outil de configuration](config/index.md) | La ville ou l’adresse saisie. Les coordonnées saisies restent dans votre navigateur | L’outil de recherche de lieux du gouvernement du Canada (geo.ca) : `geolocator.api.geo.ca` |
| Ouvrir la carte interactive des régions | Votre adresse IP et la partie visible de la carte | OpenStreetMap |
| Placer le répéteur sur la carte dans l’[outil de configuration](config/index.md) | Votre adresse IP et la partie visible de la carte | OpenStreetMap |
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

## L’outil de configuration

L’[outil de configuration](config/index.md) ne demande ni ne conserve jamais
votre mot de passe administrateur ni votre mot de passe Wi-Fi. Là où une
commande en exige un, elle affiche un espace réservé que vous remplissez
vous-même.

- **Partager et reprendre.** Le lien de l’outil (**Copier un lien vers ces
  réponses**, qui est aussi l’adresse dans votre navigateur) contient vos
  réponses non secrètes, comme le nom du répéteur, sa région, le lieu choisi
  (une ville ou une adresse) et les coordonnées de l’épingle que vous avez
  placée sur la carte, pour que vous puissiez partager ou reprendre une
  configuration. Il ne contient jamais de
  mots de passe, de renseignements Wi-Fi ni de réponse `region` collée. Les
  liens peuvent apparaître dans l’historique du navigateur et les journaux du
  serveur : ne partagez pas un lien qui contient un emplacement privé.
- **Emplacement sur la carte.** L’outil affiche une carte avec une épingle, que
  vous pouvez déplacer. Les commandes règlent l’emplacement du répéteur à
  l’épingle, et tout le monde peut voir cet endroit sur les cartes publiques. La
  plupart des gens choisissent un endroit à une rue ou deux du répéteur. Si vous
  cochez **Désactiver l’emplacement**, l’outil retire ces commandes de la liste,
  et le lieu et l’épingle restent aussi hors du lien.
- **Changer de langue.** Pour ne pas vous faire recommencer, l’outil garde vos
  coches, la version du micrologiciel et les réponses collées dans cet onglet du
  navigateur, seulement le temps du changement. L’autre page les utilise une seule fois,
  puis les supprime. Passé 10 minutes, ils sont ignorés, et ils disparaissent à
  la fermeture de l’onglet.
- **Fichiers de régions.** MeshMapper n’est pas contacté, sauf si vous cliquez
  sur un lien qui y mène. L’outil de configuration,
  [Comprendre les répéteurs](config/guide.md) et la carte des régions lisent les
  fichiers de régions publiés sur ce site.

## Données enregistrées sur votre appareil

Changer de langue sur la carte des régions conserve votre sélection dans le lien
vers l’autre page. Il peut contenir les coordonnées saisies, un lieu, des
portées de ville et de province et un profil radio. Ces liens peuvent apparaître
dans l’historique du navigateur et les journaux du serveur. Ne partagez pas un
lien qui contient un emplacement privé.

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
