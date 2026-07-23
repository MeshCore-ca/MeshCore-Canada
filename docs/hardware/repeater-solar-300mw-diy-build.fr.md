---
title: Construire un répéteur solaire de 300 mW
description: Examinez et testez sur l’établi ce répéteur solaire fondé sur RAK avant de l’installer.
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
  - assets/styles/devices-builds.css?v=20260722-2
---

# Construire un répéteur solaire de 300 mW

<div class="mc-guide-status" data-status="draft" markdown>

**Vérifiez chaque pièce avant de construire.** Confirmez les limites
électriques, la polarité des connecteurs, la cible du micrologiciel et
l’étanchéité avant de mettre l’appareil sous tension ou de l’installer.

</div>

<dl class="mc-guide-facts">
  <div><dt>Radio</dt><dd>RAK19003 / RAK4631 Type 6</dd></div>
  <div><dt>Micrologiciel</dt><dd>Confirmer la cible actuelle du répéteur</dd></div>
  <div><dt>Résistance aux intempéries</dt><dd>Vérifier après chaque modification du boîtier</dd></div>
  <div><dt>Entretien</dt><dd>Établir un calendrier d’inspection pour le site</dd></div>
</dl>

## Avant de commencer

Cette construction exige de découper un boîtier, d’assembler un parcours RF et
de brancher une pile au lithium à un système de recharge solaire. Elle crée
aussi du matériel destiné à une installation exposée et surélevée.

!!! danger "Arrêtez jusqu’à ce que le système complet ait été examiné"
    Vérifiez dans la documentation des fabricants la chimie exacte de la pile, sa protection, les limites du chargeur, la polarité des connecteurs, les caractéristiques des fils, l’entrée solaire, le boîtier, l’évent, le parcours de l’antenne et l’étanchéité. Faites appel à une personne qualifiée pour tout détail électrique ou structural qui dépasse vos compétences.

<ul class="mc-checklist">
  <li>Chaque pièce et révision du matériel correspond à une source datée.</li>
  <li>La carte radio apparaît pour le rôle de répéteur dans la version actuelle du programme officiel de mise à jour MeshCore.</li>
  <li>L’antenne est destinée à la bande canadienne de 902–928 MHz et tout son parcours de connecteurs est confirmé.</li>
  <li>Le parcours de la pile et de l’alimentation solaire possède les protections documentées et des limites compatibles.</li>
  <li>Vous avez un multimètre, une protection oculaire, des outils de perçage et de coupe appropriés ainsi qu’un espace de travail sécuritaire.</li>
  <li>Vous avez un câble de récupération USB et garderez l’appareil sur l’établi jusqu’à ce qu’il réussisse les vérifications.</li>
</ul>

## Ce que cette construction change

La procédure perce des ouvertures dans le boîtier, installe un connecteur
d’antenne externe et un évent, branche la radio et l’antenne, ajoute une
protection de pile dans le parcours d’alimentation et rend le boîtier étanche.
Ces changements peuvent être difficiles à annuler sans remplacer des pièces.

## Liste du matériel

<div class="mc-table-wrap" markdown>

