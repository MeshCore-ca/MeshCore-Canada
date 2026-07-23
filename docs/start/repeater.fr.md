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
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: varies by build
destructive: false
requires:
  - supported-repeater
  - data-capable-usb-cable
---

# Commencer avec un répéteur

Un répéteur améliore la couverture en relayant le trafic des autres personnes.
Puisqu’il s’agit d’une installation fixe, planifiez l’alimentation, l’antenne,
l’accès et l’entretien avant de l’installer.

## Avant de commencer

- Consultez les [répéteurs recommandés](../hardware/recommended-repeaters.md).
- Choisissez l’emplacement et les paramètres avec la communauté locale.
- Gardez un accès physique à l’appareil pendant les essais.
- Notez l’identité et les paramètres actuels avant tout effacement ou toute
  mise à jour.

## Ce qui sera modifié

Le guide installe le micrologiciel du répéteur et configure la radio,
l’identité, les annonces et la région. Faites les essais sur l’établi avant
toute installation difficile d’accès.

<section class="mc-start-progress" data-mc-progress-page="repeater" aria-labelledby="repeater-progress-title">
  <h2 id="repeater-progress-title">Liste de configuration</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="repeater-progress-hardware" type="checkbox" data-mc-progress> Confirmer que le matériel et l’emplacement conviennent</label></li>
    <li><label><input id="repeater-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="repeater-progress-flash" type="checkbox" data-mc-progress> Suivre le guide d’installation du micrologiciel</label></li>
    <li><label><input id="repeater-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres locaux et régionaux</label></li>
    <li><label><input id="repeater-progress-verify-local" type="checkbox" data-mc-progress> Vérifier le répéteur sur l’établi</label></li>
    <li><label><input id="repeater-progress-verify-community" type="checkbox" data-mc-progress> Faire un essai avec un compagnon à proximité</label></li>
  </ol>
</section>

## Installer le micrologiciel du répéteur

Suivez le guide [Reprogrammer et configurer un
répéteur](../meshcore/flash-repeater.md). Il présente les choix propres à chaque
carte, les sauvegardes à faire, les situations où il faut s’arrêter et la
méthode de récupération.

## Choisir les bons paramètres radio et régionaux

Utilisez le préréglage **USA/Canada (Recommended)** et le hachage des chemins
sur **3 octets**, sauf si votre communauté indique d’autres paramètres.

!!! warning "Coordonnez les changements avant l’installation"
    Consultez le [répertoire des communautés](../provinces/index.md). Les
    répéteurs à proximité doivent utiliser les mêmes paramètres locaux. Les
    personnes responsables doivent s’entendre sur tout changement qui touche
    le trafic partagé.

Utilisez le [configurateur de répéteur](../config/index.md) pour trouver les
paramètres régionaux. Relisez les commandes avant de les appliquer.

## Vérifier que tout fonctionne

Le répéteur est prêt à être installé lorsque :

1. il conserve les paramètres prévus après un redémarrage;
2. il envoie une annonce;
3. un appareil compagnon fiable à proximité reçoit cette annonce.

Utilisez la [liste de vérification du répéteur](verify.md#repeater).

## Et ensuite?

Conservez le nom de l’emplacement, la personne responsable, le moyen d’accès en
cas de panne, les paramètres et la date de la dernière vérification réussie.
Revérifiez l’appareil après tout changement de micrologiciel, d’antenne,
d’alimentation ou de région. Avec le micrologiciel 1.14 ou plus récent,
consultez le [paramètre de détection des boucles](../meshcore/flash-repeater.md#loop-detection)
avant de le modifier sur un répéteur communautaire.

Consultez les conseils sur les [antennes](../hardware/recommended-antenna.md) et
les [méthodes de fixation](../hardware/repeater-mounting-options.md) avant
l’installation finale. Si une vérification échoue,
[obtenez de l’aide](get-help.md).
