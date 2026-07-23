---
title: Choisir une antenne et une ligne d’alimentation
description: Choisissez une antenne et un câble de 902–928 MHz en vérifiant les connecteurs, la perte, le montage et les besoins du site.
audience:
  - companion-owner
  - repeater-builder
task: choose-antenna
scope: canada-baseline
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: 10-15 minutes
destructive: false
requires:
  - confirmed-radio-band
  - confirmed-device-connector
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Choisir une antenne et une ligne d’alimentation

Commencez par la radio, le connecteur et l’installation. Comparez ensuite les
antennes qui couvrent la bande canadienne de 902–928 MHz.

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez avant d’acheter.** Les produits ci-dessous sont des exemples à
comparer, et non des recommandations de rendement vérifiées. Confirmez la fiche
technique actuelle, le connecteur, les dimensions, les besoins de montage et la
compatibilité avec la radio.

</div>

!!! danger "Coupez l’alimentation avant de changer une antenne"
    N’alimentez pas une radio et ne transmettez pas sans que la bonne antenne soit branchée. Débranchez l’alimentation USB et la pile avant de brancher ou de retirer une antenne, puis suivez les instructions du fabricant de la radio.

## Vérifier d’abord la compatibilité

<ul class="mc-checklist">
  <li>L’antenne est conçue pour la bande canadienne de 902–928 MHz.</li>
  <li>La famille et la polarité des connecteurs correspondent : les connecteurs SMA et RP-SMA peuvent se ressembler, mais leurs contacts électriques diffèrent.</li>
  <li>Le genre du connecteur, la queue de cochon et la ligne d’alimentation forment un parcours complet.</li>
  <li>L’appareil et le montage peuvent soutenir la taille et le poids de l’antenne, sa charge au vent et la tension exercée par le câble.</li>
  <li>Les connecteurs extérieurs peuvent être protégés contre les intempéries et inspectés sans emprisonner l’eau.</li>
  <li>La page du produit et la fiche technique actuelles confirment les renseignements utilisés pour votre choix.</li>
</ul>

## Antennes portatives à comparer

Avant de commander, confirmez si la radio utilise un connecteur SMA, RP-SMA ou
interne.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur indiqué | À vérifier | Source |
|---|---|---|---|
| LINX ANT-916-CW-HW-SMA | SMA | Plage de fréquences, connecteur correspondant, dimensions et prise en charge de l’appareil | [DigiKey](https://www.digikey.ca/en/products/detail/te-connectivity-linx/ANT-916-CW-HW-SMA/2694126?s=N4IgTCBcDaIDIEkByANABAQSQFQLQE4BGANlwGEB1XACSoGUBZDEAXQF8g) |
| Taoglas TI.09.A.0111 | SMA | Plage de fréquences, connecteur correspondant, dimensions et prise en charge de l’appareil | [DigiKey](https://www.digikey.ca/en/products/detail/taoglas-limited/TI-09-A-0111/2332695?s=N4IgTCBcDaICoEMD2BzANggzgAjgSQDoAGATgIEFiBGGkAXQF8g) |
| Seeed Studio LoRa Antenna Kit | SMA | Plage de fréquences, contenu exact de la trousse, connecteur correspondant et prise en charge de l’appareil | [Seeed Studio](https://www.seeedstudio.com/LoRa-Antenna-Kit-for-reTerminal-DM-p-5714.html) |

</div>

## Antennes fixes à comparer

Une antenne permanente de répéteur représente une décision d’installation
complète, et non seulement un chiffre de gain. Tenez compte de la perte du
câble, du nombre de connecteurs, du diagramme de rayonnement, des conditions RF
locales, de la structure, de l’examen de la protection contre la foudre et de
la mise à la terre, des intempéries et de l’accès sécuritaire.

<div class="mc-table-wrap" markdown>

| Produit | Type | Connecteur indiqué | À vérifier | Source |
|---|---|---|---|---|
| Seeed Studio 318020693 | Omnidirectionnelle en fibre de verre | Type N | Plage de fréquences, diagramme, dimensions, charge au vent, montage et parcours du câble | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |
| L-com HG913Y-NF | Directionnelle | Type N | Plage de fréquences, diagramme, orientation, charge au vent, montage et parcours du câble | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

## Choisir la ligne d’alimentation

Utilisez le câble pratique le plus court dont la perte est acceptable.
Confirmez les deux connecteurs, le type et la longueur du câble, sa perte à la
fréquence d’utilisation, son indice pour l’extérieur, son rayon de courbure,
son serre-câble et son étanchéité. [Infinite Cables](https://www.infinitecables.com/)
est une source canadienne de câbles RF assemblés; son
[exemple LMR-240 Ultra Flex de type N](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465)
pourrait ne pas avoir les connecteurs dont vous avez besoin.

## Consigner le choix

Avant l’installation, consignez :

- le produit et la révision de l’antenne;
- la bande et le diagramme publiés;
- chaque connecteur et adaptateur, dans l’ordre;
- le type et la longueur du câble;
- la méthode de montage et de protection contre les intempéries;
- les liens vers les sources et la date de vérification;
- l’essai local qui sera effectué après l’installation.

## Vérifier après l’installation

Pendant que le boîtier est encore accessible, confirmez que la radio indique
les réglages prévus, que la ligne d’alimentation n’est ni desserrée ni pliée
brusquement, que l’étanchéité ne crée pas un chemin pour l’eau et qu’un essai de
message local réussit. N’attribuez pas un changement de couverture à l’antenne
seule sans résultats comparatifs reproductibles.

## Terminer l’installation

Pour une installation fixe, consultez les
[options de montage](repeater-mounting-options.md). Pour un nœud portatif,
revenez aux [choix de compagnons](recommended-companions.md).
