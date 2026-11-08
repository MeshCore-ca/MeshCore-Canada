---
title: Choisir un répéteur
description: Les répéteurs qu’utilisent les communautés canadiennes, d’un appareil solaire tout-en-un à deux montages communautaires.
audience:
  - repeater-builder
  - network-operator
task: choose-repeater
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-20 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choisir un répéteur

Un répéteur, c’est une radio, une alimentation, une antenne et un support.
Voici ce qu’utilisent les communautés canadiennes. Parlez de l’emplacement avec
votre [communauté locale](../provinces/index.md) avant d’acheter.

## Tout-en-un

Le **SenseCAP Solar Node P1** est un appareil solaire tout-en-un qui demande le
moins de montage. Vérifiez ce qui est inclus : la pile et l’antenne peuvent être
vendues séparément. [RobotShop Canada](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery)

## À construire soi-même

<div class="mc-decision-grid">
  <section class="mc-decision-card" data-status="draft">
    <h3>Répéteur solaire de 300 mW</h3>
    <p>Un modèle RAK à l’état d’ébauche avec une liste de pièces, des étapes d’assemblage, des vérifications sur l’établi et des notes d’entretien.</p>
    <a class="md-button" href="../repeater-solar-300mw-diy-build/">Examiner le modèle de 300 mW</a>
  </section>
  <section class="mc-decision-card" data-status="draft">
    <h3>Répéteur solaire de 1 W — Ikoka Stick</h3>
    <p>Le guide de MrAlders0n, avec pièces, photos, câblage et télémétrie INA3221 facultative.</p>
    <a class="md-button" href="../repeater-solar-1w-diy-build/">Lire le guide de construction de 1 W</a>
  </section>
</div>

## Avant d’acheter

<ul class="mc-checklist">
  <li>La carte exacte figure pour les répéteurs dans le <a href="https://meshcore.io/flasher">programme de mise à jour MeshCore</a>.</li>
  <li>La radio et l’antenne sont des versions 915 MHz (902–928 MHz), et les connecteurs correspondent.</li>
  <li>Branchez l’antenne avant d’allumer l’appareil.</li>
  <li>Le port USB reste accessible une fois l’appareil installé.</li>
</ul>

Vérifiez l’information à jour du fabricant avant de commander : les révisions de produits changent.

**Ensuite :** [Configurer un répéteur](../config/index.md) · [Antennes](recommended-antenna.md) · [Installer un répéteur](repeater-mounting-options.md)
