---
title: Commencer avec un observateur
description: Choisissez, configurez et vérifiez un observateur MeshCore qui transmet des données à la visionneuse du réseau en direct.
audience:
  - observer-operator
  - service-operator
task: start-observer
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
estimated_time: varies by method
destructive: false
requires:
  - supported-observer-method
  - internet-connection
---

# Commencer avec un observateur

Un observateur écoute le réseau au moyen d’une radio MeshCore et transmet les
données captées à la visionneuse du réseau en direct. Il n’a pas besoin de relayer le trafic, mais un
même appareil peut remplir les deux fonctions. Il peut
fonctionner dans le micrologiciel d’une radio, sur un ordinateur qui reste
allumé ou sur un système de domotique.

Avant de l’activer, lisez
[quelles données le service recueille et qui peut y accéder](../analyzer/data-collection-access.md).

[Choisir une méthode d’observation](../analyzer/intro.md){ .md-button .md-button--primary }

## Avant de commencer

- Ouvrez l’outil [Choisir une méthode d’observation](../analyzer/intro.md).
- Choisissez une méthode adaptée à votre radio, à votre système d’exploitation
  et au système hôte que vous utilisez déjà.
- Sauvegardez la configuration avant de remplacer un micrologiciel ou
  d’installer un service.
- Trouvez votre code sur la [carte des régions IATA](../config/map.md). Utilisez
  le même code en majuscules pour chaque courtier; l’aéroport le plus proche ne le détermine pas.

## Ce qui sera modifié

Selon la méthode choisie, la configuration peut remplacer le micrologiciel de
la radio, installer un service sur le système hôte ou ajouter une intégration
domotique. Elle permet aussi la transmission publique de données du réseau.



## Configurer l’observateur

Utilisez l’outil [Choisir une méthode d’observation](../analyzer/intro.md), puis
suivez uniquement le guide de la méthode choisie.

## Choisir les bons paramètres radio

La radio connectée doit utiliser les mêmes paramètres que le réseau à
proximité. Commencez avec le préréglage **Canada** et le
hachage des chemins sur **3 octets**, sauf si votre communauté indique
d’autres paramètres.

Si Canada n’apparaît pas, suivez les [consignes pour l’ancien préréglage](../provinces/index.md#canada-baseline).

!!! warning "Utilisez les mêmes paramètres que votre communauté"
    Consultez le [répertoire des communautés](../provinces/index.md). Un
    observateur peut être en ligne sans capter de trafic utile si ses paramètres
    radio diffèrent de ceux des appareils à proximité.

## Tester l’observateur

L’observateur fonctionne lorsque :

1. sa radio capte une activité MeshCore connue à proximité;
2. il apparaît dans la [liste des observateurs en direct](https://live.meshcore.ca/?tab=Observers);
3. une activité récente apparaît après une transmission à proximité.

Utilisez la [liste de vérification de l’observateur](verify.md#observer).

## Et ensuite?

Vérifiez l’observateur après tout changement de radio, de réseau,
d’identifiants, de système hôte ou de micrologiciel. Ouvrez
[Vérifier votre observateur](../analyzer/verify.md) pour consulter son état
détaillé. S’il est absent ou silencieux,
[obtenez de l’aide](get-help.md).

<section class="mc-start-progress" data-mc-progress-page="observer" aria-labelledby="observer-progress-title">
  <h2 id="observer-progress-title">Liste de vérification</h2>
  <p>Cette liste est enregistrée uniquement dans ce navigateur.</p>
  <ol>
    <li><label><input id="observer-progress-privacy" type="checkbox" data-mc-progress> Lire quelles données de l’observateur deviennent publiques</label></li>
    <li><label><input id="observer-progress-method" type="checkbox" data-mc-progress> Choisir une méthode d’observation prise en charge</label></li>
    <li><label><input id="observer-progress-prepare" type="checkbox" data-mc-progress> Sauvegarder les données et préparer l’appareil</label></li>
    <li><label><input id="observer-progress-install" type="checkbox" data-mc-progress> Suivre le guide de configuration choisi</label></li>
    <li><label><input id="observer-progress-configure" type="checkbox" data-mc-progress> Appliquer les paramètres locaux de la radio et du service</label></li>
    <li><label><input id="observer-progress-verify-local" type="checkbox" data-mc-progress> Vérifier que la radio capte l’activité à proximité</label></li>
    <li><label><input id="observer-progress-verify-network" type="checkbox" data-mc-progress> Trouver l’observateur dans la visionneuse du réseau</label></li>
  </ol>
</section>
