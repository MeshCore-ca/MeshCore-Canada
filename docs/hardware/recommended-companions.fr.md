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

Les appareils compagnons utilisent un micrologiciel de compagnon dédié et servent de points d’accès utilisateur sur le réseau MeshCore. La plupart se jumellent à votre téléphone intelligent par Bluetooth Low Energy (BLE) pour donner accès au réseau maillé.

Il existe aussi des compagnons autonomes avec écran et commandes intégrés. Ils fonctionnent sans téléphone, mais restent des points d’accès.

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez avant d’acheter.** Ces appareils ont été essayés et éprouvés par la communauté d’Ottawa et d’autres réseaux, mais les révisions de produits et la prise en charge du micrologiciel changent. Confirmez le modèle exact, la bande radio canadienne, la cible de micrologiciel du compagnon, le connecteur et les accessoires inclus dans le [programme officiel de mise à jour MeshCore](https://flasher.meshcore.io/) et dans l’information à jour du fabricant.

</div>

!!! warning "Remplacez seulement une antenne amovible"
    Les compagnons à antenne amovible peuvent profiter d’une des antennes testées ci-dessous. N’ouvrez pas et ne modifiez pas un appareil scellé à antenne interne, comme le T1000-E ou le WisMesh Tag.

    Voir : [Antennes recommandées](recommended-antenna.md)

## Compagnons Bluetooth Low Energy (BLE)

Ces appareils exigent un téléphone intelligent et l’application MeshCore. Ils se connectent à votre téléphone par BLE, et vous utilisez l’application pour interagir avec le réseau maillé. Dans cette configuration, le compagnon sert uniquement de radio et relie votre téléphone au réseau.

### Préassemblés

La façon la plus simple de commencer est d’acheter un compagnon, d’y installer MeshCore et de rejoindre le réseau. L’application MeshCore se connecte à l’appareil par BLE et sert à envoyer et à recevoir des messages sur le réseau maillé.

!!! warning "Note importante sur le ThinkNode M1"
    Assurez-vous de commander une **antenne RP-SMA** avec l’appareil.

    **N’achetez pas une antenne SMA par erreur. Il vous faut précisément une RP-SMA.**

    ThinkNode utilise un connecteur RP-SMA sur le ThinkNode M1.

!!! warning "Ensembles AliExpress"
    AliExpress affiche habituellement l’article le moins cher (par exemple, seulement le module GPS) à l’ouverture d’un lien. Assurez-vous de choisir le bon ensemble avant de l’ajouter à votre panier.

Les compagnons préassemblés suivants sont populaires et largement offerts :

<div class="mc-table-wrap" markdown>

| Produit | Notes | Lien |
|---|---|---|
| **ThinkNode M1** | Appareil compact basé sur le nRF52840, avec écran de 1,54 po et GPS. Conçu comme compagnon prêt à l’emploi pour une messagerie et un suivi fiables. **Note :** connecteur RP-SMA. Voir l’avertissement SMA c. RP-SMA ci-dessus. | [Elecrow](https://www.elecrow.com/thinknode-m1-meshtastic-lora-signal-transceiver-powered-by-nrf52840-with-154-screen-support-gps.html) |
| **LilyGO T-Echo** | Appareil compact avec écran et GPS intégrés. Choisissez la version 915 MHz pour le Canada, puis installez le micrologiciel compagnon MeshCore actuel. | [Boutique LilyGO](https://lilygo.cc/products/t-echo-lilygo) |
| **SenseCAP T1000-E** | Traceur mince en format carte de Seeed Studio. Portatif et certifié IP65. **Note :** portée plus limitée en raison des antennes internes. | [Seeed Studio](https://www.seeedstudio.com/SenseCAP-Card-Tracker-T1000-E-for-Meshtastic-p-5913.html) |
| **RAK WisMesh Tag** | Appareil robuste avec GPS, antennes intégrées, pile de 1000 mAh et boîtier IP66. Il est livré avec Meshtastic; installez le micrologiciel compagnon MeshCore actuel avant de l’utiliser. **Note :** portée plus limitée en raison des antennes internes. | [RAKwireless](https://store.rakwireless.com/products/wismesh-tag-meshtastic-gps-lora-tracker-ip66) |

</div>

### À construire soi-même

Pour les bricoleurs qui aiment se procurer les pièces et assembler leur propre appareil, voici un exemple de montage adapté à Ottawa. Consultez les [antennes recommandées](recommended-antenna.md) pour d’autres options d’antenne.

Il s’agit d’un rôle de **compagnon** et il exige un téléphone intelligent. L’application MeshCore se connecte à l’appareil par BLE et sert à envoyer et à recevoir des messages sur le réseau maillé.

#### Exemple de montage maison

<div class="mc-table-wrap" markdown>

| Article | Nom du produit | Coût (CAD) | Lien |
|---|---|---|---|
| **Carte LoRa** | Heltec T114 (ensemble avec écran) | 45,99 $ | [AliExpress](https://www.aliexpress.com/item/1005007916299029.html) |
| **Câble IPEX à SMA à angle droit** | SMA-KW 2PCS 8cm | 4,67 $ | [AliExpress](https://www.aliexpress.com/item/1005009270132403.html) |
| **Pile** | MakerFocus LiPo 3,7 V 3000 mAh (paquet de 4), connecteur Micro JST 1.5 avec circuit de protection | 34,34 $ | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4?variant=44823607541998) |
| **Antenne** | Gizont 915 MHz SMA M | 10,68 $ | [AliExpress](https://www.aliexpress.com/item/1005004607615001.html) (assurez-vous de choisir la bonne antenne à l’ouverture du lien) |

</div>

*Total de cet exemple d’achat :* **95,68 $ CAD**, dont un lot de quatre piles et deux câbles. Ce n’est pas le coût par appareil.

*Les prix datent du 2 septembre 2026. Consultez les pages liées pour vérifier les prix, l’expédition, les droits de douane et la disponibilité.*

!!! warning "Boîtier pour l’exemple de montage"
    Cet exemple de montage ne comprend pas de boîtier. Pour des boîtiers à imprimer en 3D, consultez les **[modèles d’Alley Cat](https://www.printables.com/@AlleyCat/models)**. Ils conviennent très bien aux compagnons faits maison. Assurez-vous que le boîtier choisi peut recevoir la pile de 3000 mAh et le connecteur IPEX à SMA à angle droit.

Si vous êtes dans la région d’Ottawa, vous pouvez aussi acheter ce montage entièrement assemblé auprès de [Space Hedgehog](https://space-hedgehog.com/).

## Appareils autonomes

Il existe des appareils autonomes comme le **T-Deck**, mais nous recommandons de commencer par un compagnon jumelé à un téléphone. Les appareils autonomes sont généralement plus chers, leur interface est moins fluide que l’application mobile, et ils présentent encore des particularités et des limites de micrologiciel qui peuvent compliquer la tâche des débutants.

### Appareils autonomes offerts

<div class="mc-table-wrap" markdown>

| Produit | Notes | Lien |
|---|---|---|
| **LilyGO T-LORA Pager** | Appareil de messagerie LoRa autonome et compact, au style d’un téléavertisseur classique. Utile pour des communications hors réseau simples, sans téléphone intelligent. | [Boutique LilyGO](https://lilygo.cc/en-ca/products/t-lora-pager) |
| **LilyGO T-Deck Plus** | Appareil autonome pris en charge par le micrologiciel Ripple de MeshCore. La boule de commande peut être moins pratique; tenez compte des commandes avant de choisir cet appareil. | [Boutique LilyGO](https://lilygo.cc/products/t-deck-plus-meshtastic) |

</div>

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
