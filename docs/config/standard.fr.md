---
title: Définition des régions et autorité
description: Les règles publiques, les sources, l’autorité et le processus de modification des régions MeshCore canadiennes.
audience:
  - repeater-operator
  - region-maintainer
task: understand-region-standard
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-07-19
review_by: 2026-10-19
tested_with:
  region_schema: meshcore-canada-regions-v2
difficulty: advanced
---

# Définition des régions et autorité de MeshCore Canada

Cette norme définit un seul système de régions pour tout le Canada : comment
les emplacements sont attribués, comment les limites sont générées, comment les
régions sont divisées, qui approuve les changements et comment les conflits
entre sources sont résolus.

| Norme | Valeur |
| --- | --- |
| Identifiant | MCC-REG-1 |
| Version | 1.1 proposée |
| Référence géographique | Géographie du recensement de 2021 de Statistique Canada |
| Entrée sémantique actuelle | Canada MeshCore Region Strategy v1.1.1 |
| Entrée actuelle pour les limites communautaires | Instantané MeshMapper Canada, 2026-07-12 |
| Preuve opérationnelle actuelle | Instantané canadien de densité radio protégeant la vie privée, 2026-07-15 UTC; instantané agrégé des routes Canada–États-Unis, 2026-07-18 |
| Adoption | Devient normative après approbation et fusion par MeshCore Canada |

Statistique Canada emploie en français les termes **aire de diffusion (AD)**,
**subdivision de recensement (SDR)**, **division de recensement (DR)** et
**région économique (RE)**. Les fichiers sources et le schéma de ce projet
conservent toutefois leurs clés anglaises `DA`, `CSD`, `CD` et `ER`. Dans cette
page, ces clés techniques désignent les mêmes unités officielles.

!!! important "Quelle source fait autorité aujourd’hui?"
    Cette page et la partition nationale générée sont proposées aux fins d’examen. La partition candidate attribue chaque DA numérique exactement une fois, et la carte publique affiche uniquement les régions terminales fusionnées. Aucun polygone source brut ni cercle approximatif ne constitue une limite. La partition devient l’autorité opérationnelle seulement après l’examen communautaire et la réussite de toutes les vérifications de publication prévues par cette norme.

## La décision

MeshCore Canada maintient **une seule partition géographique**. Chaque partie
du Canada appartient à exactement une région terminale du chemin
`can → province ou territoire → région → sous-région facultative`. Les
intérieurs des régions terminales ne se chevauchent jamais et leur union couvre
toute l’étendue nationale des DA.

Le registre publié de MeshCore Canada est la source de vérité unique. Une
limite n’est pas enregistrée sous forme de polygone tracé à la main. Elle est
enregistrée comme la propriété de cellules géographiques officielles de
Statistique Canada, puis régénérée à partir de ces cellules. Par défaut, les
subdivisions de recensement gardent ensemble une municipalité ou son
équivalent; les aires de diffusion demeurent la géométrie exacte utilisée pour
publier la limite commune.

Seules les régions terminales possèdent un territoire. Les provinces, les
territoires et les grandes régions sont des nœuds de regroupement formés par
leurs enfants. Les polygones bruts de MeshMapper, les cercles de la stratégie
et les zones d’événements ne sont pas publiés comme régions. Une zone de
répéteurs partagée est une métadonnée de configuration, et non une autre couche
cartographique.

## Modèle de référence

### Enregistrements géographiques

| Niveau | Rôle | Règle |
| --- | --- | --- |
| `can` | Racine nationale | Un seul enregistrement; l’identifiant court demeure `can` |
| Province ou territoire | Champ de compétence et intendance | Les 13 provinces et territoires officiels du Canada |
| Région | Zone d’exploitation stable | Exhaustive dans son champ de compétence |
| Sous-région | Division facultative d’une région | Exhaustive dans sa région parente; ne chevauche jamais une région sœur |

Une région sans enfant est une région géographique terminale. Lorsqu’elle est
divisée, ses cellules passent aux sous-régions et l’ancienne région terminale
devient un nœud de regroupement. Elle n’a ni remplissage indépendant, ni
propriété dans le résolveur, ni portée de commande supplémentaire. Un
emplacement correspond à une seule région terminale.

Chaque enregistrement contient des champs distincts pour :

- un identifiant de registre immuable comme `ca-ab-r0014`;
- un identifiant radio de référence, unique partout;
- les noms anglais et français;
- des noms autochtones et historiques facultatifs approuvés localement;
- l’identifiant de registre de son parent;
- l’historique de ses sources et examens;
- son état de publication : `proposed`, `reviewed`, `active`, `deprecated` ou `retired`.

Les noms, les identifiants radio et la géométrie peuvent changer après examen.
L’identifiant immuable ne change pas.

### Zones de répéteurs interprovinciales

Une frontière provinciale sépare la propriété cartographique, pas le trafic
radio. Chaque emplacement conserve une région terminale d’attache, mais un
répéteur peut transporter plusieurs chemins complets lorsque sa couverture
normale traverse une frontière provinciale ou territoriale.

Une **zone de répéteurs partagée** consigne une communauté établie qui traverse
plusieurs champs de compétence. Elle possède un nom et des régions terminales
membres, mais n’a aucun polygone, parent, résultat de résolveur ou identifiant
radio qui lui soit propre. Le configurateur produit plutôt le chemin complet de
chaque membre :

- Région de la capitale nationale : `can → on → on-alg → ott` et `can → qc → gatout`;
- Lloydminster : `can → ab → lloyd-ab` et `can → sk → lloyd-sk`.

Pour le micrologiciel v1.16+, la Région de la capitale nationale devient :

```text
region def can on on-alg ott|can qc gatout
```

Le nom de recherche `ncr` n’est pas transmis par radio. Les deux côtés
conservent leurs identifiants de référence, et chaque répéteur de la zone
partagée reçoit le même arbre ordonné.

Cette règle s’applique partout au Canada :

1. Une zone partagée enregistrée est sélectionnée automatiquement pour chacune de ses régions terminales membres.
2. Un répéteur frontalier ou à grande couverture situé hors d’une zone enregistrée peut sélectionner n’importe quel ensemble vérifié de régions terminales canadiennes, y compris dans plusieurs provinces ou territoires.
3. Les commandes contiennent l’union des chemins sélectionnés. Un ancêtre commun apparaît une seule fois, les parents précèdent leurs enfants et chaque nouvelle branche revient à un ancêtre déjà défini.
4. Le configurateur doit refuser le résultat s’il dépasse les limites du micrologiciel de 32 identifiants ou 172 octets de réponse. Aucune ligne de l’interface en ligne de commande ne peut dépasser 160 caractères; si une ligne `region def` serait trop longue, le configurateur utilise plutôt des lignes `region put` ordonnées.
5. L’ajout d’une zone partagée ne déplace jamais une cellule de recensement, ne fusionne aucun polygone et n’affaiblit pas les contrôles de chevauchement.

