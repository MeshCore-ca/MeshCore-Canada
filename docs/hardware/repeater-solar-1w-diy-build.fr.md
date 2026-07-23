---
title: Répéteur solaire expérimental de 1 W
description: Évaluez un modèle de répéteur solaire haute puissance non vérifié avant de décider de le reproduire.
audience:
  - advanced-repeater-builder
  - hardware-reviewer
task: review-1w-solar-repeater-build
scope: experimental
status: experimental
status_notice: false
owner: docs-hardware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: multiple days including fabrication and cure time
destructive: false
requires:
  - multimeter
  - soldering-experience
  - fabrication-experience
  - manufacturer-documentation
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---

# Répéteur solaire expérimental de 1 W

Ce modèle non vérifié combine une Ikoka Stick 0.4.0, un gestionnaire
d’alimentation solaire, un parcours RF filtré et un boîtier fabriqué sur mesure.

<div class="mc-guide-status" data-status="experimental" markdown>

**Ne construisez et ne déployez pas ce modèle sans examen électrique, RF et du
site.** Sa cible de micrologiciel, sa conception électrique, la télémétrie
facultative, ses mesures et ses limites climatiques n’ont pas été reproduites.

</div>

<dl class="mc-guide-facts">
  <div><dt>Radio</dt><dd>GOME Ikoka Stick 0.4.0</dd></div>
  <div><dt>Alimentation</dt><dd>Waveshare Solar Power Manager</dd></div>
  <div><dt>Micrologiciel</dt><dd>Ni épinglé ni reproduit</dd></div>
  <div><dt>Entretien</dt><dd>À définir pendant l’examen du site</dd></div>
</dl>

## Cette construction convient-elle?

Il s’agit d’une expérience spécialisée de dorsale ou de longue portée, et non
d’une mise à niveau par défaut. Coordonnez-vous avec les communautés voisines
et démontrez le besoin du site avant de modifier la couverture ou les habitudes
de trafic.

Utilisez le [modèle de 300 mW à l’état d’ébauche](repeater-solar-300mw-diy-build.md)
ou un système préassemblé examiné, sauf si une personne responsable du réseau
et une personne responsable de l’examen du matériel et des RF conviennent que
cette expérience répond à un besoin mesuré.

## Avant de commencer

!!! danger "Cette construction réunit des RF haute puissance, des piles au lithium, de la recharge, du soudage, de la coupe et une installation extérieure surélevée"
    Vérifiez chaque composant et chaque limite dans la documentation actuelle du fabricant. Branchez une antenne et un parcours RF examiné avant tout essai de transmission. Ne mettez pas sous tension une pile ou un chargeur lorsque la polarité, la protection, le câblage, la température ou les valeurs attendues sont inconnus.

<ul class="mc-checklist">
  <li>Le besoin du réseau local et les effets sur les autres régions sont documentés.</li>
  <li>Le matériel Ikoka exact et la cible du micrologiciel du répéteur sont confirmés et récupérables par USB.</li>
  <li>Une personne responsable de l’examen du matériel et de l’électricité approuve la pile, le chargeur, le panneau, le câblage, la protection, la télémétrie facultative et le plan thermique du boîtier.</li>
  <li>Une personne responsable de l’examen RF approuve la radio, le filtre, la ligne de transmission RF, l’antenne, les connecteurs et le site.</li>
  <li>Un examen de la structure et du site couvre la masse finale, la surface du panneau, le montage, le vent, la glace, la neige, le passage des câbles et l’accès.</li>
  <li>La construction restera sous surveillance sur l’établi jusqu’à l’approbation de son dossier d’essai.</li>
</ul>

## Ce que cette construction change

La procédure découpe et perce un boîtier, colle un panneau solaire avec de
l’époxy et du scellant, modifie le système de montage, branche un parcours RF
haute puissance et un filtre, assemble un système d’alimentation au lithium et
peut retirer les broches de l’écran pour la télémétrie facultative. Plusieurs
changements sont difficiles ou impossibles à annuler sans remplacer des pièces.

