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
last_reviewed: 2026-09-03
review_by: 2027-03-02
difficulty: beginner
estimated_time: 10-15 minutes
destructive: false
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Choisir un appareil compagnon

Un appareil compagnon est la radio jumelée à l’application MeshCore sur votre
téléphone. Voici ceux qu’utilisent les communautés canadiennes. Avant
d’acheter, vérifiez que le
[programme de mise à jour MeshCore](https://meshcore.io/flasher) propose le
modèle exact, et qu’il s’agit de la version 915 MHz.

## Prêts à l’emploi

<div class="mc-table-wrap" markdown>

| Produit | Notes | Lien |
|---|---|---|
| **ThinkNode M1** | Appareil compact basé sur le nRF52840, avec écran de 1,54 po et GPS. Conçu comme compagnon prêt à l’emploi pour une messagerie et un suivi fiables. **Commandez une antenne RP-SMA** avec l’appareil : une SMA ne s’y branche pas. | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| **LilyGO T-Echo** | Appareil compact avec écran et GPS intégrés. Choisissez la version 915 MHz pour le Canada, puis installez le micrologiciel compagnon MeshCore actuel. | [Boutique LilyGO](https://lilygo.cc/products/t-echo-lilygo) |
| **SenseCAP T1000-E** | Traceur mince en format carte de Seeed Studio. Portatif et certifié IP65. **Antenne interne :** portée plus courte; ne l’ouvrez pas pour changer l’antenne. | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| **RAK WisMesh Tag** | Appareil robuste avec GPS, antennes intégrées, pile de 1000 mAh et boîtier IP66. Il est livré avec Meshtastic; installez le micrologiciel compagnon MeshCore actuel avant de l’utiliser. **Antenne interne :** portée plus courte. | [RAKwireless](https://store.rakwireless.com/products/wismesh-tag-meshtastic-gps-lora-tracker-ip66) |

</div>

Les liens AliExpress s’ouvrent souvent sur l’option la moins chère; vérifiez que
vous avez choisi le bon ensemble. Vous voulez une meilleure antenne pour un
modèle à antenne amovible? Consultez [Antennes](recommended-antenna.md).

## À construire soi-même

Un exemple de montage pour les personnes qui aiment assembler leur propre
appareil. Il se jumelle à votre téléphone comme ceux ci-dessus.

<div class="mc-table-wrap" markdown>

| Article | Nom du produit | Coût (CAD) | Lien |
|---|---|---|---|
| **Carte LoRa** | Heltec T114 (ensemble avec écran) | 45,99 $ | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html) |
| **Câble IPEX à SMA à angle droit** | SMA-KW 2PCS 8cm | 4,67 $ | [AliExpress](https://www.aliexpress.com/item/1005009270132403.html) |
| **Pile** | MakerFocus LiPo 3,7 V 3000 mAh (paquet de 4), connecteur Micro JST 1.5 avec circuit de protection | 34,34 $ | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| **Antenne** | Gizont 915 MHz SMA M | 10,68 $ | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) (assurez-vous de choisir la bonne antenne à l’ouverture du lien) |

</div>

*Total de cet exemple d’achat :* **95,68 $ CAD**, dont un lot de quatre piles et
deux câbles; ce n’est donc pas le coût par appareil. *Les prix datent du
2 septembre 2026; consultez les pages liées pour les prix actuels,
l’expédition et les droits de douane.*

Le montage ne comprend pas de boîtier. Les
[modèles d’Alley Cat](https://www.printables.com/@AlleyCat/models) sont de bons
choix à imprimer en 3D; choisissez-en un qui accueille la pile de 3000 mAh et le
connecteur à angle droit.

Ce montage est aussi vendu assemblé par [Space Hedgehog](https://space-hedgehog.com/).

## Appareils autonomes

Les appareils autonomes ont leur propre écran et clavier et fonctionnent sans
téléphone. Nous recommandons plutôt de commencer par un compagnon jumelé à un
téléphone : les appareils autonomes coûtent plus cher et leur micrologiciel
manque encore de finition.

<div class="mc-table-wrap" markdown>

| Produit | Notes | Lien |
|---|---|---|
| **LilyGO T-LORA Pager** | Appareil de messagerie LoRa autonome et compact, au style d’un téléavertisseur classique. Utile pour des communications hors réseau simples, sans téléphone intelligent. | [Boutique LilyGO](https://lilygo.cc/en-ca/products/t-lora-pager) |
| **LilyGO T-Deck Plus** | Appareil autonome pris en charge par le micrologiciel Ripple de MeshCore. La boule de commande peut être moins pratique; tenez compte des commandes avant de choisir cet appareil. | [Boutique LilyGO](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

**Ensuite :** [Configurer un compagnon](../start/companion.md).
