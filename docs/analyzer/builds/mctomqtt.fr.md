---
title: Observer avec MCtoMQTT
description: Transmettez les paquets d’une radio USB à partir d’un ordinateur Linux ou macOS qui reste en fonction.
audience:
  - observer-operators
  - service-operators
task: configure-mctomqtt-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 30 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
---

# Observer avec MCtoMQTT

MCtoMQTT lit les paquets d’une radio MeshCore connectée par USB et les publie à
partir d’un hôte Linux ou macOS qui reste en fonction.

## Cette méthode vous convient-elle?

<div class="mc-method-fit">
  <div><strong>Utilisez MCtoMQTT si</strong>Un ordinateur Linux ou macOS reste près d’une radio de journalisation des paquets connectée par USB.</div>
  <div><strong>Choisissez autre chose si</strong>RemoteTerm, Home Assistant ou PyMC gère déjà la radio.</div>
  <div><strong>Gardez en fonction</strong>La radio, la connexion USB, le service de l’hôte et la connexion Internet.</div>
</div>

L’outil d’assistance peut aussi configurer `meshcore-packet-capture` pour un
compagnon relié par BLE, liaison série ou TCP.

## Avant de commencer { #before-you-start }

| Exigence | Vérification |
|---|---|
| Radio | La journalisation des paquets fonctionne par USB et les paramètres du réseau local sont exacts |
| Hôte | Linux ou macOS pour `meshcoretomqtt`; Windows est pris en charge uniquement pour la capture d’un compagnon |
| Accès | Vous pouvez lire la configuration actuelle et redémarrer le service |
| Emplacement | Un véritable [code d’emplacement](../iata-codes.md) à trois lettres |
| Outils | `curl`, un afficheur de texte et `systemctl` sous Linux |

!!! warning "Examinez le script avant de l’exécuter"
    Ces outils d’assistance ne sont liés ni à une version précise ni à une somme de contrôle. Téléchargez-les et examinez-les avant de les exécuter. L’option `--no-restart` écrit quand même des fichiers; ce n’est pas une simulation.

Fichiers à examiner :