Enregistrez une zone partagée automatique uniquement lorsque les exploitants de
chaque côté confirment l’usage régulier de chemins transfrontaliers ou
l’existence d’une seule communauté continue. Les autres longs chemins sont
choisis séparément pour chaque répéteur. Les choix par défaut demeurent ainsi
utiles sans transformer chaque frontière provinciale en une seule zone radio
surdimensionnée.

### Chemins de grands réseaux et de réseaux voisins

Un chemin régional est un choix d’acheminement, pas une prévision de portée RF.
Une grande couverture n’exige pas nécessairement une montagne. L’altitude, les
trajets au-dessus de l’eau, les installations ordinaires sur les toits et les
répéteurs reliés peuvent tous produire de longues routes.

Chaque répéteur conserve une région canadienne d’attache. Les exploitants
peuvent ensuite ajouter les chemins canadiens ou américains voisins que le
répéteur doit acheminer. La correspondance régionale est exacte; chaque portée
prévue doit donc inclure toute son ascendance. Le configurateur n’ajoute jamais
automatiquement un chemin voisin et ne dessine jamais la géométrie des
États-Unis. Le simple fait de capter le trafic d’une zone ne suffit pas :
ajoutez son chemin seulement si ce répéteur doit acheminer le trafic destiné à
cette zone.

Utilisez le plus petit ensemble utile et répartissez le travail entre les
répéteurs :

| Rôle du répéteur | Choix d’acheminement |
| --- | --- |
| Accès local | Chemin d’attache seulement |
| Pont régional | Chemin d’attache et quelques chemins canadiens voisins qu’il relie régulièrement |
| Dorsale longue distance | Ensemble examiné de chemins canadiens et américains étayé par les routes observées |

Ne placez pas tous les chemins disponibles sur chaque répéteur. Par exemple, le
trafic entre Waterloo, Toronto et l’ouest de l’État de New York peut être
réparti entre des répéteurs-ponts plutôt que d’imposer les trois chemins à
chacun. Le choix revient aux exploitants locaux et doit être coordonné avec les
communautés qui utilisent ces chemins.

Un chemin américain est admissible lorsqu’il est voisin du Canada ou situé de
l’autre côté d’une étendue d’eau commune et qu’il apparaît dans des preuves de
routes résolues. Un chemin plus éloigné exige des preuves répétées. Ces preuves
rendent seulement le chemin disponible; elles n’en font pas un choix par défaut
et ne garantissent pas son rendement futur.

L’instantané agrégé des routes du 2026-07-18 étaye les chemins suivants :

| Zone | Chemin exact | État | Côté canadien | Motifs de route / observations |
| --- | --- | --- | --- | ---: |
| Ouest de l’État de New York | `us → us-ny` | Documenté par les exploitants de WNY | Ontario et Québec | 4,508 / 33,820 |
| Washington | `west → pnw → wa` | Chemin PNW documenté | Colombie-Britannique | 5,384 / 21,596 |
| Oregon | `west → pnw → or` | Chemin PNW documenté; route plus éloignée | Colombie-Britannique | 903 / 1,394 |
| Pennsylvanie | `us → us-pa` | Provisoire; à confirmer localement | Ontario | 37 / 82 |
| Ohio | `us → us-oh` | Provisoire; à confirmer localement | Ontario | 6 / 10 |
| Californie | `west → ca` | Extension PNW provisoire; route plus éloignée | Colombie-Britannique | 7 / 12 |

L’instantané compte les motifs de route résolus uniques et leurs observations
provenant de `dev.meshcore.ca`. Il ne conserve aucun nom de nœud, identifiant ou
coordonnée exacte. Ces nombres constituent des preuves d’acheminement, pas une
mesure de rendement. D’autres États frontaliers ou éloignés pourront être
ajoutés seulement avec le même type de preuve et l’examen des exploitants
voisins.

### Sélectionner une région plus grande

La sélection d’une province, d’un territoire ou d’une grande région affiche ses
régions enfants immédiates. La sélection d’un enfant qui a lui-même des enfants
permet de descendre d’un autre niveau. Les plus petits choix affichés sont les
régions terminales actives utilisées pour la recherche d’emplacement et les
commandes.

Le contour d’un parent est calculé comme l’union de ses enfants pour la
surbrillance et la navigation cartographique. Il n’est jamais enregistré ni
affiché comme une région remplie concurrente. La hiérarchie demeure ainsi utile
sans attribuer deux fois le même lieu.

L’arbre parent-enfant initial, les noms et les emplacements des points d’origine
regroupent le document de stratégie soumis, les discussions du forum, les
commentaires Discord, les captures d’écran et les anciennes ébauches de
régions. Ces sources communautaires déterminent **quelles** sous-régions
existent et comment les gens les reconnaissent. MeshMapper demeure la
principale préférence de limite là où une région canadienne y est définie. Le
générateur décide de la limite commune exacte en attribuant des DA entières; il
n’invente pas de noms supplémentaires et n’empile pas les formes dessinées par
les utilisateurs.

Les commentaires futurs passent par le même processus sous forme de proposition
de changement de parent, de point d’origine, de nom ou d’attribution explicite
de DA. La liste avant-après des DA peut être examinée; une préférence locale
peut donc améliorer une limite sans créer ailleurs de trou ni de
chevauchement.

## Cadre de couverture nationale

L’unité topologique est l’**aire de diffusion (AD; clé technique `DA`) de
Statistique Canada de 2021**. Le produit numérique contient les 57 936 DA et
constitue tout le domaine de propriété. Le produit cartographique contient 57 932 DA, car quatre
DA composées uniquement d’eau en sont exclues; il sert seulement à obtenir un
littoral public plus propre. Les deux produits utilisent la même appartenance
lorsqu’une DA cartographique existe.

