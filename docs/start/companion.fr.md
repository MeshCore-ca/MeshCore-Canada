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
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
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

<section class="mc-start-progress" data-mc-progress-page="companion" aria-labelledby="companion-progress-title">
  <h2 id="companion-progress-title">Liste de configuration</h2>
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

## Installer le micrologiciel du compagnon

Suivez le guide [Reprogrammer et configurer un appareil
compagnon](../meshcore/flash-companion.md). Il explique comment choisir
l’appareil, établir la connexion dans le navigateur, installer le micrologiciel
et récupérer l’appareil en cas de problème.

## Choisir les bons paramètres radio

Utilisez le préréglage **USA/Canada (Recommended)** et le hachage des chemins
sur **3 octets**, sauf si votre communauté indique d’autres paramètres.

!!! warning "Utilisez les mêmes paramètres que votre communauté"
    Consultez le [répertoire des communautés](../provinces/index.md). Si votre
    communauté publie d’autres paramètres, utilisez-les.

Redémarrez l’appareil après avoir modifié les paramètres radio, puis envoyez
une annonce.

## Vérifier que tout fonctionne

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
