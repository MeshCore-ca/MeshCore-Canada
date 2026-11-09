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
last_reviewed: 2026-11-02
review_by: 2026-12-31
evidence:
  - https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md
  - https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579
  - Bilingual answers checked against the IATA configurator and linked setup guides on 2026-10-29; no hardware testing.
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# FAQ MeshCore

## Généralités

??? question "Quels réglages radio MeshCore utilise-t-il au Canada?"
    Choisissez le préréglage **Canada** dans l’application. Il règle les valeurs
    radio canadiennes et des parcours de **3 octets**; le préréglage distinct
    **USA** utilise les mêmes valeurs radio, mais ne modifie pas le réglage des
    parcours ([annonce du préréglage](https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579)). Les valeurs figurent dans le tableau
    des [réglages par défaut du Canada](../index.md#canada-baseline).

    Consultez toujours votre page du [répertoire des communautés](../provinces/index.md)
    au cas où un réseau voisin utiliserait d’autres réglages.

??? question "Qu’est-ce que le mode de hachage des parcours à 3 octets?"
    Les messages MeshCore transportent de courts identifiants de répéteurs le long
    de leur parcours. MeshCore Canada recommande des identifiants de **3 octets** :
    les grands réseaux de répéteurs obtiennent beaucoup plus d’identifiants
    uniques qu’avec l’ancien réglage de 1 octet. Dans la ligne de commande MeshCore :

    ```text
    set path.hash.mode 2
    ```

    Les répéteurs dont le micrologiciel est antérieur à 1.14 ne peuvent pas relayer
    les parcours de 2 ou 3 octets. Plus de détails dans la [FAQ officielle](https://github.com/meshcore-dev/MeshCore/blob/main/docs/faq.md#39-q-what-is-multibyte-support-what-do-1-byte-2-byte-3-byte-adverts-and-messages-mean) (en anglais).

??? question "Ai-je besoin d’un certificat de radioamateur?"
    MeshCore Canada ne peut pas donner d’avis juridique. La plupart des
    communautés MeshCore canadiennes supposent une utilisation LoRa exempte de
    licence dans la bonne bande ISM, mais vous êtes responsable des fréquences,
    de la puissance, des antennes et du cycle d’utilisation légaux là où vous êtes.

    Si vous exploitez une station de radioamateur ou de l’équipement non standard,
    consultez les [règles actuelles d’ISDE](../resources/links.md#radio-and-regulatory-references)
    avant d’émettre.

??? question "À quelle portée m’attendre?"
    La portée dépend beaucoup de l’antenne, de la hauteur, du relief, des
    obstacles, du bruit et de la ligne de vue. Un appareil portatif à l’intérieur
    peut ne couvrir qu’un quartier; un répéteur extérieur bien placé, avec une vue
    dégagée, peut couvrir beaucoup plus.

    Pour dépanner, comparez avec un nœud fiable à proximité avant de soupçonner
    le micrologiciel.

## Matériel

??? question "Quels appareils fonctionnent avec MeshCore?"
    Utilisez les appareils proposés dans le [programme de mise à jour MeshCore](https://meshcore.io/flasher)
    ou dans un guide de MeshCore Canada pour le rôle voulu. Consultez
    [Choisir du matériel](../hardware/index.md).

    Pour un observateur, une carte LoRa Wi-Fi compatible peut servir de
    [répéteur observateur](../config/index.md?type=observer).

??? question "Puis-je utiliser mon appareil Meshtastic avec MeshCore?"
    Parfois, mais il doit être programmé avec le micrologiciel MeshCore et pris en
    charge par la version de MeshCore choisie. Un appareil sous Meshtastic ne
    rejoindra pas un réseau MeshCore.

    Sauvegardez ce qui compte avant de le reprogrammer et considérez la première
    programmation MeshCore comme une nouvelle configuration.

??? question "Quelle carte acheter en premier?"
    Pour un premier compagnon, choisissez-en un qui figure dans le programme de
    mise à jour MeshCore et qui est utilisé par la communauté près de chez vous :
    consultez [Compagnons](../hardware/recommended-companions.md). Pour un
    répéteur ou un observateur fixe, une alimentation stable, une bonne antenne et
    l’accès à distance comptent plus qu’un écran.

## Réseau

??? question "Comment rejoindre un réseau existant?"
    1. Trouvez votre page dans le [répertoire des communautés](../provinces/index.md).
    2. Choisissez le préréglage **Canada**, sauf indication contraire de la page locale.
    3. Vérifiez que les parcours sont réglés sur **3 octets**.
    4. Redémarrez l’appareil après avoir modifié les réglages radio.
    5. Envoyez une annonce et vérifiez si les personnes à proximité vous voient.

??? question "Comment lancer un nouveau réseau dans ma région?"
    Utilisez les réglages par défaut du Canada, sauf raison locale de faire
    autrement. Commencez par des compagnons, puis configurez des répéteurs avec
    l’[outil de configuration](../config/index.md), qui donne chaque commande à coller.

    Quand vous êtes prêts, [ajoutez votre communauté](../contributing.md) au
    répertoire avec sa région, son état, ses coordonnées et tout réglage différent.

??? question "Pourquoi mon observateur n’affiche-t-il aucun paquet?"
    Une connexion au serveur prouve seulement que l’observateur a atteint MQTT.
    Il peut tout de même ne rien capter si le préréglage radio ou le réglage des
    parcours est incorrect, si la publication des paquets est désactivée ou s’il
    n’y a aucun nœud actif à proximité.

    Consultez [Vérifier votre observateur](../analyzer/verify.md) et le
    [dépannage](../analyzer/troubleshooting.md) pour cerner le problème.

??? question "Où poser une autre question?"
    Consultez [Obtenir de l’aide](../start/get-help.md) : Discord et le forum
    sont les plus rapides.
