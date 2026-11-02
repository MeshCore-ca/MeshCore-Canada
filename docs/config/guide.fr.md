---
title: Comprendre les répéteurs
description: Ce que font les répéteurs et les répéteurs observateurs, comment les portées et les régions guident les messages, et ce que fait chaque commande.
audience:
  - repeater-operator
  - companion-user
  - region-maintainer
task: understand-repeaters
scope: canada-baseline
status: verified
owner: region-maintainers
last_reviewed: 2026-11-02
review_by: 2027-05-02
evidence: tests/content/setup-guide.test.mjs
difficulty: beginner
estimated_time: 10 minutes
destructive: false
page_styles:
  - assets/setup/scope-demo.css?v=20261102-1
page_scripts:
  - assets/regions/modules/iata-scopes.js?v=20261013-1
  - assets/setup/scope-demo.js?v=20261102-1
---

# Comprendre les répéteurs

Cette page explique les idées derrière l’[outil de configuration](index.md) : ce
que fait un répéteur, comment les portées et les régions décident où vont les
messages, et ce que fait chaque commande de la liste de l’outil. Pas besoin de
la lire d’abord : l’outil pose une question à la fois et explique chaque
commande au fur et à mesure.

## Ce qu’est un répéteur { #what-a-repeater-is }

Un répéteur relaie les messages pour qu’ils aillent plus loin.

C’est une radio MeshCore qui reste allumée au même endroit, idéalement en
hauteur, sur un toit ou un mât. Personne n’y discute directement. Pour discuter,
on utilise un **appareil compagnon** : la petite radio jumelée à l’application
MeshCore sur un téléphone ou un ordinateur. Quand un répéteur entend un message,
il peut le relayer, pour qu’il joigne des gens trop loin pour entendre
l’appareil compagnon. Chaque répéteur qui relaie un message compte pour un
**saut**.

Avant de relayer un message, un répéteur vérifie deux choses :

