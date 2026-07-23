---
title: Programmer, configurer et tester un répéteur sur l’établi
description: Sauvegardez, programmez par USB, configurez, vérifiez et récupérez un répéteur MeshCore avant qu’il quitte l’établi.
audience:
  - repeater-builder
  - network-operator
task: flash-repeater
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 30-60 minutes
destructive: true
requires:
  - supported-repeater-board
  - physical-usb-access
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# Programmer, configurer et tester un répéteur sur l’établi

Confirmez la carte exacte, le chargeur d’amorçage, la cible du répéteur et le
fichier du micrologiciel dans les sources officielles avant d’apporter des
changements. Gardez le répéteur sur l’établi jusqu’à ce qu’il ait réussi toutes
les vérifications de ce guide.

## Avant de changer le micrologiciel

!!! danger "Sauvegardez le répéteur avant tout effacement"
    **Erase Flash** peut supprimer l’identité ou la clé privée du répéteur, l’accès administrateur, le nom, l’emplacement, les définitions de régions, les réglages radio et toute autre configuration enregistrée. L’identité d’un appareil déployé ne peut pas être recréée si sa clé privée n’a pas été sauvegardée.

Pour un répéteur existant, notez ou exportez :

- le modèle exact de la carte, le rôle et la version actuelle du micrologiciel;
- le nom de l’appareil, les réglages radio, l’emplacement choisi, les réglages d’annonce, le mode de hachage des parcours et la configuration des régions;
- les renseignements d’accès administrateur et invité dans votre gestionnaire de mots de passe;
- la clé privée au moyen d’une méthode de sauvegarde sécurisée et compatible.

Ne publiez jamais la clé privée ni les mots de passe dans un billet, une capture
d’écran, un journal ou une discussion. Si une sauvegarde requise ne peut pas
être effectuée, arrêtez-vous avant l’effacement.

## Avant de commencer

- [ ] La carte exacte et son rôle sont confirmés.
- [ ] L’identité et les réglages existants sont sauvegardés de façon sécuritaire.
- [ ] Un câble USB de données fiable et une alimentation stable sont disponibles.
- [ ] Je peux retrouver un accès USB physique si la configuration ou une mise à jour échoue.
- [ ] J’ai consulté le [répertoire des communautés](../provinces/index.md) et le [configurateur de répéteur](../config/index.md) pour connaître la bonne région et les bons réglages locaux.
- [ ] Je vais tester le répéteur sur l’établi avant de l’installer en hauteur ou dans un boîtier éloigné.

## Ce que la programmation change

Un effacement remplace le micrologiciel et peut supprimer l’identité et les
réglages. La configuration inscrit aussi des valeurs de radio, d’annonce, de
hachage des parcours, d’accès, d’emplacement et de région qui influencent le
réseau partagé.

## Plan de récupération

Gardez sur l’établi la méthode de récupération USB propre à la carte exacte, un
câble de données fiable, l’identité et les réglages sauvegardés ainsi que le
fichier de micrologiciel vérifié. Si l’effacement ou la programmation échoue,
n’essayez pas la cible d’une autre carte; remettez la carte exacte en mode DFU
ou chargeur d’amorçage, puis réessayez par USB avec le même rôle vérifié.

## Décision concernant le chargeur d’amorçage nRF52 { #nrf52-bootloader-decision }

Ignorez cette section pour les cartes qui ne sont pas fondées sur nRF52.

Pour les cartes nRF52 prises en charge, MeshCore Canada demande actuellement
aux responsables d’utiliser les [versions OTAFIX](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases)
avant de compter sur la récupération OTA. Confirmez que le fichier correspond
à la carte exacte; utiliser le chargeur d’amorçage d’une autre carte peut exiger
une récupération physique.

Téléchargez uniquement le fichier OTAFIX actuel dont le nom de carte correspond
exactement à votre matériel. N’utilisez pas un nom de fichier copié d’un ancien
guide ou d’une capture d’écran.

1. Téléchargez le fichier `update-*.uf2` correspondant depuis la page des versions OTAFIX.
2. Branchez la carte par USB.
3. Activez son mode de chargeur d’amorçage UF2. Sur une RAK4631, il faut normalement appuyer deux fois sur le bouton près du port USB; pour les autres cartes, utilisez la méthode de réinitialisation documentée.
4. Confirmez qu’un lecteur USB apparaît et examinez `INFO.TXT` pour vérifier l’identité de la carte.
5. Copiez le fichier UF2 correspondant sur ce lecteur. Le lecteur peut se déconnecter pendant le redémarrage de la carte.
6. Revenez au mode de chargeur d’amorçage et confirmez que `INFO.TXT` indique la version `0.9.2` avant de continuer.

Si l’identité de la carte ou la version attendue ne correspond pas, arrêtez et
récupérez l’appareil par USB avant de programmer MeshCore.

## Programmer par USB — méthode recommandée