La cohorte de propriété par défaut est la **subdivision de recensement (SDR;
clé technique `CSD`) de 2021**, l’unité de Statistique Canada utilisée pour une
municipalité ou son équivalent. Les 5 161 CSD sont gardées entières, sauf si une exception approuvée
attribue chaque DA de cette CSD. Les 293 **divisions de recensement (DR; clé
technique `CD`)** fournissent un regroupement supérieur pour les municipalités régionales, les
comtés et les zones comparables. Une décision examinée concernant une CD peut
garder ensemble une communauté régionale établie, mais ne peut écarter le point
d’origine d’une autre région sans examen.

Le générateur utilise les 76 **régions économiques (RE; clé technique `ER`)
officielles de 2021** comme garde-fous généraux. Elles empêchent un point d’origine urbain d’absorber
une grande zone rurale sans lien simplement parce qu’il est le plus proche.
Leurs noms ne deviennent pas automatiquement des noms radio.

La stratégie actuelle fournit 192 points d’origine géographiques candidats. Le
générateur crée 193 régions terminales, car l’ancien point d’origine
transfrontalier de Lloydminster est divisé en une région albertaine et une
région saskatchewanaise. MeshMapper fournit 29 polygones sources communautaires
associés à 27 identifiants candidats de référence. Ce sont des entrées
d’attribution, et non des couches finales concurrentes.

| Province ou territoire | Garde-fous ER | Régions terminales candidates actuelles | Polygones sources MeshMapper |
| --- | ---: | ---: | ---: |
| Colombie-Britannique | 8 | 29 | 9 |
| Alberta | 8 | 14 | 4 |
| Saskatchewan | 6 | 12 | 1 |
| Manitoba | 8 | 10 | 1 |
| Ontario | 11 | 50 | 10 |
| Québec | 17 | 17 | 4 |
| Nouveau-Brunswick | 5 | 15 | 0 |
| Nouvelle-Écosse | 5 | 18 | 0 |
| Île-du-Prince-Édouard | 1 | 3 | 0 |
| Terre-Neuve-et-Labrador | 4 | 11 | 0 |
| Yukon | 1 | 6 | 0 |
| Territoires du Nord-Ouest | 1 | 5 | 0 |
| Nunavut | 1 | 3 | 0 |
| **Canada** | **76** | **193** | **29** |

Le catalogue des régions terminales candidates demeure lisible par machine
dans [`canada-regions.json`](../assets/regions/canada-regions.json). Le tableau
ci-dessus ne ratifie pas tous les noms et regroupements candidats. Les zones
d’influence incertaines — particulièrement en Alberta, en Saskatchewan, au
Manitoba, à Terre-Neuve-et-Labrador, au Yukon et dans certaines parties du
Québec — demeurent prioritaires pour l’examen local avant leur activation.

### Vérification du système actuel

L’ancien prototype à chevauchements a confirmé pourquoi une seule couche
d’autorité générée est nécessaire :

- les enregistrements du catalogue doivent encore être examinés par les communautés avant leur activation;
- les 192 zones à rayon autour des points d’origine et les 29 polygones MeshMapper bruts étaient affichés ensemble, mais ne formaient pas une partition;
- 52 des 192 centres de points d’origine correspondent actuellement à un autre identifiant ou à aucun identifiant dans le résolveur du prototype, dont trois résultats qui traversent un champ de compétence;
- les 29 polygones MeshMapper contiennent 29 paires de chevauchements non négligeables; ils doivent être conciliés avant de servir de couche unique;
- le polygone source actuel `YXX` est manifestement hors échelle et doit être actualisé ou expressément approuvé avant de pouvoir servir de point d’ancrage à Abbotsford;
- six alias normalisés ont plus d’un propriétaire; une recherche ambiguë exige donc le contexte du champ de compétence ou un choix explicite.

Il s’agit de constats de migration, et non de définitions régionales acceptées.
La carte publique utilise maintenant uniquement la partition générée; les
cercles sources et les polygones sources bruts demeurent des éléments de preuve
pour le générateur et le rapport d’assurance qualité.

### Inventaire complet des garde-fous

Chaque DA se trouve dans l’une de ces combinaisons de province ou territoire et
de région économique. Les codes proviennent de la Classification géographique
type de 2021.

| Province ou territoire | Régions économiques |
| --- | --- |
| Terre-Neuve-et-Labrador | `1010` Péninsule d’Avalon; `1020` Côte-sud–Péninsule de Burin; `1030` Côte-ouest–Péninsule du Nord–Labrador; `1040` Notre Dame–Centre de la baie de Bonavista |
| Île-du-Prince-Édouard | `1110` Île-du-Prince-Édouard |
| Nouvelle-Écosse | `1210` Cap-Breton; `1220` Côte-nord; `1230` Vallée de l’Annapolis; `1240` Sud; `1250` Halifax |
| Nouveau-Brunswick | `1310` Campbellton–Miramichi; `1320` Moncton–Richibucto; `1330` Saint John–St. Stephen; `1340` Fredericton–Oromocto; `1350` Edmundston–Woodstock |
| Québec | `2410` Gaspésie–Îles-de-la-Madeleine; `2415` Bas-Saint-Laurent; `2420` Capitale-Nationale; `2425` Chaudière-Appalaches; `2430` Estrie; `2433` Centre-du-Québec; `2435` Montérégie; `2440` Montréal; `2445` Laval; `2450` Lanaudière; `2455` Laurentides; `2460` Outaouais; `2465` Abitibi-Témiscamingue; `2470` Mauricie; `2475` Saguenay–Lac-Saint-Jean; `2480` Côte-Nord; `2490` Nord-du-Québec |
| Ontario | `3510` Ottawa; `3515` Kingston–Pembroke; `3520` Muskoka–Kawarthas; `3530` Toronto; `3540` Kitchener–Waterloo–Barrie; `3550` Hamilton–Péninsule du Niagara; `3560` London; `3570` Windsor–Sarnia; `3580` Stratford–Péninsule de Bruce; `3590` Nord-est; `3595` Nord-ouest |
| Manitoba | `4610` Sud-est; `4620` Centre-sud; `4630` Sud-ouest; `4640` Centre-nord; `4650` Winnipeg; `4660` Interlake; `4670` Parklands; `4680` Nord |
| Saskatchewan | `4710` Regina–Moose Mountain; `4720` Swift Current–Moose Jaw; `4730` Saskatoon–Biggar; `4740` Yorkton–Melville; `4750` Prince Albert; `4760` Nord |
| Alberta | `4810` Lethbridge–Medicine Hat; `4820` Camrose–Drumheller; `4830` Calgary; `4840` Banff–Jasper–Rocky Mountain House; `4850` Red Deer; `4860` Edmonton; `4870` Athabasca–Grande Prairie–Peace River; `4880` Wood Buffalo–Cold Lake |
| Colombie-Britannique | `5910` Île de Vancouver et côte; `5920` Lower Mainland–Sud-ouest; `5930` Thompson–Okanagan; `5940` Kootenay; `5950` Cariboo; `5960` Côte-nord; `5970` Nechako; `5980` Nord-est |
| Yukon | `6010` Yukon |
| Territoires du Nord-Ouest | `6110` Territoires du Nord-Ouest |
| Nunavut | `6210` Nunavut |

