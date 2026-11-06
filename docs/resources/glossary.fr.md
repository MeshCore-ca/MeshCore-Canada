---
title: Glossaire MeshCore
description: Trouvez des définitions simples des appareils MeshCore, des paramètres radio, des chemins et des données du réseau.
audience:
  - newcomer
  - meshcore-user
task: define-meshcore-term
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-11-02
review_by: 2027-01-19
evidence: Existing MeshCore Canada documentation terminology
difficulty: beginner
estimated_time: 2-10 minutes
destructive: false
---

# Glossaire MeshCore

Utilisez la commande **Rechercher** de votre navigateur pour aller directement
à un terme. Les définitions sont courtes; les guides liés expliquent comment
utiliser chaque paramètre ou appareil.

## A-C

**Annonce (Advert)**
:   Un paquet d’annonce MeshCore qui permet aux nœuds à proximité de découvrir
    un appareil et son chemin. Les applications peuvent afficher le terme
    anglais **Advert**.

**Appareil compagnon (Companion)**
:   Un appareil MeshCore personnel qui sert à envoyer et à recevoir des
    messages. Il se connecte souvent à une application et ne relaie pas le
    trafic du réseau.

**Bande industrielle, scientifique et médicale (ISM)**
:   Une partie du spectre radio utilisée par de nombreux appareils de faible
    puissance. Son utilisation légale dépend tout de même du lieu, du matériel
    et des conditions d’exploitation.

**Code de localisation**
:   Un code court qui regroupe les données des observateurs par secteur.
    Certains guides parlent d’un code IATA parce qu’ils utilisent des codes
    d’aéroport de trois lettres.

**CoreScope**
:   Les outils publics de MeshCore Canada qui permettent de consulter les
    observateurs, les paquets, les nœuds et les données cartographiques.

## F-M

**Facteur d’étalement (SF)**
:   Un paramètre LoRa qui influence le temps d’occupation des ondes, le débit
    de données et la réception. Utilisez la valeur indiquée dans vos paramètres
    locaux ou dans l’[outil de configuration](../config/index.md).

**JSON Web Token (JWT)**
:   Un identifiant à durée limitée utilisé par certains services de données de
    MeshCore Canada. Traitez-le comme un renseignement sensible.

**Largeur de bande**
:   Un paramètre radio LoRa qui détermine la partie du spectre utilisée par une
    transmission. Utilisez la valeur indiquée dans vos paramètres locaux ou
    dans l’[outil de configuration](../config/index.md).

**LoRa**
:   La modulation radio longue portée et faible puissance utilisée par les
    appareils MeshCore.

**Maillage**
:   Un réseau dans lequel les appareils pris en charge peuvent relayer le
    trafic au lieu de dépendre d’une seule radio centrale.

**Message Queuing Telemetry Transport (MQTT)**
:   Un protocole de publication et d’abonnement utilisé par les observateurs
    pour transmettre des données du réseau aux outils publics.

**Micrologiciel**
:   Le logiciel installé sur un appareil. Un micrologiciel MeshCore est conçu
    pour une carte et une fonction précises.

**Mode de hachage des chemins**
:   Le paramètre MeshCore qui détermine la taille des identifiants dans les
    chemins d’annonce. Utilisez la valeur de la configuration locale ou
    canadienne actuelle.

## N-S

**Nœud**
:   Tout appareil MeshCore présent sur le réseau.

**Observateur**
:   Une radio ou un service qui transmet des données MeshCore aux outils publics.
    L’observation et la répétition sont des fonctions distinctes; un appareil peut faire les deux.

**Portée (region scope)**
:   Une portée est une étiquette sur un message qui indique jusqu’où il doit
    aller. Vous réglez une portée par défaut sur votre appareil compagnon, et
    chaque canal peut avoir la sienne. Voir
    [Les portées et les régions](../config/guide.md#scopes-and-regions).

**Préréglage**
:   Un ensemble nommé de paramètres radio.

**Rapport signal-bruit (SNR)**
:   Une mesure qui compare un signal reçu au bruit de fond.

**Région**
:   Le secteur que dessert un répéteur, nommé d’après le code d’aéroport le plus
    proche. Une liste de régions, ce sont les étiquettes qu’un répéteur accepte
    de relayer. Voir
    [Les portées et les régions](../config/guide.md#scopes-and-regions).

**Répéteur**
:   Un appareil MeshCore normalement fixe qui relaie les paquets afin
    d’améliorer la couverture du réseau.

**Répéteur de bordure**
:   Un répéteur qui entend régulièrement des répéteurs d’une autre région, par
    exemple entre Belleville et Kingston. Il ne relaie pas les messages sans
    étiquette, pour qu’ils ne débordent pas dans la région voisine. Voir
    [Répéteur de ville ou de bordure](../config/guide.md#city-or-edge).

**Répéteur de ville**
:   Un répéteur qui relaie les messages sans étiquette, pour que les gens des
    environs qui n’ont pas réglé de portée soient quand même entendus. Tout
    répéteur qui n’est pas de bordure est un répéteur de ville. Voir
    [Répéteur de ville ou de bordure](../config/guide.md#city-or-edge).

**Répéteur observateur**
:   Un répéteur qui rapporte aussi ce qu’il entend à live.meshcore.ca, pour que
    tout le monde puisse voir l’état du réseau. Il lui faut le Wi-Fi, donc une
    carte ESP32. Voir
    [Ce qu’est un répéteur observateur](../config/guide.md#repeater-observers).

**Serveur de salon (Room Server)**
:   Un appareil MeshCore qui garde un salon partagé accessible aux appareils
    compagnons. Sa fonction principale est d’héberger le salon, et non
    d’améliorer la couverture.

**Serveur MQTT (broker)**
:   Un service qui reçoit et distribue des messages au moyen du protocole MQTT.

## T-W

**Taux de codage (CR)**
:   Un paramètre LoRa de correction des erreurs. Utilisez la valeur indiquée
    dans vos paramètres locaux ou dans l’[outil de configuration](../config/index.md).



**WebSocket**
:   Une connexion Web de longue durée. Certains clients MQTT utilisent
    WebSocket pour joindre un serveur MQTT par les voies réseau Web habituelles.

## Pages connexes

- [Comparer les types d’appareils MeshCore](../start/index.md)
- [Lire les questions fréquentes](../meshcore/general-faq.md)
- [Comprendre les répéteurs](../config/guide.md)
- [Choisir une méthode d’observation](../analyzer/intro.md)
