---
title: Construire un répéteur solaire de 1 W avec l’Ikoka Stick
description: Pièces, prix, photos d’assemblage, schéma de câblage et télémétrie INA3221 facultative pour le répéteur solaire Ikoka Stick de MrAlders0n.
audience:
  - advanced-repeater-builder
task: build-1w-solar-repeater
scope: ottawa-field-practice
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-09-09
review_by: 2026-10-17
difficulty: advanced
estimated_time: plusieurs jours, y compris la fabrication et le durcissement de la colle
destructive: true
requires:
  - multimeter
  - soldering-experience
  - fabrication-experience
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20260909-1
---

<span id="repeteur-solaire-experimental-de-1-w"></span>

# Construire un répéteur solaire de 1 W — Ikoka Stick

Par **MrAlders0n (Ottawa)** · Guide d’origine : **1er janvier 2026**

Construisez un répéteur MeshCore solaire avec une GOME Ikoka Stick, une boîte de jonction et un panneau solaire collé à l’époxy.

**Carte :** GOME Ikoka Stick (matériel v0.4.0)<br>
**Alimentation :** Waveshare Solar Power Manager (modèle standard)<br>
**Micrologiciel :** MeshCore

## Avant de commencer

!!! warning "Sans garantie"
    Ce guide communautaire est fourni sans garantie. Vérifiez la continuité et la polarité au multimètre avant de mettre le circuit sous tension. Débranchez le panneau solaire, la batterie et l’USB avant de souder ou de modifier le câblage.

<span id="cette-construction-convient-elle"></span>

!!! info "Quand utiliser un répéteur de 1 W"
    Un répéteur de 1 W peut servir aux liaisons principales ou aux endroits où la connexion au maillage est difficile. Il n’est pas nécessaire partout; consultez votre communauté locale.

