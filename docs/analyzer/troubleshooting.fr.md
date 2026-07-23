---
title: Dépanner un observateur
description: Trouvez où votre observateur a cessé de fonctionner et demandez de l’aide sans dévoiler de renseignements secrets.
audience:
  - observer-operators
task: troubleshoot-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: intermediate
estimated_time: 15 minutes
destructive: false
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Dépanner un observateur

Commencez par ce que vous pouvez constater. Modifiez un seul élément à la fois
pour savoir ce qui a réglé le problème.

## L’observateur n’apparaît jamais { #observer-never-appears }

Vérifiez les éléments suivants dans l’ordre :

1. **Radio :** confirmez qu’elle est alimentée, connectée à la méthode d’observation et réglée selon le réseau maillé local.
2. **Appareil ou service :** confirmez que le processus de l’observateur fonctionne.
3. **Courtier :** confirmez que le point de terminaison principal indique une connexion avec validation TLS.
4. **Affichage :** attendez quelques minutes, actualisez [CoreScope Observers](https://live.meshcore.ca/#/observers), puis recherchez le nom exact de l’observateur.

Ces commandes consultent seulement l’état des services :

=== "MCtoMQTT"

    ```bash
    sudo systemctl status mctomqtt --no-pager
    sudo journalctl -u mctomqtt -n 80 --no-pager
    ```

=== "Capture du compagnon"

    ```bash
    sudo systemctl status meshcore-capture --no-pager
    sudo journalctl -u meshcore-capture -n 80 --no-pager
    ```

=== "PyMC"

    ```bash
    sudo systemctl status pymc-repeater --no-pager
    sudo journalctl -u pymc-repeater -n 80 --no-pager
    ```

Avant de partager les résultats, suivez les consignes de la section
[Quoi transmettre lorsque vous demandez de l’aide](#what-to-share-when-asking-for-help).

Pour un micrologiciel autonome, exécutez seulement ces commandes de lecture
dans l’interface en ligne de commande de l’appareil :

```text
get name
get wifi.status
get mqtt.iata
get mqtt.status
get mqtt1.preset
get mqtt2.preset
get path.hash.mode
```

Vous devriez voir la connexion Wi-Fi et au moins le courtier principal
connectés, un code d’emplacement à trois lettres ainsi que les préréglages
`meshcore-ca-1` et `meshcore-ca-2`.

## L’observateur apparaît, mais aucun paquet n’arrive { #observer-appears-but-no-packets-arrive }

Une connexion au courtier ne confirme pas la transmission des paquets.

1. Confirmez que la radio capte l’activité normale du réseau maillé à proximité.
2. Confirmez que la publication des paquets est activée pour la méthode choisie.
3. Confirmez que le code d’emplacement et le sujet des paquets concordent.
4. Consultez [CoreScope Packets](https://live.meshcore.ca/#/packets) après de l’activité à proximité.

| Méthode | Paramètre de paquets |
|---|---|
| Micrologiciel MQTT | `get mqtt.packets` indique `on`, `get bridge.enabled` indique `on` et `get mqtt.rx` indique `on` |
| MCtoMQTT / capture du compagnon | Le sujet des paquets se termine par `/packets`, et non seulement par `/status` |
| PyMC | Le champ `format` du courtier est `letsmesh` |
| Home Assistant | **Payload Mode** est réglé à `packet`, ou l’ancien réglage **Packets (Lets Mesh)** est activé |
| RemoteTerm | Le sujet de paquets Community MQTT est activé |

Si la radio ne reçoit aucun paquet, vérifiez d’abord le préréglage radio,
l’antenne, la connexion et l’activité locale. Ne modifiez les paramètres du
courtier qu’après ces vérifications.

## Seule la connexion de secours échoue { #only-the-backup-connection-fails }

Comparez les deux entrées. L’hôte de secours et l’audience du jeton doivent être
`mqtt2.meshcore.ca`. Un jeton destiné à l’hôte principal ne peut pas
s’authentifier auprès de l’hôte de secours.

Ne désactivez pas la validation TLS pour réussir la connexion.

## L’observateur apparaît au mauvais endroit { #observer-appears-in-the-wrong-place }

Vérifiez chaque champ d’emplacement configuré. Utilisez le même véritable
[code d’emplacement](iata-codes.md) à trois lettres dans les deux entrées du
courtier et dans la méthode d’observation.

N’utilisez pas :

- `CAN` comme abréviation du Canada;
- `XXX` ou `HOME`;
- un code voisin simplement parce qu’un ancien sélecteur n’affiche pas le bon code.

Mettez l’intégration à jour si elle n’accepte pas le bon code.

## L’observateur se connecte et se déconnecte sans arrêt { #observer-connects-and-disconnects-repeatedly }

Vérifiez, dans cet ordre :

1. la stabilité de l’alimentation et de la connexion USB;
2. la mise en veille de l’hôte ou les redémarrages du service;
3. la stabilité d’Internet et du DNS;
4. l’exactitude de l’horloge système;
5. les erreurs répétées de jeton, de TLS ou de WebSocket dans les journaux locaux.

Notez l’heure et le fuseau horaire d’une déconnexion. Un administrateur pourra
ainsi comparer votre signalement aux journaux de l’infrastructure sans que vous
ayez à dévoiler vos identifiants.

## L’écran de Home Assistant ne correspond pas au guide { #home-assistant-screen-does-not-match-the-guide }

Les écrans actuels utilisent **Payload Mode** et un champ d’emplacement en texte
libre. Les anciens écrans peuvent plutôt afficher **Packets (Lets Mesh)** et un
sélecteur.

Mettez l’intégration à jour avant de choisir un mauvais emplacement. Si l’écran
actuel diffère encore, notez les versions de Home Assistant et de l’intégration
MeshCore, puis demandez de l’aide.

## Quoi transmettre lorsque vous demandez de l’aide { #what-to-share-when-asking-for-help }

Copiez ce modèle et remplissez les renseignements que vous connaissez. Conservez
les libellés anglais pour faciliter le triage :

```text
Observer method:
Device or board:
Operating system / Home Assistant version:
Observer app, integration, or firmware version:
Location code:
Time checked (with time zone):
First thing that failed: radio / observer / broker / viewer
Primary connected: yes / no / unknown
Backup connected: yes / no / not supported
Observer visible: yes / no
Recent packet visible: yes / no
Exact error after redaction:
Steps already tried:
```

Avant de le publier, retirez :

- le nom du réseau Wi-Fi et son mot de passe;
- les mots de passe MQTT, JWT, jetons, témoins et en-têtes d’autorisation;
- les clés privées MeshCore;
- le courriel du responsable et ses coordonnées personnelles;
- les adresses résidentielles ou coordonnées exactes;
- les lignes sans rapport provenant de fichiers de configuration complets.

Publiez le tout sur le [forum de MeshCore Canada](https://forum.meshcore.ca/) ou
le canal de soutien de votre communauté locale. N’incluez que le court extrait
du journal qui montre le problème.

Retournez à [Vérifier votre observateur](verify.md) après chaque correction.