## Autorité et priorité des sources

La **version publiée du registre** constitue l’autorité opérationnelle finale.
Ses entrées jouent des rôles différents :

| Priorité | Source | Rôle |
| ---: | --- | --- |
| 1 | Décisions approuvées du registre | Décisions explicites sur les limites, les noms, les divisions, les fusions ou la réattribution de DA |
| 2 | MeshMapper Canada | Principal point d’ancrage de l’identité et des limites communautaires lorsqu’une région canadienne y existe |
| 3 | Canada MeshCore Region Strategy v1.1.1 | Identifiants candidats, liens de parenté et points d’origine hors de la couverture MeshMapper |
| 4 | Relations CD/CSD de Statistique Canada | Garder cohérents les municipalités et les regroupements régionaux établis |
| 5 | Instantané de densité radio protégeant la vie privée | Preuve secondaire pour départager des choix serrés et non examinés de CSD entières |
| 6 | Générateur déterministe | Concilie chaque DA dans une seule région sans inventer une autre couche manuelle |

Statistique Canada demeure l’autorité topologique à chaque niveau de priorité.
MeshMapper et les formes communautaires approuvées déterminent la couverture
voulue; la limite finale est alignée sur des DA entières pour que les régions
voisines partagent exactement la même frontière.

Les autres sources jouent des rôles de soutien :

- Les régions économiques de la SGC empêchent une croissance déraisonnable sur de longues distances.
- Les divisions et subdivisions de recensement définissent les regroupements supérieurs et les cohortes de propriété indivisibles par défaut utilisées par le générateur.
- Les grappes protégeant la vie privée provenant des répertoires en direct et de développement de MeshCore Canada tiennent compte de chaque nœud positionné récent. Les répéteurs, les serveurs de salon et les capteurs fixes fournissent les preuves d’attribution; les compagnons ajoutent un contexte indicatif de densité puisqu’ils peuvent se déplacer. Ces grappes complètent l’examen local sans le remplacer.
- Les jeux de données provinciaux et territoriaux actuels servent à valider les changements municipaux et la terminologie locale.
- La Base de données toponymiques du Canada sert à valider les noms de lieux.
- Les données sur les réserves des Premières Nations, les régions inuites, les établissements métis, les traités et les terres du Canada sont des jeux de référence distincts de la couche régionale. Elles ne deviennent ni des limites opérationnelles ni des noms sans l’examen des communautés concernées.

Une décision locale approuvée peut préciser un point d’ancrage MeshMapper. Elle
doit indiquer les DA modifiées, expliquer le consensus local, réussir les mêmes
contrôles d’assurance qualité et faire l’objet d’une nouvelle version du
registre. Les polygones bruts de différents fournisseurs ne sont jamais empilés
pour former une couche finale « au mieux ».

## Génération déterministe des limites

Le générateur doit produire le même résultat à partir des mêmes entrées
verrouillées.

### 1. Verrouiller les entrées

Consignez l’URL de téléchargement, la date de publication, la licence, la taille
du fichier et son empreinte SHA-256 pour :

- les fichiers numériques et cartographiques des limites des DA de 2021;
- la classification des régions économiques de la SGC de 2021;
- les fichiers numériques des limites des divisions et subdivisions de recensement de 2021;
- l’instantané MeshMapper Canada;
- le registre candidat, les dérogations de recensement approuvées, l’instantané de densité radio protégeant la vie privée et la configuration du générateur.

Ne mélangez pas un fichier plus récent de subdivisions de recensement à
l’ensemble des DA de 2021. Les nouveaux fichiers municipaux demeurent des avis
de changement jusqu’à l’adoption d’un ensemble complet et compatible de
géographie de recensement.

### 2. Normaliser la géométrie

Validez et réparez la géométrie source, calculez les superficies et les
distances dans le système `EPSG:3347` de Statistique Canada, puis publiez le
résultat Web en WGS 84. Chaque DA est désignée par son DGUID, et non par un
numéro de ligne ou un nom.

Pour MCC-REG-1, la couverture numérique des DA constitue la géométrie de
propriété. Le « point représentatif » est le résultat GEOS `PointOnSurface`
calculé à partir de cette géométrie dans la projection `EPSG:3347` de
Statistique Canada. Toute la couverture officielle des DA est conservée comme
un ensemble d’unités communes; elle n’est ni tamponnée, ni réparée, ni
simplifiée entité par entité. Seuls les polygones sources externes sont réparés
avant comparaison. `sources.lock.json` consigne les fichiers sources exacts,
tandis que `generator.yml` consigne l’algorithme, la chaîne d’outils et les
paramètres de précision.

Le générateur candidat exige pour chaque polygone source une correspondance dans
le registre, une géométrie réparée non vide, un champ de compétence déclaré et
un contact avec au moins une DA de ce champ. Une source mise en quarantaine est
exclue. L’examen du centre, du rayon et de tout débordement hors du champ de
compétence demeure obligatoire avant qu’un candidat puisse faire autorité.

### 3. Aligner les enveloppes MeshMapper sur les DA

Un polygone source considère une DA comme faisant partie de son
**enveloppe générale** lorsque l’une de ces conditions est remplie :

- le point représentatif de la DA est couvert par le polygone source;
- au moins 50 % de la superficie terrestre de la DA chevauche le polygone source.

Lorsque plusieurs enveloppes couvrent la même DA, l’enveloppe gagnante est
choisie selon cet ordre :

1. une dérogation explicite approuvée;
2. le plus grand rapport de chevauchement;
3. la priorité de la source dans le registre;
4. le plus petit identifiant de registre immuable selon l’ordre lexical.

Chaque conflit est inscrit au rapport d’assurance qualité. Une enveloppe décide
quelle cible MeshMapper peut être candidate pour une DA; elle ne possède pas
directement la DA. Les formes sources brutes ne sont jamais exportées comme
polygones opérationnels.

### 4. Valider les points d’origine communautaires

