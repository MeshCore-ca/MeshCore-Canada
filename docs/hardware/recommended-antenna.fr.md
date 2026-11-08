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

Des antennes qui ont donné de bons résultats aux communautés canadiennes. Toutes
sont conçues pour la bande de 902–928 MHz.

- **Éteignez l’appareil avant de changer l’antenne.** Faire fonctionner une
  radio sans antenne peut l’endommager.
- **Vérifiez le connecteur.** Les connecteurs SMA et RP-SMA se ressemblent, mais
  ne s’emboîtent pas; vérifiez celui de votre appareil.

## Antennes pour compagnons

Des antennes SMA compactes pour les appareils portatifs.

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

## Antennes pour répéteurs

Des antennes omnidirectionnelles à connecteur de type N pour les répéteurs.
L’Alfa est un bon point de départ. La Seeed mesure 1,3 mètre : utilisez-la
seulement sur un site élevé (environ 30 m au-dessus du sol ou plus) pour des
liaisons à longue distance.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Coût (CAD) | Lien |
|---|---|---|---|
| Alfa AOA-915-5ACM | Type N | 34,99 $ | [Amazon](https://a.co/d/ieEIQpy) |
| Seeed Studio RF Explorer 902-928MHz 8dBi, 1300 mm (318020693) | Type N | 110 $ | [Mouser](https://www.mouser.ca/ProductDetail/Seeed-Studio/318020693?qs=By6Nw2ByBD0kjpJjgHd0aQ%3D%3D) |

</div>

Pour une liaison fixe à longue distance, une antenne directionnelle :

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Coût (CAD) | Lien |
|---|---|---|---|
| L-com HG913Y-NF | Type N | 237,17 $ | [DigiKey](https://www.digikey.ca/en/products/detail/l-com/HG913Y-NF/21289980) |

</div>

## Câbles d’antenne

Utilisez le câble le plus court possible. [Infinite Cables](https://www.infinitecables.com/),
à Toronto, fabrique des câbles LMR-240 de bonne qualité dans plusieurs longueurs
et combinaisons de connecteurs.

<div class="mc-table-wrap" markdown>

| Produit | Connecteur | Lien |
|---|---|---|
| LMR-240 Ultra Flex N-Type Male to N-Type Female | Type N mâle à type N femelle | [Infinite Cables](https://www.infinitecables.com/products/lmr-240-ultra-flex-n-type-male-to-n-type-female-cable?variant=42809804980465) |

</div>

*Les prix datent de la compilation de cette liste; consultez les pages liées
pour les prix actuels et l’expédition.*

**Ensuite :** [Installer un répéteur](repeater-mounting-options.md) · [Compagnons](recommended-companions.md)
