---
title: Commencer avec un appareil compagnon
description: Préparez, configurez et vérifiez un appareil compagnon MeshCore personnel pour une communauté canadienne.
audience:
  - first-time-user
  - companion-owner
task: start-companion
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
difficulty: beginner
estimated_time: 20-30 minutes
destructive: false
requires:
  - supported-companion
  - data-capable-usb-cable
---

# Commencer avec un appareil compagnon

Un appareil compagnon sert à envoyer et à recevoir des messages personnels. Il
ne relaie pas le trafic des autres personnes. La plupart se jumellent à une
application; certains possèdent leur propre écran et leurs propres commandes.

[Installer et configurer un compagnon](../meshcore/flash-companion.md){ .md-button .md-button--primary }

## Avant de commencer

- Consultez les [appareils compagnons recommandés](../hardware/recommended-companions.md).
- Confirmez que le guide détaillé de reprogrammation indique votre appareil.
- Utilisez un câble USB de données et un navigateur pris en charge.
- Notez l’identité et les paramètres dont vous aurez besoin avant toute étape
  d’effacement.

## Ce qui sera modifié

Le guide lié remplace le micrologiciel de l’appareil et le configure comme
compagnon. Arrêtez-vous avant l’effacement si vous ne pouvez pas récupérer les
renseignements dont vous avez besoin.



## Installer le micrologiciel du compagnon

Suivez le guide [Installer et configurer un compagnon](../meshcore/flash-companion.md).

## Choisir les bons paramètres radio

Utilisez le préréglage **Canada** et le hachage des chemins
sur **3 octets**, sauf si votre communauté indique d’autres paramètres.

Si Canada n’apparaît pas, suivez les [consignes pour l’ancien préréglage](../provinces/index.md#canada-baseline).

!!! warning "Utilisez les mêmes paramètres que votre communauté"
    Consultez le [répertoire des communautés](../provinces/index.md). Si votre
    communauté publie d’autres paramètres, utilisez-les.

Redémarrez l’appareil après avoir modifié les paramètres radio, puis envoyez
une annonce.

## Choisir une portée (scope) {#choisir-un-scope}

!!! note "Réglez dès maintenant votre portée par défaut"
    Les répéteurs utilisent maintenant les portées pour choisir les messages à
    retransmettre. Une portée par défaut sur votre compagnon fait en sorte que
    vos messages aillent aussi loin qu’il le faut.

    - **Ontario ou Québec :** utilisez `onqc`.
    - **Ailleurs :** utilisez le code de votre province, comme `ns` ou `bc`,
      sauf si votre communauté a convenu d’autre chose.

Pour la régler, connectez votre compagnon à l’application MeshCore (version 1.43 ou plus récente), puis :

1. Touchez la **roue des réglages** en haut à droite.
2. Descendez jusqu’à **Network Settings** et touchez **Default Region Scope**.
3. Si votre portée n’est pas dans la liste, touchez **Add Region** (ou le **+**), tapez-la en minuscules et touchez le crochet.
4. Touchez votre portée pour la sélectionner, puis touchez le crochet en haut à droite. **Settings Saved!** apparaît.

Trouvez votre code de ville sur la [carte des régions IATA](../config/map.md). En Ontario et au Québec, utilisez aussi `onqc` pour le canal Public et votre code de ville, comme `yow`, pour les canaux de test : ouvrez le canal, touchez **⋮** et choisissez **Set Region Scope**. Réservez `can` et `na` à un usage futur.

Les responsables de robots et de MeshMapper suivent les [consignes pour les robots et MeshMapper](../proposals/onqc-scopes.md#robots-et-meshmapper).

Le [guide des portées](../config/standard.md) présente les versions d’application requises et des exemples. Les portées ne changent pas les réglages radio.

## Tester l’appareil

Le compagnon est prêt lorsque :

1. l’appareil affiche les paramètres du Canada ou ceux de votre communauté;
2. un appareil fiable ou un membre de la communauté à proximité voit son annonce.

Utilisez la [liste de vérification du compagnon](verify.md#companion).

## Et ensuite?

Conservez une copie des paramètres locaux et revérifiez-les après toute
modification du micrologiciel. Consultez les
[guides pratiques de MeshCore](../meshcore/general-howto.md) pour les tâches de
messagerie courantes. [Trouvez votre communauté](../provinces/index.md), puis
échangez un message d’essai avec une personne à proximité. Si personne ne voit
l’annonce, [obtenez de l’aide](get-help.md).

<section class="mc-start-progress" data-mc-progress-page="companion" aria-labelledby="companion-progress-title">
  <h2 id="companion-progress-title">Liste de vérification</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="companion-progress-hardware" type="checkbox" data-mc-progress> Confirmer que le matériel est compatible</label></li>
    <li><label><input id="companion-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="companion-progress-flash" type="checkbox" data-mc-progress> Suivre le guide d’installation du micrologiciel</label></li>
    <li><label><input id="companion-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres du Canada ou de la communauté</label></li>
    <li><label><input id="companion-progress-verify-local" type="checkbox" data-mc-progress> Vérifier l’appareil à proximité</label></li>
    <li><label><input id="companion-progress-verify-community" type="checkbox" data-mc-progress> Faire un essai avec une autre personne du réseau</label></li>
  </ol>
</section>