Chaque région locale possède un point d’origine examiné. La DA qui contient ce
point est son ancrage. Si un point se trouve sur une limite, la DA couvrante
dont le DGUID est le plus petit selon l’ordre lexical est utilisée. Un point
d’origine situé hors de son champ de compétence déclaré bloque la publication.

Deux points d’origine candidats dans la même DA constituent un conflit qui
bloque la publication. Le registre doit corriger le point; le générateur ne le
déplace jamais silencieusement.

### 5. Définir les garde-fous

L’attribution automatique ne traverse jamais une frontière provinciale ou
territoriale. Chaque point d’origine possède une région économique d’attache.
Une cible MeshMapper peut aussi être candidate dans chaque région économique
touchée par son enveloppe acceptée.

### 6. Produire une propriété provisoire des DA

Choisissez d’abord le point d’origine le plus proche dont la région économique
d’attache correspond à celle de la DA. Dans une enveloppe MeshMapper gagnante,
comparez sa cible associée aux points d’origine communautaires couverts par
cette enveloppe dont la région économique d’attache correspond à celle de la
DA. Si seule la cible associée demeure, incluez également le point d’origine
ordinaire le plus proche de la même ER. Attribuez la DA à la candidate la plus
proche dans `EPSG:3347`; une égalité exacte est tranchée selon l’identifiant de
registre immuable.

Il s’agit d’un vote provisoire, et non de la propriété finale. Cette méthode
conserve MeshMapper comme principale préférence de limite tout en permettant
aux régions locales soumises d’influencer une grande enveloppe. Le rapport
d’assurance qualité consigne le nombre provisoire de DA par région pour chaque
enveloppe et bloque une enveloppe dominante qui priverait un point d’origine
communautaire contenu.

Si une région économique n’a aucun point d’origine d’attache, le générateur
consigne une solution de repli qui bloque la publication et utilise le point
d’origine le plus proche dans la même province ou le même territoire uniquement
pour garder la carte candidate complète. Il n’attribue jamais une DA de l’autre
côté d’une frontière.

Une sortie MultiPolygon est valide pour de véritables îles et composantes
terrestres séparées; les ponts d’eau artificiels ne le sont pas. Un fragment
continental déconnecté est signalé pour examen local.

### 7. Garder les communautés de recensement cohérentes

Le générateur convertit les votes provisoires des DA en propriété finale de CSD
entières dans cet ordre :

1. une décision approuvée concernant la CSD;
2. une décision approuvée concernant la CD qui n’entre pas en conflit avec le point d’origine d’une autre région;
3. la région dont le point d’origine se trouve dans la CSD;
4. le seul point d’origine régional de la CD qui contient la CSD;
5. la pluralité des votes provisoires des DA;
6. uniquement pour un choix serré et non examiné, des preuves admissibles de grappes radio protégeant la vie privée;
7. la distance projetée au point d’origine et l’identifiant de registre immuable pour une dernière égalité exacte.

Une CSD peut être divisée uniquement par une exception approuvée qui énumère
chaque DGUID de cette CSD et son propriétaire. Le générateur échoue si toute
autre CSD possède plus d’un propriétaire. Une limite fondée sur le point
d’origine le plus proche ne peut donc pas couper une ville constituée simplement
parce qu’un quartier est plus près du point suivant.

Le cas de Kitchener-Waterloo bloque la publication s’il échoue : les 189 DA de
la CSD de Cambridge `3530010`, y compris Hespeler, correspondent à `wat`; les
766 DA de la CD de Waterloo `3530` correspondent également à `wat`. Ces nombres
sont liés à la géographie verrouillée du Recensement de 2021 et doivent être
réexaminés lorsque le millésime de recensement change.

### 8. Utiliser l’activité radio uniquement pour départager de façon confidentielle

L’instantané verrouillé `radio-density.json` réunit les observations récentes et
positionnées de `live.meshcore.ca` et les entrées positionnées actuellement
retournées par `dev.meshcore.ca`, puis déduplique en mémoire les clés publiques
identiques. Le point de terminaison de développement n’indique pas l’heure
d’observation de chaque nœud; les entrées provenant uniquement de cet
environnement fournissent donc une densité indicative, mais ne peuvent servir
de preuve décisionnelle. Les observations récentes des répéteurs, serveurs de
salon et capteurs en direct fournissent les nombres décisionnels; les
emplacements des compagnons demeurent indicatifs. L’instantané est lié à une
empreinte SHA-256 du DGUID et du propriétaire provisoire avant l’analyse radio.
Les anciens noms candidats échouent donc de façon sûre, tandis qu’un critère
radio valide peut encore modifier la propriété finale sans dépendance circulaire
de l’empreinte.

Les grappes ne s’étendent pas sur plus de 30 kilomètres. Chaque nombre
géographique publié est d’au moins cinq. Les nombres par candidat sont publiés
uniquement dans leur propre CSD, et toute la ventilation des candidats d’une CSD
est masquée si l’une des catégories contient moins de cinq nœuds. Aucun
identifiant de nœud, nom ou coordonnée exacte n’est conservé.

La preuve radio peut départager uniquement des candidates déjà présentes dans
une CSD lorsque la marge provisoire ne dépasse pas 10 points de pourcentage et
qu’au moins 60 % des preuves radio admissibles appuient une candidate. Elle ne
peut pas créer une région, diviser une CSD, traverser une province ou un
territoire ni remplacer une décision de recensement approuvée. Un instantané
radio constitue une preuve reproductible pour une version, et non une autorité
automatique en direct; tout changement passe par un nouvel instantané verrouillé
et l’examen normal.

### 9. Générer les deux produits de limites

- Le résolveur utilise les limites **numériques** des DA pour traiter les eaux côtières de façon uniforme.
- La carte publique utilise les limites **cartographiques** des DA pour produire un littoral propre.

Les deux produits utilisent la même appartenance aux DA. Les intérieurs des
régions terminales générées sont disjoints deux à deux et leur union couvre
toute l’étendue verrouillée des DA. Les régions voisines partagent une seule
limite sans largeur. Un point exactement sur cette limite correspond à
l’identifiant de registre le plus petit selon l’ordre lexical.

## Divisions et fusions

Les grandes régions sont divisées en déplaçant des DA entières, et non en
traçant une nouvelle ligne à main levée.

Une proposition de division doit comprendre :

