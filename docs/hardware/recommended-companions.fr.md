---
title: Choisir un appareil compagnon
description: Comparez les compagnons jumelés à un téléphone et les appareils autonomes, puis vérifiez leur compatibilité avant l’achat.
audience:
  - newcomer
  - companion-owner
task: choose-companion
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: beginner
estimated_time: 10-15 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choisir un appareil compagnon

Un compagnon est votre appareil personnel de messagerie MeshCore. Choisissez
si vous préférez utiliser un téléphone ou des commandes intégrées, puis
confirmez le modèle exact dans le
[programme officiel de mise à jour MeshCore](https://meshcore.io/flasher).

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez avant d’acheter.** Ces appareils sont proposés à titre de comparaison
et ne forment pas une liste de compatibilité garantie. Confirmez le modèle
exact, la bande radio canadienne, la cible de micrologiciel du compagnon, le
connecteur et les accessoires inclus.

</div>

## Choisir comment vous voulez l’utiliser

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Jumelé à un téléphone</h3>
    <p>Votre téléphone fournit l’interface principale et se connecte à la radio par Bluetooth Low Energy (BLE).</p>
    <p><strong>À vérifier :</strong> la compatibilité du téléphone, la pile, l’antenne et la cible exacte du compagnon.</p>
  </section>
  <section class="mc-decision-card">
    <h3>Autonome</h3>
    <p>Un écran et des commandes intégrées permettent l’utilisation normale de la messagerie sans téléphone.</p>
    <p><strong>À vérifier :</strong> si le micrologiciel actuel prend en charge le modèle et toutes les commandes dont vous avez besoin.</p>
  </section>
  <section class="mc-decision-card">
    <h3>À construire soi-même</h3>
    <p>Vous choisissez la carte, la pile, le boîtier, le câble et l’antenne.</p>
    <p><strong>À vérifier :</strong> la révision de la carte, la polarité et la protection de la pile, l’ajustement du boîtier et chaque connecteur d’antenne.</p>
  </section>
</div>

## Appareils à comparer

<div class="mc-table-wrap" markdown>

| Appareil | Style | À vérifier avant l’achat | Fabricant |
|---|---|---|---|
| ThinkNode M1 | Jumelé à un téléphone, avec écran | Cible exacte du programme de mise à jour, modèle de 902–928 MHz, connecteur d’antenne, pile et accessoires inclus | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| LilyGO T-Echo | Jumelé à un téléphone, avec écran | Révision exacte du matériel, cible du programme de mise à jour, bande radio, connecteur et antenne incluse | [LilyGO](https://lilygo.cc/products/t-echo-lilygo) |
| SenseCAP T1000-E | Jumelé à un téléphone, boîtier en forme de carte | Cible exacte du programme de mise à jour, bande radio, limites de l’antenne interne et prise en charge du téléphone | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| LilyGO T-LORA Pager | Commandes autonomes | Révision exacte du matériel et prise en charge actuelle de l’écran, du clavier et de l’utilisation prévue | [LilyGO](https://lilygo.cc/en-ca/products/t-lora-pager) |
| LilyGO T-Deck Plus | Commandes autonomes | Révision exacte du matériel et prise en charge actuelle de l’écran, du clavier, de la boule de commande et de l’utilisation prévue | [LilyGO](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

!!! note "Les offres changent"
    Une page de produit peut sélectionner par défaut une autre bande radio, une autre trousse d’accessoires ou un autre connecteur. Vérifiez l’option choisie avant de passer à la caisse.

## Avant d’acheter

<ul class="mc-checklist">
  <li>La révision exacte du produit apparaît comme compagnon dans la version actuelle du programme officiel de mise à jour MeshCore.</li>
  <li>La radio est la variante canadienne de 902–928 MHz.</li>
  <li>Les exigences concernant le téléphone et l’application correspondent à l’utilisation prévue.</li>
  <li>Le connecteur, la polarité, la protection et les dimensions de la pile ainsi que sa méthode de recharge sont documentés.</li>
  <li>L’antenne et chaque adaptateur correspondent au connecteur de l’appareil.</li>
  <li>Le boîtier laisse le port de récupération USB accessible.</li>
  <li>Vous avez vérifié la disponibilité, l’expédition, les droits de douane et les conditions de retour actuels.</li>
</ul>

## Poursuivre la configuration

Lorsque la carte exacte est confirmée,
[programmez et configurez le compagnon](../meshcore/flash-companion.md).
Après la programmation, redémarrez-le et effectuez un essai de message local.
