---
title: Vérifier une configuration MeshCore
description: Vérifiez si un appareil compagnon, un répéteur, un serveur de salon ou un observateur accomplit sa première tâche.
audience:
  - first-time-user
  - meshcore-operator
task: verify-first-success
scope: canada-baseline
status: verified
owner: docs-ux
last_reviewed: 2026-07-22
review_by: 2026-10-19
tested_with:
  content_baseline: f608cfe
difficulty: beginner
estimated_time: 5-10 minutes
destructive: false
---

# Vérifier votre configuration

Un appareil allumé ou un état « Connected » ne garantit pas que la
configuration est terminée. Effectuez la vérification qui correspond à votre
appareil.

Avant l’essai, confirmez que l’appareil affiche toujours les paramètres du
Canada ou ceux de votre communauté.

## Appareil compagnon { #companion }

1. Redémarrez l’appareil après le dernier changement de paramètres radio.
2. Envoyez une annonce.
3. Demandez à une personne à proximité, avec un appareil dont le bon
   fonctionnement a été confirmé, de vérifier si l’annonce apparaît.
4. Échangez un message d’essai lorsqu’une autre personne est disponible.

!!! success "Le compagnon est prêt"
    Un appareil fiable à proximité voit l’annonce et les deux appareils peuvent
    échanger un message d’essai.

Si l’annonce n’apparaît pas, comparez les paramètres radio et les chemins avant
de réinstaller le micrologiciel.

## Répéteur { #repeater }

1. Gardez le répéteur accessible sur l’établi.
2. Redémarrez-le et confirmez que les paramètres prévus sont toujours présents.
3. Envoyez une annonce à partir du répéteur.
4. Confirmez qu’un appareil compagnon fiable à proximité la reçoit.
5. Recommencez la vérification après tout changement d’antenne, d’alimentation
   ou d’installation.

!!! success "Le répéteur est prêt"
    Le répéteur conserve ses paramètres et un appareil compagnon fiable à
    proximité reçoit son annonce.

Ne l’installez pas dans un endroit difficile d’accès avant que l’essai sur
l’établi soit réussi.

## Serveur de salon { #room-server }

1. Redémarrez le serveur de salon.
2. Envoyez son annonce.
3. Confirmez qu’un appareil compagnon à proximité le découvre.
4. Entrez dans le salon avec les identifiants d’accès des invités.
5. Confirmez que l’administrateur peut toujours y accéder pour l’entretenir.

!!! success "Le serveur de salon est prêt"
    Un appareil compagnon découvre le salon et l’accès des invités fonctionne
    sans exposer les identifiants de l’administrateur.

## Observateur { #observer }

1. Créez de l’activité MeshCore à proximité avec un appareil fiable.
2. Confirmez que la radio de l’observateur utilise les mêmes paramètres.
3. Ouvrez [CoreScope Observers](https://live.meshcore.ca/#/observers).
4. Trouvez votre observateur et vérifiez son activité récente.
5. Consultez [Vérifier votre observateur](../analyzer/verify.md) pour effectuer
   la vérification complète.

!!! success "L’observateur fonctionne"
    Votre observateur apparaît dans CoreScope et affiche une activité récente
    après une transmission à proximité.

Une connexion au serveur MQTT ne suffit pas à confirmer que tout fonctionne.

## Si une vérification échoue

Si la vérification réussit, vous avez terminé. Sinon,
[obtenez de l’aide](get-help.md) et indiquez ce qui manque.
