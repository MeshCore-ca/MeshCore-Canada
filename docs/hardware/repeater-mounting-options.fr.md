---
title: Planifier le montage d’un répéteur
description: Comparez des exemples de montage en privilégiant l’autorisation, la sécurité de la structure, les intempéries, les câbles et l’inspection.
audience:
  - repeater-builder
  - site-owner
task: plan-repeater-mount
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: site dependent
destructive: false
requires:
  - property-permission
  - site-specific-safety-review
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Planifier le montage d’un répéteur

Utilisez ces exemples de la communauté pour discuter d’un site. Il ne s’agit
pas de plans d’ingénierie conçus pour un bâtiment, un mât, un climat ou une
propriété en particulier.

<div class="mc-guide-status" data-status="draft" markdown>

**Référence d’installation à l’état d’ébauche.** Ces exemples n’ont pas été
examinés en fonction de votre structure, du vent, de la glace, de la neige, de
l’exposition à la foudre, de la mise à la terre, des dégagements électriques,
de l’accès au toit ni des exigences locales.

</div>

!!! danger "La hauteur de l’antenne ne passe jamais avant la sécurité"
    Ne travaillez pas près de lignes électriques aériennes ni sur un toit, une échelle, un mât, une cheminée, une gouttière ou un évent qui n’est pas sécuritaire. Si la fixation, la charge, la mise à la terre, l’exposition aux intempéries ou le plan d’accès est incertain, arrêtez et faites appel à une personne qualifiée de votre région.

## Avant de choisir un montage

<ul class="mc-checklist">
  <li>Le propriétaire et toute autorité concernée approuvent l’emplacement et le passage des câbles.</li>
  <li>Une personne qualifiée a examiné la structure, le vent, la glace, la neige, la corrosion, les dégagements électriques, le contexte de foudre et de mise à la terre ainsi que l’accès sécuritaire.</li>
  <li>Le répéteur a réussi son essai sur l’établi et reste accessible par USB.</li>
  <li>L’antenne, le boîtier, la ligne d’alimentation RF, les connecteurs, le serre-câble et les chemins d’écoulement sont planifiés comme un seul système.</li>
  <li>Un plan d’inspection et de retrait est consigné avant l’installation.</li>
</ul>

## Ce que cette installation change

Un montage fixe ajoute une charge et des ouvertures ou des pinces à une
propriété, expose le matériel et les câbles aux intempéries et peut rendre la
récupération physique plus difficile. Consignez le nom du propriétaire du site,
les personnes qui peuvent y accéder et la façon dont l’installation sera
inspectée et retirée.

## Exemples de la communauté

### Poteau et pince

Un poteau ou un mât conçu à cette fin peut offrir un passage de câble et un
point de montage bien définis. Chaque section de poteau, pince, ancrage,
structure et charge doit quand même être examinée pour le site précis.

Pistes d’achat et de conception proposées par la communauté :

