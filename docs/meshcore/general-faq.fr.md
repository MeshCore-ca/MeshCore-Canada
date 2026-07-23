---
title: Questions et réponses sur MeshCore
description: Trouvez des réponses brèves sur les réglages canadiens, le matériel, la portée, l’adhésion à un réseau maillé et les problèmes d’observateur.
audience:
  - newcomer
  - meshcore-user
  - mesh-operator
task: answer-meshcore-question
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
evidence:
  - Existing MeshCore Canada FAQ
  - Current configurator and setup guides
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# Questions et réponses sur MeshCore

Utilisez la commande **Rechercher** de votre navigateur pour parcourir cette
page, ou choisissez un sujet ci-dessous. Comme les réglages peuvent varier
d’un endroit à l’autre, cette page renvoie à la source actuelle plutôt que de
répéter des valeurs qui pourraient changer.

- [Réglages et portée](#settings-and-range)
- [Matériel](#hardware)
- [Rejoindre ou démarrer un réseau maillé](#joining-or-starting-a-mesh)
- [Observateurs et dépannage](#observers-and-troubleshooting)

## Réglages et portée { #settings-and-range }

### Quels réglages radio dois-je utiliser au Canada?

Pour un répéteur, utilisez le [configurateur de répéteur](../config/index.md). Il
fournit les réglages actuels pour l’emplacement choisi.

Quel que soit le rôle de l’appareil, consultez d’abord le
[répertoire des communautés](../provinces/index.md). Lorsqu’une communauté
publie des réglages locaux différents, suivez-les.

### Qu’est-ce que le mode de hachage des parcours?

Il détermine la taille des identifiants utilisés dans les parcours d’annonce.
La norme canadienne des régions et le configurateur fournissent le réglage
actuel d’un répéteur. Utilisez leur résultat plutôt que de copier une ancienne
commande provenant d’une discussion ou d’une capture d’écran.

[Lire la norme des régions](../config/standard.md).

### Dois-je détenir un certificat d’opérateur radioamateur?

MeshCore Canada ne peut pas déterminer quelle autorisation s’applique à votre
station. Vous êtes responsable de respecter les règles concernant la fréquence,
la puissance, l’antenne et l’utilisation à votre emplacement.

Commencez par les [liens canadiens sur la réglementation](../resources/links.md#radio-and-regulatory-references).
En cas de doute, consultez une personne qualifiée de votre région avant de
transmettre.

### À quelle portée puis-je m’attendre?

La portée dépend de la qualité et de l’emplacement de l’antenne, de la hauteur,
du terrain, des bâtiments, de l’interférence et de la visibilité directe.
Faites un essai avec un nœud fiable situé à proximité avant de conclure que
l’appareil ou le micrologiciel est défectueux.

## Matériel { #hardware }

### Quels appareils fonctionnent avec MeshCore?

Choisissez un appareil offert dans le programme officiel de mise à jour
MeshCore ou dans un guide de MeshCore Canada pour le rôle voulu. La prise en
charge dépend de la carte et de la cible du micrologiciel.

[Comparez les rôles des appareils](../start/choose-a-goal.md), puis ouvrez le
guide du matériel depuis le guide de configuration correspondant.

### Puis-je réutiliser un appareil qui exécute actuellement Meshtastic?

Certaines cartes prises en charge peuvent être reprogrammées avec le
micrologiciel MeshCore. Un appareil qui exécute encore le micrologiciel
Meshtastic ne peut pas rejoindre un réseau MeshCore.

Confirmez le modèle exact de la carte dans le programme officiel de mise à jour
avant de le modifier, puis sauvegardez tout ce que vous devez conserver.

### Quelle carte devrais-je acheter en premier?

Choisissez d’abord le rôle. Pour un compagnon, privilégiez un appareil pris en
charge que des membres de votre communauté connaissent déjà. Pour un service
fixe, la fiabilité de l’alimentation, l’emplacement de l’antenne et la facilité
d’entretien comptent davantage que les fonctions de l’écran.

## Rejoindre ou démarrer un réseau maillé { #joining-or-starting-a-mesh }

### Comment rejoindre un réseau maillé à proximité?

1. [Trouvez la communauté locale](../provinces/index.md).
2. Suivez ses réglages publiés ou utilisez les réglages canadiens par défaut
   lorsqu’aucun remplacement local n’est indiqué.
3. Suivez le guide correspondant au [rôle de votre appareil](../start/choose-a-goal.md).
4. Envoyez une annonce et demandez à une personne à proximité de confirmer sa réception.

### Comment démarrer un réseau maillé lorsqu’aucun n’est répertorié?

Commencez avec des compagnons pour permettre aux gens de faire des essais
locaux. Ajoutez une infrastructure fixe seulement après avoir vérifié
l’emplacement, l’alimentation, la coordination locale et la norme des régions.

Lorsque le groupe est prêt, [ajoutez la communauté](../contributing.md) afin que
d’autres personnes puissent trouver son état, ses coordonnées et tout réglage
local révisé.

## Observateurs et dépannage { #observers-and-troubleshooting }

### Pourquoi mon observateur n’affiche-t-il aucun paquet?

Une connexion au service de données ne prouve pas que la radio reçoit le trafic
à proximité. Vérifiez les réglages radio choisis, la publication des paquets,
l’activité de l’appareil et le résultat final de la vérification.

Utilisez [Vérifier votre observateur](../analyzer/verify.md), puis suivez le
[guide de dépannage de l’observateur](../analyzer/troubleshooting.md) selon le
symptôme constaté.

### Où puis-je poser une autre question?

La page [Obtenir de l’aide](../start/get-help.md) indique la façon la plus
rapide d’obtenir du soutien. Retirez les mots de passe, les clés privées, les
emplacements privés précis et toute autre donnée sensible avant de partager
des captures d’écran ou des journaux.
