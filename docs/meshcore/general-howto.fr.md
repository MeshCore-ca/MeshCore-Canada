---
title: Effectuer les tâches courantes dans l’application MeshCore
description: Partagez ou importez un contact, tracez un parcours et examinez les répétitions reçues dans l’application MeshCore.
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

# Effectuer les tâches courantes dans l’application MeshCore

Choisissez la tâche dont vous avez besoin. Ces captures d’écran montrent une
version de l’interface de l’application mobile MeshCore; les noms et les
emplacements peuvent changer dans une autre version.

- [Partager votre lien de contact](#share-your-contact-link)
- [Importer un lien de contact](#import-a-contact-link)
- [Tracer un parcours](#trace-a-path)
- [Vérifier les répétitions reçues](#check-heard-repeats)

<div class="mc-preflight" markdown>

**Avant de commencer**

- Connectez l’application à votre compagnon.
- Confirmez que le compagnon peut envoyer et recevoir des messages localement.
- Ne publiez aucune clé privée, aucun mot de passe ni aucun emplacement privé
  précis dans une capture d’écran partagée.

</div>

## Partager votre lien de contact { #share-your-contact-link }

Utilisez cette procédure lorsqu’une autre personne veut vous ajouter comme
contact.

1. Ouvrez l’application MeshCore et connectez-la à votre compagnon.

2. Ouvrez l’écran **Signal**.

    ![Commande Signal dans l’application MeshCore](images/MeshCore_GetContactID1.png){ loading=lazy width="300" }

3. Sélectionnez **Advert**, puis **To Clipboard**.

    ![Menu Advert avec l’action To Clipboard](images/MeshCore_GetContactID2.png){ loading=lazy width="300" }

4. Collez le lien de contact dans la conversation où vous souhaitez le partager.

<div class="mc-result" data-state="success" markdown>

Le presse-papiers contient maintenant un lien de contact qu’une autre personne
utilisant MeshCore peut importer.

</div>

## Importer un lien de contact { #import-a-contact-link }

Utilisez cette procédure après qu’une autre personne vous a envoyé son lien de
contact MeshCore.

1. Copiez uniquement le lien de contact, puis connectez l’application à votre compagnon.

2. Ouvrez le menu **à trois points**.

    ![Menu à trois points de l’application MeshCore](images/MeshCore_AddContactMan1.png){ loading=lazy width="300" }

3. Sélectionnez **Add Contact**.

    ![Action « Add Contact » de l’application MeshCore](images/MeshCore_AddContactMan2.png){ loading=lazy width="300" }

4. Sélectionnez **Import from Clipboard Link**.

    ![Action « Import from Clipboard Link » de l’application MeshCore](images/MeshCore_AddContactMan3.png){ loading=lazy width="300" }

5. Attendez le message de réussite et l’avis de nouveau contact.

    ![Message confirmant l’importation du contact](images/MeshCore_AddContactMan5.png){ loading=lazy width="300" }

<div class="mc-result" data-state="success" markdown>

Le contact nommé apparaît maintenant dans votre liste de contacts.

</div>

Si l’importation échoue, copiez de nouveau le lien d’origine sans ajouter de
mots ni de signes de ponctuation. Si le problème persiste, demandez un nouveau
lien à la personne qui vous l’a envoyé.

## Tracer un parcours { #trace-a-path }

Un traçage manuel vérifie la suite de répéteurs que vous choisissez. Il ne
garantit pas que les messages suivants emprunteront le même parcours.

### Ouvrir l’outil de traçage

1. Connectez l’application à votre compagnon.
2. Ouvrez le menu **à trois points**.

    ![Menu à trois points de l’application MeshCore](images/MeshCore_TraceRoute1.png){ loading=lazy width="300" }

3. Sélectionnez **Tools**.

    ![Action « Tools » de l’application MeshCore](images/MeshCore_TraceRoute2.png){ loading=lazy width="300" }

4. Sélectionnez **Trace Path - Manual**.

    ![Action de traçage manuel du parcours](images/MeshCore_TraceRoute3.png){ loading=lazy width="300" }

5. Sélectionnez le bouton **plus** pour ajouter un répéteur.

    ![Bouton d’ajout d’un répéteur dans l’outil de traçage manuel](images/MeshCore_TraceRoute4.png){ loading=lazy width="300" }

### Tracer un parcours par un seul répéteur

1. Ajoutez un répéteur et assurez-vous que son identifiant est exact.

    ![Un répéteur sélectionné pour le traçage](images/MeshCore_TraceRoute1Hop1.png){ loading=lazy width="300" }

    ![Parcours à un saut prêt à être tracé](images/MeshCore_TraceRoute1Hop2.png){ loading=lazy width="300" }

2. Sélectionnez **Trace Path**.

### Tracer un parcours par plusieurs répéteurs

1. Ajoutez les répéteurs dans l’ordre aller requis par le parcours.
2. Ajoutez la suite de retour indiquée dans le plan de parcours local.

    ![Plusieurs répéteurs sélectionnés pour le traçage](images/MeshCore_TraceRoute2Hop1.png){ loading=lazy width="300" }

3. Vérifiez la suite complète, puis sélectionnez **Trace**.

    ![Parcours à plusieurs sauts prêt à être tracé](images/MeshCore_TraceRoute2Hop2.png){ loading=lazy width="300" }

4. Lisez le résultat.

    ![Résultat d’un traçage à plusieurs sauts](images/MeshCore_TraceRoute2Hop3.png){ loading=lazy width="300" }

Si vous ne connaissez pas les suites aller et retour, demandez à la communauté
locale plutôt que de deviner les identifiants des répéteurs.

## Vérifier les répétitions reçues { #check-heard-repeats }

Une répétition reçue signifie que votre compagnon a reçu une copie répétée d’un
paquet qu’il a envoyé. L’absence d’une répétition n’indique pas à elle seule où
le paquet s’est arrêté : le répéteur peut ne pas avoir reçu le paquet, ou votre
compagnon peut ne pas avoir reçu la copie répétée.

1. Envoyez un message dans le canal voulu.
2. Lorsque **Heard _n_ repeats** apparaît sous le message, maintenez le doigt
   sur celui-ci.

    ![Message affichant le nombre de répétitions reçues](images/MeshCore_HeardRepeats_Step1.png){ loading=lazy width="300" }

3. Sélectionnez **Heard Repeats**.

    ![Action « Heard Repeats » de l’application MeshCore](images/MeshCore_HeardRepeats_Step2.png){ loading=lazy width="300" }

4. Examinez les répéteurs que votre compagnon a reçus pour ce paquet.

    ![Liste des répéteurs reçus par le compagnon](images/MeshCore_HeardRepeats_Step3.png){ loading=lazy width="300" }

5. Sélectionnez un répéteur pour examiner le parcours indiqué.

### Exemple : répétition directe

![Schéma d’une répétition directe reçue](images/MeshCore_HeardRepeats_Direct.png){ loading=lazy width="300" }

![Affichage d’une répétition directe reçue dans l’application](images/MeshCore_HeardRepeats_Step4_1Repeat.png){ loading=lazy width="300" }

### Exemple : répétition à plusieurs sauts

![Schéma d’une répétition reçue à plusieurs sauts](images/MeshCore_HeardRepeats_MultiHop.png){ loading=lazy width="300" }

![Affichage d’une répétition reçue à plusieurs sauts dans l’application](images/MeshCore_HeardRepeats_Step4_2Repeat.png){ loading=lazy width="300" }

## Besoin d’aide?

Si un résultat manque ou n’est pas clair, comparez-le avec un nœud fiable situé
à proximité, puis consultez [Obtenir de l’aide](../start/get-help.md). Indiquez
la tâche et l’étape où vous vous êtes arrêté, mais retirez les données sensibles
avant de partager une capture d’écran.
