---
title: Programmer et configurer un compagnon
description: Sauvegardez, programmez, configurez, vérifiez et récupérez un compagnon MeshCore pris en charge sans perdre ses données d’identité importantes.
audience:
  - first-time-user
  - companion-owner
task: flash-companion
scope: canada-baseline
status: draft
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: beginner
estimated_time: 20-30 minutes
destructive: true
requires:
  - supported-companion
  - data-capable-usb-cable
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# Programmer et configurer un compagnon

Confirmez que le programme officiel de mise à jour prend en charge votre modèle
exact de carte comme compagnon. Utilisez ensuite ce guide pour sauvegarder
l’appareil, le programmer et rejoindre votre réseau maillé local. Consultez le
[répertoire des communautés](../provinces/index.md) pour savoir si votre
communauté utilise des réglages locaux différents.

## Avant d’effacer l’appareil

!!! danger "Erase Flash supprime les données enregistrées dans l’appareil"
    L’effacement peut supprimer l’identité ou la clé privée du nœud, son nom, ses contacts, ses canaux, ses réglages radio et toute autre configuration enregistrée. Une identité effacée ne peut être récupérée que si vous l’avez sauvegardée.

S’il ne s’agit pas d’un appareil neuf :

1. Connectez-vous au moyen de l’application ou de l’outil de configuration qui le gère actuellement.
2. Notez le modèle de la carte, son rôle, la version du micrologiciel, le nom de l’appareil, les réglages radio et tout autre réglage à recréer.
3. Exportez ou notez de façon sécuritaire l’identité ou la clé privée de l’appareil en utilisant une méthode de sauvegarde compatible avec ce micrologiciel. Conservez-la comme secret; ne la publiez jamais dans une capture d’écran, une discussion, un billet ou un journal.
4. Exportez les contacts ou les canaux si votre application offre cette option.

Si vous ne pouvez pas sauvegarder une identité ou une configuration importante,
**arrêtez-vous avant Erase Flash** et demandez l’aide de votre communauté locale.

## Avant de commencer

- [ ] J’ai choisi le modèle exact indiqué sur la carte ou signalé par celle-ci.
- [ ] J’ai sauvegardé tout ce que je dois conserver d’un appareil existant.
- [ ] J’ai un câble USB de données fiable et une alimentation stable.
- [ ] J’utilise un navigateur compatible avec Web Serial, comme une version actuelle de Chrome ou d’Edge.
- [ ] Je sais comment remettre cette carte en mode DFU ou chargeur d’amorçage si la programmation échoue.

!!! warning "Pilotes série USB"
    Certaines cartes exigent un pilote série USB avant que le navigateur puisse s’y connecter.

## Ce que la programmation change

La programmation remplace le micrologiciel installé et, lorsque **Erase Flash**
est sélectionné, supprime l’identité et la configuration enregistrées. La
configuration suivante inscrit le nom de l’appareil et les réglages radio locaux.

## Programmer le micrologiciel du compagnon

Utilisez le [programme de mise à jour Web MeshCore](https://meshcore.io/flasher)
officiel. Il faut un navigateur compatible avec
[Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).

1. Branchez l’appareil par USB.
2. Sélectionnez le modèle exact de la carte.
3. Sélectionnez **Companion Radio (Bluetooth)**.
4. Sélectionnez la version du micrologiciel destinée à cette carte.
5. Cliquez sur **Enter DFU Mode**. Le programme devrait indiquer qu’il a trouvé un appareil dans le mode attendu.
6. Vérifiez de nouveau le matériel et le micrologiciel sélectionnés.
7. Cliquez sur **Erase Flash**, puis attendez le message confirmant la réussite de l’effacement.
8. Cliquez sur **Flash** et attendez le message de fin avant de débrancher l’appareil.

## Récupération en cas d’échec

N’effacez pas l’appareil à répétition. Laissez-le branché, actualisez le
programme de mise à jour, remettez la carte en mode DFU, sélectionnez de nouveau
la carte exacte et le micrologiciel du compagnon, puis réessayez **Flash**. Si
la carte n’apparaît plus, suivez sa méthode documentée de récupération du
chargeur d’amorçage ou demandez de l’aide avant d’essayer une autre cible.

## Vérifier la programmation

Le programme de mise à jour confirme la fin de l’opération, la carte redémarre
comme compagnon et l’application compatible peut la détecter. S’il manque une
de ces étapes, suivez la procédure de récupération avant de modifier un autre
réglage.

## Configurer le compagnon

1. Jumelez le nœud à une application MeshCore compatible sur votre téléphone ou votre ordinateur.
2. Donnez-lui un nom descriptif qui ne révèle pas un emplacement privé.
3. Vérifiez si la page de votre communauté locale indique des réglages différents.
4. Si elle n’en indique aucun, utilisez les réglages par défaut du Canada : **USA/Canada (Recommended)** (`910.525 MHz / 62.5 kHz / SF7 / CR5`).
5. Enregistrez les réglages, puis reconnectez-vous après le redémarrage de l’appareil.

Le réglage facultatif **Message Settings → Auto Reset Path** détermine comment
l’application gère les changements de parcours. Conservez sa valeur par défaut,
sauf si votre méthode d’essai locale exige un autre réglage.

## Vérifier avant l’utilisation courante

1. Confirmez que l’application se reconnecte et affiche le nom de l’appareil et les réglages radio attendus.
2. Envoyez un message d’essai dans le canal **Public**.
3. Une réponse comme **Heard X Repeats** indique qu’au moins un répéteur a signalé l’avoir reçu. Un simple résultat **Sent** ne prouve pas que les réglages sont incorrects; rendez-vous dans une zone où la couverture est connue ou demandez à la communauté locale de vous aider à faire l’essai.

La configuration n’est terminée que si les réglages enregistrés résistent à un
redémarrage et qu’un essai local réussit.

## Après la programmation

Lorsque le compagnon a réussi le redémarrage et l’essai de message local,
[trouvez votre communauté](../provinces/index.md) et conservez la méthode de
récupération USB propre à la carte dans le dossier de l’appareil.

## Sources

- [Programme de mise à jour Web officiel de MeshCore](https://meshcore.io/flasher)
- [Code source et versions officielles de MeshCore](https://github.com/meshcore-dev/MeshCore)
