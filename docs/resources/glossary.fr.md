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
last_reviewed: 2026-07-22
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
    locaux ou dans le configurateur.

**JSON Web Token (JWT)**
:   Un identifiant à durée limitée utilisé par certains services de données de
    MeshCore Canada. Traitez-le comme un renseignement sensible.

**Largeur de bande**
:   Un paramètre radio LoRa qui détermine la partie du spectre utilisée par une
    transmission. Utilisez la valeur indiquée dans vos paramètres locaux ou
    dans le configurateur.

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
:   Une radio ou un service sur un système hôte qui écoute le trafic MeshCore
    et transmet des données du réseau aux outils publics. Il ne relaie pas le
    trafic du réseau.

**Préréglage**
:   Un ensemble nommé de paramètres radio.

**Rapport signal-bruit (SNR)**
:   Une mesure qui compare un signal reçu au bruit de fond.

**Répéteur**
:   Un appareil MeshCore normalement fixe qui relaie les paquets afin
    d’améliorer la couverture du réseau.

**Serveur de salon (Room Server)**
:   Un appareil MeshCore qui garde un salon partagé accessible aux appareils
    compagnons. Sa fonction principale est d’héberger le salon, et non
    d’améliorer la couverture.

**Serveur MQTT (broker)**
:   Un service qui reçoit et distribue des messages au moyen du protocole MQTT.

## T-W

**Taux de codage (CR)**
:   Un paramètre LoRa de correction des erreurs. Utilisez la valeur indiquée
    dans vos paramètres locaux ou dans le configurateur.



**WebSocket**
:   Une connexion Web de longue durée. Certains clients MQTT utilisent
    WebSocket pour joindre un serveur MQTT par les voies réseau Web habituelles.

## Pages connexes

- [Comparer les types d’appareils MeshCore](../start/choose-a-goal.md)
- [Lire les questions fréquentes](../meshcore/general-faq.md)
- [Consulter la norme sur les régions](../config/standard.md)
- [Choisir une méthode d’observation](../analyzer/intro.md)
