---
title: Programmer et configurer un serveur de salon
description: Sauvegardez, programmez, sécurisez, vérifiez et récupérez un serveur de salon MeshCore pris en charge avant son déploiement.
audience:
  - room-server-operator
  - network-operator
task: flash-room-server
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 30-45 minutes
destructive: true
requires:
  - supported-room-server-board
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# Programmer et configurer un serveur de salon

Confirmez que le programme officiel de mise à jour prend en charge votre modèle
exact de carte comme serveur de salon. Sauvegardez ensuite l’appareil,
programmez-le, sécurisez les accès et mettez-le à l’essai avec un compagnon.

## Avant d’effacer l’appareil

!!! danger "Erase Flash supprime les données enregistrées du serveur de salon"
    L’effacement peut supprimer l’identité ou la clé privée de l’appareil, les données du salon, les accès invité et administrateur, le nom, les réglages radio et toute autre configuration enregistrée. Sauvegardez tout ce que vous devez conserver avant de continuer.

Pour un appareil existant, notez la carte, la version du micrologiciel, le nom,
le rôle, les réglages radio et la configuration des accès. Exportez ou notez de
façon sécuritaire la clé privée avec un outil compatible. Conservez les mots de
passe dans un gestionnaire de mots de passe et ne les placez jamais dans une
capture d’écran, un billet ou une discussion.

Si l’historique du salon ou l’identité ne peut pas être sauvegardé et doit être
conservé, arrêtez-vous avant l’effacement.

## Avant de commencer

- [ ] La carte exacte et le rôle **Room Server** sont confirmés.
- [ ] L’identité, les données du salon et les réglages existants ont été sauvegardés lorsque cette fonction est offerte.
- [ ] Un câble USB de données fiable et une alimentation stable sont disponibles.
- [ ] J’utilise un navigateur actuel compatible avec Web Serial, comme Chrome ou Edge.
- [ ] J’ai vérifié si la page de la communauté locale indique d’autres réglages radio.

## Ce que la programmation change

La programmation remplace le micrologiciel, et **Erase Flash** peut supprimer
l’identité, les données du salon, les réglages d’accès et la configuration
radio. La configuration inscrit les accès invité et administrateur, le nom et
les réglages radio locaux.

## Plan de récupération

Avant l’effacement, gardez à portée de main la méthode de récupération USB
propre à la carte exacte, l’identité et les réglages sauvegardés, un câble
fiable et l’artéfact **Room Server** vérifié. Si la programmation échoue,
remettez cette même carte en mode DFU et réessayez avec la même cible vérifiée;
n’utilisez pas les fichiers d’une autre carte.

## Programmer le micrologiciel

1. Ouvrez le [programme de mise à jour Web MeshCore](https://meshcore.io/flasher) officiel.
2. Sélectionnez le modèle exact de l’appareil.
3. Sélectionnez **Room Server** et la version destinée à cette carte.
4. Cliquez sur **Enter DFU Mode** et attendez que l’appareil attendu apparaisse.
5. Vérifiez de nouveau le matériel et le rôle sélectionnés.
6. Cliquez sur **Erase Flash** et attendez le message confirmant la réussite de l’effacement.
7. Cliquez sur **Flash** et attendez la fin de l’opération avant de débrancher l’appareil.

Si la programmation échoue après l’effacement, laissez l’appareil branché,
actualisez le programme de mise à jour, retournez en mode DFU, confirmez la
carte et le rôle, puis réessayez **Flash**. Si l’appareil n’est plus détecté,
utilisez la procédure de récupération USB documentée de la carte.

## Vérifier la programmation

Le programme de mise à jour confirme la fin de l’opération, l’appareil redémarre
comme **Room Server** et **Configure via USB** peut s’y reconnecter. Sinon,
suivez le plan de récupération avant de configurer les accès.

## Configurer le serveur de salon

1. Après la programmation, cliquez sur **Configure via USB**.
2. Sélectionnez l’appareil série du serveur de salon et connectez-vous.
3. Donnez-lui un nom descriptif qui ne révèle pas un emplacement privé.
4. Créez des mots de passe invité et administrateur distincts et uniques, puis conservez-les de façon sécuritaire.
   - Le mot de passe invité est remis aux personnes qui doivent accéder au salon.
   - Le mot de passe administrateur contrôle la gestion et ne doit pas être utilisé comme mot de passe invité.
5. Vérifiez si la page de la communauté locale indique d’autres réglages. Si elle n’en indique aucun, utilisez les réglages par défaut du Canada : **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
6. Enregistrez les réglages et redémarrez l’appareil.

## S’assurer que tout fonctionne

1. Reconnectez-vous à la console après le redémarrage et confirmez le nom, le rôle et les réglages radio.
2. Envoyez une annonce.
3. Confirmez qu’un compagnon découvre le serveur de salon.
4. Ouvrez une session depuis le compagnon avec le mot de passe invité.
5. Confirmez que le salon fonctionne comme prévu, puis redémarrez de nouveau l’appareil et vérifiez que les réglages sont conservés.

Ne déployez pas le serveur à distance avant que la récupération USB, l’accès
administrateur, la découverte et l’accès invité fonctionnent tous sur l’établi.

## Récupération et retour en arrière

Si la découverte, l’accès invité, l’accès administrateur ou la conservation des
réglages échoue, gardez le serveur à proximité et accessible par USB. Restaurez
l’identité et les réglages sauvegardés lorsque cette fonction est offerte, ou
reprogrammez par USB la cible **Room Server** exacte, puis reprenez la
vérification. Ne déployez pas un serveur dont l’accès ou la récupération est
incertain.

## Prochaine étape

Lorsque le serveur résiste au redémarrage et réussit les vérifications d’accès,
[trouvez la communauté locale](../provinces/index.md) et consignez le nom de la
personne qui entretient le salon ainsi que son dossier de récupération.

## Sources

- [Programme de mise à jour Web officiel de MeshCore](https://meshcore.io/flasher)
- [Code source et versions officielles de MeshCore](https://github.com/meshcore-dev/MeshCore)
