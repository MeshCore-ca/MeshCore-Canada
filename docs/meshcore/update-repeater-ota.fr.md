---
title: Mettre à jour un répéteur ou un serveur de salon à distance
description: Déterminez si une mise à jour OTA est sécuritaire, préparez la récupération physique, mettez à jour un appareil nRF52 et vérifiez tous les réglages conservés.
audience:
  - advanced-repeater-operator
  - room-server-operator
task: update-repeater-ota
scope: experimental
status: experimental
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
  - assets/styles/devices-builds.css?v=20260722-2
---
# Mettre à jour un répéteur ou un serveur de salon à distance

Utilisez l’USB lorsque c’est possible. Une mise à jour à distance est une
solution de rechange plus risquée réservée aux appareils nRF52 pris en charge,
et une mise à jour ratée peut tout de même exiger une récupération par USB.
Confirmez la carte exacte, le chargeur d’amorçage, la version installée et le
fichier du micrologiciel avant de continuer.

!!! danger "Chargeur d’amorçage requis"
    Continuez seulement après avoir confirmé que la carte exacte possède le chargeur d’amorçage OTAFIX décrit dans [Programmer un répéteur](flash-repeater.md#nrf52-bootloader-decision). Une mise à jour OTA ratée peut exiger une récupération physique par USB.

!!! warning "Android est la méthode testée par la communauté"
    La communauté a observé des échecs de mise à jour OTA depuis iOS et recommande actuellement Android pour cette procédure. Il s’agit d’une recommandation locale pour réduire les risques, et non d’une affirmation selon laquelle la prise en charge d’iOS n’existe pas en amont.

## Préalables : décider s’il faut arrêter

Utilisez plutôt l’USB si vous répondez **non** à l’une des affirmations
suivantes :

- [ ] L’appareil est une carte nRF52 compatible avec OTA, comme une RAK4631, une Heltec T114 ou une XIAO nRF52840.
- [ ] L’identité de la carte, le chargeur d’amorçage installé, le micrologiciel actuel et le fichier du micrologiciel prévu sont connus.
- [ ] La clé privée, les réglages, la configuration des régions et les renseignements d’accès sont sauvegardés de façon sécuritaire.
- [ ] Une alimentation stable et un moyen fiable de gérer la radio sont disponibles pendant toute la mise à jour.
- [ ] Une personne peut atteindre l’appareil avec un câble USB si la mise à jour OTA échoue.
- [ ] Le nom du fichier ZIP téléchargé correspond exactement à la carte et au rôle.

!!! danger "Sans récupération physique, pas de mise à jour OTA"
    Ne commencez pas une mise à jour OTA sur un toit, une tour, un site hivernal ou toute autre installation inaccessible si un échec ne peut pas être corrigé rapidement par USB.

## Ce que la mise à jour change

La mise à jour OTA place l’appareil en mode de mise à jour du micrologiciel,
puis remplace celui-ci par Bluetooth. Un transfert raté peut rendre nécessaire
une récupération physique par USB, tandis qu’un mauvais artéfact peut viser la
mauvaise carte ou le mauvais rôle.

## Plan de récupération avant de commencer

Gardez le bon micrologiciel USB et un câble de données à portée de main. Notez
la version et les réglages actuels. Si l’appareil reste en mode DFU après un
échec, recherchez de nouveau un nom DFU générique et réessayez avec le même
fichier ZIP vérifié. Si la récupération à distance échoue, arrêtez et
reprogrammez par USB la carte et le rôle exacts à l’aide de la sauvegarde.

## 1. Télécharger le fichier ZIP exact du micrologiciel

1. Ouvrez le [programme de mise à jour Web MeshCore](https://meshcore.io/flasher).
2. Sélectionnez l’appareil exact et le rôle **Repeater** ou **Room Server**.
3. Choisissez la version précise approuvée pour cette mise à jour; ne vous fiez pas à une étiquette générique « latest ».
4. Utilisez la commande de téléchargement pour enregistrer l’artéfact `.zip`.

Vous pouvez aussi utiliser les
[versions officielles de MeshCore](https://github.com/meshcore-dev/MeshCore/releases)
et vérifier que l’artéfact correspond exactement à la carte et au rôle.

## 2. Placer l’appareil en mode OTA

1. Dans l’application mobile MeshCore, ouvrez une session avec le mot de passe administrateur.
2. Ouvrez **Command Line** et exécutez :

    ```text
    start ota
    ```

3. Continuez seulement après qu’une réponse semblable à `OK - mac: FF:AA:BB ...` a confirmé le mode OTA. En l’absence de confirmation, arrêtez et laissez l’appareil sur son micrologiciel actuel.

Vous pouvez également exécuter `start ota` depuis un appareil de gestion
autonome qui prend en charge la ligne de commande du répéteur.

## 3. Transférer la mise à jour

Installez l’application **nRF Device Firmware Update** de Nordic depuis la
boutique d’applications officielle du téléphone.

Pour la méthode Android testée par la communauté, utilisez :

- **Packet receipts notification:** on
- **Number of packets:** `8`
- **Request high MTU:** off
- **Disable resume:** on
- **Prepare object delay:** `0 ms`
- **Force scanning:** on

Ensuite :

1. Sélectionnez le fichier `.zip` vérifié.
2. Sélectionnez l’appareil attendu dans la liste de détection.
3. Lancez la mise à jour et gardez le téléphone, l’appareil et l’alimentation stables jusqu’à ce que l’application confirme la fin de l’opération.

Si l’application signale un échec, mais qu’un nom générique comme `AdaDFU` ou
`RAK4631_DFU` apparaît, sélectionnez cet appareil et réessayez une fois avec le
même fichier ZIP vérifié. N’utilisez pas le fichier d’une autre carte.

## Vérifier le transfert

L’application DFU confirme la fin de l’opération, l’appareil redémarre,
l’administration à distance se reconnecte et l’appareil indique la version du
micrologiciel prévue. Tout autre résultat représente une mise à jour ratée ou
incomplète.

## 4. S’assurer que la mise à jour a fonctionné

1. Fermez la session et reconnectez-vous après le redémarrage de l’appareil.
2. Exécutez `ver` et confirmez la version exacte du micrologiciel prévue.
3. Exécutez `clock`; au besoin, exécutez `clock sync` depuis un appareil de gestion à distance compatible.
4. Confirmez que les réglages de radio, de hachage des parcours, de région, d’annonce, d’accès et de rôle correspondent toujours à la configuration sauvegardée.
5. Envoyez une annonce et effectuez un essai local d’acheminement de message.

La mise à jour n’est terminée que lorsque l’appareil se reconnecte, indique la
version prévue, conserve sa configuration et réussit l’essai local.

Pour obtenir le contexte en amont, consultez les
[instructions officielles de mise à jour OTA de MeshCore](https://blog.meshcore.io/2026/04/02/nrf-ota-update).

## Récupération après l’échec d’une mise à jour

Si le même fichier ZIP vérifié ne peut pas être installé sur l’appareil DFU
attendu, cessez les tentatives à distance et récupérez par USB la carte et le
rôle exacts. Restaurez l’identité et les réglages sauvegardés lorsque cette
fonction est offerte, puis reprenez toute la vérification. N’essayez jamais
l’artéfact d’une autre carte au hasard pour effectuer une récupération.

## Après la mise à jour

Consignez l’ancienne et la nouvelle version, le nom et la source de l’artéfact,
l’identité de l’appareil, le résultat, la vérification des réglages, l’essai
radio et l’état de la récupération dans le dossier d’entretien du répéteur.

## Ce qui a été testé

La recommandation d’utiliser Android et les réglages DFU proviennent d’essais
menés par la communauté. Ils ne constituent pas une matrice d’essai complète
pour chaque carte, version du micrologiciel, téléphone ou application.