## Liste du matériel à vérifier

<div class="mc-table-wrap" markdown>

| Nº | Pièce | Qté | Détail à vérifier | Source |
|---:|---|---:|---|---|
| 1 | GOME Ikoka Stick 0.4.0 | 1 | Révision du matériel, bande canadienne, sortie RF, cible du micrologiciel, récupération | [Page du projet](https://github.com/ndoo/ikoka-stick-meshtastic-device) |
| 2 | Waveshare Solar Power Manager | 1 | Modèle exact, limites du panneau, de la pile et de la sortie, comportement au démarrage, température | [Waveshare](https://www.waveshare.com/wiki/Solar_Power_Manager) |
| 3 | Boîte de jonction IP65, 220×170×110 mm | 1 | Matériau, indice de protection après modification, température, évent | [AliExpress](https://www.aliexpress.com/item/1005007587120013.html) |
| 4 | Panneau de 10 W / 18 V, 250×340 mm | 1 | Limites électriques, dimensions, masse, résistance aux intempéries et aux charges | [Amazon](https://a.co/d/0eJo5GCr) |
| 5 | Bloc 18650 3P1S ou 4P1S | 1 | Chimie, cellules appariées, protection, construction, chargeur, température | [MP&W Supply](https://mpandw.ca/) |
| 6 | Carte de protection de pile | 1 | Seuils, courant, température, câblage, compatibilité | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off) |
| 7 | Filtre passe-bande à quatre cavités de 890–960 MHz, 50 W | 1 | Réponse à 902–928 MHz, perte d’insertion, connecteurs, intempéries, température | [Alibaba](https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html) |
| 8 | Câble de 10–15 cm, SMA à angle droit vers traversée femelle de type N | 1 | Genre et polarité des connecteurs, perte, courbure, joint | [AliExpress](https://www.aliexpress.com/item/1005008569444661.html) |
| 9 | Câble SMA mâle à angle droit de 7.5 cm | 1 | Correspondance du connecteur, perte, courbure, puissance admissible | [AliExpress](https://www.aliexpress.com/item/1005006702037541.html) |
| 10 | Câble USB-A vers USB-C à angle droit de 0.5 pi | 1 | Besoins en données et en alimentation, courant, ajustement, tension mécanique | [Amazon](https://a.co/d/045htrEG) |
| 11–12 | Entretoises M3×35 et vis M3×5 | selon les besoins | Matériau, résistance, ajustement, corrosion | Source locale |
| 13 | Gorilla Epoxy, 25 ml | 1 | Compatibilité des matériaux, durcissement, limites extérieures et de température | [Home Depot](https://www.homedepot.ca/product/gorilla-epoxy-syringe-25ml/1000778451) |
| 14 | Bouchon d’évent étanche | 1 | Filetage, circulation d’air, protection contre l’infiltration après l’installation | [AliExpress](https://www.aliexpress.com/item/1005006370919409.html) |
| 15 | Scellant de silicone extérieur transparent | 1 | Compatibilité des matériaux, durcissement, limites UV et de température | Quincaillerie locale |
| 16 | Adafruit INA3221, facultatif | 1 | Interface électrique, adresse, prise en charge du micrologiciel, isolation, étalonnage | [DigiKey](https://www.digikey.ca/en/products/detail/adafruit-industries-llc/6062/25660599) |

</div>

<p class="mc-table-note">Ces pièces sont des pistes non vérifiées. Vérifiez les caractéristiques, la disponibilité, l’expédition et le coût total actuels avant d’acheter.</p>

## Outils et téléchargements

Prévoyez des outils de soudage et de câblage, un multimètre, des forets et des
outils de coupe appropriés, des serre-joints, une protection oculaire et un
espace de travail sécuritaire.

Fichiers imprimables à vérifier :

- [Plaque de montage et support de pile (.3mf)](files/repeater-solar-1w-diy-build-plate-and-battery-holder.3mf)
- [Plaque de montage (.stl)](files/repeater-solar-1w-diy-build-plate.stl)
- [Support de pile 18650 3P1S (.stl)](files/repeater-solar-1w-diy-build-3x18650-battery-holder.stl)

Confirmez les dimensions, le matériau, le rendement thermique, les attaches, le
maintien de la pile et la qualité d’impression avant l’utilisation.

## Étapes d’assemblage

<div class="mc-stage-list">
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 1 — Examiner et vérifier l’ajustement à sec</h3>
    <p>Confirmez toutes les révisions, les dimensions, les limites électriques, les parcours des connecteurs, l’orientation du filtre, les dégagements, les pièces imprimées, les courbures de câble, l’emplacement de l’évent, celui du panneau et l’accès pour l’entretien avant de couper ou de coller.</p>
    <p><strong>Point de contrôle :</strong> le schéma, le parcours RF et la disposition mécanique examinés correspondent aux pièces exactes que vous avez en main.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 2 — Préparer le boîtier et le panneau</h3>
    <ol>
      <li>Mesurez la boîte de jonction du panneau et marquez la découpe du boîtier à partir des pièces réelles.</li>
      <li>Avec le boîtier vide et solidement soutenu, utilisez une ouverture pilote et un outil de coupe appropriés.</li>
      <li>Ébavurez et nettoyez la découpe, puis vérifiez à sec l’ajustement du panneau et le passage du câble.</li>
      <li>Collez et serrez seulement au moyen d’une méthode examinée et compatible avec les matériaux. Laissez durcir pendant toute la période indiquée par le fabricant.</li>
      <li>Appliquez le joint d’étanchéité examiné sans bloquer le drainage ni l’aération.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-1.jpg" alt="Fils du panneau solaire passant dans la découpe du boîtier" loading="lazy"><figcaption>Exemple seulement. Mesurez les pièces réelles.</figcaption></figure>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 3 — Installer la plaque de montage, le filtre, la traversée et l’évent</h3>
    <ol>
      <li>Installez les entretoises et la plaque de montage examinées sans exercer de contrainte sur le boîtier.</li>
      <li>Montez le filtre en repérant les ports d’entrée et de sortie et en conservant un rayon de courbure suffisant pour les câbles.</li>
      <li>Percez et ébavurez les trous de la traversée et de l’évent en vérifiant l’ajustement du matériel réel.</li>
      <li>Installez les joints, la traversée et l’évent selon leur documentation.</li>
      <li>Laissez les raccords RF sans alimentation et accessibles pour l’inspection.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-2.jpg" alt="Plaque de montage avec entretoises et filtre RF" loading="lazy"><figcaption>Exemple de disposition de la plaque et du filtre.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-3.jpg" alt="Boîtier avec filtre, câbles de traversée RF et bouchon d’évent" loading="lazy"><figcaption>Vérifiez le sens des connecteurs et chaque joint.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 4 — Examiner la modification du démarrage du gestionnaire d’alimentation</h3>
    <p><strong>Ne pontez pas les pastilles du bouton de démarrage du gestionnaire d’alimentation.</strong> Cette modification n’a pas été reproduite ni examinée.</p>
    <p>Avant d’envisager tout changement, exigez qu’une personne responsable de l’examen du matériel approuve le schéma exact, les modes de défaillance, les répercussions sur la garantie, la méthode de soudage, l’essai de démarrage et le retour en arrière.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-4.jpg" alt="Pont de fil non vérifié sur les pastilles du bouton de démarrage du gestionnaire solaire" loading="lazy"><figcaption>Modification non vérifiée. Ne la reproduisez pas à partir de cette photographie.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 5 — Monter la radio et décider de la télémétrie facultative</h3>
    <p>Vérifiez à sec l’ajustement de l’Ikoka Stick et du gestionnaire d’alimentation. La branche facultative INA3221 retire l’embase de l’écran et se soude aux pastilles I2C; elle doit donc rester séparée de la construction de base.</p>
    <p>Le brochage de télémétrie, le parcours de mesure, l’étalonnage, la plage de courant, l’adresse I2C et la prise en charge par le micrologiciel ne sont pas vérifiés.</p>
    <p><strong>Par défaut :</strong> omettez la télémétrie facultative. Ne retirez pas les broches de l’écran et n’ajoutez pas d’options de micrologiciel avant d’avoir reproduit le matériel exact et la cible actuelle de MeshCore.</p>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-5.jpg" alt="Raccord facultatif non vérifié d’un INA3221 près de l’embase d’écran de l’Ikoka" loading="lazy"><figcaption>Télémétrie facultative non vérifiée. Ne la reproduisez pas à partir de cette photographie.</figcaption></figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 6 — Assembler le parcours de la pile et de la recharge</h3>
    <ol>
      <li>Gardez l’alimentation solaire, la pile, l’USB et la radio débranchés.</li>
      <li>Confirmez la construction du bloc-pile, l’appariement des cellules, la protection, le maintien, l’isolation et les limites de température.</li>
      <li>Confirmez chaque borne du gestionnaire d’alimentation et de la carte de protection dans la documentation actuelle des fabricants.</li>
      <li>Mesurez et consignez la polarité; ne vous fiez pas à la couleur des fils.</li>
      <li>Branchez une seule branche examinée à la fois et inspectez-la avant de continuer.</li>
    </ol>
    <p><strong>Point de contrôle :</strong> il ne reste aucune borne, limite ou valeur attendue inconnue, aucun conducteur exposé ni aucune condition de pile non prise en charge.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 7 — Terminer les parcours RF et USB</h3>
    <ol>
      <li>Vérifiez le sens d’entrée et de sortie du filtre ainsi que chaque connecteur SMA et de type N.</li>
      <li>Branchez tout le parcours d’antenne examiné avant que la radio puisse transmettre.</li>
      <li>Acheminez le câble d’alimentation USB sans pli brusque, frottement ni tension.</li>
      <li>Gardez le boîtier ouvert pendant la première mise sous tension supervisée et les vérifications.</li>
    </ol>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-6.jpg" alt="Intérieur terminé avec télémétrie INA3221 facultative" loading="lazy"><figcaption>Disposition avec télémétrie facultative non vérifiée.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-7.jpg" alt="Intérieur terminé sans télémétrie INA3221 facultative" loading="lazy"><figcaption>Exemple de disposition de base.</figcaption></figure>
    <figure><img class="mc-build-photo" src="../images/repeater-solar-1w-diy-build-8.jpg" alt="Intérieur complet du boîtier avec radio, filtre, gestionnaire d’alimentation et pile" loading="lazy"><figcaption>Exemple d’intérieur. Une photographie ne constitue pas une approbation électrique.</figcaption></figure>
  </section>
</div>

## Vérifier les mesures

Aucune plage numérique d’acceptation n’a été examinée par des pairs pour cette
page. Ne remplacez pas les valeurs manquantes par des tensions ou des courants
devinés.

<div class="mc-table-wrap" markdown>

| Vérification | Résultat acceptable | Condition d’arrêt |
|---|---|---|
| Continuité débranchée | Aucun court-circuit involontaire dans les parcours d’alimentation ou RF documentés | Continuité inattendue ou configuration incertaine du multimètre |
| Polarité des connecteurs | Les mesures correspondent au schéma examiné et au brochage du fabricant | Toute contradiction ou broche inconnue |
| Valeurs solaires, de pile et de sortie | Chaque valeur mesurée respecte la documentation actuelle de tous les composants branchés | Limite manquante ou valeur hors limites |
| Première mise sous tension | Démarrage stable et attendu, sans chaleur, odeur, enflure, fumée, bruit ni cycle de redémarrage | Tout comportement physique ou électrique anormal |
| Parcours RF | Bande, sens du filtre et raccords exacts, avec l’antenne branchée avant la transmission | Antenne manquante, connecteur desserré ou forcé, réponse inconnue du filtre |
| Télémétrie facultative | Mesures et comportement du micrologiciel reproduits indépendamment | Câblage, adresse, étalonnage ou cible de construction non vérifiés |

</div>

## Le tester sur l’établi

<ul class="mc-checklist">
  <li>Consignez les pièces exactes, les révisions, les documents sources, le schéma, les photographies, la polarité et les valeurs mesurées.</li>
  <li>Utilisez des méthodes supervisées de première mise sous tension et de limitation du courant adaptées au matériel examiné.</li>
  <li>Confirmez que l’appareil démarre après l’application de chaque source d’alimentation prévue et après une coupure d’alimentation contrôlée.</li>
  <li>Confirmez que l’identité, le micrologiciel et les réglages de radio, de région, de parcours, d’annonce et d’accès du répéteur résistent au redémarrage.</li>
  <li>Confirmez qu’un compagnon à proximité reçoit une annonce et que l’essai d’acheminement local prévu réussit.</li>
  <li>Mesurez le comportement RF et électrique avec la méthode approuvée par la personne responsable de l’examen; ne déduisez pas la puissance de sortie à partir d’un seul réglage du micrologiciel.</li>
  <li>Effectuez sous surveillance un essai de recharge et de charge qui couvre les conditions examinées sans dépasser les limites des composants.</li>
  <li>Inspectez la tension des câbles et les joints, puis effectuez un essai de résistance à l’eau adapté au boîtier.</li>
  <li>Démontrez la récupération USB et documentez le plan de retrait et d’accès.</li>
</ul>

Ne déployez pas l’appareil avant qu’une personne responsable de l’examen du
matériel et de l’électricité, une personne responsable de l’examen RF et le
propriétaire du site aient approuvé le dossier d’essai complet.

## Récupération et retour en arrière

Si une vérification échoue, cessez de transmettre et débranchez l’alimentation
solaire, USB et de la pile selon la séquence sécuritaire examinée. Déplacez le
matériel vers un espace de travail surveillé approprié. Ne rebranchez pas une
pile au lithium chaude, gonflée, endommagée, qui fuit ou qui paraît autrement
douteuse. Restaurez le micrologiciel par USB seulement après avoir compris le
problème électrique ou RF.

Les découpes, l’époxy, les broches retirées et les ponts de soudure peuvent être
irréversibles. Remplacez les composants douteux plutôt que d’improviser une
réparation. Pour revenir de façon sécuritaire sur la branche de télémétrie
facultative, omettez-la avant toute modification; ne supposez pas que le
matériel retiré pourra être restauré.

## Entretien

Aucun intervalle n’est approuvé. Le dossier du site doit définir les
inspections du montage, du panneau et de son collage, des infiltrations d’eau,
de l’évent, des joints, de la corrosion, des câbles et connecteurs, du filtre,
de l’état de la pile, du comportement de recharge, des valeurs mesurées, du
micrologiciel et de la configuration, de la vérification radio et de la
récupération physique. Reprenez l’inspection après tout événement grave ou
comportement inexpliqué défini par la personne responsable de l’examen du site.

## Source

Fondé sur des notes expérimentales fournies par MrAlders0n en 2026. Aucune
affirmation concernant le matériel ou le micrologiciel de cette page n’est
vérifiée.

Privilégiez une option examinée du
[guide de sélection des répéteurs](recommended-repeaters.md). Si cette
expérience est approuvée et mise en service, terminez le
[plan de montage](repeater-mounting-options.md) et la
[configuration du répéteur](../config/index.md).