- **Le message porte-t-il l’étiquette d’un secteur qu’il dessert?** C’est sa
  liste de régions qui en décide. Voir [Les portées et les régions](#scopes-and-regions).
- **Le message est-il déjà allé trop loin?** Après 16 sauts, plus aucun
  répéteur ne le relaie.

Tous les appareils des environs doivent utiliser les mêmes réglages radio, sinon
ils ne s’entendent pas. La majeure partie du Canada utilise les réglages radio
canadiens; certains groupes locaux ont les leurs.

Pour en configurer un, utilisez l’[outil de configuration](index.md). Pour le
matériel et l’emplacement, consultez les [répéteurs recommandés](../hardware/recommended-repeaters.md)
et les [options de montage](../hardware/repeater-mounting-options.md).

## Ce qu’est un répéteur observateur { #repeater-observers }

Un répéteur observateur est un répéteur qui rapporte aussi ce qu’il entend à
live.meshcore.ca, pour que tout le monde puisse voir l’état du réseau. Il lui
faut le Wi-Fi pour ça.

C’est pourquoi il lui faut une carte **ESP32** : les cartes nRF52 n’ont pas de
Wi-Fi. Il utilise le micrologiciel d’observateur de
l’[outil de programmation des observateurs](https://observer.gessaman.com/),
sous MQTT Observer Firmware. Ses rapports passent par votre Wi-Fi jusqu’aux deux
serveurs de MeshCore Canada, avec MQTT (une façon courante pour des appareils
d’envoyer des rapports à un serveur).

Il fonctionne de l’une de ces deux façons :

- **Relayer et observer :** un répéteur complet qui rapporte aussi ce qu’il
  entend. C’est le choix de la plupart des gens.
- **Écouter seulement :** il rapporte ce qu’il entend à live.meshcore.ca, mais
  ne relaie jamais rien.

Dans les deux cas, il rapporte ce qu’il entend. L’écoute seule est utile à
l’intérieur ou près d’un autre répéteur, là où relayer ne ferait qu’ajouter du
bruit. Vous pourrez changer plus tard avec `set repeat on` ou `set repeat off`.

Le répéteur observateur n’est qu’un type d’observateur. D’autres utilisent
RemoteTerm, Home Assistant ou un petit ordinateur branché à une radio :
[Configurer un observateur](../analyzer/intro.md) vous aide à choisir.
[Données d’observation et confidentialité](../analyzer/data-collection-access.md)
explique ce que contiennent les rapports.

## Les portées et les régions { #scopes-and-regions }

**Une portée est une étiquette sur un message qui indique jusqu’où il doit aller.
Une liste de régions, ce sont les étiquettes qu’un répéteur accepte de relayer.**

C’est toute l’idée. Par exemple :

- **Un message étiqueté `ytr` reste autour de Belleville.** Les répéteurs de
  Quinte West ont `ytr` dans leur liste, donc ils le relaient. Ceux de Kingston
  ne l’ont pas, donc il s’arrête là.
- **Un message étiqueté `on` traverse l’Ontario**, parce que tous les
  répéteurs de l’Ontario ont `on` dans leur liste.

### Un code, deux noms

Les mêmes codes courts apparaissent à deux endroits :

- **Sur un message, l’étiquette est une portée.** Vous la réglez sur votre
  appareil compagnon et sur chaque canal. L’application MeshCore l’appelle
  *region scope*.
- **Sur un répéteur, les étiquettes qu’il relaie sont ses régions**, gardées
  dans sa liste de régions.

Une région, c’est aussi le secteur que dessert un répéteur. Les régions portent
le nom du code d’aéroport le plus proche : Belleville est dans `ytr`, Quinte
West. La région d’un répéteur décide quels messages il relaie.

### Quelle est ma région?

L’[outil de configuration](index.md) la trouve à partir de la ville où sera le
répéteur, et la [carte des régions](map.md) les montre toutes.

- **Près d’une frontière provinciale, choisissez le côté où il se trouve
  vraiment.** La région `yow` traverse la rivière des Outaouais : un répéteur
  d’Ottawa a `yow` et `on`, un répéteur de Gatineau `yow` et `qc`.
- **Les villes d’une même région partagent son code.** Ottawa et Gatineau sont
  toutes deux dans `yow`.
- **Aucune zone pour votre secteur?** [MeshMapper](https://meshmapper.net/),
  la carte communautaire qui dessine le secteur de chaque région, ne couvre pas
  tout. La carte des régions montre alors plutôt une
  [région initiale](#starter-regions) de MeshCore Canada.
- **Écrivez les codes en minuscules.** Vous pouvez chercher `YTR`, mais sur les
  ondes, `ytr` et `YTR` sont deux étiquettes différentes.

### Les cinq étiquettes

De la plus petite à la plus grande :

| Étiquette | Exemple | Ce qu’elle couvre |
| --- | --- | --- |
| Région | `ytr`, `yow`, `yhz` | Un secteur, nommé d’après son code d’aéroport |
| Province ou territoire | `on`, `qc`, `ns` | La province où se trouve le répéteur |
| Ontario + Québec | `onqc` | Les deux provinces, comme un seul réseau partagé |
| Canada | `can` | Tout le Canada. Dans chaque liste, pas encore utilisée |
| Amérique du Nord | `na` | Le Canada et les États-Unis. Dans chaque liste, pas encore utilisée |

Un répéteur de Belleville a `ytr`, `on`, `onqc`, `can` et `na`. Un répéteur de
Halifax a `yhz`, `ns`, `can` et `na` : `onqc` est réservée à l’Ontario et au
Québec.

`can` et `na` sont dans chaque liste pour que des messages pancanadiens ou
transfrontaliers puissent un jour fonctionner sans que personne ait à
reconfigurer son répéteur. Ne les utilisez pas encore sur votre appareil
compagnon ni dans vos canaux : à elles seules, elles ne permettent pas à un
message d’atteindre une autre province ou un autre pays.

**Chaque étiquette est indépendante.** Les étiquettes vont de la plus petite à
la plus grande, mais elles ne s’emboîtent pas : avoir `on` ne veut pas dire
avoir `ytr`. Chaque étiquette doit être dans la liste séparément. C’est
pourquoi l’outil de configuration met sur chaque répéteur toutes celles qui
s’appliquent.

### Comment un répéteur décide

Quand un message arrive à un répéteur, celui-ci compare son étiquette à sa liste :

- **L’étiquette est dans sa liste :** il relaie le message.
- **L’étiquette n’est pas dans sa liste :** il ne le relaie pas.
- **Aucune étiquette :** le message compte comme `*`, l’étoile qui veut dire
  « sans étiquette ». Il est relayé seulement si `*` est permis, ce que font les
  répéteurs de ville et pas les répéteurs de bordure. Les anciennes applications
  envoient des messages sans étiquette, tout comme un appareil compagnon sans
  portée par défaut.
- **Trop de sauts :** après 16 sauts, le message s’arrête, quelle que soit son
  étiquette.

La liste d’un répéteur de ville de Belleville contient `*`, `ytr`, `on`, `onqc`,
`can` et `na`. Donc :

| Message | Étiquette | Répéteur de ville de Belleville |
| --- | --- | --- |
| Canal de test de Belleville | `ytr` | Le relaie |
| Premier message à une amie à Montréal | `onqc` | Le relaie |
| Quelqu’un avec une ancienne application | aucune | Le relaie |
| Canal de Kingston | `ygk` | Ne le relaie pas |
| Canal de tout le Québec | `qc` | Ne le relaie pas |

Le répéteur entend quand même tous les messages : sa liste décide seulement
lesquels il relaie. Votre appareil compagnon reçoit tout ce qui l’atteint.

Quelques pièges fréquents :

- **L’orthographe doit être exacte.** `ytr`, `YTR` et `quinte` sont trois
  étiquettes différentes.
- **Seuls les messages qui se répandent sont vérifiés.** Les messages de canal,
  et le premier message privé à un contact, se répandent par tous les
  répéteurs prêts à les relayer. C’est ce qu’on appelle une *diffusion* (flood).
  Dès qu’un message privé a un chemin connu, il suit ce chemin et les étiquettes
  ne comptent plus.
- **Un répéteur sans régions ne relaie que les messages sans étiquette.** Un
  message étiqueté ne circule qu’une fois que les répéteurs du trajet ont son
  étiquette.
- **Une étiquette n’est ni un cadenas ni une clôture.** N’importe qui peut
  mettre n’importe quelle étiquette sur un message, et elle ne vérifie pas où
  vous êtes. Elle indique seulement aux répéteurs s’ils doivent relayer le
  message.

### Qui relaie quoi

Voici un bout de réseau entre Belleville et Kingston, avec un répéteur de
bordure entre les deux :

- **Les répéteurs de ville de Belleville** ont `*`, `ytr`, `on`, `onqc`, `can`
  et `na`.
- **Le répéteur de bordure** a `ytr`, `ygk`, `on`, `onqc`, `can` et `na`, mais
  pas `*`.
- **Les répéteurs de ville de Kingston** ont `*`, `ygk`, `on`, `onqc`, `can` et
  `na`.

Chaque répéteur relaie-t-il le message?

- **Sans étiquette, envoyé à Belleville :** Belleville le relaie. Le répéteur de
  bordure ne le relaie pas, donc Kingston n’est pas atteint. Il reste autour de
  Belleville.
- **`ytr`, un canal de Belleville :** Belleville et le répéteur de bordure le
  relaient. Les répéteurs de Kingston ne le relaient pas, donc il s’arrête là.
- **`ygk`, un canal de Kingston :** le répéteur de bordure et Kingston le
  relaient. Belleville ne le relaie pas, donc il reste autour de Kingston.
- **`on`, un canal de l’Ontario :** les trois le relaient, donc il va partout en
  Ontario.
- **`onqc`, la portée par défaut d’un compagnon :** les trois le relaient, donc
  il va partout en Ontario et au Québec.

Cette liste montre quels répéteurs relaient un message, pas la couverture radio.
Quiconque est à portée d’un répéteur entend quand même ce qu’il transmet, et un
vrai réseau a plus de trajets que celui-ci.

### Essayez : quelles villes une étiquette atteint-elle? { #scope-demo }

Cet exemple montre quels répéteurs de ville relaient un message, selon
l’étiquette qu’on y met.

<div data-scope-demo></div>

<noscript><p>L’exemple a besoin de JavaScript pour fonctionner. Le tableau et la liste ci-dessus montrent la même chose.</p></noscript>

### Pourquoi des codes d’aéroport?

- **MeshMapper les utilise déjà**, par exemple `ytr.meshmapper.net`.
- **MeshCore les utilise déjà ailleurs**, par exemple pour le
  [code d’emplacement que chaque observateur transmet](../analyzer/iata-codes.md).
  D’autres noms seulement pour les régions ne feraient qu’ajouter de la
  confusion.
- **Aucun accent ni majuscule où se tromper.** `montréal`, `Montreal` et
  `montreal` seraient trois étiquettes différentes.
- **Ils sont faciles à diviser plus tard.** Si une ville veut un jour son propre
  secteur, elle peut prendre son propre code d’aéroport et garder sa province
  et `onqc`.

Le code désigne le secteur, pas l’aéroport. Les codes viennent de l’IATA,
l’association du transport aérien qui attribue les codes d’aéroport. C’est
pourquoi la carte parle de régions IATA.

### Lire une ligne `region def`

Pas besoin de cette section pour configurer un répéteur : l’outil donne la ligne
exacte. Elle aide quand vous voulez en lire une.

```text
region def ytr|* on|* onqc|* can|* na
```

`region def` construit la liste du répéteur en une ligne. La commande ajoute
chaque nom à son tour, et `|*` veut dire « revenir en haut » avant le suivant :
les noms se retrouvent côte à côte, pas les uns dans les autres. Envoyez ensuite
`region` pour voir la liste :

```text
*^ F
 ytr F
 on F
 onqc F
 can F
 na F
```

- **`F`** veut dire qu’il relaie ces messages.
- **La ligne `*`** concerne les messages sans étiquette. Elle a `F` sur un
  répéteur de ville et pas de `F` sur un répéteur de bordure.
- **`^`** marque sa région d’attache. Sur un nouveau répéteur, il est sur `*`.
  Vous pouvez l’ignorer.

`region def` ajoute seulement des noms. La commande ne retire jamais ceux qui
sont déjà là : sur un répéteur déjà en service, les anciennes régions sont donc
retirées d’abord. Voir [Retirer les anciennes régions](#old-regions). Avant la
version 1.16, le micrologiciel construit la même liste un nom par ligne. Voir
[Micrologiciels plus anciens](#older-firmware).

### Comment les messages trouvent leur chemin d’une ville à l’autre { #route-discovery }

Pas besoin d’entendre chaque répéteur du trajet pour écrire à quelqu’un d’une
autre ville. Le premier message privé à un contact, avant qu’un chemin soit
connu, se répand dans le réseau avec votre **portée par défaut**. La réponse qui
indique le chemin à votre appareil compagnon revient avec la portée par défaut
**de votre contact**. Ensuite, les messages suivent le chemin enregistré et les
étiquettes ne comptent plus.

Les deux portées par défaut doivent donc être des étiquettes que les répéteurs
entre les deux relaient. Les répéteurs configurés avec l’outil en Ontario et au
Québec ont tous `onqc` : cette étiquette fonctionne entre Belleville et
Montréal, dans les deux sens. Une étiquette de région comme `ytr` s’arrête au
premier répéteur qui ne l’a pas, juste après Quinte West, et un message sans
étiquette s’arrête au premier répéteur de bordure. C’est pourquoi les appareils compagnons ont une
portée par défaut. Voir [Portées des appareils compagnons](#companions).

Il faut quand même les coordonnées de votre contact et des liaisons radio
fonctionnelles entre vous. La
[FAQ de MeshCore (en anglais)](https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md#54-q-how-does-a-node-discover-a-path-to-its-destination-and-then-use-it-to-send-messages-in-the-future-instead-of-flooding-every-message-it-sends-like-meshtastic)
explique comment les chemins sont trouvés.

## Ce que fait chaque réglage { #settings }

L’outil de configuration explique chaque commande de sa liste en une phrase.
Voici les mêmes explications, réunies au même endroit. Les exemples sont ceux
d’un répéteur à Belleville, dont la région est `ytr` (Quinte West). Votre liste
utilise votre propre ville, votre région et votre nom.

Vous collez les commandes une à la fois dans la Console de l’outil de
programmation, ou vous les envoyez depuis la Command Line du répéteur dans
l’application MeshCore. La plupart répondent `OK`. Les lignes avec des mots
entre `<` et `>` sont à taper vous-même : l’outil ne demande jamais vos mots de
passe, donc il ne peut pas les copier pour vous.

### Réglages de base

`set radio 910.525,62.5,7,5`
:   Utilise les réglages radio canadiens : 910,525 MHz, 62,5 kHz, facteur d’étalement 7, taux de codage 5. Tous les appareils des environs doivent avoir les mêmes.

`set radio 910.425,62.5,7,5`
:   Utilise les réglages radio de BC Mesh : 910,425 MHz, 62,5 kHz, facteur d’étalement 7, taux de codage 5. Tous les appareils des environs doivent avoir les mêmes.

    L’outil demande quels réglages utiliser seulement là où un groupe local,
    comme BC Mesh en Colombie-Britannique, a les siens.

Quand vous envoyez les commandes depuis votre téléphone, la ligne radio est
retirée : changer les réglages radio depuis votre téléphone couperait la
connexion que vous utilisez.

`set name Belleville_R1`
:   Le nom que les autres voient.

    Lettres, chiffres, `_` et `-`, sans espaces.

`set lat 44.1628`
:   Place le répéteur sur les cartes près de la localité (Belleville), pas à son endroit exact. Cette ligne règle la latitude.

`set lon -77.3832`
:   Cette ligne règle la longitude, pour que les cartes le placent près de la localité (Belleville).

    Décochez l’option de carte dans l’outil, et ces deux lignes disparaissent.

`password <votre nouveau mot de passe administrateur>`
:   Règle le mot de passe administrateur qui vous servira à le gérer depuis l’application. Gardez-le dans votre gestionnaire de mots de passe.

`password <votre nouveau mot de passe administrateur>`, sur un répéteur déjà en service
:   Change le mot de passe administrateur. Si vous sautez cette ligne, le répéteur conserve l’actuel. Gardez le nouveau dans votre gestionnaire de mots de passe.

### Réglages de MeshCore Canada

L’outil donne ces quatre réglages à chaque répéteur, pour que les répéteurs du
réseau se comportent tous de la même façon. Une *annonce* (advert) est la façon
dont un appareil signale aux autres qu’il existe. Ces réglages s’enregistrent
d’eux-mêmes.

`set path.hash.mode 2`
:   Utilise des identifiants de répéteur plus longs (3 octets) dans la liste des répéteurs par lesquels un message est passé, pour que moins de répéteurs partagent le même identifiant.

`set advert.interval 240`
:   S’annonce toutes les 4 heures aux répéteurs qui l’entendent directement.

`set flood.advert.interval 47`
:   S’annonce dans l’ensemble du réseau maillé toutes les 47 heures.

`set flood.max 16`
:   Ne relaie jamais un message après 16 sauts (chaque répéteur qui le relaie compte pour un saut).

### Portées

Les lignes de portée d’un répéteur de ville de Belleville, avec le
micrologiciel 1.16 ou plus récent :

`region def ytr|* on|* onqc|* can|* na`
:   Relaie les messages qui portent une de ces étiquettes : Quinte West (ytr), Ontario (on), Ontario + Québec (onqc), Canada (can) et Amérique du Nord (na).

`region allowf *`
:   Relaie aussi les messages sans étiquette, comme le fait un répéteur de ville.

`region denyf *`
:   Ne relaie pas les messages sans étiquette, pour qu’ils restent dans leur région. C’est ce qui en fait un répéteur de bordure.

    Un répéteur de bordure reçoit cette ligne au lieu de `region allowf *`.

`region default ytr`
:   Ajoute l’étiquette ytr aux annonces de ce répéteur.

`region save`
:   Enregistre les réglages de région.

### Sauvegarder un répéteur en service { #back-up }

Un répéteur déjà en service a une identité : sa clé privée. Les autres appareils
le reconnaissent par cette clé, et elle ne peut pas être recréée si elle est
perdue. Avant de le programmer, sauvegardez-le :

1. Notez son nom et son mot de passe administrateur.
2. Branchez-le par USB, ouvrez la Console dans
   l’[outil de programmation MeshCore](https://flasher.meshcore.io/), envoyez
   `get prv.key` et gardez la réponse dans votre gestionnaire de mots de passe.
   Ça ne fonctionne que par USB.
3. Ne l’effacez jamais dans l’outil de programmation.

Si la programmation l’efface quand même, par exemple quand vous passez au
micrologiciel d’observateur, remettez la clé dans la Console avec `set prv.key`
suivi de la clé sauvegardée, puis `reboot`. Les deux commandes figurent dans la
[référence des commandes MeshCore (en anglais)](https://docs.meshcore.io/cli_commands/#view-or-change-this-nodes-identity-private-key).

Ne partagez jamais la clé privée : quiconque l’a peut se faire passer pour votre
répéteur.

### Retirer les anciennes régions { #old-regions }

Un répéteur déjà en service peut encore avoir des régions d’une ancienne
configuration. `region def` ne les retire pas : la liste de l’outil les retire
donc d’abord.

`region`
:   Affiche les régions qu’il a maintenant. Collez la réponse dans l’outil de configuration pour retirer les anciennes.

`region remove ott`
:   Retire l’ancienne région ott.

`region home ytr`
:   Fait de ytr sa région d’attache, puisque son ancienne région d’attache est retirée.

    Cette ligne n’apparaît que si le symbole `^` de la région d’attache était sur une des anciennes régions.

L’outil retire d’abord les noms les plus en retrait et ne retire jamais `*`. Si
`region remove` répond `Err - not empty`, un autre nom est encore en retrait
sous celui-ci : retirez-le d’abord, puis réessayez. `Err - not found` veut dire
qu’il est déjà retiré; ce n’est pas grave.

Depuis l’application, une longue réponse peut être tronquée. Si la liste semble
coupée, ou si le répéteur a beaucoup de régions, lancez plutôt `region` par USB,
dans la Console de l’outil de programmation.

### Micrologiciels plus anciens { #older-firmware }

À partir de la version 1.16, le micrologiciel construit toute la liste avec une
seule ligne `region def`. Les versions plus anciennes ajoutent un nom par ligne :
ces lignes se répètent donc pour chaque étiquette.

**Micrologiciel 1.15 :**

`region put ytr`
:   Relaie les messages qui portent l’étiquette Quinte West (ytr).

**Micrologiciel 1.14 :**

`region put ytr`
:   Ajoute Quinte West (ytr) à sa liste de régions. Il ne relaie pas ces messages avant sa ligne `region allowf`.

`region allowf ytr`
:   Relaie les messages qui portent l’étiquette Quinte West (ytr).

La version 1.14 n’a pas de `region default` : les annonces du répéteur restent
donc sans étiquette. La mise à jour en vaut la peine. Avant la version 1.14, les
réglages de région ne fonctionnent pas : mettez d’abord le micrologiciel à jour.

### Répéteur observateur

Ces lignes concernent seulement un répéteur observateur.

`set mqtt.iata YTR`
:   Indique à live.meshcore.ca de quelle région viennent ses rapports.

    C’est le code de la région, en majuscules.

`set wifi.powersave none`
:   Garde le Wi-Fi éveillé pour que les rapports ne soient pas retardés.

`set mqtt1.preset meshcore-ca-1`
:   Envoie ses rapports au serveur principal de MeshCore Canada. Remplace ce qui se trouve dans l’emplacement MQTT 1, la première de ses connexions de serveur enregistrées.

`set mqtt2.preset meshcore-ca-2`
:   Envoie aussi ses rapports au serveur de secours de MeshCore Canada. Remplace ce qui se trouve dans l’emplacement MQTT 2, la deuxième de ses connexions de serveur enregistrées.

    Si cette carte envoie déjà ses rapports à un autre réseau dans ces
    emplacements, utilisez plutôt Configure via USB dans l’outil de
    programmation des observateurs pour mettre MeshCore Canada dans des
    emplacements libres (3 à 6).

`set mqtt.status on`
:   Envoie un court rapport d’état à la connexion, puis régulièrement, pour que live.meshcore.ca l’affiche en ligne.

`set mqtt.packets on`
:   Rapporte les paquets (messages radio) qu’il entend. C’est l’essentiel de ce qu’il envoie aux serveurs.

`set mqtt.raw off`
:   N’envoie pas en plus une copie brute de chaque paquet. Les serveurs n’en ont pas besoin.

`set mqtt.rx on`
:   Inclut les paquets qu’il reçoit par radio.

`set mqtt.tx advert`
:   Parmi les paquets qu’il envoie lui-même, ne rapporte que ses propres annonces.

`set bridge.enabled on`
:   Active l’envoi par Wi-Fi. C’est l’interrupteur principal de tout ce qu’il rapporte.

`set repeat on`
:   Relaie aussi les messages, comme un répéteur complet.

`set repeat off`
:   Écoute seulement : ne relaie jamais de messages.

`advert`
:   S’annonce tout de suite, pour que les appareils à proximité le voient sans attendre.

`set wifi.ssid <nom de votre Wi-Fi>`
:   Votre réseau Wi-Fi 2,4 GHz. Tapez son nom exactement, sans guillemets.

`set wifi.pwd <mot de passe de votre Wi-Fi>`
:   Le mot de passe de votre Wi-Fi. Ne le collez jamais dans un endroit partagé.

### Pour terminer

`reboot`
:   Redémarre pour que tous les réglages prennent effet.

Après le redémarrage, l’outil propose quelques vérifications, comme `ver` et
`region`. Elles affichent seulement ses réglages. La seule exception est
`clock sync`, qui règle son horloge : après un redémarrage, son horloge est
souvent fausse, et les téléphones peuvent ignorer ses annonces tant qu’elle
n’est pas réglée.

### Détection des boucles { #loop-detection }

L’outil ne change pas ce réglage. À partir de la version 1.14, le micrologiciel
peut rejeter les paquets qui repassent sans cesse par le même répéteur, ce qui
peut calmer une avalanche de paquets répétés. Changez-le seulement avec les
opérateurs de votre secteur : notez la valeur actuelle avec `get loop.detect`,
réglez-la, par exemple, avec `set loop.detect moderate`, et remettez l’ancienne
valeur si des messages commencent à se perdre. Consultez la
[référence des commandes MeshCore (en anglais)](https://docs.meshcore.io/cli_commands/#view-or-change-this-nodes-loop-detection).

## Répéteur de ville ou de bordure { #city-or-edge }

Un répéteur de bordure entend régulièrement des répéteurs d’une autre région,
par exemple entre Belleville et Kingston. Tous les autres sont des répéteurs de
ville, même en périphérie. Les répéteurs de bordure empêchent les messages sans
étiquette de déborder dans la région voisine.

La différence, c’est ce qu’ils font des messages sans étiquette :

- **Un répéteur de ville les relaie** (`region allowf *`), pour que les gens des
  environs qui n’ont pas réglé de portée soient quand même entendus.
- **Un répéteur de bordure ne les relaie pas** (`region denyf *`). Il a aussi
  les codes des régions voisines qu’il entend, pour que les messages étiquetés
  pour l’un ou l’autre côté passent.

Belleville, répéteur de ville :

```text
region def ytr|* on|* onqc|* can|* na
region allowf *
region default ytr
```

Belleville, répéteur de bordure qui entend aussi Kingston (`ygk`) :

```text
region def ytr|* ygk|* on|* onqc|* can|* na
region denyf *
region default ytr
```

### Pourquoi c’est important

Sans répéteurs de bordure, chaque message sans étiquette se répandrait de ville
en ville dans tout le réseau et occuperait les ondes partout. Les répéteurs de
bordure gardent ces échanges locaux dans leur région, tandis que les messages
étiquetés vont aussi loin que leur étiquette le permet.

### Mon répéteur est-il un répéteur de bordure?

- **Être près d’une limite ne suffit pas.** Ce qui compte, ce sont les
  répéteurs qu’il entend régulièrement.
- **Vérifiez ses voisins sur [MeshMapper](https://meshmapper.net/).** Cliquez
  sur votre répéteur pour voir les répéteurs qu’il entend, avec la fréquence et
  la date des derniers échanges sur chaque liaison. Plusieurs voisins dans une
  autre région, entendus souvent et récemment, en font un répéteur de bordure.
  Une seule liaison vue quelques fois, ou pas depuis des semaines, ne compte pas.
- **Les villes qui partagent un code forment une seule région.** Ottawa et
  Gatineau sont toutes deux dans `yow` : un répéteur entre les deux est un
  répéteur de ville.
- **Réfléchissez bien si c’est le seul répéteur du secteur.** Un répéteur de
  bordure ne relaie pas les messages des gens des environs qui n’ont pas réglé
  de portée.
- **Tous les répéteurs qui relient les deux mêmes régions devraient être des
  répéteurs de bordure.** Sinon, les messages sans étiquette contournent la
  bordure en passant par celui qui ne l’est pas.

Un répéteur de bordure liste les régions voisines qu’il entend régulièrement. Il
relaiera aussi les messages étiquetés pour celles-ci. Elles sont facultatives :
sans elles, il relaie quand même `on`, `onqc` et les autres étiquettes plus
larges.

### Étiquettes partagées avec les États-Unis { #cross-border-scopes }

Certains répéteurs sont reliés à un réseau des États-Unis. Pour eux, l’outil
propose des étiquettes de plus :

- **`onny`**, une étiquette partagée Ontario–New York, pour un répéteur de ville
  ou de bordure en Ontario.
- **Les réseaux américains voisins**, pour les répéteurs de bordure : l’Ouest de
  l’État de New York, la Pennsylvanie et l’Ohio depuis l’Ontario; Washington et
  l’Oregon depuis la Colombie-Britannique.

Cochez-en un seulement si ce répéteur est relié à ce réseau et que ses
opérateurs sont d’accord. Dans le doute, laissez-les décochés.

### Encore trop de bruit?

Si les messages sans étiquette restent trop nombreux dans une région, les
répéteurs peuvent aussi limiter leur parcours avec `set flood.max.unscoped 3`.
Les messages étiquetés gardent la limite de 16 sauts. L’outil n’ajoute pas
cette ligne : utilisez-la seulement si les opérateurs de votre secteur sont
d’accord.

## Portées des appareils compagnons { #companions }

Votre appareil compagnon met une portée sur ce que vous envoyez. Chaque canal
peut avoir la sienne, et tout le reste utilise votre **portée par défaut**.

!!! note "Réglez dès maintenant votre portée par défaut"
    Les répéteurs configurés avec l’[outil de configuration de meshcore.ca](index.md)
    relaient les messages selon leur portée. Les répéteurs de bordure ne
    relaient pas les messages sans portée : sans portée par défaut, vos
    messages risquent de ne pas dépasser votre secteur.

    - **Ontario ou Québec :** utilisez `onqc`.
    - **Ailleurs :** utilisez le code de votre province, comme `ns` ou `bc`,
      sauf si votre communauté a convenu d’autre chose.

Dans l’application MeshCore, version 1.43 ou plus récente, ce réglage se trouve
sous **Settings → Network Settings → Default Region Scope**. Le
[guide de l’appareil compagnon](../start/companion.md#regler-votre-portee-par-defaut)
montre chaque étape avec des captures d’écran.

**Pourquoi `onqc`?** On ne peut pas donner sa propre portée à un seul message
privé. Le premier message à un contact utilise votre portée par défaut, et la
réponse qui établit le chemin utilise celle de votre contact (voir
[Comment les messages trouvent leur chemin d’une ville à l’autre](#route-discovery)).
`onqc` est relayée dans les deux provinces : elle fonctionne donc entre
n’importe quelles villes de l’Ontario et du Québec. Ailleurs, aucune étiquette
n’est partagée entre provinces : le code de votre province est donc la plus
large en usage. N’utilisez pas encore `can` ni `na`.

### Donner une portée à un canal

Un canal sans portée propre utilise votre portée par défaut. Pour donner sa
propre portée à un canal, ouvrez-le, touchez **⋮**, choisissez
**Set Region Scope** et choisissez l’étiquette. Si elle n’est pas dans la liste,
ajoutez-la d’abord avec **+**.

| Canal | Portée |
| --- | --- |
| `Public` | `onqc` en Ontario et au Québec; le code de votre province ailleurs |
| Canaux de test, comme `#testing` | Votre région, par exemple `ytr` |
| Canaux de robots, comme `#bots` | Votre région |
| Vos propres canaux | Votre région, votre province ou `onqc`, selon l’entente entre les personnes qui les utilisent |

Les messages avec portée sont un peu plus courts : l’application permet moins
de caractères par message. Sur `Public`, la limite est passée de 137 à 127
caractères lors de nos essais.

### Robots et MeshMapper { #bots-and-meshmapper }

Les robots et [MeshMapper](https://meshmapper.net/) utilisent l’étiquette de
leur région, comme `ytr`, pour que leurs messages restent dans leur secteur.

- **Robots :** sur l’appareil compagnon du robot, réglez **Default Region
  Scope** sur le code de votre région, de la même façon que ci-dessus. Réglez
  aussi sur votre région les canaux où il publie.
- **MeshMapper :** utilisez le code de votre région comme portée pour ses
  messages.

Un message étiqueté ne passe que par les répéteurs qui ont son étiquette :
vérifiez donc que les répéteurs autour de vous ont été configurés avec elle.

## Régions initiales { #starter-regions }

Là où MeshMapper n’a pas encore de zone, MeshCore Canada comble le vide avec une
région initiale. Les régions initiales utilisent de vrais codes d’aéroport et
fonctionnent comme les autres régions, mais **ce ne sont pas des zones
MeshMapper, et elles ne garantissent aucune couverture radio**. La carte les
trace avec des contours dorés en pointillé. Vérifiez auprès des opérateurs de
votre secteur avant de vous y fier.

| Secteur | Région | Origine du code |
| --- | --- | --- |
| Île-du-Prince-Édouard | `yyg` | [Charlottetown](https://flyyyg.com/) |
| Terre-Neuve | `yyt` | [Saint-Jean](https://stjohnsairport.com/) |
| Labrador | `yyr` | [Happy Valley–Goose Bay](https://goosebayairport.com/) |
| Yukon | `yxy` | [Whitehorse](https://yukonairports.ca/contact-information) |
| Territoires du Nord-Ouest | `yzf` | [Yellowknife](https://tc.canada.ca/fr/aviation/exploitation-aeroports-aerodromes/liste-aeroports-appartenant-transports-canada) |
| Nunavut | `yfb` | [Iqaluit](https://tc.canada.ca/fr/aviation/exploitation-aeroports-aerodromes/liste-aeroports-appartenant-transports-canada) |

Dans les autres provinces, ces pôles comblent les espaces restants :

| Province | Régions initiales |
| --- | --- |
| C.-B. | `ylw` Kelowna, `yxs` Prince George, `yxt` Terrace, `yxc` Cranbrook |
| Alb. | `ymm` Fort McMurray, `yqu` Grande Prairie |
| Sask. | `yxe` Saskatoon, `yqr` Regina |
| Man. | `ybr` Brandon, `yth` Thompson, `yyq` Churchill |
| Ont. | `ysb` Sudbury, `yam` Sault-Sainte-Marie, `yts` Timmins, `yqk` Kenora |
| Qc | `yvo` Val-d’Or, `yzv` Sept-Îles, `yvp` Kuujjuaq |
| N.-B. | `yqm` Moncton, `yfc` Fredericton |
| N.-É. | `yqi` Yarmouth |

Les terres qu’aucune région ne couvre vont au centre régional le plus proche
dans leur province : une région MeshMapper ou un des pôles ci-dessus.

Un répéteur à Charlottetown a `yyg`, `pe`, `can` et `na`; un répéteur à
Whitehorse a `yxy`, `yt`, `can` et `na`. Ni l’un ni l’autre n’utilise `onqc`.
L’[outil de configuration](index.md) donne les commandes.

### Extensions proposées { #planning-extensions }

Un espace juste à côté d’une région MeshMapper peut reprendre son code comme
**extension proposée**. Par exemple, le point `43.8678, -81.2619` près de
Wingham est dans `ykf`, pas dans `ysb` (Sudbury). Goderich est dans `yxu`, et
Kincardine dans `ylk`.

Les extensions sont des surfaces distinctes en pointillé sur la carte. Elles ne
changent pas les zones de MeshMapper, et la carte indique quel genre de surface
contient votre point. Comme les régions initiales, elles doivent être revues
localement et ne représentent pas la couverture radio mesurée.

Les régions initiales et les extensions sont de grands points de départ, pas la
promesse que des villes éloignées peuvent s’entendre. Les zones de MeshMapper
ont toujours priorité : demandez dans [MeshMapper](https://meshmapper.net/)
l’ajout ou la modification d’une zone. Pour proposer un changement à une région
initiale ou à une extension, [envoyez une proposition communautaire](../submit-idea.md).

Les contours suivent les limites des provinces et des territoires de
Statistique Canada. Le Labrador correspond aux divisions de recensement 10 et
11; Terre-Neuve couvre le reste de la province.

## Sources

- [MeshMapper](https://meshmapper.net/) et l’onglet **Données régionales** de la carte
- [Référence des commandes MeshCore (en anglais)](https://docs.meshcore.io/cli_commands/)
- [Sources et licences](../assets/regions/NOTICE.txt)
