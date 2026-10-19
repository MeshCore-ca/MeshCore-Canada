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
last_reviewed: 2026-09-03
review_by: 2027-03-02
difficulty: intermediate
estimated_time: 10-15 minutes
destructive: false
requires:
  - confirmed-radio-band
  - confirmed-device-connector
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choisir une antenne et une ligne d’alimentation

De nombreux appareils LoRa à antenne amovible sont livrés avec une antenne d’usine rudimentaire. La communauté d’Ottawa a obtenu de bons résultats avec les options de 902–928 MHz ci-dessous.

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez avant d’acheter.** Ces antennes ont bien fonctionné à Ottawa et dans d’autres réseaux, mais les révisions de produits changent. Confirmez auprès du fabricant la fiche technique actuelle, le connecteur, les dimensions, les besoins de montage et la compatibilité avec la radio avant de commander.

</div>

!!! danger "Coupez l’alimentation avant de changer une antenne"
    Assurez-vous que l’appareil est débranché de l’alimentation et de la pile avant de changer d’antenne. Comme ces appareils peuvent émettre des signaux radio, allumer un appareil sans antenne peut l’endommager. [Plus d’information ici](https://electronics.stackexchange.com/questions/335912/can-i-break-a-radio-tranceiving-device-by-operating-it-with-no-antenna-connected){ target="_blank" rel="noopener" } (en anglais).

## Vérifier d’abord la compatibilité

<ul class="mc-checklist">
  <li>L’antenne est conçue pour la bande canadienne de 902–928 MHz.</li>
  <li>La famille et la polarité des connecteurs correspondent : les connecteurs SMA et RP-SMA peuvent se ressembler, mais leurs contacts électriques diffèrent.</li>
  <li>Le genre du connecteur, la queue de cochon et la ligne d’alimentation forment un parcours complet.</li>
  <li>L’appareil et le montage peuvent soutenir la taille et le poids de l’antenne, sa charge au vent et la tension exercée par le câble.</li>
  <li>Les connecteurs extérieurs peuvent être protégés contre les intempéries et inspectés sans emprisonner l’eau.</li>
  <li>La page du produit et la fiche technique actuelles confirment les renseignements utilisés pour votre choix.</li>
</ul>

## Antennes pour compagnons

Ce sont des antennes SMA, plus compactes, qui ont pourtant constamment offert un excellent rendement à Ottawa et dans d’autres réseaux. Nous recommandons n’importe laquelle des options ci-dessous.

!!! warning "SMA c. RP-SMA"
    Portez une attention particulière au type de connecteur de votre compagnon ou répéteur, car certains sont livrés avec un connecteur SMA à polarité inversée (RP-SMA). Vous aurez besoin d’un adaptateur pour brancher une antenne SMA, ou d’acheter une antenne RP-SMA. [Plus d’information sur les différences entre ces connecteurs](https://blog.linitx.com/what-are-sma-rp-sma-connectors-and-whats-the-difference/){ target="_blank" rel="noopener" } (en anglais).

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Coût (CAD) | Lien |
|---|---|---|---|
| Gizont 915 MHz SMA M | SMA | 12 $ | [Space Hedgehog (boutique locale)](https://space-hedgehog.com/products/gizont-915mhz-antenna?variant=51602989711416) |
| Gizont 915 MHz SMA M | SMA | 10,53 $ | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| Gizont 915 MHz RP-SMA M | RP-SMA | 10,53 $ | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) |
| LINX ANT-916-CW-HW-SMA | SMA | 14,65 $ | [DigiKey](https://www.digikey.ca/en/products/detail/te-connectivity-linx/ANT-916-CW-HW-SMA/2694126?s=N4IgTCBcDaIDIEkByANABAQSQFQLQE4BGANlwGEB1XACSoGUBZDEAXQF8g) |
| Taoglas TI.09.A.0111 | SMA | 17,47 $ | [DigiKey](https://www.digikey.ca/en/products/detail/taoglas-limited/TI-09-A-0111/2332695?s=N4IgTCBcDaICoEMD2BzANggzgAjgSQDoAGATgIEFiBGGkAXQF8g) |
| Seeed Studio LoRa Antenna Kit | SMA | 6,79 $ | [Seeed Studio](https://www.seeedstudio.com/LoRa-Antenna-Kit-for-reTerminal-DM-p-5714.html) |

</div>

## Antennes omnidirectionnelles pour répéteurs

Ces antennes de type N sont destinées aux répéteurs. L’Alfa est le choix de départ courant à Ottawa, mais la hauteur, la perte du câble, le terrain et les conditions RF locales influencent aussi la couverture.

Si vous voulez une antenne plus grande et plus performante, nous avons mis à l’essai l’antenne en fibre de verre Seeed de 1300 mm avec d’excellents résultats. Notez qu’elle mesure 1,3 mètre. Nous ne la recommandons que pour les répéteurs installés à une hauteur importante (environ 30 m au-dessus du sol ou plus) et destinés aux liaisons longue distance ou à la dorsale.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Coût (CAD) | Lien |
|---|---|---|---|
| Alfa AOA-915-5ACM | Type N | 34,99 $ | [Amazon](https://a.co/d/ieEIQpy) |
| Seeed Studio RF Explorer 902-928MHz 8dBi, 1300 mm (318020693) | Type N | 110 $ | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |

</div>

## Antennes directionnelles pour répéteurs

Les antennes directionnelles sont destinées aux répéteurs fixes et aux liaisons longue distance point à point ou point à multipoint. Toutes les antennes ci-dessous utilisent un connecteur de type N et conviennent aux installations extérieures permanentes.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Coût (CAD) | Lien |
|---|---|---|---|
| L-com HG913Y-NF | Type N | 237,17 $ | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

Une antenne permanente de répéteur représente une décision d’installation complète, et non seulement un chiffre de gain. Tenez compte de la perte du câble, du nombre de connecteurs, du diagramme de rayonnement, des conditions RF locales, de la structure, de la protection contre la foudre et de la mise à la terre, des intempéries et de l’accès sécuritaire.

*Les prix ont été relevés au moment de la rédaction de cette liste (consultez la page liée pour le prix et la date à jour). Ils varient selon le fournisseur et peuvent exclure l’expédition.*

## Câbles d’antenne

Pour des câbles LMR-240 courts et de grande qualité, [Infinite Cables](https://www.infinitecables.com/), à Toronto, est la meilleure source que nous ayons trouvée. Leurs câbles sont plutôt chers, mais la qualité de fabrication est excellente et ils offrent une grande variété de longueurs et de combinaisons de connecteurs pour toute installation. Utilisez le câble pratique le plus court dont la perte est acceptable, et confirmez les deux connecteurs, le type et la longueur du câble, son indice pour l’extérieur, son rayon de courbure, son serre-câble et son étanchéité.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Lien |
|---|---|---|
| LMR-240 Ultra Flex N-Type Male to N-Type Female | Type N mâle à type N femelle | [Infinite Cables](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465) |

</div>

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
