---
title: Commencer avec un observateur
description: Choisissez, configurez et vérifiez un observateur MeshCore qui transmet des données du réseau à CoreScope.
audience:
  - observer-operator
  - service-operator
task: start-observer
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: intermediate
estimated_time: varies by method
destructive: false
requires:
  - supported-observer-method
  - internet-connection
---

# Commencer avec un observateur

Un observateur écoute le réseau au moyen d’une radio MeshCore et transmet les
données captées à CoreScope. Il ne relaie pas le trafic du réseau. Il peut
fonctionner dans le micrologiciel d’une radio, sur un ordinateur qui reste
allumé ou sur un système de domotique.

Avant de l’activer, lisez
[quelles données le service recueille et qui peut y accéder](../analyzer/data-collection-access.md).

## Avant de commencer

- Ouvrez l’outil [Choisir une méthode d’observation](../analyzer/intro.md).
- Choisissez une méthode adaptée à votre radio, à votre système d’exploitation
  et au système hôte que vous utilisez déjà.
- Sauvegardez la configuration avant de remplacer un micrologiciel ou
  d’installer un service.
- Lorsque la méthode le demande, utilisez un vrai code de localisation à
  proximité.

## Ce qui sera modifié

Selon la méthode choisie, la configuration peut remplacer le micrologiciel de
la radio, installer un service sur le système hôte ou ajouter une intégration
domotique. Elle permet aussi la transmission publique de données du réseau.

<section class="mc-start-progress" data-mc-progress-page="observer" aria-labelledby="observer-progress-title">
  <h2 id="observer-progress-title">Liste de configuration</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="observer-progress-privacy" type="checkbox" data-mc-progress> Lire quelles données de l’observateur deviennent publiques</label></li>
    <li><label><input id="observer-progress-method" type="checkbox" data-mc-progress> Choisir une méthode d’observation prise en charge</label></li>
    <li><label><input id="observer-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="observer-progress-install" type="checkbox" data-mc-progress> Suivre le guide de configuration choisi</label></li>
    <li><label><input id="observer-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres locaux de la radio et du service</label></li>
    <li><label><input id="observer-progress-verify-local" type="checkbox" data-mc-progress> Vérifier que la radio capte l’activité à proximité</label></li>
    <li><label><input id="observer-progress-verify-network" type="checkbox" data-mc-progress> Trouver l’observateur dans CoreScope</label></li>
  </ol>
</section>

## Configurer l’observateur

Utilisez l’outil [Choisir une méthode d’observation](../analyzer/intro.md), puis
suivez uniquement le guide de la méthode choisie.

## Choisir les bons paramètres radio

La radio connectée doit utiliser les mêmes paramètres que le réseau à
proximité. Commencez avec le préréglage **USA/Canada (Recommended)** et le
hachage des chemins sur **3 octets**, sauf si votre communauté indique
d’autres paramètres.

!!! warning "Utilisez les mêmes paramètres que votre communauté"
    Consultez le [répertoire des communautés](../provinces/index.md). Un
    observateur peut être en ligne sans capter de trafic utile si ses paramètres
    radio diffèrent de ceux des appareils à proximité.

## Vérifier que tout fonctionne

L’observateur fonctionne lorsque :

1. sa radio capte une activité MeshCore connue à proximité;
2. il apparaît dans [CoreScope Observers](https://live.meshcore.ca/#/observers);
3. une activité récente apparaît après une transmission à proximité.

Utilisez la [liste de vérification de l’observateur](verify.md#observer).

## Et ensuite?

Vérifiez l’observateur après tout changement de radio, de réseau,
d’identifiants, de système hôte ou de micrologiciel. Ouvrez
[Vérifier votre observateur](../analyzer/verify.md) pour consulter son état
détaillé. S’il est absent ou silencieux,
[obtenez de l’aide](get-help.md).
