---
title: Régions IATA et portées des messages
description: Choisissez les zones IATA de MeshMapper, configurez des portées indépendantes et remplacez l’ancienne hiérarchie.
audience:
  - repeater-operator
  - region-maintainer
task: understand-region-standard
scope: canada-baseline
status: draft
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2027-03-24
tested_with:
  scope_model: meshcore-canada-iata-scopes-v1
  repeater_firmware: 1.16+
difficulty: intermediate
---

# Régions IATA et portées des messages

Trouvez votre zone dans la [carte des régions](map.md), puis ouvrez le
[configurateur de répéteur](index.md). Les deux outils utilisent les mêmes
limites et identifient leur source.

Écrivez les portées en minuscules : **yow (Ottawa–Gatineau)**, **yul (Montréal)**
ou **yyz (Toronto)**. La recherche accepte les codes d’aéroport en majuscules,
mais les noms transmis sont en minuscules. `YOW`, `yow` et l’ancien `ott`
sont des noms distincts sur le réseau.

## La liste des portées

| Niveau | Exemple | Usage |
| --- | --- | --- |
| Ville | `yow` | La zone de MeshMapper |
| Province ou territoire | `on` ou `qc` | Le lieu d’installation du répéteur |
| Réseau partagé | `onqc` | Ontario et Québec seulement |
| Canada | `can` | Prévu pour plus tard; pas encore la portée par défaut d’un compagnon |

Ces noms sont indépendants. Un répéteur d’Ottawa porte `yow`, `on`, `onqc`
et `can`. Un répéteur de Gatineau porte `yow`, `qc`, `onqc` et `can`.
La zone de ville reste la même des deux côtés de la rivière.

Le site utilise les codes IATA partout au Canada. Les réglages du réseau
partagé viennent de la [proposition ON/QC](../proposals/onqc-scopes.md); leur
publication ne signifie pas que tous les opérateurs les ont adoptés.
Ailleurs, l’outil propose ville, province et `can`, sans inventer une autre
portée de réseau partagé. Convenez des portées plus larges avec les opérateurs locaux.

Les portées filtrent la retransmission par inondation. Ce ne sont ni du
chiffrement, ni un contrôle d’accès, ni des limites de couverture ou des
barrières GPS. Elles ne limitent pas les messages directs dont le chemin est connu.

## Trouver la ville et la province

