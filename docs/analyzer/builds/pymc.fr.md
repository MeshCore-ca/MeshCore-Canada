---
title: Observer avec PyMC
description: Transmettez à CoreScope les paquets d’un service de répéteur PyMC déjà en fonction.
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
  - assets/styles/analyzer.css?v=20260722-2
---

# Observer avec PyMC

Ajoutez les points de terminaison principal et de secours de MeshCore Canada à
un service de répéteur PyMC que vous exploitez déjà.

## Cette méthode vous convient-elle?

<div class="mc-method-fit">
  <div><strong>Utilisez PyMC si</strong>Un service de répéteur PyMC fonctionnel gère déjà la radio.</div>
  <div><strong>Choisissez autre chose si</strong>Vous installeriez Python et PyMC uniquement pour observer le trafic.</div>
  <div><strong>Gardez en fonction</strong>L’hôte PyMC, le service, la connexion radio et l’accès Internet.</div>
</div>

## Vérifier votre installation

Cette procédure vise un service systemd Linux nommé `pymc-repeater` dont la
configuration se trouve dans `/etc/pymc_repeater/config.yaml`. Confirmez la
version, le nom du service, le chemin et le format de configuration avant toute
modification. Si les chemins diffèrent, ou si vous utilisez macOS ou Windows,
suivez la documentation de la version de PyMC installée.

## Avant de commencer { #before-you-start }

- [ ] PyMC fonctionne correctement avant le changement.
- [ ] Vous connaissez les véritables chemins du service et de sa configuration.
- [ ] La radio utilise les paramètres du réseau maillé local.
- [ ] Vous avez choisi un véritable [code d’emplacement](../iata-codes.md).
- [ ] Vous pouvez restaurer une copie de sauvegarde appartenant à `root`.

Notez l’état actuel du service :

```bash
sudo systemctl status pymc-repeater --no-pager
sudo cp -- /etc/pymc_repeater/config.yaml /etc/pymc_repeater/config.yaml.pre-meshcore-ca
```

## Ce qui sera modifié

Vous modifierez la configuration YAML de PyMC et redémarrerez le service. Le
changement ajoute un code d’emplacement et deux entrées de courtier chiffrées
et authentifiées par jeton; il ne modifie pas le micrologiciel de la radio.

## Configuration

Dans `/etc/pymc_repeater/config.yaml`, définissez le code d’emplacement dans
`mqtt` :

```yaml
mqtt:
  iata_code: YOW
```

Remplacez `YOW` par le véritable code le plus près de l’observateur.

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

## Ce que vous devriez voir

Le service demeure actif sans erreur YAML, TLS ou de jeton, et son nombre de
paquets change lorsque la radio capte du trafic à proximité.

## Vérifier dans CoreScope { #check-in-corescope }

1. Trouvez l’observateur dans [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Attendez de l’activité normale à proximité.
3. Confirmez la présence d’un paquet récent dans [CoreScope Packets](https://live.meshcore.ca/#/packets).

Terminez avec [Vérifier votre observateur](../verify.md). Un service systemd en
bon état ne confirme pas que les paquets se sont rendus à CoreScope.

## Récupération { #recovery }

Restaurez exactement la sauvegarde créée avant la modification :

```bash
sudo cp -- /etc/pymc_repeater/config.yaml.pre-meshcore-ca /etc/pymc_repeater/config.yaml
sudo systemctl restart pymc-repeater
sudo systemctl status pymc-repeater --no-pager
```

Conservez le fichier défectueux en privé s’il peut servir au diagnostic. Ne le
publiez pas sans d’abord retirer les renseignements secrets et personnels.

## Si la vérification échoue

Consultez le [dépannage](../troubleshooting.md). Indiquez la version de PyMC, le
nom du service, la première étape qui a échoué et un court extrait caviardé du
journal.