- [Support de poteau réglable](https://a.co/d/5U5cT4m)
- [Option de pince pour poteau 1](https://www.aliexpress.com/item/1005004943447000.html)
- [Guide de montage d’un boîtier RAKwireless](https://docs.rakwireless.com/product-categories/wisblock/rakbox-uo180x130x60/installation-guide/#mounting-guide)
- [Option de pince pour poteau 2](https://www.aliexpress.com/item/1005004943650198.html)
- [Poteau de tente militaire de 4 pi de Princess Auto](https://www.princessauto.com/en/4-ft-army-tent-pole/product/PA0009280777)
- [Tube d’acier rond de 3/4 × 36 po](https://www.homedepot.ca/product/paulin-3-4-x-36-inch-round-steel-tube/1000126774)

Stéphane P a partagé un support d’antenne Alfa imprimable :
[télécharger le fichier STL](https://drive.google.com/file/d/1wIU9kLxolzM9vPUB35ETY1sCPLGvtfFu/view?usp=share_link).

![Support d’antenne Alfa imprimé en 3D et fixé à un poteau](images/PoleMount.jpg){ .mc-build-photo loading=lazy }

![Exemple de la communauté montrant un poteau de répéteur fixé près d’une cheminée](images/ChimneyMount.jpg){ .mc-build-photo loading=lazy }

Une installation sur une cheminée exige un examen précis de la cheminée, de la
structure, de la chaleur, des dégagements, des attaches, des intempéries et de
l’accès sécuritaire. La photographie n’est pas une instruction pour reproduire
la fixation.

### Exemple de montage sur une gouttière

Aussiemandias a partagé un support de gouttière imprimable :
[télécharger le fichier STL](https://drive.proton.me/urls/A0P57SRHT0#voPRasptRVbW).

![Boîtier RAK Unify installé avec un support de gouttière conçu par la communauté](images/RAKUnify_GutterMounted.jpeg){ .mc-build-photo loading=lazy }

Une gouttière n’est pas nécessairement un élément structural. Inspectez la
gouttière, la planche de rive, les attaches, le drainage, les charges de glace
et de neige, le vent, le passage des câbles et l’accès avant d’envisager cette
approche.

### Exemple de rallonge de tuyau d’évent

N’utilisez pas une rallonge de tuyau d’évent avant qu’une personne qualifiée
ait confirmé l’évent existant, les matériaux du bâtiment, les exigences du code
et la charge ajoutée.

![Exemple de la communauté montrant un répéteur monté sur une rallonge de tuyau d’évent en ABS](images/VentPipeExtension.jpg){ .mc-build-photo loading=lazy }

## Liste de vérification de l’installation

<ul class="mc-checklist">
  <li>L’autorisation, l’accès sécuritaire, les dégagements électriques et l’examen propre au site sont documentés.</li>
  <li>Le montage, les attaches, la structure et le passage des câbles correspondent au plan examiné.</li>
  <li>La quincaillerie extérieure et les métaux différents ont été pris en compte selon les conditions locales.</li>
  <li>Les câbles ont un serre-câble, une protection contre les plis, un chemin d’écoulement et des entrées étanches.</li>
  <li>Le boîtier peut s’aérer comme prévu et n’accumule pas d’eau.</li>
  <li>L’antenne est branchée avant que la radio puisse transmettre.</li>
  <li>Le retrait et la récupération physique par USB demeurent pratiques.</li>
</ul>

## Vérifier l’installation terminée

Depuis une position sécuritaire, inspectez toute l’installation pour repérer
les mouvements, les tensions sur les câbles, la quincaillerie desserrée, le
drainage obstrué et les chemins d’eau. Confirmez ensuite que le répéteur se
reconnecte, conserve ses réglages, envoie une annonce reçue localement et
réussit l’essai d’acheminement de messages prévu.

## Récupération et retrait

Si un élément bouge, fuit, se desserre, se corrode, change électriquement ou
échoue à la vérification radio, cessez d’utiliser le site. Coupez l’alimentation
lorsque c’est sécuritaire, retirez ou fixez le matériel conformément au plan
d’accès approuvé, puis retournez-le sur l’établi. Ne dépannez pas du matériel
sous tension en hauteur.

## Dossier d’entretien

<div class="mc-maintenance-record" markdown>

Aucun intervalle d’inspection pancanadien n’a été approuvé. Avant le
déploiement, consignez un intervalle propre au site et les conditions qui
déclenchent une inspection supplémentaire, comme des conditions
météorologiques extrêmes, des travaux à proximité, une infiltration d’eau ou
un changement du comportement radio.

Pour chaque inspection, consignez la date, le nom de la personne qui l’a
effectuée, les photographies, l’état de la quincaillerie et des câbles, l’état
du boîtier, la vérification radio, les travaux correctifs et la date de la
prochaine inspection.

</div>

## Avant l’installation

Revenez au [choix du répéteur](recommended-repeaters.md) ou
[programmez et testez le répéteur sur l’établi](../meshcore/flash-repeater.md)
avant de l’installer.
