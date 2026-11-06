---
title: Configurer un appareil compagnon
description: Programmez, configurez et testez un appareil compagnon MeshCore au Canada, sur une seule page.
audience:
  - first-time-user
  - companion-owner
task: start-companion
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-11-02
review_by: 2026-12-31
tested_with:
  content_baseline: 7daceca
  review_method: bilingual content and navigation checks, not physical-device testing
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Content and linked setup paths reviewed on 2026-10-29; radio and installation checks remain operator tasks.
difficulty: beginner
estimated_time: 20-30 minutes
destructive: true
requires:
  - supported-companion
  - data-capable-usb-cable
---

# Configurer un appareil compagnon

Un appareil compagnon est votre radio MeshCore personnelle. Il se jumelle à
l’application MeshCore sur votre téléphone pour envoyer et recevoir des
messages. Il ne relaie pas les messages des autres. Comptez de 20 à 30 minutes.

## Avant de commencer

- **Un appareil compatible.** Consultez les
  [appareils compagnons recommandés](../hardware/recommended-companions.md) et
  vérifiez que le [programme de mise à jour MeshCore](https://meshcore.io/flasher)
  propose votre carte exacte.
- **Un câble USB de données.** Les câbles de recharge seulement ne fonctionnent pas.
- **Chrome ou Edge sur un ordinateur.** Le programme exige
  [Web Serial](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility).
  Certaines cartes exigent aussi un pilote série USB.
- **L’application MeshCore** sur votre téléphone, version 1.43 ou plus récente.

### Appareil déjà utilisé? Sauvegardez-le d’abord

!!! danger "Erase Flash supprime les données enregistrées dans l’appareil"
    Cela comprend son identité (clé privée), son nom, ses contacts, ses canaux
    et ses réglages radio. Une identité effacée ne peut être récupérée que si
    vous l’avez sauvegardée.

1. Connectez-vous avec l’application qui le gère actuellement.
2. Notez son nom, ses réglages radio et tout ce que vous devrez régler de nouveau.
3. Exportez sa clé privée avec l’option de sauvegarde de votre application.
   Gardez-la secrète : ne la publiez jamais dans une capture d’écran, une
   discussion ou un billet.
4. Exportez les contacts et les canaux si votre application le permet.

Si vous ne pouvez pas sauvegarder quelque chose d’important,
**arrêtez-vous avant Erase Flash** et [demandez de l’aide](get-help.md).

## 1. Programmer le micrologiciel

1. Branchez l’appareil à votre ordinateur par USB.
2. Ouvrez le [programme de mise à jour MeshCore](https://meshcore.io/flasher) et
   sélectionnez votre carte exacte.
3. Sélectionnez **Companion Radio (Bluetooth)** et la version du micrologiciel
   pour cette carte.
4. Suivez les étapes de connexion du programme. Utilisez **Enter DFU Mode**
   seulement si votre carte le demande.
5. Appareil neuf ou réinitialisation voulue? Sauvegardez d’abord, puis cliquez
   sur **Erase Flash** seulement si les instructions de votre carte l’exigent.
   Pour une mise à jour, laissez l’effacement désactivé.
6. Cliquez sur **Flash** et attendez le message de fin avant de débrancher.

### Vérifier que ça a fonctionné

Une fois terminé, la carte redémarre comme compagnon et l’application peut la
trouver.

### Récupération si la programmation échoue

N’effacez pas l’appareil à répétition. Laissez-le branché, actualisez le
programme, remettez la carte en mode DFU, sélectionnez la même carte et le
micrologiciel du compagnon, puis réessayez **Flash**. Si la carte n’apparaît
plus, [demandez de l’aide](get-help.md) avant d’essayer autre chose.

## 2. Le nommer et régler la radio

1. Ouvrez l’application MeshCore et jumelez votre compagnon.
2. Donnez-lui un nom qui ne révèle pas où vous habitez.
3. Consultez le [répertoire des communautés](../provinces/index.md) pour les
   réglages de votre région. Si aucun n’est indiqué, choisissez **Canada**
   (`910.525 MHz / 62.5 kHz / SF7 / CR5`) et confirmez les parcours de **3 octets**.
4. Enregistrez. L’appareil redémarre; reconnectez-vous ensuite.

Utilisez **Canada**, sauf si votre communauté indique d’autres paramètres. Si
Canada n’apparaît pas dans votre application, suivez les
[consignes pour l’ancien préréglage](../provinces/index.md#canada-baseline).

## 3. Régler votre portée par défaut {#choisir-un-scope}

!!! note "Réglez dès maintenant votre portée par défaut"
    Les répéteurs configurés avec l’[outil de configuration de meshcore.ca](../config/index.md)
    relaient les messages selon leur portée. Les répéteurs de bordure ne
    relaient pas les messages sans portée : sans portée par défaut, vos
    messages risquent de ne pas dépasser votre secteur.

    - **Ontario ou Québec :** utilisez `onqc`.
    - **Ailleurs :** utilisez le code de votre province, comme `ns` ou `bc`,
      sauf si votre communauté a convenu d’autre chose.

### La régler dans l’application MeshCore {#regler-votre-portee-par-defaut}

Les captures d’écran utilisent `onqc`; tapez votre propre portée si vous êtes
ailleurs.

1. Connectez votre appareil compagnon à l’application MeshCore et touchez la **roue des réglages** en haut à droite.

    [![Liste des contacts de l’application MeshCore avec la roue des réglages en haut à droite](../assets/images/onqc-scopes/companion-01-connected.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-01-connected.webp)

2. Descendez jusqu’à **Network Settings** et touchez **Default Region Scope**.

    [![Écran Settings avec Network Settings et Default Region Scope](../assets/images/onqc-scopes/companion-02-settings.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-02-settings.webp)

3. Si votre portée n’est pas dans la liste, touchez **Add Region**, ou le **+** en haut à droite.

    [![Écran Select Region sans région et bouton Add Region](../assets/images/onqc-scopes/companion-03-select-region.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-03-select-region.webp)

4. Tapez votre portée, tout en minuscules, et touchez le **crochet** en haut à droite.

    [![Écran Add Region avec onqc tapé](../assets/images/onqc-scopes/companion-04-add-region.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-04-add-region.webp)

5. Touchez votre portée pour la sélectionner.

    [![Écran Select Region avec onqc dans la liste](../assets/images/onqc-scopes/companion-05-pick-onqc.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-05-pick-onqc.webp)

6. Default Region Scope affiche maintenant votre portée. Touchez le **crochet** en haut à droite. Il tourne pendant l’enregistrement, puis **Settings Saved!** apparaît.

    [![Settings avec onqc comme portée par défaut et le message Settings Saved](../assets/images/onqc-scopes/companion-06-saved.webp){ loading=lazy width="300" height="652" }](../assets/images/onqc-scopes/companion-06-saved.webp)

- Trouvez votre code de ville sur la page [Trouver votre zone](../config/map.md).
- **Ontario et Québec :** utilisez aussi `onqc` pour le canal Public, et votre
  code de ville (comme `yow`) pour les canaux de test. Ouvrez le canal, touchez
  **⋮** et choisissez **Set Region Scope**.
- Réservez `can` et `na` à un usage futur.
- Vous exploitez un robot ou MeshMapper? Suivez les
  [consignes pour les robots et MeshMapper](../config/guide.md#bots-and-meshmapper).

[Comprendre les répéteurs](../config/guide.md#companions) explique les portées,
avec des exemples. Les portées ne changent pas les réglages radio.

## Tester l’appareil

1. Envoyez un message dans le canal **Public**.
2. **Heard X Repeats** signifie qu’un répéteur l’a capté. Un simple **Sent** ne
   veut pas dire que vos réglages sont incorrects : vous êtes peut-être hors de
   portée. Rendez-vous dans une zone couverte ou demandez à votre communauté de
   vous aider à faire l’essai.
3. Redémarrez le compagnon et vérifiez que son nom et ses réglages sont conservés.

## Et ensuite?

- [Trouvez votre communauté](../provinces/index.md) et présentez-vous.
- Apprenez l’application avec les [guides pratiques de MeshCore](../meshcore/general-howto.md).
- Personne ne vous entend? [Obtenez de l’aide](get-help.md).
