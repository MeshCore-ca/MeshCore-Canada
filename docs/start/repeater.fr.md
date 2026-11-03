---
title: Commencer avec un répéteur
description: Préparez, configurez et vérifiez un répéteur MeshCore pour une communauté canadienne.
audience:
  - repeater-builder
  - repeater-operator
task: start-repeater
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
difficulty: intermediate
estimated_time: varies by build
destructive: false
requires:
  - supported-repeater
  - data-capable-usb-cable
page_styles:
  - assets/styles/repeater-hash-check.css?v=20260820-1
page_scripts:
  - assets/javascripts/repeater-hash-check.js?v=20261029-1
---

# Commencer avec un répéteur

Un répéteur améliore la couverture en relayant le trafic des autres personnes.
Puisqu’il s’agit d’une installation fixe, planifiez l’alimentation, l’antenne,
l’accès et l’entretien avant de l’installer.

[Configurer un répéteur](../config/index.md){ .md-button .md-button--primary }

## Avant de commencer

- Consultez les [répéteurs recommandés](../hardware/recommended-repeaters.md).
- Choisissez l’emplacement et les paramètres avec la communauté locale.
- Gardez un accès physique à l’appareil pendant les essais.
- Notez l’identité et les paramètres actuels avant tout effacement ou toute
  mise à jour.

## Ce qui sera modifié

L’outil de configuration vous guide pour programmer le micrologiciel du
répéteur, puis vous donne les commandes qui règlent sa radio, son nom, ses
annonces et ses régions. Faites les essais sur l’établi avant toute
installation difficile d’accès.

## Configurer le répéteur

Ouvrez l’[outil de configuration du répéteur](../config/index.md). Il pose
quelques questions, puis vous donne toutes les commandes à coller, une à la
fois, avec ce que chacune fait.

## Choisir les bons paramètres radio et régionaux

Utilisez le préréglage **Canada** et le hachage des chemins
sur **3 octets**, sauf si votre communauté indique d’autres paramètres.

Si Canada n’apparaît pas, suivez les [consignes pour l’ancien préréglage](../provinces/index.md#canada-baseline).

!!! warning "Coordonnez les changements avant l’installation"
    Consultez le [répertoire des communautés](../provinces/index.md). Les
    répéteurs à proximité doivent utiliser les mêmes paramètres locaux. Les
    personnes responsables doivent s’entendre sur tout changement qui touche
    le trafic partagé.

L’[outil de configuration](../config/index.md) choisit votre zone IATA MeshMapper
d’après votre ville, votre adresse ou vos coordonnées et règle ses portées. Le répéteur a encore d’anciennes
régions? L’outil les retire d’abord :
[Comprendre les répéteurs](../config/guide.md#old-regions) explique comment.

Un répéteur qui entend régulièrement des répéteurs d’une autre région est un
répéteur de bordure. Consultez les personnes responsables à proximité avant d’en
configurer un : [Comprendre les répéteurs](../config/guide.md#city-or-edge)
explique la différence.

<div data-mc-repeater-hash-check></div>

<noscript>JavaScript est requis pour vérifier les identifiants en direct. Vous pouvez aussi [ouvrir le répertoire des nœuds en direct](https://live.meshcore.ca/?tab=Nodes).</noscript>

## Tester le répéteur

Le répéteur est prêt à être installé lorsque :

1. il conserve les paramètres prévus après un redémarrage;
2. il envoie une annonce;
3. un appareil compagnon fiable à proximité reçoit cette annonce.

Chaque fois que le répéteur redémarre, réglez de nouveau son horloge avec
`clock sync` depuis l’application MeshCore avant d’envoyer l’annonce. Après un
redémarrage, son horloge est souvent fausse, et les téléphones peuvent ignorer
ses annonces tant qu’elle n’est pas réglée.

Utilisez la [liste de vérification du répéteur](verify.md#repeater).

## Et ensuite?

Conservez le nom de l’emplacement, la personne responsable, le moyen d’accès en
cas de panne, les paramètres et la date de la dernière vérification réussie.
Revérifiez l’appareil après tout changement de micrologiciel, d’antenne,
d’alimentation ou de région. Avec le micrologiciel 1.14 ou plus récent,
consultez le [paramètre de détection des boucles](../config/guide.md#loop-detection)
avant de le modifier sur un répéteur communautaire.

Consultez les conseils sur les [antennes](../hardware/recommended-antenna.md) et
les [méthodes de fixation](../hardware/repeater-mounting-options.md) avant
l’installation finale. Si une vérification échoue,
[obtenez de l’aide](get-help.md).

<section class="mc-start-progress" data-mc-progress-page="repeater" aria-labelledby="repeater-progress-title">
  <h2 id="repeater-progress-title">Liste de vérification</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="repeater-progress-hardware" type="checkbox" data-mc-progress> Confirmer que le matériel et l’emplacement conviennent</label></li>
    <li><label><input id="repeater-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="repeater-progress-flash" type="checkbox" data-mc-progress> Programmer le répéteur avec l’outil de configuration</label></li>
    <li><label><input id="repeater-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres locaux et régionaux</label></li>
    <li><label><input id="repeater-progress-verify-local" type="checkbox" data-mc-progress> Vérifier le répéteur sur l’établi</label></li>
    <li><label><input id="repeater-progress-verify-community" type="checkbox" data-mc-progress> Faire un essai avec un compagnon à proximité</label></li>
  </ol>
</section>
