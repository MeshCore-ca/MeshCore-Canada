---
title: Planifier un répéteur
description: Choisissez une approche et vérifiez l’ensemble formé par la radio, l’alimentation, l’antenne, le boîtier et la méthode de récupération.
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
  - assets/styles/devices-builds.css?v=20260722-2
---

# Planifier un répéteur

Un répéteur ne se limite pas à une carte radio. Planifiez son alimentation, son
antenne, son boîtier, son montage et un moyen de l’atteindre en cas de problème.

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez le système complet.** Les révisions de produits et la prise en charge
du micrologiciel changent. Confirmez la radio exacte, le système d’alimentation,
le parcours de l’antenne, le boîtier, le montage et la méthode de récupération
avant d’acheter ou de construire.

</div>

## Choisir une approche

<div class="mc-decision-grid">
  <section class="mc-decision-card">
    <h3>Système extérieur préassemblé</h3>
    <p>Il réduit la fabrication nécessaire, mais les piles, les câbles d’antenne, le matériel de montage ou la radio peuvent tout de même être vendus séparément.</p>
    <p><strong>À vérifier :</strong> le contenu exact, la bande radio, la cible du micrologiciel, le parcours des connecteurs, l’indice de protection contre les intempéries et l’accès USB.</p>
    <a class="md-button" href="#outdoor-system-to-compare">Examiner un exemple</a>
  </section>
  <section class="mc-decision-card">
    <h3>Construction personnalisée</h3>
    <p>Vous choisissez chaque pièce, mais vous devenez responsable de la compatibilité électrique, de l’étanchéité, du montage et de l’accès pour l’entretien.</p>
    <p><strong>À vérifier :</strong> les limites du fabricant, la polarité, la protection, le câblage, les conditions thermiques et la récupération sécuritaire.</p>
    <a class="md-button" href="#community-build-guides">Voir les guides de construction de la communauté</a>
  </section>
</div>

!!! tip "Commencez par le besoin du réseau, et non par la puissance d’émission"
    Le site, la hauteur, le système d’antenne, la perte du câble, le bruit local, les régions voisines, le budget énergétique et l’accès pour l’entretien influencent tous un répéteur. Coordonnez-vous avec la communauté locale avant de choisir une puissance élevée ou un parcours à longue portée.

## Système extérieur à comparer { #outdoor-system-to-compare }

Le SenseCAP Solar Node P1 est un exemple de boîtier préassemblé à évaluer. Il ne
s’agit pas d’une recommandation complète : confirmez chaque option et
accessoire sélectionné dans la documentation actuelle du fabricant.

<div class="mc-table-wrap" markdown>

| Élément du système | Ce qu’il faut vérifier | Source |
|---|---|---|
| SenseCAP Solar Node P1 | Modèle exact pour la bande canadienne, carte et cible de répéteur prises en charge, indice du boîtier, pièces d’alimentation incluses, montage et accès USB | [RobotShop Canada](https://ca.robotshop.com/products/sensecap-solar-node-p1-meshtastic-w-o-gps-battery) |
| Système de pile | Chimie, protection, capacité, plage de températures, compatibilité du chargeur et instructions d’installation | Documentation du fabricant du produit |
| Antenne et câble | Bande de 902–928 MHz, connecteur d’usine, perte du câble, genre et polarité des connecteurs, montage et étanchéité | [Guide des antennes LoRa de Seeed](https://wiki.seeedstudio.com/lora_antenna_selection_guide/) |

</div>

!!! warning "Les connecteurs SMA et RP-SMA ne sont pas interchangeables"
    Confirmez le connecteur d’usine, son genre et sa polarité, la longueur et la perte du câble, le connecteur de l’antenne et l’étanchéité comme un seul parcours complet. Ne commandez jamais en vous fiant seulement à l’apparence du connecteur.

## Guides de construction de la communauté { #community-build-guides }

<div class="mc-decision-grid">
  <section class="mc-decision-card" data-status="draft">
    <h3>Répéteur solaire de 300 mW</h3>
    <p>Un modèle RAK à l’état d’ébauche avec une liste de pièces, des étapes d’assemblage, des vérifications sur l’établi et des notes d’entretien.</p>
    <a class="md-button" href="../repeater-solar-300mw-diy-build/">Examiner le modèle de 300 mW</a>
  </section>
  <section class="mc-decision-card" data-status="experimental">
    <h3>Répéteur solaire expérimental de 1 W</h3>
    <p>Un modèle haute puissance non vérifié destiné à un besoin mesuré du réseau. Un examen électrique, RF et du site est requis avant d’acheter des pièces ou de commencer les travaux.</p>
    <a class="md-button" href="../repeater-solar-1w-diy-build/">Examiner le modèle expérimental de 1 W</a>
  </section>
</div>

Ces guides sont des références de la communauté. Ils ne constituent ni des
listes de matériel vérifiées ni un remplacement de la documentation actuelle
du fabricant et d’un examen par une personne qualifiée.

## Avant de construire ou d’acheter

<ul class="mc-checklist">
  <li>La carte radio exacte apparaît pour le rôle de répéteur dans la version actuelle du programme officiel de mise à jour MeshCore.</li>
  <li>La radio et l’antenne sont destinées à la bande canadienne de 902–928 MHz.</li>
  <li>Toute la chaîne d’alimentation respecte les limites du fabricant et utilise les protections documentées.</li>
  <li>L’antenne est branchée avant que la radio puisse transmettre.</li>
  <li>L’autorisation du propriétaire, l’examen de la structure, les charges dues aux intempéries, le passage des câbles et les risques électriques sont pris en compte.</li>
  <li>Le répéteur peut être récupéré par USB après son installation.</li>
  <li>La région et les réglages locaux sont confirmés dans le configurateur de répéteur.</li>
  <li>Un essai sur l’établi et un plan d’entretien sont prêts avant l’installation.</li>
</ul>

## Le tester d’abord sur l’établi

Un répéteur terminé doit rester sur l’établi jusqu’à ce qu’il résiste à un
redémarrage, conserve ses réglages, envoie une annonce reçue par un compagnon à
proximité, réussisse un essai d’acheminement local et puisse toujours être
récupéré par USB. Utilisez ensuite la
[liste de vérification pour un montage sécuritaire](repeater-mounting-options.md).

## Poursuivre la configuration

- [Programmer et tester un répéteur sur l’établi](../meshcore/flash-repeater.md)
- [Choisir une antenne et une ligne d’alimentation](recommended-antenna.md)
- [Planifier un montage sécuritaire](repeater-mounting-options.md)
