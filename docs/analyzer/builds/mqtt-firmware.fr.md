---
title: Construire un observateur MQTT autonome
description: Transformez une carte LoRa Wi-Fi compatible en observateur consacré à CoreScope.
audience:
  - observer-operators
task: configure-standalone-observer
scope: experimental
status: draft
owner: meshcore-canada
last_reviewed: 2026-07-22
review_by: 2026-10-19
difficulty: advanced
estimated_time: 35 minutes
destructive: true
page_styles:
  - assets/styles/analyzer.css?v=20260722-2
page_scripts:
  - assets/javascripts/analyzer-command-builder.js?v=20260722-2
---

# Construire un observateur MQTT autonome

Un micrologiciel d’observation spécialisé permet à une carte LoRa Wi-Fi
compatible de transmettre la télémétrie des paquets à proximité sans ordinateur
hôte distinct.

## Cette méthode vous convient-elle?

<div class="mc-method-fit">
  <div><strong>Bon choix</strong>Vous pouvez consacrer une carte LoRa Wi-Fi compatible à l’observation.</div>
  <div><strong>Choisissez une autre méthode</strong>RemoteTerm, Home Assistant, PyMC ou un hôte USB à proximité gère déjà la radio.</div>
  <div><strong>Gardez en fonction</strong>La carte, une alimentation stable, le Wi-Fi 2,4 GHz et l’accès Internet.</div>
</div>

Cette méthode utilise un micrologiciel tiers. Confirmez la carte et la version
affichées par l’outil de programmation avant de poursuivre.

## Confirmer la source du micrologiciel

