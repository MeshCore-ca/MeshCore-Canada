---
title: Commencer avec un serveur de salon
description: Préparez, configurez et vérifiez un serveur de salon MeshCore persistant pour une communauté canadienne.
audience:
  - room-server-operator
task: start-room-server
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: 20-30 minutes
destructive: false
requires:
  - supported-room-server
  - data-capable-usb-cable
---

# Commencer avec un serveur de salon

Un serveur de salon garde un salon partagé accessible. Il ne remplace pas un
répéteur : utilisez un répéteur pour acheminer le trafic et améliorer la
couverture.

## Avant de commencer

- Confirmez que l’outil de reprogrammation offre le micrologiciel
  **Room Server** pour votre appareil.
- Décidez qui entretiendra le salon et conservera un accès physique en cas de
  panne.
- Notez l’identité et les paramètres dont vous aurez besoin avant toute étape
  d’effacement.
- Préparez des identifiants différents pour les invités et l’administrateur.

## Ce qui sera modifié

Le guide lié remplace le micrologiciel et configure l’identité du serveur de
salon, les identifiants d’accès et les paramètres radio.

<section class="mc-start-progress" data-mc-progress-page="room-server" aria-labelledby="room-server-progress-title">
  <h2 id="room-server-progress-title">Liste de configuration</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="room-server-progress-hardware" type="checkbox" data-mc-progress> Confirmer que le matériel est compatible</label></li>
    <li><label><input id="room-server-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="room-server-progress-flash" type="checkbox" data-mc-progress> Suivre le guide d’installation du micrologiciel</label></li>
    <li><label><input id="room-server-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres d’accès et les paramètres locaux</label></li>
    <li><label><input id="room-server-progress-verify-local" type="checkbox" data-mc-progress> Vérifier le serveur de salon à proximité</label></li>
    <li><label><input id="room-server-progress-verify-community" type="checkbox" data-mc-progress> Tester la découverte et l’accès des invités</label></li>
  </ol>
</section>

## Installer le micrologiciel du serveur de salon

Suivez le guide [Reprogrammer et configurer un serveur de
salon](../meshcore/flash-room-server.md). Il explique comment choisir
l’appareil, installer le micrologiciel, configurer les accès et récupérer
l’appareil en cas de problème.

## Choisir les bons paramètres radio

Utilisez le préréglage **USA/Canada (Recommended)** et le hachage des chemins
sur **3 octets**, sauf si votre communauté indique d’autres paramètres.

!!! warning "Utilisez les mêmes paramètres que votre communauté"
    Consultez le [répertoire des communautés](../provinces/index.md). Si votre
    communauté publie d’autres paramètres, utilisez-les.

Gardez les identifiants de l’administrateur confidentiels. Partagez uniquement
les renseignements d’accès destinés aux personnes invitées dans le salon.

## Vérifier que tout fonctionne

Le serveur de salon est prêt lorsque :

1. un appareil compagnon à proximité découvre son annonce;
2. le compagnon peut entrer avec les identifiants des invités;
3. l’administrateur peut toujours le récupérer et l’entretenir.

Utilisez la [liste de vérification du serveur de salon](verify.md#room-server).

## Et ensuite?

Notez qui entretient le salon et comment obtenir de l’aide. Demandez à un
membre de la communauté à proximité de faire un essai avec un deuxième
compagnon. Revérifiez la découverte et l’accès des invités après tout
changement de micrologiciel, d’identifiants ou de paramètres radio. En cas
d’échec, [obtenez de l’aide](get-help.md).
