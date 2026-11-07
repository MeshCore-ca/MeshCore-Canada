---
title: Configurer un serveur de salon
description: Programmez, configurez et testez un serveur de salon MeshCore au Canada, sur une seule page.
audience:
  - room-server-operator
task: start-room-server
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-10-29
review_by: 2026-12-31
tested_with:
  content_baseline: 7daceca
  review_method: bilingual content and navigation checks, not physical-device testing
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Content and linked setup paths reviewed on 2026-10-29; radio and installation checks remain operator tasks.
difficulty: intermediate
estimated_time: 20-30 minutes
destructive: true
requires:
  - supported-room-server
  - data-capable-usb-cable
---

# Configurer un serveur de salon

Un serveur de salon héberge un salon de discussion partagé sur le réseau. Les
gens s’y connectent avec un mot de passe invité et peuvent rattraper les
messages manqués. Ce n’est pas un répéteur : installez un
[répéteur](../config/index.md) distinct pour la couverture.

## Avant de commencer

- **Un appareil compatible** pour lequel le
  [programme de mise à jour MeshCore](https://meshcore.io/flasher) offre le
  micrologiciel **Room Server**.
- **Un câble USB de données.** Les câbles de recharge seulement ne fonctionnent pas.
- **Chrome ou Edge sur un ordinateur.** Le programme exige
  [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).
- **Une personne responsable.** Décidez qui garde le mot de passe
  administrateur et peut brancher l’appareil par USB au besoin.

### Appareil déjà utilisé? Sauvegardez-le d’abord

!!! danger "Erase Flash supprime les données du serveur de salon"
    Cela comprend son identité (clé privée), les messages du salon, les accès
    invité et administrateur, son nom et ses réglages radio.

1. Notez son nom, ses réglages radio et ses réglages d’accès.
2. Sauvegardez sa clé privée avec un outil compatible. Gardez-la secrète.
3. Conservez les mots de passe dans un gestionnaire de mots de passe, jamais
   dans une capture d’écran, un billet ou une discussion.

Si vous ne pouvez pas sauvegarder quelque chose d’important,
**arrêtez-vous avant Erase Flash** et [demandez de l’aide](get-help.md).

## 1. Programmer le micrologiciel

1. Branchez l’appareil à votre ordinateur par USB.
2. Ouvrez le [programme de mise à jour MeshCore](https://meshcore.io/flasher) et
   sélectionnez votre carte exacte.
3. Sélectionnez **Room Server** et la version du micrologiciel pour cette carte.
4. Suivez les étapes de connexion du programme. Utilisez **Enter DFU Mode**
   seulement si votre carte le demande.
5. Appareil neuf ou réinitialisation voulue? Sauvegardez d’abord, puis cliquez
   sur **Erase Flash** seulement si les instructions de votre carte l’exigent.
   Pour une mise à jour, laissez l’effacement désactivé.
6. Cliquez sur **Flash** et attendez le message de fin avant de débrancher.

### Vérifier que ça a fonctionné

L’appareil redémarre comme serveur de salon, et **Configure via USB** dans le
programme peut s’y connecter.

### Récupération si la programmation échoue

N’effacez pas l’appareil à répétition. Laissez-le branché, actualisez le
programme, remettez la carte en mode DFU, sélectionnez la même carte et le
micrologiciel **Room Server**, puis réessayez **Flash**. Si la carte n’apparaît
plus, [demandez de l’aide](get-help.md) avant d’essayer autre chose.

## 2. Le nommer et régler les mots de passe et la radio

1. Dans le programme, cliquez sur **Configure via USB** et connectez-vous à l’appareil.
2. Donnez-lui un nom qui ne révèle pas un emplacement privé.
3. Choisissez un **mot de passe invité** (partagé avec les personnes qui
   rejoignent le salon) et un **mot de passe administrateur** différent (gardé
   privé). Conservez-les dans un gestionnaire de mots de passe.
4. Consultez le [répertoire des communautés](../provinces/index.md) pour les
   réglages de votre région. Si aucun n’est indiqué, choisissez **Canada**
   (`910.525 MHz / 62.5 kHz / SF7 / CR5`) et des parcours de **3 octets**
   (`set path.hash.mode 2`).
5. Enregistrez et redémarrez.

Utilisez **Canada**, sauf si votre communauté indique d’autres paramètres. Si
Canada n’est pas offert, suivez les
[consignes pour l’ancien préréglage](../provinces/index.md#canada-baseline).

## Tester l’appareil

Faites-le sur l’établi avant de l’installer dans un endroit difficile d’accès.

1. Envoyez une annonce depuis le serveur de salon.
2. Vérifiez qu’un compagnon à proximité le trouve.
3. Connectez-vous depuis le compagnon avec le mot de passe invité.
4. Redémarrez-le et vérifiez que son nom, ses mots de passe et ses réglages
   radio sont conservés.

En cas d’échec, gardez-le branché par USB, programmez-le de nouveau et refaites
l’essai.

## Et ensuite?

- Annoncez le salon à votre [communauté locale](../provinces/index.md) et
  expliquez comment obtenir le mot de passe invité.
- Demandez à une personne à proximité de l’essayer depuis son propre compagnon.
- Un problème? [Obtenez de l’aide](get-help.md).