!!! danger "Antenne obligatoire"
    **Branchez une antenne LoRa avant d’alimenter l’Ikoka Stick. Émettre sans antenne peut endommager définitivement la radio.** Utilisez le [réglage de puissance MeshCore adapté à votre module Ikoka](https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md#77-q-i-have-a-station-g2-or-a-heltec-v4-or-an-ikoka-stick-or-a-radio-with-an-ebyte-e22-900m30s-or-an-ebyte-e22-900m33s-module-what-should-their-transmit-power-be-set-to); une sortie de 1 W ne signifie pas qu’il faut régler la puissance TX à 30 dBm.

<span id="liste-du-materiel-a-verifier"></span>

## Liste des pièces { #parts-list }

Les prix proviennent du guide d’origine daté du **1er janvier 2026**. Ce ne sont pas des devis actuels. Les montants sont en dollars canadiens; vérifiez la disponibilité, la livraison et les taxes avant de commander.

<div class="mc-table-wrap mc-build-table mc-parts-table" markdown>

| Nº | Pièce | Qté | Prix | Source |
|---:|---|---:|---|---|
| 1 | GOME Ikoka Stick (matériel v0.4.0) | 1 | 55 $ | [GitHub](https://github.com/ndoo/ikoka-stick-meshtastic-device) (achat groupé) |
| 2 | Waveshare Solar Power Manager (modèle standard) | 1 | 15 $ | [Waveshare](https://www.waveshare.com/wiki/Solar_Power_Manager) |
| 3 | Boîte de jonction IP65 grise, 220 × 170 × 110 mm | 1 | 30 $ | [AliExpress](https://www.aliexpress.com/item/1005007587120013.html) |
| 4 | Panneau solaire de 10 W / 18 V, 250 × 340 mm | 1 | 35 $ | [Amazon](https://a.co/d/0eJo5GCr) |
| 5 | Bloc de batteries 18650 en 3P1S (ou 4P1S) | 1 | 25–35 $ | [MP&W Supply](https://mpandw.ca/) |
| 6 | Carte de protection de batterie, coupure haute et basse tension | 1 | 8 $ | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off) |
| 7 | Filtre passe-bande à quatre cavités, 890–960 MHz, 50 W (recommandé) | 1 | 65 $ | [Alibaba](https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html) |
| 8 | Câble de 10–15 cm, SMA coudé vers connecteur N femelle de cloison avec joint torique et écrou | 1 | 6 $ | [AliExpress](https://www.aliexpress.com/item/1005008569444661.html) |
| 9 | Câble de 7,5 cm, SMA mâle coudé à 90° aux deux extrémités | 1 | 7 $ | [AliExpress](https://www.aliexpress.com/item/1005006702037541.html) |
| 10 | Câble de 0,5 pi, USB-A vers USB-C coudé | 1 | 7 $ | [Amazon](https://a.co/d/045htrEG) |
| 11 | Entretoises M3x35 | 4 | — | — |
| 12 | Vis M3x5 | 8 | — | — |
| 13 | Époxy Gorilla en seringue, 25 ml | 1 | 15 $ | [Home Depot](https://www.homedepot.ca/product/gorilla-epoxy-syringe-25ml/1000778451) |
| 14 | Évent étanche | 1 | 2 $ | [AliExpress](https://www.aliexpress.com/item/1005006370919409.html) |
| 15 | Mastic silicone transparent pour l’extérieur | 1 | 10 $ | Quincaillerie |
| 16 | Adafruit INA3221 (facultatif) | 1 | 15–20 $ | [DigiKey](https://www.digikey.ca/en/products/detail/adafruit-industries-llc/6062/25660599) |

</div>

**Coût total estimé dans le guide d’origine :** environ **280–290 $ sans INA3221**, ou **300–310 $ avec INA3221**. L’antenne, les pièces imprimées en 3D et la visserie de montage ne sont pas comprises.

**Autre filtre possible (solution minimale) :** filtre à cavité Callboost de 915 MHz, bande passante de 26 MHz, 82 $. [AliExpress](https://www.aliexpress.com/item/1005004468960058.html)

### Antenne

L’antenne n’est pas incluse, car le choix dépend de l’installation. Le guide d’origine recommande un gain de 6–8 dBi ou plus pour ce type de liaison. Plusieurs personnes à Ottawa ont observé une baisse de qualité du signal avec l’Ikoka Stick et l’antenne Alfa de 5,8 dBi. Il s’agit d’une observation sur ces installations, pas d’une incompatibilité établie.

Consultez les [antennes omnidirectionnelles GOME pour répéteurs](recommended-antenna.md#antennes-omnidirectionnelles-pour-repeteurs) pour les options présentées dans le guide.

<span id="outils-et-telechargements"></span>

## Outils nécessaires

<div class="mc-table-wrap mc-build-table" markdown>

| Outil | Notes |
|---|---|
| Fer à souder | Une panne fine facilite les connexions I2C |
| Soudure et flux | |
| Multimètre | Vérifications de continuité et de tension |
| Foret étagé | Pour percer proprement la boîte de jonction |
| Scie sauteuse ou outil rotatif | Pour découper l’ouverture du panneau solaire |
| Foret de 1/8 po | Pour agrandir les trous de montage |
| Crayon | Pour tracer la découpe |
| Serre-joints et morceau de bois plat | Pour maintenir le panneau pendant le durcissement de l’époxy |
| Pince à dénuder | |

</div>

<span id="prerequisites"></span>
<span id="downloads"></span>

## Pièces imprimées et téléchargements

Imprimez ces deux pièces avant de commencer :

- Une **plaque de montage** pour la boîte de jonction, qui porte le filtre, l’Ikoka et la carte Waveshare.
- Un **support de trois batteries 18650 en parallèle**, ou un support adapté à votre bloc de batteries.

Téléchargements :

- [Plaque et support de batteries 3P1S, fichier combiné .3mf](files/repeater-solar-1w-diy-build-plate-and-battery-holder.3mf)
- [Plaque de montage (.stl)](files/repeater-solar-1w-diy-build-plate.stl)
- [Support de trois batteries 18650 (.stl)](files/repeater-solar-1w-diy-build-3x18650-battery-holder.stl)

<span id="ce-que-cette-construction-change"></span>
<span id="etapes-dassemblage"></span>

## Étapes d’assemblage { #assembly-steps }

Gardez le panneau solaire, la batterie et l’USB débranchés pendant les découpes, les soudures et les modifications du câblage.

### Préparer le boîtier

1. Posez le panneau solaire face contre le sol. À l’arrière, repérez le petit boîtier noir d’où sortent les fils rouge et noir. Mesurez-le à la règle ou au pied à coulisse.

2. Sur la **face avant** de la boîte de jonction grise, tracez un rectangle aux dimensions de ce petit boîtier. Centrez-le près du haut de la face.

3. Percez un trou de départ au centre du rectangle avec le foret étagé.

4. Découpez le rectangle à la scie sauteuse ou à l’outil rotatif, puis ébavurez les bords.

### Fixer le panneau solaire

5. Mélangez l’époxy Gorilla et étalez-la sur toute la zone de la boîte de jonction qui recevra le panneau.

6. Faites passer le câble du panneau par l’ouverture, de l’extérieur vers l’intérieur de la boîte.

      [![Fils du panneau solaire passant dans l’ouverture de la boîte](images/repeater-solar-1w-diy-build-1.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-1.jpg)

7. Pressez le panneau contre la face encollée. Placez un morceau de bois plat devant le panneau et serrez les quatre coins avec des serre-joints pour répartir la pression. Ne serrez pas trop : le panneau peut se fissurer. Vous pouvez aussi poser l’assemblage à plat et placer des poids sur l’arrière de la boîte.

8. Laissez l’époxy durcir pendant toute la durée indiquée par le fabricant avant de retirer les serre-joints.

9. Appliquez un cordon de silicone extérieur transparent sur les quatre côtés, à la jonction du panneau et de la boîte. Lissez-le pour former un joint étanche.

### Installer la plaque et le filtre

10. Fixez les quatre entretoises M3x35 aux coins de la plaque de montage. Au besoin, agrandissez légèrement les trous avec le foret de 1/8 po pour laisser passer les vis M3. Utilisez la plaque imprimée comme gabarit.

      [![Plaque de montage avec entretoises et filtre](images/repeater-solar-1w-diy-build-2.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-2.jpg)

11. Fixez le filtre passe-bande RF à peu près au centre de la plaque.

12. Branchez le câble N vers SMA à la **sortie** du filtre. Il traversera la paroi de la boîte vers l’antenne extérieure.

13. Choisissez l’emplacement du connecteur N sur la paroi. Percez au foret étagé en augmentant progressivement le diamètre et en essayant le connecteur à chaque étape.

14. Passez le connecteur N de l’intérieur vers l’extérieur, puis serrez son écrou avec le joint torique.

15. Percez un trou dans le **fond** de la boîte pour l’évent étanche.

16. Installez et serrez l’évent.

      [![Filtre dans le boîtier avec câbles SMA, connecteur N et évent](images/repeater-solar-1w-diy-build-3.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-3.jpg)

### Préparer le filtre et la radio

17. Branchez le câble SMA vers SMA à l’**entrée** du filtre. Serrez-le à la main pour le moment.

18. **Waveshare Solar Power Manager, modèle standard :** le montage d’origine relie les pastilles du bouton BOOT avec un fil pour rétablir la sortie après une coupure de courant, sans appuyer sur le bouton. Avec toutes les alimentations débranchées, soudez un petit fil entre les pastilles au dos de la carte, comme sur la photo. Cette modification concerne le modèle standard; ne supposez pas que les versions B, C ou D utilisent le même circuit. Testez le redémarrage après une coupure avant de fermer le boîtier.

      [![Fil soudé entre les pastilles du bouton BOOT du gestionnaire Waveshare](images/repeater-solar-1w-diy-build-4.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-4.jpg)

### Monter les composants

19. Pour faciliter l’accès, fixez l’Ikoka Stick et le gestionnaire Waveshare à la plaque de montage hors du boîtier. Installez aussi l’INA3221 si vous l’utilisez.

20. **(INA3221 facultatif)** Dessoudez délicatement les broches de l’embase de l’écran OLED de l’Ikoka Stick. Travaillez lentement pour ne pas endommager les composants voisins.

21. **(INA3221 facultatif)** Soudez les fils I2C de l’INA3221 aux pastilles de l’embase de l’écran. Les connexions sont indiquées dans la section [Câblage de l’INA3221](#ina3221-wiring-optional).

      [![INA3221 relié au bus I2C de l’Ikoka avec le gestionnaire Waveshare](images/repeater-solar-1w-diy-build-5.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-5.jpg)

22. Placez la plaque équipée dans la boîte et fixez-la aux entretoises M3x35 avec les vis M3x5.

### Installer la batterie

23. Fixez le support de batteries imprimé à l’intérieur de la face avant, sous l’entrée des fils du panneau solaire. Utilisez de l’adhésif double face ou de l’époxy.

24. Si le bloc de batteries 18650 n’a pas de circuit de protection intégré (PCM), placez la carte de protection entre la batterie et le gestionnaire Waveshare. Respectez les indications de polarité.

### Câbler l’alimentation

25. **(INA3221 facultatif) Panneau solaire :** reliez le positif du panneau à **CH3+**, puis **CH3-** au positif de l’entrée solaire du Waveshare. Reliez directement le négatif du panneau au négatif de l’entrée solaire.

26. **(INA3221 facultatif) Batterie :** reliez le positif de la batterie, ou de son PCM, à **CH1+**. Reliez **CH1-** au positif du connecteur de batterie JST PH2.0 du Waveshare. Reliez directement le négatif de la batterie au négatif du connecteur, puis branchez celui-ci sur la carte.

      **Sans INA3221 :** branchez le panneau solaire et la batterie directement aux entrées solaire et batterie du Waveshare.

### Terminer les connexions

27. Branchez le câble SMA venant de l’entrée du filtre au connecteur SMA de l’Ikoka Stick. Serrez les deux extrémités avec une clé adaptée, sans tordre le câble ni trop serrer. Un connecteur desserré entraîne une perte de signal. Branchez l’antenne extérieure avant de mettre l’ensemble sous tension.

28. Reliez la sortie USB-A du Waveshare à l’entrée USB-C de l’Ikoka Stick avec le câble USB.

      *Montage terminé avec INA3221 :*

      [![Montage terminé avec INA3221, Waveshare et Ikoka Stick](images/repeater-solar-1w-diy-build-6.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-6.jpg)

      *Sans INA3221 :*

      [![Montage terminé sans INA3221](images/repeater-solar-1w-diy-build-7.jpg){ .mc-build-photo width="300" height="400" loading=lazy }](images/repeater-solar-1w-diy-build-7.jpg)

      *Vue complète de l’intérieur avec INA3221, bloc de batteries et câblage :*

      [![Vue complète du boîtier terminé avec INA3221](images/repeater-solar-1w-diy-build-8.jpg){ .mc-build-photo width="300" height="225" loading=lazy }](images/repeater-solar-1w-diy-build-8.jpg)

## Câblage de l’INA3221 (facultatif) { #ina3221-wiring-optional }

L’Adafruit INA3221 se relie au bus I2C de l’Ikoka Stick par les pastilles de l’**embase d’écran OLED**. Retirez les broches de l’embase et soudez les fils directement aux pastilles.

**Connexions I2C, de l’embase d’écran Ikoka vers l’INA3221 :**

<div class="mc-table-wrap mc-build-table" markdown>

| Embase d’écran Ikoka | Broche INA3221 | Fonction |
|---|---|---|
| Broche 1 — GND | GND | Masse |
| Broche 2 — VCC (3,3 V) | VCC | Alimentation |
| Broche 3 — SCL | SCL | Horloge |
| Broche 4 — SDA | SDA | Données |

</div>

**Affectation des canaux INA3221 :**

<div class="mc-table-wrap mc-build-table" markdown>

| Canal | Connexion | Fonction |
|---|---|---|
| CH1 | Batterie | Mesurer la tension et le courant de la batterie |
| CH2 | Non utilisé | Disponible pour un ajout ultérieur |
| CH3 | Panneau solaire | Mesurer la tension et le courant solaires |

</div>

**Note :** VCC alimente l’INA3221 en 3,3 V depuis l’Ikoka. VIN1, VIN2 et VIN3 sont les entrées de mesure, pas la broche d’alimentation.

### Options de compilation du micrologiciel

MeshCore utilise l’adresse `0x42` par défaut; l’Adafruit INA3221 utilise `0x40`. Conservez les options héritées de la carte et ajoutez ces réglages à l’environnement du répéteur 30 dBm :

```ini
[env:ikoka_stick_nrf_30dbm_repeater]
build_flags =
  ${ikoka_stick_nrf_repeater.build_flags}
  ${ikoka_stick_nrf_e22_30dbm.build_flags}
  -D TELEM_INA3221_ADDRESS=0x40
  -UENV_INCLUDE_INA219
  -D TELEM_INA3221_SHUNT_VALUE=0.05
```

Les options d’adresse et d’INA219 viennent du guide d’origine : elles sélectionnent `0x40` et désactivent le pilote INA219 pour éviter un conflit. L’option de résistance shunt correspond aux résistances de **0,05 Ω** de la carte Adafruit et corrige l’échelle des mesures de courant. Voir le [brochage Adafruit](https://learn.adafruit.com/adafruit-ina3221-breakout/pinouts) et les [réglages de capteurs MeshCore](https://github.com/meshcore-dev/MeshCore/blob/main/src/helpers/sensors/EnvironmentSensorManager.cpp).

## Schéma de câblage { #wiring-diagram }

[![Schéma de câblage du répéteur solaire Ikoka avec INA3221](images/repeater-solar-1w-diy-build-9.svg){ .mc-build-photo .mc-build-diagram width="600" height="543" loading=lazy }](images/repeater-solar-1w-diy-build-9.svg)

<span id="le-tester-sur-letabli"></span>

## Vérifier avant la mise sous tension { #verifier-les-mesures }

- Vérifiez la polarité et la continuité, puis inspectez les soudures pour repérer les courts-circuits.
- Utilisez un bloc 1S protégé, composé de cellules assorties, et respectez leur plage de températures de charge.
- Vérifiez les connexions de l’antenne, du filtre et des câbles RF.
- Mesurez la sortie USB du gestionnaire d’alimentation avant de brancher la radio.
- Testez le retour de l’alimentation après une coupure. Si vous avez installé l’INA3221, comparez ses mesures à celles du multimètre.
- [Programmez et configurez le répéteur](../start/repeater.md), puis vérifiez qu’un compagnon proche reçoit son annonce avant de l’installer.

## Dépannage et récupération { #recuperation-et-retour-en-arriere }

Si le répéteur ne démarre pas, débranchez l’alimentation et revérifiez le câblage ainsi que la modification du bouton BOOT. N’utilisez plus une batterie chaude, gonflée, endommagée ou qui fuit. Si une mise à jour du micrologiciel échoue, suivez les [étapes de récupération par USB](../meshcore/flash-repeater.md#plan-de-recuperation) après avoir vérifié l’alimentation et les connexions RF.

<span id="entretien"></span>

Après l’installation, inspectez régulièrement le montage, le collage du panneau, les joints, l’évent, les câbles et la batterie, ainsi qu’après de fortes intempéries.

## Source

Restauration du [guide de MrAlders0n publié avant la refonte](https://github.com/MeshCore-ca/MeshCore-Canada/blob/76a4262a354a111d19ddf8cc4abb25b1267fd9db/docs/hardware/repeater-solar-1w-diy-build.md). Les pièces, l’ordre d’assemblage, les photos, les tableaux de câblage et les téléchargements d’origine sont conservés. L’exemple de télémétrie facultative précise aussi la résistance shunt de la carte Adafruit.

Consultez le [manuel Waveshare](https://files.waveshare.com/upload/6/6c/Solar_Power_Manager_user_manual_en.pdf) pour les limites et les bornes du gestionnaire d’alimentation standard.