- l’identifiant de la région parente;
- la liste des DGUID qui appartiennent à chaque région enfant proposée;
- les identifiants radio proposés et les noms anglais et français;
- la raison locale de la division;
- la preuve d’un examen par les communautés touchées;
- un rapport actualisé sur les limites des commandes.

Toutes les cellules du parent doivent appartenir à exactement un enfant. Après
une division, le parent devient uniquement un regroupement non terminal. Il ne
possède ni propriété distincte dans le résolveur, ni remplissage publié, ni
portée d’acheminement supplémentaire.

Les aires de diffusion agrégées peuvent servir de point de départ à une
division, mais leurs codes ne constituent pas une identité permanente. Elles
peuvent être divisées ou combinées lorsque la géographie locale le justifie.

Les CSD sont les unités par défaut des sous-régions. Privilégiez d’abord les
municipalités ou leurs équivalents au complet, puis combinez des CSD voisines en
fonction de leur CD, de l’identité locale, du terrain et des preuves
opérationnelles. La division d’une CSD est une exception et exige l’attribution
complète et énumérée des DA décrite plus haut.

Une fusion conserve chaque identifiant et identifiant radio retiré comme alias
ou marqueur permanent. Un identifiant retiré n’est jamais réutilisé
silencieusement pour un autre lieu.

## Noms et identifiants radio

Le registre suit la préférence exprimée sur le forum pour des identifiants
courts, plats et faciles à lire. La hiérarchie est enregistrée dans les champs
de parenté plutôt que répétée dans chaque identifiant.

Les identifiants radio de référence doivent :

- être uniques dans tout le réseau maillé connecté;
- contenir uniquement les caractères minuscules `a-z`, `0-9` et `-`;
- compter au plus 29 octets UTF-8;
- demeurer stables une fois activés;
- éviter de nommer automatiquement une vaste région rurale d’après sa plus grande ville;
- être comparés aux identifiants actifs, obsolètes, retirés, aux alias et aux groupes de recherche non géographiques.

Les codes IATA et postaux peuvent servir d’alias lorsqu’ils sont utiles, mais ni
l’un ni l’autre ne constitue l’autorité nationale de dénomination. Une nouvelle
sous-région utilise un identifiant plat significatif localement lorsqu’il est
sans ambiguïté. Un identifiant préfixé par le parent sert en dernier recours à
éviter une collision; il n’est pas obligatoire.

Les commandes générées utilisent uniquement les identifiants de référence. La
recherche peut accepter les noms et alias. Le registre conserve séparément les
noms anglais et français; les noms autochtones locaux exigent l’examen de la
communauté concernée et ne sont jamais déduits.

## Gouvernance

### Responsabilités

| Rôle | Responsabilité |
| --- | --- |
| Responsables des régions de MeshCore Canada | Intégrité du registre, vérification des collisions, publications, générateur et assurance qualité |
| Responsables provinciaux ou territoriaux | Coordonner les propositions locales et confirmer les effets dans tout leur champ de compétence |
| Exploitants et communautés locales | Premier examen des noms locaux, des regroupements et de la couverture pratique |
| Responsables des régions voisines | Examen conjoint lorsqu’une proposition déplace leur limite commune de DA |

Les responsables nationaux font respecter le modèle de données; ils n’inventent
pas l’identité locale. Un changement techniquement valide peut attendre
l’examen local. Un changement populaire localement peut quand même échouer s’il
crée un trou, un chevauchement, une collision ou un dépassement des limites des
commandes.

### Processus de modification

1. Soumettez une proposition depuis l’éditeur de limites. Le service ouvre un billet public avec les DGUID, les noms, les identifiants, la raison et l’auteur proposé; aucun compte de contribution n’est requis.
2. Générez une comparaison avant-après et un rapport d’assurance qualité.
3. Obtenez l’examen local et celui du champ de compétence touché. Une proposition transfrontalière exige l’accord de chaque côté.
4. Prévoyez une période d’examen public consignée dans la proposition.
5. Un responsable autorisé approuve la proposition en fermant le billet `boundary-update` avec l’état **Completed**. L’état **Close as not planned** la rejette.
6. L’Action du dépôt vérifie la proposition signée, consigne la décision de recensement examinée, régénère et valide toute la couche nationale, enregistre le résultat dans `main` et met sa publication en file d’attente.
7. Conservez la version précédente pour la restauration et la migration.

### Propositions de l’éditeur de limites

L’éditeur travaille avec les mêmes cellules de recensement que le générateur.
Son action normale réattribue une CSD entière, et affiche sa CD comme contexte
d’examen. Il n’enregistre jamais un polygone tracé à main levée comme géométrie
opérationnelle. Une personne chargée de l’examen peut utiliser des modifications
provisoires au niveau des DA pour façonner une division exceptionnelle, mais
l’enregistrement `splitExceptions` approuvé doit énumérer chaque DA de la CSD,
sans DGUID en double ni manquant.

L’éditeur est une page statique à `/config/editor/` et n’exige aucun compte de
contribution. Il peut déplacer des cellules vers une région existante ou
proposer une nouvelle région avec un nom unique, un identifiant court et une
cellule d’ancrage modifiée. La nouvelle région terminale utilise le parent
commun le plus proche de ses régions sources afin de conserver l’arbre actuel.
Il crée une proposition versionnée avec l’empreinte d’appartenance de base et
le propriétaire avant-après de chaque DGUID modifié. Lors de la soumission, un
service exploité par MeshCore Canada répète les vérifications d’autorité et de
proposition, valide le contrôle antipourriel et utilise une GitHub App limitée
au dépôt pour ouvrir automatiquement le billet public. La page statique et le
service de production sont tous deux exploités par MeshCore Canada; aucun
identifiant GitHub ni secret de signature n’est placé dans le navigateur.
L’App publique possède uniquement un accès en lecture-écriture aux billets et
ne peut pas modifier la carte. La proposition de référence est signée par l’App
et enregistrée dans des marqueurs lisibles par machine, tandis que le billet
présente le résumé destiné aux personnes. Les responsables peuvent reproduire
la vérification avec `scripts/validate-region-proposal.py`, qui ajoute le
contexte CD/CSD et exige une raison avant l’examen; un auteur peut aussi être
consigné.