Utilisez le [programme de mise à jour Web MeshCore](https://meshcore.io/flasher)
officiel dans un navigateur compatible avec
[Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

1. Branchez le répéteur par USB.
2. Sélectionnez le modèle exact du matériel.
3. Sélectionnez **Repeater** comme rôle et choisissez la version destinée à cette carte.
4. Cliquez sur **Enter DFU Mode** et attendez que le programme trouve la carte.
5. Vérifiez de nouveau la carte et le rôle sélectionnés.
6. Cliquez sur **Erase Flash** et attendez le message confirmant la réussite de l’effacement.
7. Cliquez sur **Flash** et attendez la fin de l’opération avant de débrancher l’appareil.

Si la programmation échoue après l’effacement, n’effacez pas l’appareil à
répétition. Actualisez la page, remettez la carte en mode DFU, vérifiez de
nouveau la cible et réessayez **Flash**. Utilisez la procédure de récupération
USB de la carte si elle n’apparaît plus.

## Vérifier la programmation

Le programme de mise à jour confirme la fin de l’opération, la carte redémarre
comme répéteur et la console de configuration peut s’y reconnecter. Si cet état
n’est pas atteint, suivez le plan de récupération avant de configurer l’appareil.

## Configurer le répéteur

1. Dans le programme de mise à jour Web MeshCore, ouvrez **Repeater Setup**.
2. Connectez-vous au répéteur et activez **Show Advanced Settings** pour afficher les champs requis.
3. Entrez l’emplacement prévu ou utilisez la carte. Ne publiez pas un emplacement privé exact à moins que ce soit approprié pour le site.
4. Donnez-lui un nom descriptif, comme `Callsign_R1` ou `Downtown_R1`.
5. Créez un mot de passe administrateur unique et conservez-le de façon sécuritaire.
6. Confirmez que la communauté locale n’a pas publié de réglages différents. Sinon, appliquez **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
7. Utilisez les valeurs d’annonce actuellement recommandées par MeshCore Canada :
   - **Advert Interval:** `60` minutes
   - **Flood Advert Interval:** `24` heures
   - **Flood Max:** `64`
8. Utilisez le [configurateur de répéteur](../config/index.md) pour obtenir les commandes de région et le mode de hachage des parcours. Le réglage canadien par défaut utilise 3 octets (`set path.hash.mode 2`); utilisez les réglages locaux différents lorsque votre communauté en publie.
9. Ajoutez les renseignements sur le propriétaire seulement s’ils conviennent à des annonces publiques.
10. Enregistrez les réglages et redémarrez l’appareil.

### Détection des boucles { #loop-detection }

Le micrologiciel de répéteur **1.14 ou une version plus récente** peut rejeter
les paquets qui repassent plusieurs fois par le même répéteur. Modifiez ce
réglage uniquement en coordination avec les responsables locaux. Notez la
valeur actuelle, puis exécutez :

```text
get loop.detect
set loop.detect moderate
get loop.detect
```

La dernière commande doit indiquer `moderate`. Surveillez toute perte de trafic
légitime et restaurez la valeur notée si la livraison se dégrade. Ce réglage
peut limiter une tempête de paquets; il ne répare pas un répéteur défectueux et
ne prouve pas que le réseau maillé est sain. Consultez la
[référence officielle de la CLI](https://docs.meshcore.io/cli_commands/#view-or-change-this-nodes-loop-detection){ target="_blank" rel="noopener" }.

## Vérifier et tester sur l’établi

1. Reconnectez-vous après le redémarrage et synchronisez l’horloge du répéteur.
2. Confirmez que la version du micrologiciel, le nom de l’appareil, les réglages radio, le mode de hachage des parcours, les réglages d’annonce et la configuration des régions correspondent au plan.
3. Envoyez une annonce et confirmez qu’un compagnon à proximité la reçoit.
4. Redémarrez encore une fois, reconnectez-vous et confirmez que la configuration enregistrée est intacte.
5. Vérifiez l’administration à distance depuis le compagnon prévu avant de fermer un boîtier ou d’installer le répéteur dans un endroit éloigné.

Après chaque redémarrage, synchronisez de nouveau l’horloge du répéteur.
L’acheminement peut continuer même si l’horloge est inexacte, mais une heure
d’annonce périmée peut empêcher les compagnons d’accepter une nouvelle annonce.

Ne déployez pas le répéteur avant qu’il ait réussi cet essai sur l’établi et que
la récupération USB demeure pratique.

## Changements d’identité sur 1 octet

La plupart des responsables ne devraient pas changer l’identité d’un répéteur
après sa configuration. Une région qui coordonne encore des identifiants sur
1 octet peut demander de le faire. Suivez
[Générer un identifiant de répéteur](generate-repeater-id.md) uniquement lorsque
la personne responsable de la région confirme que c’est nécessaire, et gardez
l’ancienne clé privée comme moyen de revenir en arrière.

## Avant l’installation

Gardez le répéteur sur l’établi jusqu’à ce qu’il ait réussi toutes les
vérifications. Consultez ensuite le [plan de montage](../hardware/repeater-mounting-options.md)
et conservez un accès USB physique.

## Sources

- [Programme de mise à jour Web officiel de MeshCore](https://meshcore.io/flasher)
- [Code source et versions officielles de MeshCore](https://github.com/meshcore-dev/MeshCore)
- [Versions OTAFIX citées par la communauté](https://github.com/oltaco/Adafruit_nRF52_Bootloader_OTAFIX/releases)
