---
title: Tâches courantes dans l’application MeshCore
description: Partagez ou importez un contact, tracez un parcours et vérifiez les répétitions reçues dans l’application MeshCore.
audience:
  - companion-user
  - meshcore-user
task: use-meshcore-app-tools
scope: upstream-meshcore
status: draft
owner: docs-app
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: beginner
estimated_time: 5-15 minutes
destructive: false
---

# Tâches courantes dans l’application MeshCore

Des guides étape par étape pour les tâches les plus courantes dans l’application
mobile MeshCore.

- [Envoyer votre premier message](#send-your-first-message)
- [Partager votre lien de contact](#share-your-contact-link)
- [Importer un lien de contact](#import-a-contact-link)
- [Tracer un parcours](#trace-a-path)
- [Vérifier les répétitions reçues](#check-heard-repeats)

## Envoyer votre premier message { #send-your-first-message }

1. Ouvrez l’application et connectez-vous à votre compagnon.
2. Ouvrez le canal **Public**, ou celui de votre communauté.
3. Envoyez un bref bonjour et demandez une réponse.

**Heard X repeats** sous votre message signifie qu’un répéteur l’a capté. Une
réponse confirme que la messagerie fonctionne dans les deux sens.

## Partager votre lien de contact { #share-your-contact-link }

1. Ouvrez l’application MeshCore et connectez-vous à votre nœud.
2. Touchez l’icône **Signal**.

    ![Icône Signal dans l’application MeshCore](images/MeshCore_GetContactID1.png){ loading=lazy width="300" }

3. Touchez **Advert → To Clipboard**.

    ![Menu Advert avec l’option To Clipboard](images/MeshCore_GetContactID2.png){ loading=lazy width="300" }

4. Collez votre lien de contact là où vous voulez le partager.

## Importer un lien de contact { #import-a-contact-link }

1. Ouvrez l’application et connectez-vous à votre nœud.
2. Touchez les **trois points**.

    ![Menu à trois points dans l’application MeshCore](images/MeshCore_AddContactMan1.png){ loading=lazy width="300" }

3. Touchez **Add Contact**.

    ![Option Add Contact](images/MeshCore_AddContactMan2.png){ loading=lazy width="300" }

4. Touchez **Import from Clipboard Link**.

    ![Option Import from Clipboard Link](images/MeshCore_AddContactMan3.png){ loading=lazy width="300" }

5. Après quelques secondes, vous verrez **« Success - contact has been imported »**.

    ![Message confirmant l’importation du contact](images/MeshCore_AddContactMan5.png){ loading=lazy width="300" }

6. Une deuxième fenêtre apparaît : **« New Contact Discovered &lt;NOM&gt; »**.
7. Le contact est ajouté.

## Tracer un parcours { #trace-a-path }

### Un seul saut

1. Ouvrez l’application et connectez-vous.
2. Touchez les **trois points**.

    ![Menu à trois points dans l’application MeshCore](images/MeshCore_TraceRoute1.png){ loading=lazy width="300" }

3. Touchez **Tools**.

    ![Option Tools dans l’application MeshCore](images/MeshCore_TraceRoute2.png){ loading=lazy width="300" }

4. Touchez **Trace Path - Manual**.

    ![Option Trace Path - Manual](images/MeshCore_TraceRoute3.png){ loading=lazy width="300" }

5. Touchez le **bouton plus**.

    ![Bouton plus de l’outil de traçage manuel](images/MeshCore_TraceRoute4.png){ loading=lazy width="300" }

6. Sélectionnez un répéteur et confirmez.

    ![Un répéteur sélectionné pour un traçage](images/MeshCore_TraceRoute1Hop1.png){ loading=lazy width="300" }

7. Vous verrez un identifiant de répéteur : c’est un **traçage à un saut**.

    ![Parcours à un saut prêt à tracer](images/MeshCore_TraceRoute1Hop2.png){ loading=lazy width="300" }

8. Touchez **Trace Path**.

### Deux sauts ou plus

1. Suivez les étapes 1 à 5 ci-dessus.
2. Sélectionnez les répéteurs **dans l’ordre** :
    - choisissez le **parcours aller** et confirmez;
    - rouvrez le menu d’ajout et choisissez le **parcours retour**;
    - ou tapez vous-même les identifiants, par exemple `d3, f3, d3`.

    ![Plusieurs répéteurs sélectionnés pour un traçage](images/MeshCore_TraceRoute2Hop1.png){ loading=lazy width="300" }

3. Confirmez les parcours aller et retour, puis touchez **Trace**.

    ![Parcours à plusieurs sauts prêt à tracer](images/MeshCore_TraceRoute2Hop2.png){ loading=lazy width="300" }

4. Consultez les résultats.

    ![Résultat d’un traçage à plusieurs sauts](images/MeshCore_TraceRoute2Hop3.png){ loading=lazy width="300" }

## Vérifier les répétitions reçues { #check-heard-repeats }

Quand vous envoyez un message, il se rend à un répéteur proche, qui le répète.
Si votre compagnon capte cette répétition, elle compte comme une **répétition
reçue**. Votre compagnon peut en manquer, par exemple :

- votre message atteint le répéteur, mais la répétition ne vous revient pas;
- vous utilisez un compagnon de 1 W et le répéteur est de 0,3 W : vous
  l’atteignez, mais vous êtes peut-être trop loin pour capter sa répétition.

1. Envoyez un message dans le canal Public.
2. Quand **Heard X repeats** apparaît sous votre message, maintenez le doigt sur le message.

    ![Message affichant le nombre de répétitions reçues](images/MeshCore_HeardRepeats_Step1.png){ loading=lazy width="300" }

3. Touchez **Heard Repeats**.

    ![Option Heard Repeats](images/MeshCore_HeardRepeats_Step2.png){ loading=lazy width="300" }

4. Vous verrez chaque répéteur que votre compagnon a entendu répéter ce message.

    ![Liste des répéteurs captés par le compagnon](images/MeshCore_HeardRepeats_Step3.png){ loading=lazy width="300" }

5. Touchez un répéteur pour voir le parcours de sa répétition jusqu’à vous.

**Notes :**

- Un répéteur proche peut apparaître comme un **saut direct**.
- Vous pouvez aussi voir un **répéteur éloigné**. Cela arrive quand il capte
  votre message peu après un autre répéteur et que votre compagnon entend les
  deux répétitions.
- Votre compagnon doit capter un répéteur *directement* pour qu’il apparaisse
  dans la liste.

### Exemple : répétition directe

![Schéma d’une répétition reçue directement](images/MeshCore_HeardRepeats_Direct.png){ loading=lazy width="300" }

![Vue de l’application pour une répétition directe](images/MeshCore_HeardRepeats_Step4_1Repeat.png){ loading=lazy width="300" }

### Exemple : répétition à plusieurs sauts

Un répéteur capte votre message et le répète, puis votre compagnon capte la
répétition de ce même message par un deuxième répéteur :

![Schéma d’une répétition à plusieurs sauts](images/MeshCore_HeardRepeats_MultiHop.png){ loading=lazy width="300" }

![Vue de l’application pour une répétition à plusieurs sauts](images/MeshCore_HeardRepeats_Step4_2Repeat.png){ loading=lazy width="300" }

Besoin d’aide? [Obtenez de l’aide](../start/get-help.md).
