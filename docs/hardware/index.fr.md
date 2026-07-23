---
title: Choisir le matériel MeshCore
description: Choisissez un compagnon, un répéteur, une antenne ou un modèle à construire, puis confirmez sa compatibilité avant l’achat.
audience:
  - newcomer
  - node-builder
task: choose-hardware
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choisir le matériel MeshCore

Choisissez d’abord le rôle de l’appareil. Avant de l’acheter, confirmez ensuite
la carte exacte et la cible du micrologiciel dans le
[programme officiel de mise à jour MeshCore](https://meshcore.io/flasher).

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez avant d’acheter.** Les révisions de produits et la prise en charge
du micrologiciel changent. Les appareils liés sont des options à comparer, et
non des garanties de compatibilité.

</div>

## Choisir un type d’appareil

<div class="mc-device-chooser">
  <section class="mc-decision-card">
    <h3>Compagnon personnel</h3>
    <p>Utilisez-le pour envoyer et recevoir des messages. La plupart des compagnons se jumellent à un téléphone; certains ont leur propre écran et leurs propres commandes.</p>
    <a class="md-button md-button--primary" href="recommended-companions/">Choisir un compagnon</a>
  </section>
  <section class="mc-decision-card">
    <h3>Répéteur</h3>
    <p>Utilisez-le pour améliorer la couverture. Planifiez la radio, l’alimentation, l’antenne, le boîtier, le montage et la récupération comme un seul système.</p>
    <a class="md-button" href="recommended-repeaters/">Planifier un répéteur</a>
  </section>
  <section class="mc-decision-card">
    <h3>Antenne et câble</h3>
    <p>Faites correspondre la bande radio et le connecteur avant de commander. Les connecteurs SMA et RP-SMA peuvent se ressembler, mais ne sont pas interchangeables.</p>
    <a class="md-button" href="recommended-antenna/">Choisir une antenne</a>
  </section>
  <section class="mc-decision-card">
    <h3>Serveur de salon</h3>
    <p>Utilisez-le pour héberger un salon persistant. Choisissez une carte prise en charge, une alimentation continue et un plan d’administration sécurisé.</p>
    <a class="md-button" href="../meshcore/flash-room-server/">Configurer un serveur de salon</a>
  </section>
</div>

## Guides de construction de la communauté

Ces modèles proposés par la communauté sont des références de construction
détaillées, et non des recommandations de produits par défaut. Lisez l’état de
révision et les consignes de sécurité de chaque guide avant d’acheter des pièces
ou de commencer les travaux.

<div class="mc-decision-grid">
  <section class="mc-decision-card" data-status="draft">
    <h3>Répéteur solaire de 300 mW</h3>
    <p>Un modèle RAK à l’état d’ébauche pour les personnes expérimentées, avec une liste de pièces, des étapes d’assemblage, des vérifications sur l’établi et des notes d’entretien.</p>
    <a class="md-button" href="repeater-solar-300mw-diy-build/">Examiner le modèle de 300 mW</a>
  </section>
  <section class="mc-decision-card" data-status="experimental">
    <h3>Répéteur solaire expérimental de 1 W</h3>
    <p>Un modèle haute puissance non vérifié proposé par MrAlders0n. Utilisez-le seulement après qu’un examen électrique, RF et du site a confirmé un besoin réel du réseau.</p>
    <a class="md-button" href="repeater-solar-1w-diy-build/">Examiner le modèle expérimental de 1 W</a>
  </section>
</div>

## Avant d’acheter

<ul class="mc-checklist">
  <li>Le modèle exact apparaît pour le rôle voulu dans la version actuelle du programme officiel de mise à jour MeshCore.</li>
  <li>La radio est un modèle canadien de 902–928 MHz.</li>
  <li>Les connecteurs de l’antenne, de la queue de cochon et de la ligne d’alimentation RF correspondent exactement. Les connecteurs SMA et RP-SMA ne sont pas interchangeables.</li>
  <li>Le fabricant prend en charge la pile, le chargeur, le boîtier et la plage de températures pour l’utilisation prévue.</li>
  <li>Vous avez un câble USB de données fiable et un moyen pratique de récupérer physiquement l’appareil.</li>
  <li>La documentation actuelle du fabricant confirme toutes les caractéristiques importantes pour l’achat.</li>
</ul>

## Poursuivre la configuration

Après avoir choisi un appareil pris en charge, suivez le guide correspondant :

- [Programmer un compagnon](../meshcore/flash-companion.md)
- [Programmer et tester un répéteur sur l’établi](../meshcore/flash-repeater.md)
- [Programmer un serveur de salon](../meshcore/flash-room-server.md)

Vous avez trouvé un produit ou un renseignement de compatibilité périmé?
[Signalez la correction](../submit-idea.md) en indiquant la source du fabricant
et la date de votre vérification.
