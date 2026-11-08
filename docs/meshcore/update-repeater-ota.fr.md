---
title: Mettre à jour un répéteur ou un serveur de salon à distance
description: Mettez à jour un répéteur ou un serveur de salon nRF52 en toute sécurité, puis vérifiez ses réglages.
audience:
  - advanced-repeater-operator
  - room-server-operator
task: update-repeater-ota
scope: experimental
status: experimental
status_notice: false
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: 30-60 minutes
destructive: true
requires:
  - supported-nrf52-device
  - physical-usb-recovery
  - verified-firmware-zip
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Mettre à jour un répéteur ou un serveur de salon à distance

## Avant de commencer

!!! danger "Le chargeur d’amorçage d’abord"
    Faites-le seulement si le répéteur a le **chargeur d’amorçage OTAFIX**.
    L’[outil de configuration des répéteurs](../config/index.md) explique sa mise
    à jour pour les cartes nRF52.

!!! danger "Android seulement : iOS déconseillé"
    Ces étapes sont pour **Android**. iOS fonctionne en théorie, mais plusieurs
    mises à jour à distance ont échoué depuis iOS. D’ici à ce que ça change,
    n’utilisez pas d’appareil iOS pour ces mises à jour.

Ceci s’applique seulement aux cartes nRF (par exemple RAK4630, Heltec T114 et
XIAO nRF52). **Nous recommandons fortement de faire la mise à jour par USB.**

!!! warning "Risques de la mise à jour à distance"
    Une mise à jour à distance peut échouer même si l’application indique qu’elle
    a réussi; le répéteur doit alors être reprogrammé par USB. Une mise à jour a
    échoué chez nous en hiver et nous avons dû attendre le printemps pour
    accéder au répéteur. Procédez à vos risques.

Sauvegardez d’abord la clé privée du répéteur, au cas où un échec exigerait une
reprogrammation par USB : connectez-vous comme administrateur, ouvrez
**Command Line** et envoyez `get prv.key`. Conservez la réponse dans un
gestionnaire de mots de passe et ne la partagez jamais.

Ces étapes résument les [instructions officielles du blogue MeshCore](https://blog.meshcore.io/2026/04/02/nrf-ota-update).

## 1. Télécharger le fichier .zip du micrologiciel

1. Ouvrez le [programme de mise à jour MeshCore](https://meshcore.io/flasher) et trouvez votre appareil.
2. Sélectionnez le rôle **Repeater** ou **Room Server**, puis la dernière version.
3. Cliquez sur **Download** en bas à droite et choisissez le fichier `.zip`.

Vous pouvez aussi télécharger le `.zip` de votre carte (par exemple, le répéteur
T114) depuis les [versions MeshCore sur GitHub](https://github.com/meshcore-dev/MeshCore/releases).

## 2. Se connecter et lancer la mise à jour

1. Dans l’application MeshCore, connectez-vous à l’appareil avec le mot de passe administrateur.
2. Ouvrez l’onglet **Command Line** et envoyez :

    ```
    start ota
    ```

3. Vous devriez voir une réponse comme :

    ```
    OK - mac: FF:AA:BB ...
    ```

**Astuce :** un appareil autonome comme un T-Deck avec Ripple peut aussi envoyer
`start ota`.

## 3. Se connecter avec le téléphone

Installez l’application **nRF Device Firmware Update** de Nordic depuis Google
Play si vous ne l’avez pas.

### Réglages de l’application DFU

Touchez l’icône **Settings** et réglez :

- **Packet receipts notification :** ON
- **Number of packets :** 8
- **Request high MTU :** OFF
- **Disable resume :** ON
- **Prepare object delay :** 0 ms
- **Force scanning :** ON

### Lancer la mise à jour

1. Sélectionnez le fichier `.zip` téléchargé.
2. Sélectionnez votre appareil dans la liste.
3. Touchez **Start** et attendez la fin de la mise à jour.

## 4. Vérifier la mise à jour

1. Déconnectez-vous et reconnectez-vous, avec l’application ou un appareil autonome.
2. Vérifiez l’horloge avec `clock`. Si elle est fausse, envoyez `clock sync`.
3. Envoyez `ver` pour confirmer que la version du micrologiciel a changé.

## Récupération en cas d’échec

Si la mise à jour bloque ou échoue, envoyez ceci depuis votre téléphone ou un
appareil autonome, puis recommencez :

```
reboot
```

**RAK4631 avec le chargeur d’amorçage à jour :** l’application indiquera
probablement que la programmation a échoué. Relancez la recherche : l’appareil
apparaît avec un nom générique (comme AdaDFU ou RAK4631_DFU). Sélectionnez-le et
téléversez de nouveau la mise à jour.