Après l’examen local et public, une personne autorisée ferme le billet étiqueté
comme **Completed**. L’Action du dépôt vérifie indépendamment l’auteur, la
personne qui ferme, l’étiquette, la signature de l’App, l’empreinte de la
proposition et le champ de compétence. Elle vérifie aussi le propriétaire
actuel de chaque cellule demandée. Une proposition peut demeurer ouverte
pendant que d’autres limites changent, mais elle échoue de façon sûre si l’une
de ses cellules a changé durant l’examen. Une décision concernant une CSD
entière devient une dérogation de cohorte; une décision partielle devient une
division explicite qui énumère toutes les DA de cette CSD. Pour une nouvelle
région approuvée, l’Action tire le point d’origine de la cellule d’ancrage
officielle, ajoute l’entrée au catalogue et applique la même décision de
propriété. Les points d’origine approuvés par la communauté ne participent pas
à l’étape candidate avant l’analyse radio : la cohorte ou la division examinée
possède les cellules approuvées. Cela protège la base de densité radio
verrouillée et empêche une expansion non examinée. L’Action régénère ensuite
les deux partitions nationales et les cellules de l’éditeur à partir des
sources verrouillées, exécute les contrôles de publication et enregistre la
décision source ainsi que les éléments générés dans `main`. Cette mise à jour déclenche le
déploiement normal du site. Tout échec avant la publication rouvre le billet et
laisse `main` inchangée. Une fermeture comme **Not planned** ne change aucune
autorité. Les brouillons de l’éditeur, l’état local du navigateur et les billets
soumis ne font jamais autorité avant la fin de l’approbation et de la
validation.

La géométrie des cellules de recensement de l’éditeur
(`docs/assets/regions/cells/`) a été générée pour la dernière fois avec
`scripts/build-region-editor-data.py --retain 10%` plutôt qu’avec la valeur par
défaut de 8 %, car 8 % réduit une aire de diffusion de la
Colombie-Britannique à une forme dégénérée. La valeur retenue est consignée avec
les autres entrées de construction dans
`docs/assets/regions/cells/manifest.json`.

Règles de versionnement :

- **Majeure :** millésime de géographie de recensement ou modification incompatible de l’autorité ou du modèle.
- **Mineure :** réattribution de DA, division, fusion, modification de hiérarchie ou d’identifiant, ou modification des membres d’une zone de répéteurs partagée.
- **Correctif :** noms, alias, documentation ou métadonnées de source sans modification de l’appartenance.

Les limites opérationnelles des régions sont des définitions communautaires
d’acheminement. Elles ne constituent aucune revendication juridique, électorale,
cadastrale, territoriale, de traité, de titre ou de souveraineté.

## Contrôles de publication

Une version géographique échoue à moins que toutes ces conditions soient
remplies :

- les 57 936 DA figurent exactement une fois dans la table d’appartenance des régions terminales;
- les 5 161 CSD et 293 CD proviennent du même ensemble verrouillé du Recensement de 2021;
- chaque CSD possède une seule région terminale, sauf si une exception approuvée énumère chaque DGUID;
- la région terminale de chaque DA se trouve dans la même province ou le même territoire;
- chaque paire d’intérieurs de régions terminales a une superficie de chevauchement nulle, sans égard à sa branche hiérarchique;
- la différence symétrique entre l’union des régions terminales et l’union numérique verrouillée des 57 936 DA est nulle à la précision configurée;
- l’union de chaque sous-région correspond à l’appartenance de son parent;
- seules les régions terminales possèdent une géométrie; aucun `routingOverlays`, `sharedParents` ou champ ajouté par profil n’existe;
- chaque zone de répéteurs partagée contient des régions terminales de référence provenant d’au moins deux provinces ou territoires, et aucune région terminale n’appartient à plus d’une zone automatique;
- les noms des zones partagées n’entrent jamais dans l’arbre radio; les chemins complets des membres respectent toutes les limites du micrologiciel et des lignes série;
- chaque chemin voisin est non géographique, facultatif, étayé par des preuves agrégées de routes et utilise une hiérarchie externe documentée ou expressément provisoire;
- les chemins voisins ne possèdent jamais de cellules canadiennes, ne sont jamais résolus à partir d’un point cartographique et ne figurent jamais comme géométrie de limites américaines;
- chaque point de test du résolveur retourne une seule région terminale;
- chaque région active est contiguë par une limite terrestre commune, ou possède une exception documentée d’île ou de MultiPolygon;
- chaque identifiant actif est unique partout et respecte la limite d’octets du micrologiciel;
- chaque ancien identifiant correspond à un enregistrement actif, obsolète ou à un marqueur permanent;
- chaque enregistrement géographique actif possède des `allowed_er_codes` examinés, et aucun conflit de point d’origine ou de cellule verrouillée ne demeure;
- chaque point d’ancrage MeshMapper possède un rapport d’écart au niveau des DA;
- la CSD de Cambridge `3530010` compte exactement 189 DA appartenant à `wat`, et la CD de Waterloo `3530` compte exactement 766 DA appartenant à `wat`;
- toute entrée de densité radio ne contient aucun identifiant de nœud, nom ou coordonnée exacte, utilise des agrégats d’au moins cinq nœuds et ne peut pas diviser une CSD;
- chaque polygone source réussit les contrôles de superficie, de centre, de compatibilité du champ de compétence et d’état d’examen avant de servir d’ancrage;
- toute la géométrie générée est valide et reproductible à partir des entrées verrouillées;
- toutes les commandes d’essai générées respectent les limites de 32 régions, 172 octets de réponse et 160 caractères par ligne série;
- chaque enregistrement géographique actif possède un nom anglais et un nom français;
- le rapport d’assurance qualité ne contient aucun conflit non examiné ni région de repli.

## Éléments obligatoires du registre

Avant que la première version géographique MCC-REG-1 soit marquée active, le
dépôt doit publier :

| Élément | Rôle |
| --- | --- |
| `sources.lock.json` | Entrées, licences et empreintes exactes |
| `generator.yml` | Version de l’algorithme et toutes ses constantes |
| `canada-regions.json` | Enregistrements géographiques, hiérarchie, alias et correspondances de sources |
| `municipal-overrides.json` | Propriété approuvée des CD/CSD, divisions complètes de CSD et décisions concernant les nouvelles régions |
| `radio-density.json` | Preuve agrégée facultative protégeant la vie privée; jamais de données brutes sur les nœuds |
| `canada-region-membership.csv` | Une ligne pour chaque DA numérique, avec le contexte CD/CSD, le vote provisoire et la région terminale finale |
| `aliases.csv` | Alias actuels, obsolètes, historiques et de recherche |
| `canada-region-partition.geojson` | Couche cartographique générée des régions terminales |
| `canada-region-partition-digital.geojson` | Couche complète générée du résolveur |
| `canada-region-partition.qa.json` | Preuves de publication, empreintes et écarts aux sources |
| `configuration.yml` | Politique du micrologiciel et des paramètres radio, séparée de la géographie |

