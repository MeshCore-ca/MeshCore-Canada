---
title: Changer l’identifiant d’un répéteur dans une ancienne région à identifiant sur 1 octet
description: Coordonnez, sauvegardez, modifiez, vérifiez et restaurez l’identité d’un répéteur uniquement lorsqu’une ancienne région l’exige.
audience:
  - legacy-region-operator
  - repeater-maintainer
task: change-legacy-repeater-id
scope: legacy
status: legacy
status_notice: false
owner: docs-firmware
last_reviewed: 2026-07-22
review_by: 2026-10-17
difficulty: advanced
estimated_time: 15-30 minutes
destructive: true
requires:
  - local-region-approval
  - trusted-serial-connection
  - secure-key-storage
page_styles:
  - assets/styles/devices-builds.css?v=20260722-2
---
# Changer l’identifiant d’un répéteur dans une ancienne région à identifiant sur 1 octet

!!! warning "Réservé aux anciennes régions à identifiant sur 1 octet"
    Au Canada, les hachages de parcours utilisent 3 octets par défaut. Continuez uniquement si la personne responsable de votre région a confirmé que ce répéteur doit rester en mode 1 octet et a approuvé le nouvel identifiant.

## Ce qui sera modifié

Changer la clé privée change l’identité du nœud. Cette opération peut rompre les relations existantes d’administration, de contact et de suivi. L’ancienne clé est le seul moyen de rétablir l’identité précédente.

## Préalables et sauvegarde

1. Confirmez auprès de la personne responsable de la région que le répéteur doit rester en mode 1 octet et qu’un nouvel identifiant est nécessaire.
2. Connectez-vous au répéteur et notez sa clé publique actuelle avec `get public.key`.
3. À l’aide d’une connexion série fiable, sauvegardez la clé privée actuelle avec `get prv.key`, puis conservez-la comme secret dans un endroit sécurisé.
4. Confirmez que l’identifiant proposé de 2 à 6 caractères n’est pas déjà utilisé dans le registre de coordination de la région.

Ne publiez et ne transmettez jamais une clé privée dans un billet, une capture d’écran, une discussion publique ou un journal. La clé privée précédente que vous avez sauvegardée est votre seul moyen de revenir en arrière.

## Générer et appliquer la clé

1. Ouvrez le [générateur de clés MeshCore](https://gessaman.com/mc-keygen/).
2. Entrez l’identifiant inutilisé de 2 à 6 caractères approuvé localement, puis sélectionnez **Generate Key**.
3. Confirmez que la clé privée produite est une valeur hexadécimale de 64 caractères.
4. Copiez-la directement dans la console fiable du répéteur, sans l’enregistrer dans une note ordinaire ni dans une discussion.
5. Exécutez la commande suivante en remplaçant le texte indicatif par la valeur produite :

    ```text
    set prv.key <PRIVATE-KEY>
    ```

6. Redémarrez le répéteur.

## Vérifier et restaurer

Après le redémarrage, exécutez `get public.key` et confirmez que son préfixe correspond à l’identifiant approuvé localement. Vérifiez de nouveau l’accès administrateur, les réglages radio, la configuration de la région, les annonces et l’acheminement local avant de remettre le répéteur en service.

Si la vérification échoue, restaurez l’ancienne clé privée sauvegardée avec `set prv.key <OLD-PRIVATE-KEY>`, redémarrez l’appareil, puis confirmez que la clé publique et les accès d’origine sont rétablis.

## Récupération

Si l’accès administrateur, le préfixe de la clé publique, les annonces, la configuration de la région ou l’acheminement sont incorrects, gardez le répéteur sur l’établi. Restaurez l’ancienne clé privée sauvegardée au moyen de la connexion série fiable, redémarrez l’appareil, puis confirmez que tout son état précédent est rétabli avant de le remettre en service.

## Consigner le changement

Consignez l’identifiant approuvé localement, l’approbation de la personne responsable, les anciens et nouveaux préfixes de clé publique, le résultat de la vérification et l’emplacement de la sauvegarde, sans inscrire aucune des clés privées dans le dossier d’entretien public.

## Limites de la vérification

Cette procédure n’a pas été testée avec le micrologiciel actuel. Faites-la examiner par la personne responsable de la région avant de l’utiliser.
