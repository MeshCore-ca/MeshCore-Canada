---
title: Observer avec PyMC
description: Transmettez à CoreScope les paquets d’un service de répéteur PyMC déjà actif.
audience:
  - observer-operators
  - service-operators
task: configure-pymc-observer
scope: canada-baseline
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 25 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20261019-1
---

# Observer avec PyMC

Ajoutez les adresses principale et de secours de MeshCore Canada à votre service
de répéteur PyMC.

## Vérifier votre installation

Cette procédure vise un service systemd Linux nommé `pymc-repeater` dont la
configuration se trouve dans `/etc/pymc_repeater/config.yaml`. Confirmez la
version, le nom du service, le chemin et le format de configuration avant toute
modification. Si les chemins diffèrent, ou si vous utilisez macOS ou Windows,
suivez la documentation de la version de PyMC installée.

## Ce qu’il vous faut { #before-you-start }

- PyMC fonctionne correctement avant le changement.
- Vous connaissez les véritables chemins du service et de sa configuration.
- La radio utilise les paramètres du réseau maillé local.
- Vous avez choisi un véritable [code d’emplacement](../iata-codes.md).
- Vous pouvez restaurer une copie de sauvegarde appartenant à `root`.

Notez l’état actuel du service :

```bash
sudo systemctl status pymc-repeater --no-pager
backup="/etc/pymc_repeater/config.yaml.pre-meshcore-ca.$(date -u +%Y%m%dT%H%M%S).$"
sudo cp --no-clobber -- /etc/pymc_repeater/config.yaml "$backup"
printf 'Backup: %s\n' "$backup"
```

## Configuration

Dans `/etc/pymc_repeater/config.yaml`, définissez le code d’emplacement dans
`mqtt` :

```yaml
mqtt:
  iata_code: YOW
```

Remplacez `YOW` par votre code sur la page [Trouver votre zone](../../config/map.md).

Sous `mqtt.brokers`, ajoutez :

```yaml
- name: MeshCore-CA
  enabled: true
  host: mqtt1.meshcore.ca
  port: 443
  transport: websockets
  format: letsmesh
  disallowed_packet_types: []
  retain_status: false
  tls:
    enabled: true
    insecure: false
  use_jwt_auth: true
  audience: mqtt1.meshcore.ca
- name: MeshCore-CA Backup
  enabled: true
  host: mqtt2.meshcore.ca
  port: 443
  transport: websockets
  format: letsmesh
  disallowed_packet_types: []
  retain_status: false
  tls:
    enabled: true
    insecure: false
  use_jwt_auth: true
  audience: mqtt2.meshcore.ca
```

N’ajoutez pas de mot de passe MQTT. Laissez le courriel facultatif du
responsable vide, sauf s’il est nécessaire à l’exploitation.

Relisez la section modifiée, puis redémarrez le service :

```bash
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Si le service échoue, consultez un court extrait du journal local :

```bash
sudo journalctl -u pymc-repeater -n 80 --no-pager
```

Examinez les résultats avant de les partager. Suivez la
[liste de caviardage](../troubleshooting.md#what-to-share-when-asking-for-help).

## Vérifier { #check-in-corescope }

Votre observateur devrait apparaître en quelques minutes dans la [liste des observateurs](https://live.meshcore.ca/?tab=Observers), avec des paquets récents dans les [Live packets](https://live.meshcore.ca/). Être connecté ne prouve pas que les paquets sont arrivés : terminez avec [Vérifier votre observateur](../verify.md). Il n’apparaît pas? Consultez le [dépannage](../troubleshooting.md).

## Récupération { #recovery }

Restaurez exactement la sauvegarde créée avant la modification :

```bash
sudo cp -- "${backup:?Set backup to the saved backup path first}" /etc/pymc_repeater/config.yaml
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Conservez le fichier défectueux en privé s’il peut servir au diagnostic. Ne le
publiez pas sans d’abord retirer les renseignements secrets et personnels.