| Partie du système | Exemple | Qté | Ce qu’il faut vérifier | Source |
|---|---|---:|---|---|
| Boîtier | WisMesh Unify Enclosure 910422 | 1 | Révision, limites du panneau et du chargeur, joints, aération, quincaillerie incluse | [AliExpress](https://aliexpress.com/item/1005008369061766.html) |
| Carte LoRa | RAK19003 / RAK4631, Type 6 | 1 | Carte exacte, bande canadienne, cible du micrologiciel, connecteurs | [AliExpress](https://aliexpress.com/item/1005008285698839.html) |
| Antenne | Alfa AOA-915-5ACM | 1 | Bande, connecteur, montage, exposition aux intempéries | [Amazon Canada](https://www.amazon.ca/dp/B08H8J6ZV6) |
| Queue de cochon d’antenne | N femelle vers IPEX | 1 | Génération IPEX, genre et polarité des connecteurs, longueur, perte | [AliExpress](https://aliexpress.com/item/1005001920963497.html) |
| Option de pile | Bloc Li-ion MakerFocus de 3000 mAh | 1 | Chimie, dimensions, connecteur, polarité, protection, limites du chargeur | [MakerFocus](https://www.makerfocus.com/products/makerfocus-3-7v-3000mah-lithium-rechargeable-battery-1s-3c-lipo-battery-pack-of-4) |
| Option de pile | Bloc Li-ion de 3000 mAh | 1 | Les mêmes vérifications, en plus des restrictions d’expédition au Canada | [Amazon US](https://www.amazon.com/3000mAh-Rechargable-Protection-Insulated-Development/dp/B08T6GT7DV) |
| Option de pile | Pile Space Hedgehog de 3000 mAh | 1 | Les mêmes vérifications, en plus de la disponibilité et de la révision actuelles | [Space Hedgehog](https://space-hedgehog.com/products/3000mah-battery) |
| Protection de pile | PCM Li-ion | 1 | Si elle est nécessaire et compatible; limites de courant, de tension, de température et de câblage | [Space Hedgehog](https://space-hedgehog.com/products/battery-protection-with-low-voltage-cut-off?variant=51646910660664) |
| Évent | Bouchon d’évent étanche M12×1.5 | 1 | Filetage, joint, circulation d’air, compatibilité du boîtier | [AliExpress](https://aliexpress.com/item/1005006370919409.html) |

</div>

<p class="mc-table-note">Ces pièces sont à étudier et ne constituent pas des recommandations vérifiées. Vérifiez les caractéristiques, la disponibilité, l’expédition et le coût total actuels avant d’acheter.</p>

## Outils et fournitures

- un multimètre et la documentation du fabricant de chaque composant électrique;
- une protection oculaire et des outils de perçage et de coupe appropriés;
- un foret étagé dont la taille est déterminée en ajustant réellement la traversée et l’évent;
- des outils pour les fils et une isolation ou une gaine thermorétractable adaptées aux pièces choisies;
- du ruban de silicone autofusionnant ou une autre méthode examinée pour rendre les connecteurs extérieurs étanches;
- un scellant extérieur compatible avec les matériaux du boîtier;
- un câble USB de données fiable pour la programmation et la récupération.

## Étapes d’assemblage

<div class="mc-stage-list">
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 1 — Inspecter avant de modifier</h3>
    <p>Confirmez chaque numéro de pièce et chaque révision. Inspectez les joints et la quincaillerie du boîtier. Repérez le haut du boîtier, l’emplacement de l’antenne, celui de l’évent, les dégagements des câbles et l’accès pour l’entretien avant de percer.</p>
    <p><strong>Point de contrôle :</strong> arrêtez si un connecteur, une polarité, une protection, une limite de chargeur ou un détail du boîtier est incertain.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 2 — Préparer le boîtier et le parcours RF</h3>
    <ol>
      <li>Fixez la plaque arrière RAK avec la quincaillerie fournie.</li>
      <li>Marquez des ouvertures distinctes pour la traversée de type N et l’évent. Percez lentement avec une protection appropriée, ébavurez les trous et vérifiez l’ajustement après chaque étape.</li>
      <li>Installez la traversée et l’évent avec les joints et l’orientation examinés.</li>
      <li>Toute alimentation étant débranchée, raccordez la queue de cochon du côté radio au bon connecteur LoRa.</li>
      <li>Installez l’antenne Bluetooth indiquée dans la documentation de la carte exacte.</li>
      <li>Branchez l’antenne LoRa externe avant toute mise sous tension ou tout essai de transmission.</li>
    </ol>
    <p><strong>Point de contrôle :</strong> le parcours RF est solidement fixé, sans contrainte, correctement raccordé et branché avant la mise sous tension.</p>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 3 — Programmer et vérifier l’ajustement à sec</h3>
    <ol>
      <li>Gardez l’appareil ouvert et accessible.</li>
      <li>Suivez le <a href="../../meshcore/flash-repeater/">guide de programmation sécuritaire d’un répéteur</a> pour la carte exacte.</li>
      <li>Fixez la radio sur la plaque arrière et confirmez que les câbles ne sont ni pincés ni pliés brusquement.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_MountedAll.jpeg" alt="Carte RAK et câbles d’antenne ajustés à sec sur la plaque arrière du boîtier" loading="lazy">
      <figcaption>Exemple d’ajustement à sec. Vérifiez en main la carte exacte et le passage des câbles.</figcaption>
    </figure>
  </section>
  <section class="mc-build-stage" data-stage="stop">
    <h3>Étape 4 — Vérifier et brancher le parcours d’alimentation</h3>
    <ol>
      <li>Toute alimentation étant débranchée, repérez les bornes de la pile, du chargeur et de toute carte de protection à partir de leur documentation actuelle.</li>
      <li>Vérifiez la polarité des deux câbles JST avec un multimètre; ne vous fiez pas seulement à la couleur des fils.</li>
      <li>Branchez le côté chargeur et le côté pile uniquement selon le schéma examiné de l’appareil de protection exact.</li>
      <li>Isolez et fixez mécaniquement la carte de protection et la pile sans les écraser, les chauffer, les percer ni les coincer contre des arêtes vives.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/RAK19003-Layout.png" alt="Disposition des connecteurs RAK19003 utilisée comme repère visuel" loading="lazy">
      <figcaption>Orientation seulement. Suivez la documentation de votre carte exacte.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/VoltaicEnclosures_Layout.png" alt="Exemple de disposition des raccordements d’une carte de protection" loading="lazy">
      <figcaption>Concept seulement. Ne déduisez pas les étiquettes des bornes ni les limites d’une autre carte de protection.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/RAK19003-LayoutSolar.jpg" alt="Disposition du boîtier solaire montrant le câblage de la pile et de la protection" loading="lazy">
      <figcaption>Confirmez la polarité et chaque limite électrique avant de reproduire le parcours.</figcaption>
    </figure>
  </section>
  <section class="mc-build-stage">
    <h3>Étape 5 — Rendre étanche seulement après la vérification sur l’établi</h3>
    <ol>
      <li>Posez le joint du boîtier sans le tordre ni le pincer.</li>
      <li>Branchez le fil solaire du boîtier seulement après avoir confirmé sa polarité et ses limites.</li>
      <li>Fermez le boîtier uniformément avec la quincaillerie, le couple et la méthode indiqués dans sa documentation.</li>
      <li>Appliquez la méthode examinée d’étanchéité extérieure sur le raccord d’antenne exposé sans bloquer le drainage ni l’aération.</li>
    </ol>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_Finished.jpeg" alt="Intérieur terminé d’un répéteur RAK Unify avant la fermeture du boîtier" loading="lazy">
      <figcaption>Exemple d’intérieur. Les révisions des pièces et leur disposition peuvent différer.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_SelfFuseTape.jpeg" alt="Ruban autofusionnant autour d’un connecteur d’antenne extérieur" loading="lazy">
      <figcaption>Un exemple d’étanchéité proposé par la communauté, et non une méthode universelle d’installation.</figcaption>
    </figure>
    <figure>
      <img class="mc-build-photo" src="../images/BuildRepeater1_Heatshrink.jpg" alt="Gaine thermorétractable autour d’un raccord d’antenne extérieur" loading="lazy">
      <figcaption>Confirmez que la méthode choisie est compatible et inspectable, et qu’elle n’emprisonne pas l’eau.</figcaption>
    </figure>
  </section>
</div>

## Vérifier les mesures

Aucune plage numérique d’acceptation électrique n’a été examinée par des pairs
pour cette page. Utilisez les limites actuelles du fabricant pour la pile, le
chargeur, l’appareil de protection, la carte radio et le panneau exacts.

<div class="mc-table-wrap" markdown>

| Vérification | Résultat acceptable | Condition d’arrêt |
|---|---|---|
| Continuité, alimentation débranchée | Aucun court-circuit involontaire dans le parcours d’alimentation documenté | Continuité inattendue, mesure instable ou configuration incertaine du multimètre |
| Polarité | Chaque connecteur correspond à la polarité documentée avant d’être raccordé | La couleur du fil contredit la polarité mesurée ou documentée |
| Entrée de pile et solaire | Les valeurs mesurées respectent toutes les limites publiées des composants | Une valeur dépasse une limite ou la limite est inconnue |
| Première mise sous tension | Aucune chaleur, odeur, enflure, fumée, aucun bruit ni redémarrage instable | Tout comportement physique ou électrique anormal |
| Courant et fonctionnement de la radio | Le comportement correspond à la documentation examinée de la carte et du rôle | Le courant consommé ou le comportement ne peut pas être expliqué par des données probantes |

</div>

## Le tester sur l’établi

<ul class="mc-checklist">
  <li>Photographiez et consignez les pièces exactes, les révisions, le câblage, les vérifications de polarité et les valeurs mesurées.</li>
  <li>Lorsque le matériel examiné le permet, utilisez sous supervision une alimentation d’établi à courant limité.</li>
  <li>Confirmez que le répéteur démarre, se reconnecte et conserve son micrologiciel, son identité ainsi que ses réglages de radio, de région, d’annonce et d’accès après un redémarrage.</li>
  <li>Confirmez qu’un compagnon à proximité reçoit une annonce et que l’essai d’acheminement local prévu réussit.</li>
  <li>Faites fonctionner le parcours solaire et de recharge prévu sous surveillance, dans les conditions permises par la documentation des composants.</li>
  <li>Inspectez les joints et la tension des câbles avant et après un essai contrôlé de résistance à l’eau adapté à la documentation du boîtier.</li>
  <li>Gardez la récupération USB pratique et consignez sa procédure.</li>
</ul>

Ne montez pas l’appareil avant qu’il ait réussi toutes les vérifications et
qu’une personne responsable de l’examen du matériel ait approuvé le dossier du
site.

## Récupération et retour en arrière

Si une vérification échoue, débranchez l’alimentation solaire, USB et de la pile
selon la séquence sécuritaire documentée. Déplacez l’appareil vers un espace de
travail surveillé et incombustible, vérifiez s’il y a de la chaleur ou des
dommages à la pile et ne rebranchez pas une pile au lithium douteuse. Restaurez
la dernière configuration fiable de la carte par USB seulement après avoir
corrigé le problème électrique.

Les trous mécaniques et le travail d’adhésif ou de scellant peuvent être
irréversibles. Remplacez le boîtier et les pièces d’alimentation endommagés ou
douteux plutôt que d’improviser une réparation.

## Entretien

Aucun intervalle pancanadien n’est approuvé. Avant le déploiement, consignez un
calendrier d’inspection propre au site qui couvre les mouvements du montage,
les infiltrations d’eau, les joints, la corrosion, la tension des câbles,
l’état de la pile, le comportement de recharge, les valeurs mesurées, le
micrologiciel et la configuration, la vérification radio ainsi que la
récupération physique.

## Source

Fondé sur des notes de construction fournies par MrAlders0n en 2026. Les pièces
et les instructions doivent encore faire l’objet d’un examen du matériel.

Après l’essai sur l’établi, terminez le
[plan de montage](repeater-mounting-options.md) et réglez la région du répéteur
au moyen du [configurateur](../config/index.md).
