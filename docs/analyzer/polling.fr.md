---
title: Interrogation par l’observateur
description: Un observateur demande aux répéteurs voisins leur batterie, leur température et leur état, puis envoie les réponses à Beacon. Expérimental.
audience:
  - observer-operators
task: enable-observer-polling
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-11-26
review_by: 2027-02-24
difficulty: intermediate
estimated_time: 30 minutes
destructive: true
---

# Interrogation par l’observateur

!!! warning "Expérimental"
    L’interrogation utilise un micrologiciel d’essai. Attendez-vous à des
    bogues, et ne l’installez pas sur un observateur difficile d’accès.

Quand l’interrogation est activée, un observateur demande aux répéteurs tout
près de lui leur niveau de batterie, leur température et leur état, puis envoie
les réponses à Beacon (live.meshcore.ca) par Internet.

![Deux cartes. Aujourd’hui, une question sur la batterie d’un répéteur éloigné est relayée par six répéteurs, et la réponse aussi. Avec Beacon, l’observateur le plus proche du répéteur l’interroge par un seul court lien radio, et tout le reste passe par Internet.](../assets/images/observer-polling.png)

## Pourquoi c’est utile

Aujourd’hui, pour vérifier la batterie d’un répéteur éloigné, vous vous
connectez depuis chez vous. Votre requête est relayée par tous les répéteurs
entre vous et lui, et la réponse aussi. Ça occupe une bonne partie du réseau
maillé, et ça échoue souvent.

Avec l’interrogation, un observateur qui entend le répéteur directement lui
pose la question à votre place. Il suffit d’un court échange radio. Beacon
choisit, pour chaque répéteur, l’observateur qui a le meilleur signal.

- **Mots de passe invité seulement.** Un mot de passe invité permet de lire les
  statistiques sans rien modifier. Les mots de passe administrateur ne sont
  jamais acceptés.
- **Voisins directs seulement.** L’observateur ne s’adresse qu’aux répéteurs
  qu’il entend directement (zéro saut), donc rien ne s’ajoute au reste du
  réseau maillé.
- **Peu de trafic.** Au plus deux interrogations par répéteur par heure, une à
  la fois.

## Ce qu’il vous faut

- Une carte pour laquelle le micrologiciel d’interrogation existe. Ce sont des
  cartes ESP32 avec PSRAM (mémoire supplémentaire) : Station G2, Station G3,
  Heltec V4 (y compris les versions avec trousse d’extension et R8) et
  T-Beam S3 Supreme (SX1262). La Heltec V3 n’a pas de PSRAM, donc elle ne peut
  pas interroger.
- Le Wi-Fi à l’endroit où se trouve l’observateur.
- Chrome ou Edge sur un ordinateur, et un câble de données USB.
- La clé publique (64 caractères) de chaque répéteur à interroger.
  L’observateur doit entendre chacun directement.

## Avant de commencer

La première programmation du micrologiciel d’interrogation exige
**Erase device**, qui efface tous les réglages de la carte ainsi que son
identité.

- Notez ses réglages radio, son nom et son mot de passe administrateur.
- Si la carte est déjà en service, sauvegardez sa clé privée pour qu’elle garde
  son identité : envoyez `get prv.key` et gardez la réponse dans votre
  gestionnaire de mots de passe.
  [Sauvegarder un répéteur en service](../config/guide.md#back-up) donne les
  étapes.

## Configuration

L’[outil de configuration](../config/index.md?type=observer) fait tout ça pour
vous. Choisissez **Répéteur observateur**, puis **ESP32 avec PSRAM**, puis
répondez **Oui** quand il demande s’il faut activer l’interrogation. Il vous
donne les étapes de programmation et toutes les commandes à coller.

Pour le faire à la main :

1. Ouvrez l’[outil de programmation des observateurs](https://observer.gessaman.com/)
   dans Chrome ou Edge.
2. Choisissez **MQTT Observer Firmware**, votre carte, puis **Repeater**.
3. Sous **Version**, choisissez `v1.18.0.1-poll`. Ce n’est pas la plus récente
   de la liste.
4. La première fois, cochez **Erase device**. Les mises à jour suivantes
   gardent vos réglages.
5. Programmez la carte et attendez qu’elle redémarre.
6. Configurez-la comme répéteur observateur : radio, nom, Wi-Fi et les deux
   serveurs de MeshCore Canada.
   [Ce que fait chaque réglage](../config/guide.md#settings) donne ces lignes.
7. Activez l’interrogation :

    ```text
    set poll.url https://live.meshcore.ca
    poll add <clé publique du répéteur>
    set poll on
    ```

    Envoyez la ligne `poll add` une fois par répéteur, jusqu’à 8.

Ne touchez pas à `poll.slot` ni à `poll.consent`. L’observateur trouve lui-même
le bon emplacement MQTT, et Beacon règle la fréquence des interrogations.

Par défaut, l’observateur essaie un mot de passe invité vide, puis `hello`. Si
un répéteur utilise un autre mot de passe invité, indiquez-le :

```text
poll pw <clé publique du répéteur> set <mot de passe invité>
```

Pour interroger aussi les répéteurs que demandent les utilisateurs de Beacon,
envoyez `set poll.requests on`.

## Vérifier que ça fonctionne

| Commande | Ce que vous devriez voir |
|---|---|
| `get poll` | L’interrogation activée, le mode `telemetry`, un emplacement MQTT et vos répéteurs |
| `get poll.status` | Une ligne par répéteur, avec son dernier résultat |
| `get poll.status 1` | Les détails du premier répéteur : batterie, température, prochaine interrogation |
| `poll now <clé publique du répéteur>` | Une interrogation immédiate (au plus une par minute) |
| `get mqtt.status` | Se termine par `poll:` et le nombre de répéteurs qui ont répondu |

Les relevés apparaissent sur la page du répéteur dans Beacon, et l’observateur
reçoit l’étiquette Poller.

## Si rien ne se passe

- **`get poll` indique le mode `unknown` :** Beacon n’a pas encore répondu.
  Vérifiez `poll.url` et que le Wi-Fi fonctionne. Rien n’est interrogé tant que
  l’observateur n’a pas réglé son horloge par Wi-Fi.
- **Aucun emplacement :** aucun emplacement MQTT ne correspond aux serveurs de
  Beacon. Vérifiez les serveurs de MeshCore Canada dans `get mqtt.status`.
- **`not_direct` :** l’observateur n’a pas entendu ce répéteur directement
  depuis un jour.
- **`login failed` :** le répéteur n’accepte ni un mot de passe invité vide ni
  `hello`. Indiquez son mot de passe invité avec `poll pw`.
- **L’interrogation s’est arrêtée pour un répéteur :** si un répéteur laisse
  entrer l’observateur comme administrateur, l’observateur cesse de
  l’interroger et renonce à cet accès. Corrigez les mots de passe du répéteur,
  puis envoyez `poll enable <clé publique du répéteur>`.

Plus d’aide : [Dépanner un observateur](troubleshooting.md).

## Retour au micrologiciel habituel

Désactivez l’interrogation avec `set poll off`.

Le micrologiciel d’interrogation se met à jour lui-même à partir du canal
d’essai. Pour revenir au micrologiciel d’observateur habituel, envoyez
`ota branch beta`, puis `ota update`.