Le GeoJSON généré est une sortie de construction. Le catalogue, la table
d’appartenance, la configuration du générateur et le verrouillage des sources
sont les entrées qui font autorité. Les groupes de recherche non géographiques
ne possèdent jamais de cellules, n’apparaissent pas dans la couche
cartographique et ne sont pas résolus à partir d’un point. Le nom d’une zone de
répéteurs partagée n’entre jamais dans une commande; seuls les chemins de
référence de ses membres y entrent.

## Migration depuis la carte actuelle

| Phase | Résultat | État des limites |
| --- | --- | --- |
| Version candidate générée | 193 régions terminales exclusives; chaque DA numérique est attribuée une fois | Complète et sans chevauchement; toujours proposée |
| Verrouillage des sources | Entrées de Statistique Canada, MeshMapper, de la stratégie et des dérogations figées | Entrées reproductibles |
| Ébauche générée | Chaque DA est attribuée; l’assurance qualité automatisée est publiée | Complète, mais proposée |
| Examen local | Zones d’influence incertaines en Alberta et ailleurs corrigées; noms examinés dans les deux langues officielles | Examinée |
| Version active | L’appartenance et les éléments réussissent chaque contrôle de publication | Fait autorité |

MeshMapper demeure la principale source d’attribution communautaire lorsqu’une
région y existe. Les cercles et polygones sources bruts ne deviennent jamais
des régions finales et ne sont jamais affichés comme tels. Ottawa et
l’Outaouais demeurent des régions provinciales terminales voisines, et
Lloydminster demeure divisée en `lloyd-ab` et `lloyd-sk`. Leurs configurations
partagées réunissent les chemins de référence des membres sans fusionner la
géométrie cartographique.

## Règles de configuration des répéteurs

Les instructions générées doivent suivre la
[documentation officielle actuelle de l’interface MeshCore](https://docs.meshcore.io/cli_commands/),
et non des exemples copiés d’un ancien document de stratégie.

- Utilisez `region def` ou `region put` pour définir exactement l’arbre requis par ce répéteur.
- `name|jump` crée `name` sous le curseur actuel, puis déplace le curseur vers `jump`; `jump` n’est pas le parent de `name`.
- `region def` n’efface pas l’arbre actuel et peut laisser des modifications partielles après une erreur.
- Une configuration interprovinciale doit utiliser une seule racine `can` avec une branche complète par région terminale sélectionnée. Elle ne doit pas inventer un deuxième parent ou l’identifiant d’une zone partagée.
- Un chemin américain voisin conserve la hiérarchie utilisée par cette communauté. Il constitue une branche racine distincte et ne fait pas partie de `can`.
- Les zones de répéteurs partagées enregistrées utilisent le même ordre déterministe des membres sur chaque répéteur. Les autres sélections à grande couverture sont ordonnées selon la hiérarchie de référence, et non selon l’ordre des clics.
- Sélectionnez les chemins selon le rôle du répéteur. N’ajoutez pas tous les chemins partout.
- Exécutez simplement `region` pour examiner le résultat.
- Exécutez `region save` seulement après avoir confirmé l’arbre et les permissions d’inondation.

L’outil de configuration doit générer et tester les commandes à partir des
identifiants de parent du registre. Il ne doit jamais déduire l’ordre des
commandes en divisant une chaîne d’identifiant. La carte peut entourer ensemble
toutes les régions terminales canadiennes sélectionnées, mais chaque
remplissage demeure sa région géographique d’origine sans chevauchement. Les
chemins américains voisins apparaissent uniquement dans les commandes et les
noms. L’éditeur de limites continue d’accepter une seule province ou un seul
territoire par proposition; l’appartenance à une zone de répéteurs partagée et
les métadonnées des chemins voisins sont modifiées dans le catalogue et
examinées par chaque côté touché.

## Registre des sources

- [Discussion du forum de MeshCore Canada](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54), y compris la discussion sur la couverture complète et les unités administratives dans les [messages 29 à 36](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/29), la discussion sur l’autorité locale dans les [messages 43 et 44](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/43) et la préoccupation sur la facilité de trouver l’information dans le [message 50](https://forum.meshcore.ca/t/thoughts-canadian-regions-strategy/54/50).
- Canada MeshCore Region Strategy v1.1.1, datée du 23 juin 2026. Empreinte SHA-256 du PDF fourni : `9f32d71d2656cfa3abfda4736c3ddb64d1b6e7c5d4e88a7d55b63424f9353a3b`.
- Instantané canadien [MeshMapper](https://meshmapper.net/) `meshmapper-ca-2026-07-12`.
- [Définition des DA de Statistique Canada de 2021](https://www12.statcan.gc.ca/census-recensement/2021/ref/dict/az/definition-eng.cfm?ID=geo021), [Guide des fichiers des limites de 2021](https://www150.statcan.gc.ca/n1/pub/92-160-g/92-160-g2021001-eng.htm), [relations de la géographie de diffusion de 2021](https://www12.statcan.gc.ca/census-recensement/2021/geo/sip-pis/dguid-idugd/index2021-eng.cfm?year=21) et [norme des régions économiques de 2021](https://www.statcan.gc.ca/en/subjects/standard/sgc/2021/er-additionalinfo).
- [Licence ouverte de Statistique Canada](https://www.statcan.gc.ca/en/terms-conditions/open-licence).
- Instantané protégeant la vie privée des nœuds positionnés de MeshCore Canada provenant de [`live.meshcore.ca`](https://live.meshcore.ca/) et [`dev.meshcore.ca`](https://dev.meshcore.ca/), où l’infrastructure fixe sert aux décisions et tous les rôles sont conservés uniquement comme contexte agrégé.
- Preuve agrégée de routes résolues provenant de [`dev.meshcore.ca`](https://dev.meshcore.ca/) le 18 juillet 2026. Seuls les totaux par zone sont conservés.
- [Paramètres radio de WNY MeshCore](https://wnymeshcore.org/guides/radio-settings) pour `us → us-ny`, [stratégie du Pacific Northwest](https://gessaman.com/meshcore/regions/) pour `west → pnw → wa` et `west → pnw → or`, et [convention de chemins d’États de RegionMesh](https://www.regionmesh.com/meshcore-region-configuration/) pour les chemins provisoires des États-Unis.