| Élément | Référence |
|---|---|
| Outil de programmation | [observer.gessaman.com](https://observer.gessaman.com/) |
| Branche source consignée | `mqtt-bridge-implementation-flex` |
| Révision source consignée | `c0c845f5` |
| Préréglages du courtier | `meshcore-ca-1` et `meshcore-ca-2` |

La révision indique la source utilisée lors de l’examen de ce guide; elle ne
confirme pas que l’outil en ligne utilise encore cette version. Arrêtez si
l’outil affiche une carte, une source ou une version que vous n’avez pas
vérifiée.

## Avant de commencer { #before-you-start }

!!! danger "Faites une sauvegarde avant d’activer Erase device"
    L’effacement peut supprimer la clé d’identité privée, le nom, les paramètres radio, les données régionales et toute autre configuration enregistrée. Sauvegardez la clé privée et notez la carte, le rôle, la version du micrologiciel et les paramètres. Si vous ne pouvez pas sauvegarder l’identité, arrêtez et utilisez une nouvelle carte ou demandez de l’aide.

- [ ] Confirmez que la carte exacte figure dans l’outil de programmation de l’observateur.
- [ ] Décidez si ce nœud doit relayer le trafic ou seulement l’observer.
- [ ] Sauvegardez l’identité et les paramètres actuels.
- [ ] Gardez à portée de main un câble USB de données fiable et la méthode de récupération de la carte.
- [ ] Choisissez un véritable [code d’emplacement](../iata-codes.md).

## Ce qui sera modifié

La programmation remplace le micrologiciel de la carte. La configuration
modifie ensuite son nom, les valeurs radio, le mode de hachage des chemins, le
code d’emplacement, les identifiants Wi-Fi, les préréglages du courtier, le mode
de paquets et le comportement de répétition.

Le générateur de commandes s’exécute localement dans ce navigateur. Il
n’enregistre pas les champs Wi-Fi, ne les place pas dans l’URL et ne les inclut
pas dans l’aperçu par défaut.

## Configuration

### 1. Programmer la carte

1. Ouvrez [observer.gessaman.com](https://observer.gessaman.com/).
2. Sous **MQTT Observer Firmware**, choisissez exactement la carte compatible.
3. Choisissez **Repeater** ou **Room Server**.
4. Pour une carte neuve ou volontairement réaffectée, activez **Erase device** seulement après avoir franchi l’étape de sauvegarde ci-dessus.
5. Programmez l’image fusionnée.
6. Une fois la programmation terminée, privilégiez **Configure via USB**. Utilisez **Console** uniquement pour les paramètres absents de l’écran de configuration.

L’outil devrait confirmer la fin de l’opération et la carte devrait se
reconnecter par USB.

### 2. Entrer les paramètres communs

Utilisez les paramètres du réseau maillé local. En l’absence d’une configuration
propre à la communauté, la configuration canadienne de départ est :

| Paramètre | Valeur |
|---|---|
| Préréglage radio | **USA/Canada (Recommended)** |
| Valeurs radio brutes | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| Empreintes de chemin | 3 octets (`set path.hash.mode 2`) |
| Préréglage principal | `meshcore-ca-1` |
| Préréglage de secours | `meshcore-ca-2` |
| Wi-Fi | Un réseau 2,4 GHz |

### 3. Générer les commandes

L’interface en ligne de commande n’a pas de règle générale documentée pour les
guillemets. Le générateur rejette les espaces, les guillemets, les barres
obliques inverses, les caractères de contrôle et les autres valeurs Wi-Fi
ambiguës. Utilisez **Configure via USB** pour un réseau qu’il ne peut pas
représenter de façon sûre.

<div class="mc-command-builder" id="observer-command-builder" data-location-source="../../location-codes.json">
  <div class="mc-command-grid">
    <label>
      <strong>Carte</strong>
      <select id="observer-board">
        <option value="heltec-v3">Heltec V3</option>
        <option value="heltec-v4-oled">Heltec V4 OLED</option>
        <option value="other-supported">Une autre cible affichée par l’outil de programmation</option>
      </select>
    </label>
    <label>
      <strong>Code d’emplacement</strong>
      <input id="observer-iata" list="observer-iata-list" maxlength="3" placeholder="YOW" autocomplete="off" spellcheck="false">
      <datalist id="observer-iata-list"></datalist>
    </label>
    <label>
      <strong>Rôle</strong>
      <select id="observer-role">
        <option value="Repeater">Répéteur</option>
        <option value="Room-Server">Serveur de salon</option>
      </select>
    </label>
    <label>
      <strong>Numéro du nœud</strong>
      <input id="observer-number" value="01" maxlength="16" autocomplete="off" spellcheck="false">
    </label>
    <label>
      <strong>SSID Wi-Fi</strong>
      <input id="observer-ssid" maxlength="32" autocomplete="off" spellcheck="false" aria-describedby="observer-secret-help">
    </label>
    <div class="mc-command-field">
      <label for="observer-password"><strong>Mot de passe Wi-Fi</strong></label>
      <div class="mc-secret-row">
        <input id="observer-password" type="password" maxlength="64" autocomplete="new-password" spellcheck="false" aria-describedby="observer-secret-help">
        <button type="button" id="observer-toggle-password" aria-pressed="false">Afficher</button>
      </div>
    </div>
    <label class="mc-command-field--wide">
      <strong>Trafic du réseau maillé</strong>
      <select id="observer-repeat">
        <option value="on">Observer et relayer les paquets</option>
        <option value="off">Observer seulement</option>
      </select>
    </label>
  </div>
  <p class="mc-command-notice" id="observer-location-status" aria-live="polite">Chargement des suggestions d’emplacements canadiens…</p>
  <p class="mc-command-notice" id="observer-secret-help">Le SSID et le mot de passe restent uniquement dans cette page. Ils sont effacés lorsque vous la quittez et masqués dans l’aperçu jusqu’à ce que vous choisissiez de les afficher.</p>
  <div class="mc-command-errors" id="observer-command-errors" role="alert" aria-live="assertive"></div>
  <dl class="mc-command-summary" id="observer-command-summary" aria-label="Résumé non sensible des commandes"></dl>
  <div class="mc-command-actions">
    <button type="button" id="observer-reveal-commands" aria-pressed="false" disabled>Afficher les commandes sensibles</button>
    <button type="button" id="observer-copy-commands" disabled>Copier les commandes affichées</button>
    <button type="button" id="observer-clear-secrets">Effacer les champs Wi-Fi</button>
    <span id="observer-copy-status" aria-live="polite"></span>
  </div>
  <pre aria-label="Aperçu des commandes de l’observateur"><code id="observer-command-output">Remplissez les champs obligatoires pour générer les commandes.</code></pre>
</div>

Vérifiez le résumé non sensible et l’aperçu caviardé. Affichez et copiez les
commandes uniquement sur un ordinateur de confiance. Le presse-papiers
contiendra les identifiants Wi-Fi; effacez-le après utilisation.

### Entrer les commandes à la main

Si vous préférez les entrer manuellement, définissez d’abord les valeurs non
sensibles :

```text
set name YOW-Repeater-01
set radio 910.525,62.5,7,5
set path.hash.mode 2
set mqtt.iata YOW
set wifi.powersave none
set mqtt1.preset meshcore-ca-1
set mqtt2.preset meshcore-ca-2
set mqtt3.preset none
set mqtt4.preset none
set mqtt5.preset none
set mqtt6.preset none
set mqtt.status on
set mqtt.packets on
set mqtt.raw off
set mqtt.rx on
set mqtt.tx advert
set bridge.enabled on
set repeat on
advert
```

Remplacez le nom et le code d’emplacement. Utilisez `set repeat off` pour un
nœud qui observe sans relayer.

Entrez les identifiants directement dans la console de l’appareil :

```text
set wifi.ssid <network-name>
set wifi.pwd <network-password>
reboot
```

Ne collez pas les lignes d’identifiants complètes dans une conversation, un
billet, une capture d’écran, un journal ou une note enregistrée. N’ajoutez pas
de guillemets génériques de l’interpréteur de commandes à une valeur destinée
à l’interface de l’appareil.

## Ce que vous devriez voir

Après le redémarrage, exécutez :

```text
get name
get wifi.status
get mqtt.iata
get mqtt1.preset
get mqtt2.preset
get mqtt.status
get mqtt.packets
get bridge.enabled
get path.hash.mode
```

La carte est correctement configurée lorsque :

- le Wi-Fi et MQTT indiquent qu’ils sont connectés;
- le code d’emplacement est exact;
- les préréglages sont `meshcore-ca-1` et `meshcore-ca-2`;
- la publication des paquets et le mode pont sont activés;
- le mode de hachage des chemins est `2`.

## Vérifier dans CoreScope { #check-in-corescope }

1. Trouvez l’observateur dans [CoreScope Observers](https://live.meshcore.ca/#/observers).
2. Attendez de l’activité radio normale à proximité.
3. Confirmez la présence d’un paquet récent dans [CoreScope Packets](https://live.meshcore.ca/#/packets).

Terminez avec [Vérifier votre observateur](../verify.md). Une connexion Wi-Fi et
MQTT ne confirme pas que les paquets se sont rendus à CoreScope.

## Récupération { #recovery }

Si la carte ne redémarre pas ou ne se reconnecte pas :

1. débranchez-la et rebranchez-la avec un câble de données fiable;
2. utilisez la séquence de récupération ou de démarrage propre à la carte publiée par l’outil;
3. reprogrammez exactement la bonne cible sans l’effacer de nouveau, sauf si la récupération l’exige;
4. restaurez l’identité et les paramètres sauvegardés uniquement sur la carte prévue;
5. refaites les vérifications locales dans l’interface en ligne de commande avant de remettre la carte en service.

Si le micrologiciel fonctionne, mais que l’observation échoue, restaurez les
paramètres précédents consignés ou reprogrammez la dernière version vérifiée et
fonctionnelle. Gardez privée la sauvegarde de l’identité privée.

## Si la vérification échoue

Consultez le [dépannage](../troubleshooting.md). Partagez uniquement les
résultats des commandes de lecture après avoir retiré les renseignements privés.
Ne partagez jamais les commandes Wi-Fi ni une clé privée.