- [Source de l’outil Bash](https://github.com/MeshCore-ca/MeshCore-Canada/blob/main/docs/analyzer/scripts/add-meshcore-ca-broker.sh)
- [Outil Bash publié](https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh)
- [Source de l’outil PowerShell pour compagnon](https://github.com/MeshCore-ca/MeshCore-Canada/blob/main/docs/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1)

## Ce qui sera modifié

Sur un hôte à liaison série, l’outil :

- écrit `/etc/mctomqtt/config.d/20-meshcore-ca.toml`;
- crée une copie horodatée `.bak.<timestamp>` si ce fichier existe;
- ajoute les points de terminaison principal et de secours de MeshCore Canada ainsi que le code d’emplacement;
- redémarre `mctomqtt`, sauf si l’option `--no-restart` est utilisée.

Pour la capture d’un compagnon, il met à jour
`~/.meshcore-packet-capture/.env.local`, crée une sauvegarde horodatée,
configure les emplacements 1 et 2, désactive les emplacements 3 à 6 et peut
redémarrer le service de capture.

Les options d’installation téléchargent et exécutent des programmes
d’installation distincts provenant des projets d’origine. Ne les utilisez pas
avant d’avoir aussi examiné le programme nommé.

## Configuration

### 1. Télécharger et examiner l’outil

```bash
workdir="$(mktemp -d)"
curl -fsSLo "$workdir/add-meshcore-ca-broker.sh" https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh
less "$workdir/add-meshcore-ca-broker.sh"
```

Vérifiez l’URL source, les chemins modifiés, les hôtes des points de
terminaison, le comportement de sauvegarde et le comportement de redémarrage.
Conservez le fichier pour le reste de la configuration.

### 2. Écrire sans redémarrer

Remplacez `YOW` par le véritable code d’emplacement le plus près de
l’observateur :

```bash
bash "$workdir/add-meshcore-ca-broker.sh" --device serial-host --iata YOW --no-restart
```

L’outil valide la forme du code, rejette `XXX`, affiche un avertissement pour
les codes absents de sa courte liste et indique les chemins modifiés et
sauvegardés.

### 3. Examiner le résultat

```bash
sudo sed -n '1,220p' /etc/mctomqtt/config.d/20-meshcore-ca.toml
```

Confirmez que :

- le code d’emplacement est exact;
- l’hôte principal et son audience sont `mqtt1.meshcore.ca`;
- l’hôte de secours et son audience sont `mqtt2.meshcore.ca`;
- le port est `443`, le transport est WebSockets et la validation TLS est activée.

Ne collez pas le fichier complet dans un billet public sans l’avoir examiné.

### 4. Redémarrer volontairement

```bash
sudo systemctl restart mctomqtt
sudo systemctl status mctomqtt --no-pager
```

Le service devrait demeurer actif sans erreurs TLS ou d’authentification
répétées.

### Exécuter directement après l’examen

Après avoir examiné la version actuellement publiée de l’outil, vous pouvez
exécuter directement ce même fichier :

```bash
bash <(curl -fsSL https://meshcore.ca/analyzer/scripts/add-meshcore-ca-broker.sh) --device serial-host --iata YOW
```

La méthode de téléchargement présentée plus haut facilite l’examen et la
récupération.

### Nouvelle installation

L’option `--install-mctomqtt` télécharge et exécute le programme d’installation
du projet `meshcoretomqtt`. Examinez d’abord ce programme, puis ajoutez
l’option :

```bash
bash "$workdir/add-meshcore-ca-broker.sh" --device serial-host --iata YOW --install-mctomqtt
```

Le programme d’installation du projet d’origine contrôle le choix du port série
et les modifications de paquets. Il n’est lié ici ni à une version ni à une
somme de contrôle.

## Capture d’un compagnon

Réglez d’abord la radio du compagnon selon les paramètres du réseau maillé
local.

=== "Linux ou macOS"

    Examinez le même outil Bash, puis exécutez :

    ```bash
    bash "$workdir/add-meshcore-ca-broker.sh" --device companion --iata YOW --no-restart
    ```

    Examinez `~/.meshcore-packet-capture/.env.local`, puis redémarrez votre
    processus de capture.

=== "Windows PowerShell"

    Téléchargez et examinez l’outil avant de l’exécuter :

    ```powershell
    $helper = Join-Path $env:TEMP "add-meshcore-ca-packetcapture-broker.ps1"
    Invoke-WebRequest https://meshcore.ca/analyzer/scripts/add-meshcore-ca-packetcapture-broker.ps1 -OutFile $helper
    Get-Content $helper
    powershell -NoProfile -ExecutionPolicy Bypass -File $helper -Iata YOW
    ```

    L’outil PowerShell modifie
    `%USERPROFILE%\.meshcore-packet-capture\.env.local` et crée une sauvegarde.
    Son option d’installation facultative exécute un programme d’installation
    provenant d’un autre projet; examinez-le d’abord.

Il n’existe pas de programme d’installation Windows documenté pour
`meshcoretomqtt` dans le cas d’un hôte série de journalisation des paquets.

## Ce que vous devriez voir

Le service demeure actif, le point de terminaison principal se connecte et son
nombre de paquets change lorsque la radio capte du trafic à proximité.

## Vérifier dans CoreScope { #check-in-corescope }

1. Confirmez que le service demeure actif.
2. Trouvez l’observateur dans [CoreScope Observers](https://live.meshcore.ca/#/observers).
3. Attendez de l’activité normale à proximité.
4. Confirmez la présence d’un paquet récent dans [CoreScope Packets](https://live.meshcore.ca/#/packets).

Terminez avec [Vérifier votre observateur](../verify.md). Un service en fonction
ou une connexion au courtier ne confirme pas que les paquets se sont rendus à
CoreScope.

## Récupération { #recovery }

Utilisez le chemin exact de la sauvegarde affiché par l’outil.

Si un fichier de configuration complémentaire pour l’hôte série existait déjà :

```bash
sudo cp -- '/etc/mctomqtt/config.d/20-meshcore-ca.toml.bak.<timestamp>' '/etc/mctomqtt/config.d/20-meshcore-ca.toml'
sudo systemctl restart mctomqtt
```

Si l’outil a créé un nouveau fichier complémentaire et qu’aucun fichier
n’existait auparavant :

```bash
sudo rm -- '/etc/mctomqtt/config.d/20-meshcore-ca.toml'
sudo systemctl restart mctomqtt
```

Pour la capture d’un compagnon, restaurez la sauvegarde
`.env.local.bak.<timestamp>` indiquée par-dessus `.env.local`, conservez ses
permissions, puis redémarrez le processus de capture.

L’outil ne désinstalle pas les logiciels ajoutés par une option d’installation
externe. Utilisez la procédure de désinstallation vérifiée du projet d’origine.

## Si la vérification échoue

Consultez le [dépannage](../troubleshooting.md). Partagez uniquement un court
état de service caviardé et la liste des chemins modifiés.