- Utilisez le code indiqué sur la carte : une zone [MeshMapper](https://meshmapper.net/) ou une région initiale ci-dessous.
- Pour une zone interprovinciale, choisissez la province où le répéteur est installé.
- Si aucune zone n’est publiée, demandez à votre communauté de l’ajouter dans
  MeshMapper. L’aéroport le plus proche ne détermine pas votre zone.
- Si des polygones se chevauchent, choisissez la zone de votre communauté;
  l’outil n’en sélectionne pas une arbitrairement.

Les contours provinciaux indiquent la province du répéteur et définissent les
grandes régions initiales ci-dessous. Ils ne modifient pas les zones de MeshMapper.

## Régions initiales {#starter-regions}

Ces attributions de MeshCore Canada couvrent des endroits sans zone publiée dans
MeshMapper. Elles utilisent de vrais codes IATA et les mêmes scopes indépendants,
mais **ne sont ni des zones publiées dans MeshMapper ni des garanties de couverture**.
La carte les identifie par des limites dorées en pointillé.

Ces attributions sont des propositions distinctes, pas une extension approuvée
du déploiement ON/QC. Confirmez leur utilisation localement.

| Secteur | Scope | Référence du code |
| --- | --- | --- |
| Île-du-Prince-Édouard | `yyg` | [Charlottetown](https://flyyyg.com/) |
| Terre-Neuve | `yyt` | [Saint-Jean](https://stjohnsairport.com/) |
| Labrador | `yyr` | [Happy Valley–Goose Bay](https://goosebayairport.com/) |
| Yukon | `yxy` | [Whitehorse](https://yukonairports.ca/contact-information) |
| Territoires du Nord-Ouest | `yzf` | [Yellowknife](https://tc.canada.ca/fr/aviation/exploitation-aeroports-aerodromes/liste-aeroports-appartenant-transports-canada) |
| Nunavut | `yfb` | [Iqaluit](https://tc.canada.ca/fr/aviation/exploitation-aeroports-aerodromes/liste-aeroports-appartenant-transports-canada) |

Dans les autres provinces, ces pôles comblent les espaces restants :

| Province | Régions proposées |
| --- | --- |
| C.-B. | `ylw` Kelowna, `yxs` Prince George, `yxt` Terrace, `yxc` Cranbrook |
| Alb. | `ymm` Fort McMurray, `yqu` Grande Prairie |
| Sask. | `yxe` Saskatoon, `yqr` Regina |
| Man. | `ybr` Brandon, `yth` Thompson, `yyq` Churchill |
| Ont. | `ysb` Sudbury, `yam` Sault-Sainte-Marie, `yts` Timmins, `yqk` Kenora |
| Qc | `yvo` Val-d’Or, `yzv` Sept-Îles, `yvp` Kuujjuaq |
| N.-B. | `yqm` Moncton, `yfc` Fredericton, `ysj` Saint John |
| N.-É. | `yhz` Halifax, `yqi` Yarmouth |

Les espaces non attribués sont répartis selon la distance à **tous les centres
régionaux de la province** : les régions publiées dans MeshMapper et les pôles
initiaux ci-dessus. Ils ne sont pas attribués seulement aux nouvelles régions.
Les distances utilisent la projection Lambert du Canada.

### Extensions proposées {#planning-extensions}

Un espace voisin d’une région IATA existante peut reprendre son code comme
**extension proposée**. Par exemple, le point `43.8678, -81.2619` près de Wingham
est attribué à `ykf`, pas à Sudbury (`ysb`). Goderich est attribuée à `yxu` et
Kincardine à `ylk`.

Les extensions sont des surfaces distinctes en pointillé, pas des modifications
aux polygones publiés par MeshMapper. Le résultat indique la source de la surface
qui contient votre point. Les 13 provinces et territoires restent cartographiés.
Les limites proposées doivent être revues localement; elles ne représentent pas
la couverture radio mesurée.

Par exemple, l’Île-du-Prince-Édouard utilise `yyg`, `pe` et `can`; le Yukon utilise
`yxy`, `yt` et `can`. Ces régions n’utilisent pas `onqc`.
Le [configurateur](index.md) fournit les commandes.

Ces grandes régions sont un point de départ, pas la preuve d’un lien radio entre
des communautés éloignées. Confirmez leur utilisation localement et
[proposez des ajustements](../submit-idea.md) selon le développement des réseaux.
Les limites publiées par MeshMapper ont toujours priorité.

Les contours proviennent de la géographie provinciale et territoriale de
Statistique Canada déjà utilisée par le site. Le Labrador correspond aux divisions
de recensement 10 et 11; Terre-Neuve couvre le reste de la province. Aucun cercle
autour d’un aéroport ni ancien nom de scope hiérarchique n’est utilisé.

## Configuration du répéteur

### Contacts et vérification locale

Chaque résultat indique la source des limites, les communautés, le responsable et
l’état de vérification des réglages. Une limite publiée ne prouve ni l’adoption
locale ni les réglages radio. Les contacts de l’annuaire ne deviennent pas
automatiquement responsables de région.

La fiche permet de proposer un responsable, de confirmer les réglages avec une
preuve publique datée ou de proposer une limite. Ces changements passent par une
PR. Une vérification hebdomadaire regroupe les changements de MeshMapper dans un
ticket à examiner; rien n’est publié automatiquement. Les réglages confirmés sont
à revérifier après six mois.

### Comparer une configuration existante

À la dernière étape du configurateur, ouvrez **Vérifier une liste de régions
existante**. Collez la réponse complète de `region` et, avec la version 1.15 ou
plus récente, celle de `region default` si vous le souhaitez. La comparaison
indique les scopes conservés, ajoutés, modifiés et supprimés. Les données restent
dans votre navigateur. Vous devez examiner les suppressions avant de copier les
commandes. Préférez USB et gardez une copie : une réponse à distance peut être
tronquée. Le symbole `^` marque la région d’origine, pas le scope par défaut.

Utilisez de préférence le micrologiciel **1.16 ou plus récent**. Le configurateur
prend aussi en charge **1.15** et un mode limité pour **1.14**. Coordonnez le
changement avec les opérateurs voisins et gardez un accès physique au répéteur.

| Micrologiciel | Commandes produites | Portée des annonces |
| --- | --- | --- |
| 1.16+ | `region def`, sans hiérarchie | Ville d’origine |
| 1.15 | Commandes `region put` séparées | Ville d’origine |
| 1.14 | `region put` et `region allowf` pour chaque nom | Sans portée; mise à jour nécessaire |

En 1.15, `region put` répond `OK - (flood allowed)`. Si une commande de
configuration ne répond pas, vérifiez la connexion et renvoyez-la avec
**Send Again**. Arrêtez-vous en cas d’erreur réelle. Mettez les versions plus
anciennes à jour avant d’utiliser les identifiants canadiens de 3 octets.

### Retirer les anciennes entrées {#existing-devices}

Utilisez de préférence une connexion USB pour éviter de perdre l’accès de
gestion pendant le changement. Exécutez `region` et conservez une copie.
`region def` ajoute ou déplace des entrées; il ne retire pas les anciennes.

Retirez les noms inutiles avec `region remove <nom>`, des entrées les plus
indentées vers leurs parents. Ne retirez pas `*`. Voici l’exemple de
l’ancien chemin d’Ottawa uniquement :

```text
region remove ott
region remove on-alg
region remove on
region remove can
region save
```

Les autres arbres demandent leurs propres noms et leur propre ordre.
En cas de `Err - not empty`, retirez d’abord les enfants restants.
Pour un remplacement manuel complet, exécutez `region` de nouveau : seul `*`
devrait rester. Le comparateur peut plutôt conserver les entrées utiles et les
déplacer hors des anciens parents.
Ne réinitialisez pas tout l’appareil pour changer ses portées.

### Répéteur de ville {#repeteur-local}

Un répéteur qui dessert une seule région IATA reste un répéteur de ville, même
à sa limite extérieure. Des villes ou des contours portant le même code IATA
comptent toujours comme une seule région.

Exemple pour Ottawa :

```text
region def yow|* on|* onqc|* can
region allowf *
region default yow
region
region save
region
```

`|*` replace le curseur à la racine avant le nom suivant.
`region allowf *` garde les messages sans portée utilisables localement.
`region default yow` garde les annonces du répéteur dans sa zone de ville.

Pour Gatineau, remplacez `on` par `qc`. Pour Montréal, utilisez `yul` et `qc`.
À Calgary, utilisez `region def yyc|* ab|* can` et `region default yyc`.

### Répéteur de bordure {#repeteur-de-liaison}

Choisissez le mode bordure si le répéteur communique régulièrement avec des
répéteurs de régions IATA différentes. Sa proximité d’une limite ne suffit pas.
Les portées des villes voisines sont facultatives : ajoutez-les seulement pour
retransmettre leurs messages avec portée. À Rigaud, du côté québécois,
pour relier Ottawa–Gatineau et Montréal :

```text
region def yow|* yul|* qc|* onqc|* can
region denyf *
region default yow
region
region save
region
```

Le répéteur porte les deux noms de ville, mais seulement sa propre province.
Il bloque la retransmission des messages sans portée. Les messages `onqc`
peuvent traverser la liaison; les messages `yow` s’arrêtent aux répéteurs
qui ne portent pas `yow`. Les autres liaisons entre ces villes doivent aussi
bloquer `*`, sinon les messages sans portée peuvent les contourner.

Les chemins américains restent des choix explicites, identifiés séparément.
Confirmez-les auprès du réseau voisin. Cette migration ne les renomme pas
et n’ajoute pas de polygones américains.

### Réglages de la phase 1 ON/QC {#reglages-onqc-facultatifs}

Le configurateur propose ces réglages sur demande. Il conserve la fréquence
radio et la taille d’identifiant actuelles tant que vous ne choisissez pas
de changement. L’option ON/QC sélectionne aussi les identifiants de 3 octets.
Sans cette option, l’outil produit les commandes de portée sans ces réglages;
ce n’est pas une configuration complète de la phase 1.

```text
set path.hash.mode 2
set advert.interval 240
set flood.advert.interval 47
set flood.max 16
```

Ces valeurs donnent des identifiants de 3 octets, des annonces locales toutes
les quatre heures, des annonces par inondation toutes les 47 heures et une
limite de 16 sauts. Vérifiez que cette limite suffit au plus long trajet voulu.
`set flood.max.unscoped 3` appartient à la **phase 3**, seulement au besoin,
après la phase 2 et une annonce locale. L’outil ne l’ajoute pas par défaut.

Les commandes peuvent prendre effet ou être enregistrées dès leur saisie.
Conservez une sauvegarde : un redémarrage ne suffit pas nécessairement à les
annuler. Vérifiez chaque réponse et arrêtez-vous en cas d’erreur.
Après `region save`, vérifiez les noms et les indicateurs `F` avec `region`.
Sur un répéteur de bordure, `*` ne doit pas porter `F`.

## Compagnons et canaux

!!! warning "ON/QC : attendez la phase 2"
    Pour un compagnon personnel, laissez **Default Region Scope** vide et les
    canaux **sans portée** pour le moment. La phase 2 n’est pas ouverte. Elle ne
    peut commencer avant **janvier 2027**, lorsque les répéteurs seront prêts et
    que le déploiement sera annoncé. Un changement trop tôt peut bloquer les
    messages sur un répéteur qui n’est pas encore configuré.

Suivez l’[ordre de déploiement](../proposals/onqc-scopes.md#ordre-de-deploiement).
Les robots et MeshMapper utilisent leur portée de ville à la **fin de la phase 1**,
une fois les répéteurs locaux prêts. Les compagnons personnels attendent la phase 2.

**Quand la phase 2 sera annoncée**, avec l’application MeshCore **1.43 ou plus
récente**, ouvrez **Settings → Network Settings → Default Region Scope** et
choisissez `onqc`. Le premier message direct envoyé par inondation et sa réponse de
découverte de chemin peuvent ainsi traverser le réseau partagé.

| Trafic ON/QC | Portée |
| --- | --- |
| Portée par défaut du compagnon et canal Public | `onqc` |
| Canaux de test personnels | Votre ville, par exemple `yow` |
| Autres canaux | Ville, province ou `onqc`, selon l’entente locale |

Définissez chaque canal : sans portée propre, il utilise celle du compagnon.
N’utilisez pas encore `can` par défaut. Hors ON/QC, convenez d’une portée
partagée avec les opérateurs; le site ne suppose pas qu’un trajet pancanadien existe.

## Limites du micrologiciel

- **32 régions nommées** au maximum, en plus de `*`.
- **160 octets par commande**.
- Une réponse `region` de **160 octets**, incluant indentation, indicateurs,
  marqueur de région d’origine et octet de fin.

Choisissez uniquement les zones de liaison utiles. L’outil ne produit pas
de commandes pour un profil trop volumineux.

## Mises à jour et anciens liens

Demandez les changements aux zones publiées dans [MeshMapper](https://meshmapper.net/).
Pour nos régions initiales, [envoyez une proposition communautaire](../submit-idea.md).
MeshCore Canada conserve les zones publiées intactes et identifie ses ajouts séparément.
Certains anciens liens mènent à leur zone IATA;
vérifiez le lieu, la province et les zones de liaison, car les limites ont changé.
Un nom absent ou ambigu exige une nouvelle sélection.

L’[ancien éditeur](editor/index.md) permet de télécharger les brouillons
enregistrés localement. Les nouvelles propositions fondées sur les secteurs
de recensement ne sont plus acceptées. Les anciens tickets et leurs aperçus
sont conservés. Le [formulaire des communautés](../submit-idea.md) reste disponible.

## Sources

- [Proposition ON/QC](../proposals/onqc-scopes.md)
- [MeshMapper](https://meshmapper.net/) et l’onglet **Données des régions** de la carte
- [Référence des commandes MeshCore](https://docs.meshcore.io/cli_commands/)
- [Sources et licences](../assets/regions/NOTICE.txt)
- [Ancien modèle fondé sur le recensement, conservé dans Git](https://github.com/MeshCore-ca/MeshCore-Canada/blob/e5281887ffdce3985d8f919fc353fa597a8ac93e/docs/config/standard.fr.md)
