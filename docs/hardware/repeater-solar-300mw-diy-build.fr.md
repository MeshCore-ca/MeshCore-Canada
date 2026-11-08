---
title: Construire un répéteur solaire de 300 mW
description: "Le répéteur solaire de MrAlders0n dans un boîtier RAK Unify : pièces, prix et 22 étapes d’assemblage avec photos."
audience:
  - repeater-builder
  - hardware-reviewer
task: build-300mw-solar-repeater
scope: experimental
status: draft
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: intermediate
estimated_time: one day plus sealant cure time
destructive: false
requires:
  - multimeter
  - safe-work-area
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20261019-1
---

# Monter un répéteur solaire de 300 mW

Par **MrAlders0n (Ottawa)** · Guide original : **1er janvier 2026**

Un répéteur MeshCore solaire dans le boîtier **RAK Unify Box**. Suivez chaque
étape avec soin pour un montage fiable et étanche.

!!! warning "Aucune garantie"
    Ce guide communautaire est fourni sans garantie. Vérifiez tout avec un
    multimètre avant de mettre quoi que ce soit sous tension. Des questions?
    Écrivez à **MrAlders0n** sur le [Discord](https://discord.gg/GBCP4xdgNv).

## Liste des pièces

Les prix proviennent du guide original, en date de **mai 2026**, en dollars
canadiens. Vérifiez les prix actuels et l’expédition avant de commander.

<div class="mc-table-wrap" markdown>

| Article | Produit | Coût (CAD) | Lien |
|---|---|---|---|
| **Boîtier** | WisMesh Unify Enclosure 910422 | 72,50 $ | [AliExpress](https://aliexpress.com/item/1005008369061766.html) |
| **Carte LoRa** | RAK WisBlock RAK19003/RAK4631 (Type 6) | 36,38 $ | [AliExpress](https://aliexpress.com/item/1005008285698839.html) |
| **Antenne** | ALFA AOA-915-5ACM | 34,99 $ | [Amazon](https://www.amazon.ca/dp/B08H8J6ZV6) |
| **Câble coaxial d’antenne** | N femelle à IPX | 6,79 $ | [AliExpress](https://aliexpress.com/item/1005001920963497.html) |
| **Pile** | Li-ion 3000 mAh, Makerfocus (paquet de 4, Micro JST 2.0), expédiée de Chine | 34,10 $ | [Makerfocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4) |
| **Protection de pile** ^ | PCM Li-ion, Space Hedgehog | 6,00 $ | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off?variant=51646910660664) |
| **Évent** | Bouchon d’aération étanche (M12×1,5-10) | 6,12 $ | [AliExpress](https://aliexpress.com/item/1005006370919409.html) |

</div>

^ La pile plate Makerfocus comprend déjà un PCM; le PCM supplémentaire est une
mesure de sécurité de plus. Avec des piles non protégées (comme des 18650 à
bouton), un PCM est nécessaire.

**Coût total approximatif : 180 $ CAD**

!!! tip "Utiliser une autre pile Li-ion plate"
    Une pile avec un autre connecteur convient aussi, mais vous devez remplacer
    son connecteur par un Micro JST 2.0 et vérifier la polarité (voir les étapes
    d’assemblage). Exemple de pile locale avec connecteur Molex Picoblade 1.25 :
    [Space Hedgehog](https://space-hedgehog.com/products/3000mah-battery?variant=51602989875256).
    Exemple de connecteur JST 2.0 : [Adafruit](https://www.adafruit.com/product/4714).

## Étapes d’assemblage

!!! danger "Les antennes avant l’alimentation"
    **Branchez toujours une antenne LoRa et l’antenne Bluetooth à la carte RAK
    avant de la mettre sous tension. La faire fonctionner sans antennes peut
    l’endommager de façon permanente.**

1. Déballez toutes les pièces et mettez-les de côté. Gardez l’œil sur les petites
   vis et pièces : elles se perdent facilement.
2. Fixez la plaque arrière RAK dans le boîtier avec les quatre vis fournies.
3. Percez deux trous : un pour le support d’antenne de type N et un pour le
   bouchon de drainage.
    - Utilisez une mèche étagée pour des trous nets.
    - **Pour trouver le haut du boîtier,** posez-le sur le dos. Le trou de
      fixation marqué « 1 » indique le haut.
    - Percez lentement, un palier à la fois. Essayez le connecteur de type N
      après chaque palier jusqu’à ce qu’il s’ajuste bien.
    - Faites de même au bas du boîtier pour le bouchon de drainage.
4. Installez le support d’antenne de type N et le bouchon de drainage.
5. Branchez le câble du support de type N au connecteur IPEX LoRa de la carte
   RAK19003.
6. Fixez l’antenne Bluetooth sur le côté du boîtier avec le ruban double face
   fourni.
7. Branchez l’IPEX Bluetooth à la carte RAK19003.
8. Branchez une antenne au connecteur de type N, puis programmez et configurez
   la RAK avec l’[outil de configuration des répéteurs](../config/index.md).
9. Fixez la RAK sur la plaque arrière. Le résultat devrait ressembler à ceci :

    [![Carte RAK et câbles d’antenne fixés sur la plaque arrière du boîtier](images/BuildRepeater1_MountedAll.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_MountedAll.jpeg)

10. Branchez le câble JST PHR-2 à la prise de pile de la RAK19003, **en vérifiant
    la polarité**. Beaucoup de câbles JST sont câblés à l’envers.

    [![Disposition de la carte RAK19003 montrant le connecteur de pile](images/RAK19003-Layout.png){ .mc-build-photo width="300" loading=lazy }](images/RAK19003-Layout.png)

11. Branchez l’autre extrémité de ce câble du côté **CHG** du PCM Li-ion. Cette
    photo montre le PCM de Voltaic Enclosures utilisé au début; le PCM
    recommandé fonctionne de la même façon.

    [![Disposition d’un PCM Li-ion avec les côtés CHG et BATT indiqués](images/VoltaicEnclosures_Layout.png){ .mc-build-photo width="300" loading=lazy }](images/VoltaicEnclosures_Layout.png)

12. Glissez sur le câble une gaine thermorétractable assez grande pour couvrir
    le PCM avant de brancher la pile.
13. Branchez le câble JST PHR-2 de la pile du côté **BATT** du PCM, en
    **vérifiant de nouveau la polarité**.

    [![RAK19003 reliée au PCM et à la pile](images/RAK19003-LayoutSolar.jpg){ .mc-build-photo width="300" loading=lazy }](images/RAK19003-LayoutSolar.jpg)

14. Rétractez la gaine pour couvrir tout le PCM.
15. *(Facultatif)* Fixez le PCM à la plaque arrière avec du ruban double face,
    ou laissez-le libre dans le boîtier.
16. *(Facultatif)* Fixez la pile à la plaque arrière avec du ruban double face
    ou de la quincaillerie. Le résultat devrait ressembler à ceci :

    [![Intérieur du répéteur terminé, avec la pile et le PCM fixés](images/BuildRepeater1_Finished.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_Finished.jpeg)

17. Placez le joint de caoutchouc dans la rainure autour de la plaque avant du
    boîtier.
18. Branchez le fil du panneau solaire de la plaque avant à la RAK19003. Veillez
    à ce que le joint reste en place.
19. Assemblez les plaques avant et arrière et fixez-les avec les six vis.
    Serrez-les bien pour garder le joint étanche.
20. Enveloppez tout le connecteur de type N et la partie métallique exposée de
    l’antenne Alfa de ruban de silicone autofusionnant, ou utilisez deux couches
    de gaine thermorétractable.
21. Appliquez un cordon de silicone extérieur transparent autour de la base du
    connecteur de type N pour empêcher l’eau d’entrer dans le boîtier.

    [![Ruban de silicone autofusionnant autour du connecteur de type N](images/BuildRepeater1_SelfFuseTape.jpeg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_SelfFuseTape.jpeg)
    [![Gaine thermorétractable sur le connecteur de type N](images/BuildRepeater1_Heatshrink.jpg){ .mc-build-photo width="300" loading=lazy }](images/BuildRepeater1_Heatshrink.jpg)

22. *(Facultatif)* Ajoutez un cordon de silicone le long du bord supérieur du
    joint, entre les deux plaques, et autour de la base de l’antenne pour plus
    d’étanchéité.

## Tester sur l’établi

Avant de l’installer, vérifiez qu’il démarre, qu’il conserve ses réglages après
un redémarrage et qu’un compagnon à proximité reçoit son annonce. Si quelque
chose cloche, débranchez la pile et le panneau solaire et revérifiez la polarité
avant de réessayer.

**Ensuite :** [Installer un répéteur](repeater-mounting-options.md)
