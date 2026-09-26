(function () {
  "use strict";

  var scriptUrl = document.currentScript && document.currentScript.src
    ? document.currentScript.src
    : new URL("/assets/regions/regions.js", window.location.origin).href;
  var assetBase = new URL(".", scriptUrl);
  var catalogPromise = null;
  var displayPartitionPromise = null;
  var resolverPartitionPromise = null;
  var leafletPromise = null;
  var activeMaps = [];
  var configuratorSupport = window.MeshCoreRegionConfiguratorSupport || {};
  var iataScopes = window.MeshCoreIataScopes;
  var radioProfiles = window.MeshCoreRadioProfiles;
  var REQUEST_TIMEOUT_MS = 12000;
  var frenchRuntime = /^fr(?:-|$)/i.test(
    document.documentElement ? document.documentElement.lang || "" : ""
  );

  var FRENCH_RUNTIME_TEXT = {
    "Choose the place you mean:": "Choisissez le lieu recherché :",
    "Place lookup failed": "La recherche de lieux a échoué",
    "MeshCore Canada starter region": "Région initiale de MeshCore Canada",
    "MeshCore Canada planning extension": "Extension proposée par MeshCore Canada",
    "Planning extension": "Extension proposée",
    "Planning extensions": "Extensions proposées",
    "MeshCore Canada planning": "Planification MeshCore Canada",
    "Planning extension details": "Détails des extensions proposées",
    "This point is outside the published MeshMapper boundary. MeshCore Canada assigns the gap to this nearby IATA region for planning; confirm its use locally.": "Ce point est hors de la limite publiée par MeshMapper. MeshCore Canada attribue cet espace à cette région IATA voisine à des fins de planification; confirmez son utilisation localement.",
    "Starter regions": "Régions initiales",
    "Starter region details": "Détails des régions initiales",
    "This broad starter region is assigned by MeshCore Canada, not yet published by MeshMapper. Confirm its use with local operators; it does not promise radio coverage.": "Cette grande région initiale est attribuée par MeshCore Canada; elle n’est pas encore publiée dans MeshMapper. Confirmez son utilisation avec les opérateurs locaux; elle ne garantit pas la couverture radio.",
    "Published MeshMapper zones are unchanged. Labelled planning regions fill the remaining gaps across Canada.": "Les zones publiées par MeshMapper restent inchangées. Des régions proposées identifiées comblent les espaces restants partout au Canada.",
    "Planning regions follow provincial borders and nearby hubs. Newfoundland and Labrador are separate. Published MeshMapper zones take priority.": "Les régions proposées suivent les frontières provinciales et les pôles voisins. Terre-Neuve et le Labrador sont séparés. Les zones publiées par MeshMapper ont priorité.",
    "IATA boundaries SHA-256": "SHA-256 des limites IATA",
    "Download IATA boundaries": "Télécharger les limites IATA",
    "Other IATA regions": "Autres régions IATA",
    "No IATA region contains this point. Browse the region list or check with your community.": "Aucune région IATA ne contient ce point. Consultez la liste ou votre communauté.",
    "Review the replacement scope list": "Vérifier la nouvelle liste de scopes",
    "These saved zones need a new choice:": "Ces zones enregistrées nécessitent un nouveau choix :",
    "I checked the replacement scope list.": "J’ai vérifié la nouvelle liste de scopes.",
    "Review the replacement scope list in step 3 before copying commands.": "Vérifiez la nouvelle liste de scopes à l’étape 3 avant de copier les commandes.",
    "Too many saved zones": "Trop de zones enregistrées",
    "Choose a supported firmware version.": "Choisissez une version de micrologiciel prise en charge.",
    "On firmware 1.14, this repeater's adverts stay unscoped. Upgrade to 1.15 or newer to scope its adverts by city.": "Avec le micrologiciel 1.14, les annonces de ce répéteur restent sans scope. Passez à la version 1.15 ou plus récente pour les limiter au scope de ville.",
    "The saved zone differs from this location. Choose the current IATA region.": "La zone enregistrée ne correspond pas à cet emplacement. Choisissez la région IATA actuelle.",
    "MeshCore Canada repeater setup summary": "Résumé de configuration du répéteur MeshCore Canada",
    "Generated": "Généré le",
    "Location label": "Nom du lieu",
    "Home region": "Région locale",
    "Region budget": "Limites de la liste",
    "Not recorded": "Non indiqué",
    "1. Back up and remove obsolete regions before applying a fresh scope list, preferably over USB.": "1. Conservez la liste actuelle et retirez les régions obsolètes avant d’appliquer les nouveaux scopes, de préférence par USB.",
    "2. Run region and compare every scope and flood permission above. Some commands save immediately.": "2. Exécutez region et comparez chaque scope et autorisation ci-dessus. Certaines commandes enregistrent immédiatement les changements.",
    "3. Run region again after saving.": "3. Exécutez region à nouveau après l’enregistrement.",
    "4. If radio settings changed, reboot and run get radio to confirm them.": "4. Si les réglages radio ont changé, redémarrez puis exécutez get radio pour les confirmer.",
    "5. If the advert ID size changed, run get path.hash.mode to confirm it.": "5. Si la taille d’identifiant a changé, exécutez get path.hash.mode pour la confirmer.",
    "This summary omits exact coordinates, passwords, private keys, and device identifiers.": "Ce résumé exclut les coordonnées exactes, les mots de passe, les clés privées et les identifiants d’appareil.",
    "Published MeshMapper boundary": "Limite publiée par MeshMapper",
    "No reply? Check the connection and use Send Again. On 1.15, region put replies OK - (flood allowed).": "Aucune réponse? Vérifiez la connexion et utilisez Send Again. Avec la version 1.15, region put répond OK - (flood allowed).",
    "MeshMapper zone": "Zone MeshMapper",
    "Reserved": "Réservée",
    "Province scope": "Portée provinciale",
    "ON/QC scope": "Portée ON/QC",
    "Province or territory of the repeater": "Province ou territoire du répéteur",
    "Choose a province or territory": "Choisissez une province ou un territoire",
    "A MeshMapper zone can cross a provincial border. Use the province where this repeater is installed.": "Une zone MeshMapper peut traverser une frontière provinciale. Choisissez la province où ce répéteur est installé.",
    "Use the proposed ON/QC standard settings": "Utiliser les réglages proposés pour ON/QC",
    "Leave unchecked for scope commands only. A complete ON/QC Phase 1 setup also needs these standard settings.": "Laissez cette case décochée pour les commandes de portée seulement. Une configuration complète de la phase 1 ON/QC exige aussi ces réglages standard.",
    "ON/QC rollout: repeaters first": "Déploiement ON/QC : les répéteurs d’abord",
    "Phase 2 is not open. Personal companions keep their default scope empty and channels unscoped until the rollout is announced: January 2027 at the earliest, after the repeaters are ready.": "La phase 2 n’est pas ouverte. Les compagnons personnels gardent leur portée par défaut vide et leurs canaux sans portée jusqu’à l’annonce du déploiement : janvier 2027 au plus tôt, une fois les répéteurs prêts.",
    "Rollout phases": "Phases du déploiement",
    "ON/QC Phase 1 standard settings included": "Réglages standard de la phase 1 ON/QC inclus",
    "ON/QC Phase 1 standard settings not included": "Réglages standard de la phase 1 ON/QC non inclus",
    "These commands do not include all of the proposal’s standard ID, advert and hop settings. Select the ON/QC option in step 3 if you want to include them.": "Ces commandes n’incluent pas tous les réglages standard d’identifiants, d’annonces et de sauts de la proposition. Sélectionnez l’option ON/QC à l’étape 3 pour les inclure.",
    "3-byte IDs, local adverts every 4 hours, flood adverts every 47 hours, and a 16-hop flood limit.": "Identifiants de 3 octets, annonces locales toutes les 4 heures, annonces par inondation toutes les 47 heures et limite de 16 sauts.",
    "More than one MeshMapper zone contains this point. Choose your community's zone.": "Plusieurs zones MeshMapper contiennent ce point. Choisissez celle de votre communauté.",
    "More than one MeshMapper zone contains this point. Select your community's zone on the map.": "Plusieurs zones MeshMapper contiennent ce point. Sélectionnez celle de votre communauté sur la carte.",
    "No published MeshMapper zone contains this point. Browse the zone list or check with your community.": "Aucune zone publiée dans MeshMapper ne contient ce point. Consultez la liste ou votre communauté.",
    "Zone found. Choose the province where the repeater is installed.": "Zone trouvée. Choisissez la province où le répéteur est installé.",
    "This saved link used an older region name. Check the MeshMapper zone and province before applying settings.": "Ce lien utilisait un ancien nom de région. Vérifiez la zone MeshMapper et la province avant d’appliquer les réglages.",
    "IATA scope setup requires firmware v1.16 or newer. Update the repeater first.": "Les portées IATA exigent le micrologiciel 1.16 ou plus récent. Mettez d’abord le répéteur à jour.",
    "The IATA scope catalog is unavailable or out of date.": "Le catalogue des portées IATA est indisponible ou périmé.",
    "Confirm the repeater province: it differs from this zone's usual province.": "Confirmez la province du répéteur : elle diffère de celle habituellement associée à cette zone.",
    "These are published MeshMapper zones, not radio coverage or scope-enforcement boundaries.": "Ce sont les zones publiées par MeshMapper, pas des limites de couverture radio ou d’application des portées.",
    "Open this zone in MeshMapper": "Ouvrir cette zone dans MeshMapper",
    "Choose the repeater province in the configurator": "Choisissez la province du répéteur dans le configurateur",
    "MeshMapper snapshot": "Instantané MeshMapper",
    "Published zones": "Zones publiées",
    "Fetched": "Récupéré le",
    "Flat scopes": "Portées indépendantes",
    "City, province, mesh scope where defined, can, and na. Each scope is independent.": "Ville, province, réseau partagé s’il est défini, can et na. Chaque portée est indépendante.",
    "onqc is for Ontario and Québec. can and na are reserved for future use, not companion defaults or active cross-border routes.": "onqc couvre l’Ontario et le Québec. can et na sont réservés pour plus tard, pas comme portées par défaut d’un compagnon ni comme routes transfrontalières actives.",
    "Map limits": "Limites de la carte",
    "Only published MeshMapper boundaries are shown. Gaps are not filled with guessed circles or census regions.": "Seules les limites publiées par MeshMapper sont affichées. Les espaces vides ne sont pas comblés par des cercles estimés ou des régions de recensement.",
    "Province outlines are used only to identify the repeater province. They do not change MeshMapper boundaries.": "Les contours provinciaux servent seulement à identifier la province du répéteur. Ils ne modifient pas les limites de MeshMapper.",
    "Source files": "Fichiers sources",
    "MeshMapper boundaries SHA-256": "SHA-256 des limites MeshMapper",
    "Download MeshMapper boundaries": "Télécharger les limites MeshMapper",
    "City zone": "Zone locale",
    "Nearby city zones": "Zones locales à proximité",
    "Other MeshMapper zones": "Autres zones MeshMapper",
    "Select only city zones this repeater links. Edge mode blocks unscoped floods.": "Sélectionnez seulement les zones reliées par ce répéteur. Le mode bordure bloque la retransmission sans portée.",
    "An edge repeater can carry several IATA codes. Its province scope stays the province where it is installed.": "Un répéteur de bordure peut porter plusieurs codes IATA. Sa portée provinciale reste celle de son lieu d’installation.",
    "Choose the city scopes this repeater should forward.": "Choisissez les portées de ville que ce répéteur doit retransmettre.",
    "Request a zone change": "Demander une modification de zone",
    "Uses the same scope list": "Utilise la même liste de portées",
    "City repeater": "Répéteur de ville",
    "One IATA region; unscoped messages work locally.": "Une région IATA; les messages sans portée restent utilisables localement.",
    "Edge repeater": "Répéteur de bordure",
    "Regularly links repeaters in different IATA regions; blocks unscoped floods.": "Relie régulièrement des répéteurs de régions IATA différentes; bloque la retransmission sans portée.",
    "A repeater on the outer boundary stays a city repeater unless it regularly links to another IATA region.": "Un répéteur à la limite extérieure reste un répéteur de ville, sauf s’il relie régulièrement une autre région IATA.",
    "Different cities or map outlines with the same IATA code still count as one region.": "Des villes ou des contours portant le même code IATA comptent toujours comme une seule région.",
    "Forwarded scopes": "Portées retransmises",
    "Forwarded scopes:": "Portées retransmises :",
    "Before applying a new scope list": "Avant d’appliquer une nouvelle liste de portées",
    "Back up the current region list. Remove old entries before applying this profile; use USB if possible.": "Conservez la liste actuelle. Retirez les anciennes entrées avant d’appliquer ce profil; utilisez une connexion USB si possible.",
    "Migration instructions": "Consignes de migration",
    ". Existing regions are not cleared. Some commands save immediately.": ". Les anciennes régions ne sont pas effacées. Certaines commandes enregistrent immédiatement les changements.",
    "No MeshMapper zones are published here yet.": "Aucune zone MeshMapper n’est encore publiée ici.",
    "Select this city zone to see its scope options.": "Sélectionnez cette zone locale pour voir ses portées.",
    "Quebec City": "Québec",
    "Montreal": "Montréal",
    "Saguenay Lac-st-jean": "Saguenay–Lac-Saint-Jean",
    "Cape Breton Island": "Île du Cap-Breton",
    "Bas-St-Laurent-Gaspésie": "Bas-Saint-Laurent–Gaspésie",
    "Loading regional boundaries…": "Chargement des limites régionales…",
    "Radio network": "Réseau radio",
    "Advert ID size": "Taille de l’identifiant d’annonce",
    "Keep current settings": "Conserver les réglages actuels",
    "Choose a profile only after checking with your community. A region does not select a radio network.": "Confirmez le profil auprès de votre communauté. Une région ne détermine pas les réglages radio.",
    "The Canada app preset uses 3-byte paths. Here, choose radio and advert ID settings separately.": "Le préréglage Canada de l’application utilise des parcours de 3 octets. Ici, choisissez séparément les réglages radio et la taille de l’identifiant d’annonce.",
    "Canada preset details": "Détails du préréglage Canada",
    "Radio changes take effect after reboot.": "Les changements radio prennent effet après le redémarrage.",
    "Choose the region you mean:": "Choisissez la région recherchée :",
    "This saved location is invalid or no longer available. Choose a region again.": "Cet emplacement est invalide ou n’est plus disponible. Choisissez une région à nouveau.",
    "Setup summary": "Résumé de configuration",
    "3 bytes": "3 octets",
    "2 bytes": "2 octets",
    "1 byte": "1 octet",
    "Unable to load MeshCore Canada region data": "Impossible de charger les données régionales de MeshCore Canada",
    "Unable to load the Canadian map layer": "Impossible de charger la couche cartographique canadienne",
    "Unable to load the Canadian location layer": "Impossible de charger la couche canadienne de localisation",
    "The Canadian region catalog contains an invalid or duplicate local region": "Le catalogue des régions canadiennes contient une région locale invalide ou en double",
    "The Canadian region catalog contains an invalid shared repeater area": "Le catalogue des régions canadiennes contient une zone partagée de répéteurs invalide",
    "A shared repeater area must cross a province or territory": "Une zone partagée de répéteurs doit traverser une province ou un territoire",
    "The region catalog contains an invalid neighbouring network path": "Le catalogue des régions contient un chemin de réseau voisin invalide",
    "A neighbouring network tag collides with the Canadian hierarchy": "Un identifiant de réseau voisin entre en conflit avec la hiérarchie canadienne",
    "A neighbouring network tag has no label": "Un identifiant de réseau voisin n’a pas de libellé",
    "A neighbouring network tag has conflicting parents": "Un identifiant de réseau voisin a des parents incompatibles",
    "A neighbouring network tag has conflicting labels": "Un identifiant de réseau voisin a des libellés incompatibles",
    "Canadian map layer is invalid": "La couche cartographique canadienne est invalide",
    "Canadian map layer contains an invalid or duplicate region": "La couche cartographique canadienne contient une région invalide ou en double",
    "Canadian map layer does not match the region catalog": "La couche cartographique canadienne ne correspond pas au catalogue des régions",
    "Canadian location layer is invalid": "La couche canadienne de localisation est invalide",
    "Canadian location layer contains an invalid or duplicate region": "La couche canadienne de localisation contient une région invalide ou en double",
    "Canadian location layer does not match the region catalog": "La couche canadienne de localisation ne correspond pas au catalogue des régions",
    "Geocoding service error": "Erreur du service de géocodage",
    "No matching Canadian postal code found": "Aucun code postal canadien correspondant n’a été trouvé",
    "Online place lookup is unavailable. Enter coordinates or browse the region list.": "La recherche de lieux en ligne est indisponible. Entrez des coordonnées ou parcourez la liste des régions.",
    "Copy": "Copier",
    "Copied": "Copié",
    "Copy failed": "Échec de la copie",
    "Copied to clipboard.": "Copié dans le presse-papiers.",
    "Copy failed. Select and copy the command manually.": "La copie a échoué. Sélectionnez et copiez la commande manuellement.",
    "Needs review": "À vérifier",
    "Draft": "Brouillon",
    "Reviewed": "Vérifié",
    "Active": "Actif",
    "Deprecated": "Obsolète",
    "Unreviewed": "Non vérifié",
    "No seed": "Aucun point de départ",
    "Country": "Pays",
    "Province / Territory": "Province ou territoire",
    "Local Region": "Région locale",
    "Region": "Région",
    "Area Group": "Groupe de zones",
    "Shared repeater area": "Zone partagée de répéteurs",
    "community path": "chemin communautaire",
    "confirm locally": "à confirmer localement",
    "Add only the paths this repeater should forward. Different repeaters can carry different paths to spread traffic.": "Ajoutez seulement les chemins que ce répéteur doit relayer. Différents répéteurs peuvent transporter différents chemins pour répartir le trafic.",
    "Canadian regions": "Régions canadiennes",
    "Provinces and territories may be mixed.": "Vous pouvez combiner des provinces et des territoires.",
    "required": "obligatoire",
    "Add any Canadian region": "Ajouter une région canadienne",
    "Choose a region": "Choisissez une région",
    "Neighbouring network paths": "Chemins des réseaux voisins",
    "Add one only when this repeater should forward traffic for that area. Nothing outside Canada is added to the boundary map.": "Ajoutez-en un seulement si ce répéteur doit relayer le trafic de cette zone. Rien à l’extérieur du Canada n’est ajouté à la carte des limites.",
    "No region yet": "Aucune région pour l’instant",
    "Choose a location first.": "Choisissez d’abord un emplacement.",
    "Too many regions selected": "Trop de régions sélectionnées",
    "Cross-province repeater setup": "Configuration de répéteur interprovinciale",
    "Connect to the repeater CLI": "Se connecter à l’interface en ligne de commande du répéteur",
    "Use USB at the repeater or remote management over LoRa.": "Utilisez l’USB sur place ou la gestion à distance par LoRa.",
    "USB serial": "Connexion série USB",
    "At the repeater": "Sur place",
    "Connect the repeater to a computer with a data-capable USB cable.": "Branchez le répéteur à un ordinateur avec un câble USB qui transmet les données.",
    "In desktop Chrome or Edge, open the": "Dans Chrome ou Edge sur un ordinateur, ouvrez",
    ". For Gessaman's MQTT Observer firmware, use the": ". Pour le micrologiciel MQTT Observer de Gessaman, utilisez le",
    "For Gessaman's MQTT Observer firmware, use the": "Pour le micrologiciel MQTT Observer de Gessaman, utilisez le",
    "instead.": "plutôt.",
    "Choose": "Choisissez",
    ", then approve the repeater's serial or COM port when the browser asks.": ", puis autorisez le port série ou COM du répéteur lorsque le navigateur le demande.",
    "then approve the repeater's serial or COM port when the browser asks.": "puis autorisez le port série ou COM du répéteur lorsque le navigateur le demande.",
    "Remote over LoRa": "À distance par LoRa",
    "Through a companion radio": "Par une radio compagnon",
    "On a phone or computer, connect the": "Sur un téléphone ou un ordinateur, connectez l’",
    "official MeshCore app": "application MeshCore officielle",
    "to your companion radio.": "à votre radio compagnon.",
    "Open": "Ouvrez",
    ", select the repeater, then choose": ", sélectionnez le répéteur, puis choisissez",
    "select the repeater, then choose": "sélectionnez le répéteur, puis choisissez",
    "from its menu.": "dans son menu.",
    "Enter the repeater admin password, tap": "Entrez le mot de passe administrateur du répéteur, touchez",
    ", then open": ", puis ouvrez",
    "then open": "puis ouvrez",
    "If the repeater is missing, open Tools → Discover Nearby Nodes. If a wait timer appears, let it finish before logging in.": "Si le répéteur est absent, ouvrez Tools → Discover Nearby Nodes. Si une minuterie apparaît, attendez qu’elle se termine avant de vous connecter.",
    "Confirm the command line": "Confirmer l’interface en ligne de commande",
    "Run": "Exécutez",
    "and check the version.": "et vérifiez la version.",
    "Apply the settings": "Appliquer les paramètres",
    "Run each line in order. Wait for a reply.": "Exécutez chaque ligne dans l’ordre. Attendez une réponse.",
    "Stop on": "Arrêtez-vous en cas de",
    ". Existing regions are not cleared.": ". Les régions existantes ne sont pas effacées.",
    "Existing regions are not cleared.": "Les régions existantes ne sont pas effacées.",
    "Check and save": "Vérifier et enregistrer",
    "and confirm each path:": "et confirmez chaque chemin :",
    "Save:": "Enregistrez :",
    "Restart the device, reconnect, then run these final checks:": "Redémarrez l’appareil, reconnectez-vous, puis effectuez ces dernières vérifications :",
    "Run this once more to confirm the saved region:": "Exécutez cette commande une dernière fois pour confirmer la région enregistrée :",
    "MeshCore command help": "Aide sur les commandes MeshCore",
    "Commands": "Commandes",
    "Canada-wide region boundary": "Limite régionale pancanadienne",
    "Boundary unavailable": "Limite indisponible",
    "Region tags": "Identifiants de région",
    "Firmware": "Micrologiciel",
    "Region budget": "Budget régional",
    "Advanced details": "Détails avancés",
    "Repeater regions:": "Régions du répéteur :",
    "Your region:": "Votre région :",
    "Copy commands": "Copier les commandes",
    "Commissioning record": "Fiche de mise en service",
    "Download or print a summary without exact coordinates, credentials, or device identifiers.": "Téléchargez ou imprimez un résumé sans coordonnées exactes, identifiants de connexion ni identifiants d’appareil.",
    "Download": "Télécharger",
    "Print": "Imprimer",
    "Commissioning summary downloaded. Exact coordinates and credentials were omitted.": "La fiche de mise en service a été téléchargée. Les coordonnées exactes et les identifiants de connexion ont été omis.",
    "The print window was blocked. Download the summary instead.": "La fenêtre d’impression a été bloquée. Téléchargez plutôt le résumé.",
    "MeshCore Canada commissioning summary": "Fiche de mise en service de MeshCore Canada",
    "MeshCore Canada repeater commissioning summary": "Fiche de mise en service du répéteur MeshCore Canada",
    "Generated": "Générée",
    "Location label": "Libellé de l’emplacement",
    "Not recorded": "Non indiqué",
    "Forwarding paths:": "Chemins relayés :",
    "Commands:": "Commandes :",
    "Verification:": "Vérification :",
    "1. Run region before saving and compare every path above.": "1. Exécutez region avant d’enregistrer et comparez chaque chemin ci-dessus.",
    "2. Run region save only after the paths and flood permissions are correct.": "2. Exécutez region save seulement lorsque les chemins et les autorisations de diffusion sont corrects.",
    "3. Run region again after saving.": "3. Exécutez region de nouveau après l’enregistrement.",
    "This summary omits exact coordinates, passwords, private keys, and device identifiers.": "Cette fiche omet les coordonnées exactes, les mots de passe, les clés privées et les identifiants d’appareil.",
    "Commissioning summary opened for printing. Exact coordinates and credentials were omitted.": "La fiche de mise en service est ouverte pour l’impression. Les coordonnées exactes et les identifiants de connexion ont été omis.",
    "Review": "Vérifier",
    "Source": "Source",
    "Seed": "Point de départ",
    "No seed point": "Aucun point de départ",
    "Repeater area": "Zone du répéteur",
    "Source note": "Note sur la source",
    "BC coastal seed follows the PNW reference data": "Le point de départ côtier de la C.-B. suit les données de référence du PNW",
    "Strategy draft v1.1.1 region": "Région de l’ébauche de stratégie v1.1.1",
    "Copy tag": "Copier l’identifiant",
    "Open source": "Ouvrir la source",
    "Setup progress": "Progression de la configuration",
    "Step 1: Device": "Étape 1 : appareil",
    "Step 2: Location": "Étape 2 : emplacement",
    "Step 3: Coverage": "Étape 3 : couverture",
    "Step 4: Apply": "Étape 4 : appliquer",
    "Device": "Appareil",
    "Location": "Emplacement",
    "Coverage": "Couverture",
    "Apply": "Appliquer",
    "Step 1 of 4": "Étape 1 sur 4",
    "What are you configuring?": "Quel appareil configurez-vous?",
    "We will recommend forwarding paths, then show how to apply them.": "Nous recommanderons les chemins à relayer, puis nous vous montrerons comment les appliquer.",
    "Browse the region map": "Parcourir la carte des régions",
    "Open the region editor": "Ouvrir l’éditeur de régions",
    "Device and experience": "Appareil et niveau d’expérience",
    "Repeater": "Répéteur",
    "Recommended for most operators": "Recommandé pour la plupart des exploitants",
    "Room server with repeating": "Serveur de salon avec relais",
    "Uses the same region paths": "Utilise les mêmes chemins régionaux",
    "Advanced operator": "Exploitant expérimenté",
    "Review wide and cross-border paths": "Examine les chemins étendus et transfrontaliers",
    "Next": "Suivant",
    "Step 2 of 4": "Étape 2 sur 4",
    "Step 4 of 4": "Étape 4 sur 4",
    "Where is the node?": "Où se trouve le nœud?",
    "Search a place": "Rechercher un lieu",
    "City, airport code, postal code, or region name": "Ville, code d’aéroport, code postal ou nom de région",
    "Find": "Rechercher",
    "Enter coordinates": "Entrer des coordonnées",
    "Latitude": "Latitude",
    "Longitude": "Longitude",
    "Use coordinates": "Utiliser les coordonnées",
    "Coordinates are checked against the Canadian region data in this page.": "Les coordonnées sont comparées aux données régionales canadiennes de cette page.",
    "Use this device": "Utiliser cet appareil",
    "Use my location": "Utiliser ma position",
    "Your browser asks first. MeshCore Canada does not receive or store your coordinates.": "Votre navigateur demande d’abord votre permission. MeshCore Canada ne reçoit ni ne conserve vos coordonnées.",
    "Browse regions without search or a map": "Parcourir les régions sans recherche ni carte",
    "Back": "Retour",
    "Explore regions": "Explorer les régions",
    "Step 3 of 4": "Étape 3 sur 4",
    "What should this node serve?": "Quelles zones ce nœud doit-il desservir?",
    "Repeater forwarding coverage": "Couverture de relais du répéteur",
    "Recommended local area": "Zone locale recommandée",
    "Use the home region and any registered shared area": "Utilise la région d’attache et toute zone partagée enregistrée",
    "Add nearby or cross-border paths": "Ajouter des chemins voisins ou transfrontaliers",
    "For bridge, wide-coverage, mountain, or water-path repeaters": "Pour les répéteurs qui font un pont, couvrent une grande zone, une montagne ou un parcours au-dessus de l’eau",
    "Radio and firmware options": "Options radio et de micrologiciel",
    "Recommended radio settings": "Paramètres radio recommandés",
    "Include recommended radio defaults": "Inclure les paramètres radio recommandés",
    "For a new setup": "Pour une nouvelle installation",
    "Keep current radio settings": "Conserver les paramètres radio actuels",
    "For an existing coordinated network": "Pour un réseau coordonné existant",
    "Firmware version": "Version du micrologiciel",
    "Review and apply": "Vérifier et appliquer",
    "Choose setup instructions": "Choisir les instructions de configuration",
    "Guide me": "Me guider",
    "Connect, apply, verify, then save": "Se connecter, appliquer, vérifier, puis enregistrer",
    "Technical operator flow": "Parcours pour exploitant technique",
    "Selection": "Sélection",
    "Node": "Nœud",
    "Place": "Lieu",
    "Home region": "Région d’attache",
    "Budget": "Budget",
    "Forwarding paths": "Chemins relayés",
    "Neighbouring paths are included only on this repeater. Confirm provisional paths with the neighbouring operators.": "Les chemins voisins sont inclus uniquement sur ce répéteur. Confirmez les chemins provisoires auprès des exploitants voisins.",
    "Choose a location or browse to a region first.": "Choisissez d’abord un emplacement ou parcourez les régions.",
    "Your home region": "Votre région d’attache",
    "Select this region to use it as the home region.": "Sélectionnez cette région comme région d’attache.",
    "Region found.": "Région trouvée.",
    "Checking the Canadian region data…": "Vérification des données régionales canadiennes…",
    "Unable to load the Canadian location data.": "Impossible de charger les données canadiennes de localisation.",
    "Enter a city, airport code, postal code, or region name.": "Entrez une ville, un code d’aéroport, un code postal ou un nom de région.",
    "Finding": "Recherche en cours",
    "Location lookup failed": "La recherche du lieu a échoué",
    "Enter a latitude from -90 to 90 and a longitude from -180 to 180.": "Entrez une latitude de -90 à 90 et une longitude de -180 à 180.",
    "This browser does not provide location access. Enter coordinates or browse regions.": "Ce navigateur ne donne pas accès à la position. Entrez des coordonnées ou parcourez les régions.",
    "Waiting for browser location permission…": "En attente de l’autorisation de localisation du navigateur…",
    "Current browser location": "Position actuelle du navigateur",
    "Location was not available. Enter coordinates or browse regions.": "La position n’était pas disponible. Entrez des coordonnées ou parcourez les régions.",
    "Leaflet failed to load": "Leaflet n’a pas pu se charger",
    "MeshCore Canada regions": "Régions de MeshCore Canada",
    "Find a region": "Trouver une région",
    "Region data": "Données régionales",
    "Region map view": "Affichage de la carte des régions",
    "Browse by province or territory": "Parcourir par province ou territoire",
    "Can't use the map?": "La carte ne fonctionne pas?",
    "Browse all regions": "Parcourir toutes les régions",
    "Search the full region list.": "Recherchez dans la liste complète des régions.",
    "Set up a repeater": "Configurer un répéteur",
    "Region search and details": "Recherche et détails des régions",
    "Find a place": "Trouver un lieu",
    "Enter coordinates instead": "Entrer plutôt des coordonnées",
    "Selected region": "Région sélectionnée",
    "Skip the interactive map": "Passer la carte interactive",
    "Loading interactive map…": "Chargement de la carte interactive…",
    "Loading Canadian boundaries and OpenStreetMap tiles.": "Chargement des limites canadiennes et des tuiles OpenStreetMap.",
    "Retry map": "Réessayer la carte",
    "Interactive Canadian region map": "Carte interactive des régions canadiennes",
    "Map legend": "Légende de la carte",
    "Selected boundary": "Limite sélectionnée",
    "Browsed group outline": "Contour du groupe parcouru",
    "Audit data loads when this view is opened.": "Les données de vérification se chargent à l’ouverture de cette vue.",
    "Unable to load release QA": "Impossible de charger les contrôles de qualité de la publication",
    "Unable to load the source lock": "Impossible de charger le verrouillage des sources",
    "Release": "Publication",
    "Status": "État",
    "Standard": "Norme",
    "Connectivity": "Connectivité",
    "Online": "En ligne",
    "Offline; showing cached static data when available": "Hors ligne; affichage des données statiques en cache lorsqu’elles sont disponibles",
    "Digital census cells": "Cellules numériques du recensement",
    "Census subdivisions": "Subdivisions de recensement",
    "Positive-area overlaps": "Chevauchements de superficie positive",
    "Quality checks": "Contrôles de qualité",
    "Release artifacts": "Artéfacts de publication",
    "Public partition SHA-256": "SHA-256 de la partition publique",
    "Resolver partition SHA-256": "SHA-256 de la partition de résolution",
    "Membership SHA-256": "SHA-256 des appartenances",
    "Unavailable": "Indisponible",
    "Download QA JSON": "Télécharger le JSON de contrôle",
    "Download catalog": "Télécharger le catalogue",
    "Open standard and change process": "Ouvrir la norme et le processus de modification",
    "Try again": "Réessayer",
    "Loading release evidence…": "Chargement des preuves de publication…",
    "Select this region to see its full path.": "Sélectionnez cette région pour voir son chemin complet.",
    "Province or territory": "Province ou territoire",
    "resolves to": "correspond à",
    "Aliases": "Alias",
    "None recorded": "Aucun",
    "Repeater paths": "Chemins du répéteur",
    "Region details": "Détails de la région",
    "Find a community": "Trouver une communauté",
    "These are routing regions, not radio coverage boundaries.": "Ces régions servent au routage; elles ne représentent pas la portée radio.",
    "Configure this region": "Configurer cette région",
    "Copy link": "Copier le lien",
    "This location is outside Canada.": "Cet emplacement se trouve à l’extérieur du Canada.",
    "No Canadian region contains that point. Browse the region list instead.": "Aucune région canadienne ne contient ce point. Parcourez plutôt la liste des régions.",
    "No Canadian region contains that point. Browse the list instead.": "Aucune région canadienne ne contient ce point. Parcourez plutôt la liste.",
    "Loading Canadian boundaries and map tools…": "Chargement des limites canadiennes et des outils cartographiques…",
    "Loading the interactive region map.": "Chargement de la carte interactive des régions.",
    "OpenStreetMap tiles did not load. Search and the region list still work.": "Les tuiles OpenStreetMap ne se sont pas chargées. La recherche et la liste des régions fonctionnent toujours.",
    "OpenStreetMap tiles could not load. Search and the region list still work.": "Impossible de charger les tuiles OpenStreetMap. La recherche et la liste des régions fonctionnent toujours.",
    "Interactive region map loaded.": "La carte interactive des régions est chargée.",
    "The map could not load. Search and the region list still work.": "La carte n’a pas pu se charger. La recherche et la liste des régions fonctionnent toujours.",
    "Search regions": "Rechercher des régions",
    "Filter by area": "Filtrer par zone",
    "All areas": "Toutes les zones",
    "Region directory table": "Tableau du répertoire des régions",
    "Area": "Zone",
    "Boundary": "Limite",
    "Basis": "Fondement",
    "Canada-wide": "Pancanadienne",
    "Established": "Établie",
    "Proposed": "Proposée",
    "Setup": "Configuration",
    "Map": "Carte",
    "Regions": "Régions",
    "Local regions": "Régions locales",
    "Provinces & territories": "Provinces et territoires",
    "Region status summary": "Résumé de l’état des régions",
    "Loading Canadian regions…": "Chargement des régions canadiennes…",
    "Newfoundland and Labrador": "Terre-Neuve-et-Labrador",
    "Prince Edward Island": "Île-du-Prince-Édouard",
    "Nova Scotia": "Nouvelle-Écosse",
    "New Brunswick": "Nouveau-Brunswick",
    "Quebec": "Québec",
    "British Columbia": "Colombie-Britannique",
    "Northwest Territories": "Territoires du Nord-Ouest",
    "Atlantic": "Atlantique",
    "Prairies": "Prairies",
    "Northern Canada": "Nord canadien",
    "Zoom in": "Zoom avant",
    "Zoom out": "Zoom arrière",
    "Marker": "Marqueur",
    "contributors": "contributeurs",
    "Close popup": "Fermer la fenêtre",
    "A JavaScript library for interactive maps": "Une bibliothèque JavaScript pour les cartes interactives"
  };

  var FRENCH_RUNTIME_PATTERNS = [
    [/^(.+) \(request timed out\)$/, function (match, message) {
      return translateRuntimeText(message) + " (délai de la requête dépassé)";
    }],
    [/^(.+): ([^:]+)$/, function (match, prefix, value) {
      var translatedPrefix = FRENCH_RUNTIME_TEXT[prefix];
      return translatedPrefix ? translatedPrefix + " : " + translateRuntimeText(value) : match;
    }],
    [/^(\d+) \/ 32 tags, (\d+) \/ 160 bytes$/, function (match, tags, bytes) {
      return tags + " / 32 identifiants, " + bytes + " / 160 octets";
    }],
    [/^That name matches more than one region \((.+)\)\. Add a province or postal code\.$/, function (match, choices) {
      return "Ce nom correspond à plusieurs régions (" + choices + "). Ajoutez une province ou un code postal.";
    }],
    [/^Confirm (.+) tags with neighbouring operators before applying them\.$/, function (match, label) {
      return "Confirmez les identifiants de " + label + " auprès des exploitants voisins avant de les appliquer.";
    }],
    [/^Check locally before using: (.+)\.$/, function (match, tags) {
      return "Vérifiez localement avant d’utiliser : " + tags + ".";
    }],
    [/^Do not use: (.+)\.$/, function (match, tags) {
      return "N’utilisez pas : " + tags + ".";
    }],
    [/^Too many regions: (\d+) tags exceeds the 32-tag limit\.$/, function (match, count) {
      return "Trop de régions : " + count + " identifiants dépassent la limite de 32.";
    }],
    [/^Region names use (\d+) bytes, above the 160-byte response limit\.$/, function (match, bytes) {
      return "Les noms de régions utilisent " + bytes + " octets, au-delà de la limite de réponse de 160 octets.";
    }],
    [/^(.+) keeps (.+) in one repeater configuration\.$/, function (match, area, members) {
      return area + " regroupe " + members.replace(/ and /g, " et ") + " dans une seule configuration de répéteur.";
    }],
    [/^This selection uses (\d+) tags and (\d+) bytes\. Remove regions until it fits the 32-tag and 160-byte limits\.$/, function (match, tags, bytes) {
      return "Cette sélection utilise " + tags + " identifiants et " + bytes + " octets. Retirez des régions jusqu’à respecter les limites de 32 identifiants et de 160 octets.";
    }],
    [/^(.+) combines (.+) in one repeater setup\. All map boundaries remain separate\.$/, function (match, area, members) {
      return area + " regroupe " + members.replace(/ and /g, " et ") + " dans une seule configuration de répéteur. Toutes les limites cartographiques demeurent distinctes.";
    }],
    [/^(.+)\. Each map region keeps its own boundary\.$/, function (match, jurisdictions) {
      return jurisdictions + ". Chaque région cartographique conserve sa propre limite.";
    }],
    [/^(.+) is added to this repeater only\. MeshCore Canada does not own or draw those boundaries\.$/, function (match, paths) {
      return paths + " est ajouté uniquement à ce répéteur. MeshCore Canada ne possède ni ne trace ces limites.";
    }],
    [/^Shared repeater area: (.+)$/, function (match, area) {
      return "Zone partagée de répéteurs : " + area;
    }],
    [/^(\d+) subregions$/, function (match, count) {
      return count + " sous-régions";
    }],
    [/^([A-Z0-9-]+) · region$/, function (match, tag) {
      return tag + " · région";
    }],
    [/^(.+) resolves to (.+)$/, function (match, place, region) {
      return place + " correspond à " + region;
    }],
    [/^(\d+) leaf regions$/, function (match, count) {
      return count + " régions terminales";
    }],
    [/^(\d+) of (\d+) reported invariants pass$/, function (match, passed, total) {
      return passed + " invariants sur " + total + " sont respectés";
    }],
    [/^Source lock: (.+) census vintage · (\d+) locked sources\.$/, function (match, vintage, count) {
      return "Verrouillage des sources : recensement de " + vintage + " · " + count + " sources verrouillées.";
    }],
    [/^(\d+) of (\d+) regions$/, function (match, shown, total) {
      return shown + " régions sur " + total;
    }],
    [/^(\d+) regions$/, function (match, count) {
      return count + " régions";
    }],
    [/^(\d+) \/ 32 tags · (\d+) \/ 160 bytes$/, function (match, tags, bytes) {
      return tags + " / 32 identifiants · " + bytes + " / 160 octets";
    }],
    [/^(.+) region$/, function (match, label) {
      return "Région de " + label;
    }]
  ];

  function translateRuntimeText(value) {
    var source = String(value == null ? "" : value);
    if (!frenchRuntime || !source) return source;
    var leading = (source.match(/^\s*/) || [""])[0];
    var trailing = (source.match(/\s*$/) || [""])[0];
    var text = source.slice(leading.length, source.length - trailing.length || source.length);
    if (!text) return source;
    if (Object.prototype.hasOwnProperty.call(FRENCH_RUNTIME_TEXT, text)) {
      var direct = FRENCH_RUNTIME_TEXT[text];
      var directTrailing = /[’']$/.test(direct) ? "" : trailing;
      return leading + direct + directTrailing;
    }
    for (var index = 0; index < FRENCH_RUNTIME_PATTERNS.length; index += 1) {
      if (FRENCH_RUNTIME_PATTERNS[index][0].test(text)) {
        return leading + text.replace(FRENCH_RUNTIME_PATTERNS[index][0], FRENCH_RUNTIME_PATTERNS[index][1]) + trailing;
      }
    }
    return source;
  }

  function localizeRuntimeNode(node) {
    if (!frenchRuntime || !node) return;
    if (node.nodeType === 3) {
      var parentName = node.parentElement && node.parentElement.tagName;
      var original = node.nodeValue;
      var trimmed = String(original || "").trim();
      if (parentName === "SCRIPT" || parentName === "STYLE" || parentName === "PRE") return;
      if (parentName === "CODE" && trimmed !== "Unavailable") return;
      var translated = parentName === "DT" && trimmed === "Review"
        ? original.replace("Review", "Vérification")
        : translateRuntimeText(original);
      if (translated !== node.nodeValue) node.nodeValue = translated;
      return;
    }
    if (node.nodeType !== 1) return;
    ["aria-label", "placeholder", "title"].forEach(function (attribute) {
      if (!node.hasAttribute(attribute)) return;
      var current = node.getAttribute(attribute);
      var translated = translateRuntimeText(current);
      if (translated !== current) node.setAttribute(attribute, translated);
    });
    Array.prototype.slice.call(node.childNodes || []).forEach(localizeRuntimeNode);
  }

  function enableRuntimeLocalization(root) {
    if (!frenchRuntime || !root || root.dataset.mccLocaleReady === "1") return;
    root.dataset.mccLocaleReady = "1";
    localizeRuntimeNode(root);
    if (typeof MutationObserver === "undefined") return;
    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (record.type === "characterData") localizeRuntimeNode(record.target);
        if (record.type === "attributes") localizeRuntimeNode(record.target);
        Array.prototype.slice.call(record.addedNodes || []).forEach(localizeRuntimeNode);
      });
    });
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "placeholder", "title"]
    });
    root.__mccLocaleObserver = observer;
  }

  function fetchWithTimeout(url, options, timeoutMs) {
    var requestOptions = Object.assign({}, options || {});
    var upstreamSignal = requestOptions.signal;
    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = null;
    var abortFromUpstream = function () {
      if (controller) controller.abort();
    };
    if (controller) {
      requestOptions.signal = controller.signal;
      timer = window.setTimeout(function () { controller.abort(); }, timeoutMs || REQUEST_TIMEOUT_MS);
      if (upstreamSignal) {
        if (upstreamSignal.aborted) controller.abort();
        else upstreamSignal.addEventListener("abort", abortFromUpstream, { once: true });
      }
    }
    return fetch(url, requestOptions).finally(function () {
      if (timer) window.clearTimeout(timer);
      if (upstreamSignal) upstreamSignal.removeEventListener("abort", abortFromUpstream);
    });
  }

  function fetchJsonAsset(filename, errorMessage, retrying) {
    return fetchWithTimeout(new URL(filename, assetBase), { cache: filename === "iata-regions.json" ? "no-cache" : "default" }, REQUEST_TIMEOUT_MS).then(function (response) {
      if (!response.ok) throw new Error(errorMessage);
      return response.json();
    }).catch(function (error) {
      if (!retrying && error && error.name !== "AbortError") {
        return fetchJsonAsset(filename, errorMessage, true);
      }
      throw error && error.name === "AbortError" ? new Error(errorMessage + " (request timed out)") : error;
    });
  }

  function loadCatalog() {
    if (!catalogPromise) {
      catalogPromise = fetchJsonAsset("iata-regions.json", "Unable to load MeshCore Canada region data")
        .then(prepareCatalog)
        .catch(function (error) {
          catalogPromise = null;
          throw error;
        });
    }
    return catalogPromise;
  }

  function loadDisplayPartition(data) {
    if (!displayPartitionPromise) {
      displayPartitionPromise = fetchJsonAsset(
        "iata-boundaries.geojson?v=" + data.source.boundarySha256,
        "Unable to load the Canadian map layer"
      ).catch(function (error) {
        displayPartitionPromise = null;
        throw error;
      });
    }
    return displayPartitionPromise;
  }

  function loadResolverPartition(data) {
    if (!resolverPartitionPromise) {
      resolverPartitionPromise = fetchJsonAsset(
        "scope-jurisdictions.geojson?v=" + data.source.jurisdictionSha256,
        "Unable to load the Canadian location layer"
      ).catch(function (error) {
        resolverPartitionPromise = null;
        throw error;
      });
    }
    return resolverPartitionPromise;
  }

  function loadData(mode) {
    if (mode === "map" || mode === "config") return loadCatalog();
    return loadCatalog();
  }

  function ensureResolverData(data) {
    if (data.resolverRegions && data.jurisdictions) return Promise.resolve(data);
    return Promise.all([loadDisplayPartition(data), loadResolverPartition(data)]).then(function (layers) {
      return applyGeneratedPartition(data, layers[0], layers[1]);
    });
  }

  function prepareCatalog(data) {
    if (data.__mccPrepared) return data;
    if (!iataScopes || data.schema !== "meshcore-canada-iata-scopes/v1" || !Array.isArray(data.policy && data.policy.reservedScopes)) throw new Error("The IATA scope catalog is unavailable or out of date.");
    if (!/^[0-9a-f]{64}$/.test(data.source.boundarySha256) || !/^[0-9a-f]{64}$/.test(data.source.jurisdictionSha256)) throw new Error("The IATA scope catalog is unavailable or out of date.");
    var suppliedAliases = data.aliases || {};
    var previousAliases = data.regionAliases || {};
    var strategySeeds = (data.seeds || []).map(function (seed) {
      return Object.assign({}, seed, {
        tag: slug(seed.tag),
        sourceTier: seed.regionSource,
        boundaryType: seed.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region"
      });
    });
    var seedTags = {};
    strategySeeds.forEach(function (seed) {
      if (!seed.tag || seedTags[seed.tag] || !data.hierarchy[seed.tag]) {
        throw new Error("The Canadian region catalog contains an invalid or duplicate local region");
      }
      seedTags[seed.tag] = true;
    });
    data.regionAliases = {};
    Object.keys(data.hierarchy || {}).forEach(function (tag) {
      data.regionAliases[tag] = unique([tag, data.hierarchy[tag].label]
        .concat(suppliedAliases[tag] || [])
        .concat(previousAliases[tag] || [])
        .filter(Boolean));
    });
    Object.keys(data.legacyAliases || {}).forEach(function (oldTag) {
      data.legacyAliases[oldTag].forEach(function (tag) {
        if (seedTags[tag]) data.regionAliases[tag] = unique(data.regionAliases[tag].concat([oldTag]));
      });
    });
    var partitionTags = Object.keys(seedTags).sort();
    data.strategySeeds = strategySeeds;
    data.strategyFallbackSeeds = [];
    data.communityExtraSeeds = [];
    data.seeds = strategySeeds;
    data.consolidatedRegionTags = partitionTags;
    data.regionCounts = {
      total: partitionTags.length,
      meshmapper: strategySeeds.filter(function (seed) { return seed.regionSource === "meshmapper"; }).length,
      starters: strategySeeds.filter(function (seed) { return seed.regionSource === "meshcore-canada"; }).length,
      extensions: data.source.planningExtensionCount || 0,
      strategy: strategySeeds.length
    };
    data.metroGroups = (data.metroGroups || []).map(function (group) {
      return { label: group.label, tags: group.tags.filter(function (tag) { return Boolean(seedTags[tag]); }) };
    });
    data.sharedRepeaterAreas = Object.keys(data.searchGroups || {}).map(function (id) {
      var group = data.searchGroups[id];
      if (!group || !group.repeaterConfig || group.repeaterConfig.mode !== "shared-member-paths") return null;
      var members = unique((group.members || []).filter(function (tag) { return Boolean(seedTags[tag]); }));
      if (members.length !== (group.members || []).length || members.length < 2) {
        throw new Error("The Canadian region catalog contains an invalid shared repeater area: " + id);
      }
      members.sort(function (left, right) {
        return ancestryText(data, left).localeCompare(ancestryText(data, right));
      });
      if (unique(members.map(function (tag) { return provinceTagFor(data, tag); })).length < 2) {
        throw new Error("A shared repeater area must cross a province or territory: " + id);
      }
      return {
        id: id,
        label: group.label,
        members: members,
        defaultForMembers: group.repeaterConfig.defaultForMembers === true,
        basis: group.repeaterConfig.basis || ""
      };
    }).filter(Boolean);
    data.externalTagLabels = {};
    data.externalTagParents = {};
    data.externalRegionPathList = Object.keys(data.externalRegionPaths || {}).map(function (id) {
      var record = data.externalRegionPaths[id];
      var path = unique(((record && record.path) || []).map(slug).filter(Boolean));
      if (!record || record.geographic !== false || record.automatic !== false || !path.length ||
          path.length !== (record.path || []).length) {
        throw new Error("The region catalog contains an invalid neighbouring network path: " + id);
      }
      path.forEach(function (tag, index) {
        if (data.hierarchy[tag]) {
          throw new Error("A neighbouring network tag collides with the Canadian hierarchy: " + tag);
        }
        var label = record.tagLabels && record.tagLabels[tag];
        if (!label) {
          throw new Error("A neighbouring network tag has no label: " + tag);
        }
        var parent = index ? path[index - 1] : null;
        if (Object.prototype.hasOwnProperty.call(data.externalTagParents, tag) &&
            data.externalTagParents[tag] !== parent) {
          throw new Error("A neighbouring network tag has conflicting parents: " + tag);
        }
        if (data.externalTagLabels[tag] && data.externalTagLabels[tag] !== label) {
          throw new Error("A neighbouring network tag has conflicting labels: " + tag);
        }
        data.externalTagParents[tag] = parent;
        data.externalTagLabels[tag] = label;
      });
      return {
        id: id,
        label: record.label,
        path: path,
        status: record.authority && record.authority.status || "provisional",
        source: record.authority && record.authority.source || "",
        sourceUrl: record.authority && record.authority.sourceUrl || "",
        eligibility: record.eligibility || "",
        trafficEvidence: record.trafficEvidence || null
      };
    }).sort(function (left, right) {
      return left.label.localeCompare(right.label);
    });
    Object.defineProperty(data, "__mccPrepared", { value: true });
    return data;
  }

  function applyGeneratedPartition(data, collection, resolverCollection) {
    data = prepareCatalog(data);
    var expected = {};
    (data.consolidatedRegionTags || []).forEach(function (tag) { expected[tag] = true; });

    if (collection) {
      if (collection.schema !== "meshcore-canada-iata-boundaries/v2" || !Array.isArray(collection.features) || !collection.features.length) {
        throw new Error("Canadian map layer is invalid");
      }
      var displaySeen = {};
      var partsSeen = {};
      var normalizedFeatures = collection.features.map(function (feature) {
        var tag = slug(feature.properties && feature.properties.tag);
        var source = feature.properties && feature.properties.regionSource;
        var partId = tag + ":" + source;
        if (!tag || partsSeen[partId] || !expected[tag] || ["meshmapper", "meshcore-canada"].indexOf(source) === -1) {
          throw new Error("Canadian map layer contains an invalid or duplicate region: " + (tag || "unknown"));
        }
        displaySeen[tag] = true;
        partsSeen[partId] = true;
        if (source === "meshcore-canada" && feature.properties.planningKind !== (data.status[tag].state === "published" ? "extension" : "starter")) throw new Error("Canadian map layer is invalid");
        return Object.assign({}, feature, {
          properties: Object.assign({}, feature.properties, {
            tag: tag,
            label: labelFor(data, tag),
            canonicalTag: tag,
            sourceTier: feature.properties.regionSource,
            boundaryType: feature.properties.planningKind === "extension" ? "planning-extension" : feature.properties.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region"
          })
        });
      });
      if (Object.keys(displaySeen).length !== Object.keys(expected).length) {
        throw new Error("Canadian map layer does not match the region catalog");
      }
      data.partitionRegions = Object.assign({}, collection, { features: normalizedFeatures });
      data.partitionByTag = {};
      normalizedFeatures.forEach(function (feature) {
        var tag = feature.properties.tag;
        if (!data.partitionByTag[tag] || feature.properties.regionSource === "meshmapper") data.partitionByTag[tag] = feature;
      });
      data.resolverRegions = data.partitionRegions;
      data.resolverByTag = data.partitionByTag;
    }

    if (resolverCollection) {
      if (!Array.isArray(resolverCollection.features) || !resolverCollection.features.length) {
        throw new Error("Canadian location layer is invalid");
      }
      var provinceTags = resolverCollection.features.map(function (feature) { return feature.properties.tag; });
      if (unique(provinceTags).length !== 13 || provinceTags.some(function (tag) { return !data.policy.provinces[tag]; })) {
        throw new Error("Canadian province lookup data is invalid");
      }
      data.jurisdictions = resolverCollection;
    }
    return data;
  }

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Lucide 0.547.0 SVG paths; ISC/Feather MIT notices are in vendor/lucide-LICENSE.
  // Include only the 17 icons used here, without downloading the full icon library.
  var ICONS = {
    "arrow-left": "<path d=\"m12 19-7-7 7-7\" /><path d=\"M19 12H5\" />",
    "arrow-right": "<path d=\"M5 12h14\" /><path d=\"m12 5 7 7-7 7\" />",
    "book-open-check": "<path d=\"M12 21V7\" /><path d=\"m16 12 2 2 4-4\" /><path d=\"M22 6V4a1 1 0 0 0-1-1h-5a4 4 0 0 0-4 4 4 4 0 0 0-4-4H3a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h6a3 3 0 0 1 3 3 3 3 0 0 1 3-3h6a1 1 0 0 0 1-1v-1.3\" />",
    "clipboard": "<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\" /><path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\" />",
    "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\" /><path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\" />",
    "download": "<path d=\"M12 15V3\" /><path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\" /><path d=\"m7 10 5 5 5-5\" />",
    "external-link": "<path d=\"M15 3h6v6\" /><path d=\"M10 14 21 3\" /><path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\" />",
    "link": "<path d=\"M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71\" /><path d=\"M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71\" />",
    "list-checks": "<path d=\"M13 5h8\" /><path d=\"M13 12h8\" /><path d=\"M13 19h8\" /><path d=\"m3 17 2 2 4-4\" /><path d=\"m3 7 2 2 4-4\" />",
    "locate-fixed": "<line x1=\"2\" x2=\"5\" y1=\"12\" y2=\"12\" /><line x1=\"19\" x2=\"22\" y1=\"12\" y2=\"12\" /><line x1=\"12\" x2=\"12\" y1=\"2\" y2=\"5\" /><line x1=\"12\" x2=\"12\" y1=\"19\" y2=\"22\" /><circle cx=\"12\" cy=\"12\" r=\"7\" /><circle cx=\"12\" cy=\"12\" r=\"3\" />",
    "map": "<path d=\"M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z\" /><path d=\"M15 5.764v15\" /><path d=\"M9 3.236v15\" />",
    "printer": "<path d=\"M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2\" /><path d=\"M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6\" /><rect x=\"6\" y=\"14\" width=\"12\" height=\"8\" rx=\"1\" />",
    "radio-tower": "<path d=\"M4.9 16.1C1 12.2 1 5.8 4.9 1.9\" /><path d=\"M7.8 4.7a6.14 6.14 0 0 0-.8 7.5\" /><circle cx=\"12\" cy=\"9\" r=\"2\" /><path d=\"M16.2 4.8c2 2 2.26 5.11.8 7.47\" /><path d=\"M19.1 1.9a9.96 9.96 0 0 1 0 14.1\" /><path d=\"M9.5 18h5\" /><path d=\"m8 22 4-11 4 11\" />",
    "search": "<path d=\"m21 21-4.34-4.34\" /><circle cx=\"11\" cy=\"11\" r=\"8\" />",
    "terminal": "<path d=\"M12 19h8\" /><path d=\"m4 17 6-6-6-6\" />",
    "triangle-alert": "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\" /><path d=\"M12 9v4\" /><path d=\"M12 17h.01\" />",
    "usb": "<circle cx=\"10\" cy=\"7\" r=\"1\" /><circle cx=\"4\" cy=\"20\" r=\"1\" /><path d=\"M4.7 19.3 19 5\" /><path d=\"m21 3-3 1 2 2Z\" /><path d=\"M9.26 7.68 5 12l2 5\" /><path d=\"m10 14 5 2 3.5-3.5\" /><path d=\"m18 12 1-1 1 1-1 1Z\" />"
  };

  function icon(name) {
    return '<svg class="mcc-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || "") + '</svg>';
  }

  function copyText(text, button, resetLabel) {
    var feedback = function (copied) {
      if (!button) return;
      var host = button.closest ? button.closest("[data-mcc-regions]") : null;
      var live = host && host.querySelector("[data-mcc-copy-status]");
      var originalHtml = button.dataset.originalHtml || button.innerHTML || resetLabel || "Copy";
      button.dataset.originalHtml = originalHtml;
      button.classList.toggle("is-copied", copied);
      button.innerHTML = copied ? "Copied" : "Copy failed";
      if (live) {
        live.textContent = "";
        window.setTimeout(function () {
          live.textContent = copied ? "Copied to clipboard." : "Copy failed. Select and copy the command manually.";
        }, 10);
      }
      window.setTimeout(function () {
        button.classList.remove("is-copied");
        button.innerHTML = button.dataset.originalHtml || resetLabel || "Copy";
      }, 1400);
    };
    var fallback = function () {
      var field = document.createElement("textarea");
      var copied = false;
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      try {
        copied = document.execCommand("copy");
      } catch (error) {
        copied = false;
      }
      field.remove();
      feedback(copied);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { feedback(true); }).catch(fallback);
    } else {
      fallback();
    }
  }

  function slug(value) {
    return String(value || "").toLowerCase().trim();
  }

  function statusFor(data, tag) {
    if (data.status && data.status[tag]) return data.status[tag];
    return {
      state: "draft",
      reviewer: "Unreviewed",
      source: "Canada MeshCore Region Strategy draft v1.1.1"
    };
  }

  function statusLabel(state) {
    if (state === "starter") return "MeshCore Canada starter region";
    if (state === "published") return "MeshMapper zone";
    if (state === "reserved") return "Reserved";
    if (state === "scope") return "Province scope";
    if (state === "pilot") return "ON/QC scope";
    if (state === "draft") return "Needs review";
    if (state === "proposal") return "Draft";
    if (state === "reviewed") return "Reviewed";
    if (state === "active") return "Active";
    if (state === "deprecated") return "Deprecated";
    return state || "Needs review";
  }

  function statusBadge(data, tag) {
    var state = statusFor(data, tag).state || "draft";
    return '<span class="mcc-badge mcc-badge-' + esc(state) + '">' + esc(statusLabel(state)) + "</span>";
  }

  function labelFor(data, tag) {
    var label = tag;
    if (data.hierarchy[tag]) label = frenchRuntime && data.hierarchy[tag].labelFr ? data.hierarchy[tag].labelFr : data.hierarchy[tag].label;
    else if (data.externalTagLabels && data.externalTagLabels[tag]) label = data.externalTagLabels[tag];
    return translateRuntimeText(label);
  }

  function scopeExists(data, tag) {
    return Boolean(data.hierarchy[tag]);
  }

  function parentFor(data, tag) {
    return data.hierarchy[tag] ? data.hierarchy[tag].parent : null;
  }

  function childrenFor(data, tag) {
    if (data.policy.provinces[tag]) {
      return data.seeds.filter(function (seed) { return seed.provinces.indexOf(tag) !== -1; })
        .map(function (seed) { return seed.tag; }).sort(function (a, b) { return labelFor(data, a).localeCompare(labelFor(data, b)); });
    }
    return Object.keys(data.hierarchy || {}).filter(function (candidate) {
      return parentFor(data, candidate) === tag;
    }).sort(function (a, b) {
      return labelFor(data, a).localeCompare(labelFor(data, b));
    });
  }

  function leafDescendants(data, tag) {
    var children = childrenFor(data, tag);
    if (!children.length) return seedForTag(data, tag) ? [tag] : [];
    return unique([].concat.apply([], children.map(function (child) {
      return leafDescendants(data, child);
    })));
  }

  function featuresForNode(data, tag) {
    var leaves = leafDescendants(data, tag);
    return {
      type: "FeatureCollection",
      features: (data.partitionRegions && data.partitionRegions.features || []).filter(function (feature) { return leaves.indexOf(feature.properties.tag) !== -1; })
    };
  }

  function ancestryFor(data, tag, province) {
    if (data.hierarchy[tag] && data.hierarchy[tag].kind === "city" && data.policy.provinces[province]) return ["can", province, tag];
    var chain = [];
    var seen = {};
    var cur = tag;
    while (cur && !seen[cur]) {
      seen[cur] = true;
      chain.unshift(cur);
      cur = parentFor(data, cur);
    }
    return chain;
  }

  function unique(values) {
    var seen = {};
    return values.filter(function (value) {
      if (seen[value]) return false;
      seen[value] = true;
      return true;
    });
  }

  function provinceTagFor(data, tag) {
    var chain = ancestryFor(data, tag);
    return chain.length > 1 ? chain[1] : tag;
  }

  function ancestryText(data, tag) {
    return ancestryFor(data, tag).join(" -> ");
  }

  function sharedRepeaterAreaForTag(data, tag) {
    return (data.sharedRepeaterAreas || []).find(function (area) {
      return area.members.indexOf(tag) !== -1;
    }) || null;
  }

  function canonicalLeafOrder(data, tags) {
    var seedTags = {};
    (data.seeds || []).forEach(function (seed) { seedTags[seed.tag] = true; });
    return unique(tags || []).filter(function (tag) {
      return Boolean(seedTags[tag]);
    }).sort(function (left, right) {
      return ancestryText(data, left).localeCompare(ancestryText(data, right));
    });
  }

  function expandSharedRepeaterLeaves(data, tags) {
    var expanded = canonicalLeafOrder(data, tags);
    expanded.slice().forEach(function (tag) {
      var area = sharedRepeaterAreaForTag(data, tag);
      if (area && area.defaultForMembers) {
        expanded = expanded.concat(area.members);
      }
    });
    return canonicalLeafOrder(data, expanded);
  }

  function selectedExternalRegionPaths(data, ids) {
    var selected = {};
    unique(ids || []).forEach(function (id) { selected[id] = true; });
    return (data.externalRegionPathList || []).filter(function (record) {
      return Boolean(selected[record.id]);
    }).sort(function (left, right) {
      return left.path.join("/").localeCompare(right.path.join("/"));
    });
  }

  function defaultRepeaterLeaves(data, primaryTag) {
    return expandSharedRepeaterLeaves(data, [primaryTag]);
  }

  function labelledPath(data, path) {
    return path.map(function (tag) { return labelFor(data, tag); }).join(" › ");
  }

  function seedText(seed) {
    return seed
      ? seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km"
      : "No seed";
  }

  function provinceOptions(data) {
    var tags = Object.keys(data.policy.provinces);
    return tags.sort(function (a, b) {
      return labelFor(data, a).localeCompare(labelFor(data, b));
    });
  }

  function knownProvince(data, tag) {
    return typeof tag === "string" && Object.prototype.hasOwnProperty.call(data.policy.provinces, tag);
  }

  function migratedCitySelection(data, value) {
    var names = String(value || "").split(",").map(slug).filter(Boolean);
    if (names.length > 64) return { tags: [], unresolved: ["Too many saved zones"] };
    var tags = [], unresolved = [];
    names.forEach(function (name) {
      if (seedForTag(data, name)) tags.push(name);
      else {
        var aliases = data.legacyAliases[name];
        if (Array.isArray(aliases) && aliases.length === 1 && seedForTag(data, aliases[0])) tags.push(aliases[0]);
        else unresolved.push(name);
      }
    });
    return { tags: unique(tags), unresolved: unique(unresolved) };
  }

  function regionPageHref(page) {
    var host = document.querySelector("[data-mcc-regions][data-mcc-root]");
    if (!host && window.location.pathname.indexOf(".html") !== -1) {
      return (page === "config" ? "config" : page) + ".html";
    }
    var routes = { dashboard: "", config: "", setup: "", map: "map/", standard: "standard/" };
    var root = host ? host.getAttribute("data-mcc-root") : "./";
    return new URL(routes[page] || "", new URL(root, document.baseURI)).href;
  }

  function mapHrefForState(state) {
    var params = new URLSearchParams();
    if (!state.manualSelection && Number.isFinite(state.lat)) params.set("lat", state.lat.toFixed(6));
    if (!state.manualSelection && Number.isFinite(state.lon)) params.set("lon", state.lon.toFixed(6));
    if (state.name) params.set("name", state.name);
    if (state.resolution && state.resolution.primary) {
      params.set("tag", state.forcedTag || state.resolution.primary.seed.tag);
    }
    if (state.type === "high-site") params.set("type", "large");
    var savedRegions = (state.selectedMetros || []).concat(state.unresolvedRegions || []);
    if (savedRegions.length) {
      params.set("regions", savedRegions.join(","));
    }
    if (state.selectedExternalPaths && state.selectedExternalPaths.length) {
      params.set("external", state.selectedExternalPaths.join(","));
    }
    if (state.firmware) params.set("firmware", state.firmware);
    if (state.radioProfile) params.set("radio", state.radioProfile);
    if (state.hashMode) params.set("hash", state.hashMode);
    if (state.jurisdictionTag) params.set("province", state.jurisdictionTag);
    if (state.standardDefaults) params.set("defaults", "onqc");
    if (state.deviceRole) params.set("role", state.deviceRole);
    if (state.wizardStep) params.set("step", state.wizardStep);
    if (state.finishPath) params.set("instructions", state.finishPath);
    return regionPageHref("map") + (params.toString() ? "?" + params.toString() : "");
  }

  function keepLanguageSelection(state) {
    document.querySelectorAll(".md-select__link[hreflang]").forEach(function (link) {
      // Transfer only the tool's public selections, never arbitrary URL fields or secrets.
      link.addEventListener("click", function () {
        var target = new URL(link.href);
        target.search = new URL(mapHrefForState(state)).search;
        link.href = target.href;
      });
    });
  }

  function initialLocation(data, params) {
    var originalTag = slug(params.get("tag") || "");
    var tag = originalTag;
    var legacy = Array.isArray(data.legacyAliases[tag]) ? data.legacyAliases[tag] : [];
    if (!seedForTag(data, tag) && legacy.length === 1) tag = legacy[0];
    var seed = tag && seedForTag(data, tag);
    var hasCoordinates = params.has("lat") || params.has("lon");
    if (!seed && !hasCoordinates) return null;
    if (!seed) tag = null;
    var point = hasCoordinates
      ? configuratorSupport.parseCoordinates(params.get("lat"), params.get("lon"))
      : seed;
    if (!point) return null;
    return { lat: point.lat, lon: point.lon, tag: tag || null, countryCode: "ca",
      source: hasCoordinates ? "coordinates" : "region",
      provinceTag: knownProvince(data, params.get("province")) ? params.get("province") : null,
      legacyTag: originalTag && originalTag !== tag ? originalTag : null,
      name: String(params.get("name") || (tag && labelFor(data, tag)) || "").slice(0, 160) };
  }

  function configHrefForState(state) {
    var mapHref = new URL(mapHrefForState(state));
    return regionPageHref("config") + mapHref.search;
  }
  function haversineKm(aLat, aLon, bLat, bLon) {
    var rad = function (d) { return d * Math.PI / 180; };
    var dLat = rad(bLat - aLat);
    var dLon = rad(bLon - aLon);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) *
      Math.cos(rad(aLat)) * Math.cos(rad(bLat));
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function rankSeeds(data, lat, lon, jurisdictionTag) {
    return data.seeds.filter(function (seed) {
      return seed.resolve !== false;
    }).map(function (seed) {
      var km = haversineKm(lat, lon, seed.lat, seed.lon);
      return {
        seed: seed,
        km: km,
        score: km,
        ancestry: ancestryFor(data, seed.tag, jurisdictionTag)
      };
    }).sort(function (a, b) {
      return a.score - b.score;
    });
  }

  function pointInRing(lon, lat, ring) {
    var inside = false;
    for (var i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      var xi = Number(ring[i][0]);
      var yi = Number(ring[i][1]);
      var xj = Number(ring[j][0]);
      var yj = Number(ring[j][1]);
      var crosses = ((yi > lat) !== (yj > lat)) &&
        (lon < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi);
      if (crosses) inside = !inside;
    }
    return inside;
  }

  function featureContainsPoint(feature, lat, lon) {
    if (!feature || !feature.geometry) return false;
    var geometry = feature.geometry;
    var polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
    if (!Array.isArray(polygons)) return false;
    return polygons.some(function (polygon) {
      if (!polygon || !polygon.length || !pointInRing(lon, lat, polygon[0])) return false;
      return !polygon.slice(1).some(function (hole) { return pointInRing(lon, lat, hole); });
    });
  }

  function boundaryFeatureAt(data, lat, lon, forcedTag, jurisdictionTag) {
    var features = data.resolverRegions && data.resolverRegions.features ||
      data.partitionRegions && data.partitionRegions.features || [];
    features = features.filter(function (feature) { return featureContainsPoint(feature, lat, lon); });
    var published = features.filter(function (feature) { return feature.properties.regionSource === "meshmapper"; });
    if (published.length) features = published;
    if (forcedTag) {
      var forced = features.find(function (feature) { return feature.properties.tag === slug(forcedTag); });
      return forced || null;
    }
    return features.length === 1 ? features[0] : null;
  }

  function resolveLocation(data, lat, lon, forcedTag, jurisdictionTag, manualSelection) {
    var ranked = rankSeeds(data, lat, lon, jurisdictionTag);
    var boundary = boundaryFeatureAt(data, lat, lon, forcedTag, jurisdictionTag);
    var boundaryTag = boundary ? String(boundary.properties.tag).toLowerCase() : null;
    var primary = boundaryTag
      ? ranked.find(function (entry) { return entry.seed.tag === boundaryTag; }) || null
      : null;
    var matches = data.resolverRegions ? iataScopes.matches(data.resolverRegions, lat, lon) : [];
    var physicalProvince = data.jurisdictions ? iataScopes.provinceAt(data.jurisdictions, lat, lon) : null;
    var province = !manualSelection && physicalProvince ? physicalProvince :
      knownProvince(data, jurisdictionTag) ? jurisdictionTag :
        manualSelection && forcedTag && primary && primary.seed.provinces.length > 1 ? null : physicalProvince;
    if (primary) {
      ranked = [primary].concat(ranked.filter(function (entry) { return entry.seed.tag !== primary.seed.tag; }));
    }
    var secondary = ranked.find(function (entry) {
      return !primary || entry.seed.tag !== primary.seed.tag;
    }) || null;

    return {
      primary: primary,
      secondary: secondary,
      top5: ranked.slice(0, 5),
      nearestKm: ranked[0] ? ranked[0].km : Infinity,
      boundary: boundary,
      displayBoundary: boundary,
      insideBoundary: Boolean(boundary),
      hasMatch: Boolean(primary),
      matches: matches,
      province: province,
      sourceTier: boundary ? boundary.properties.regionSource : null,
      planningKind: boundary ? boundary.properties.planningKind || null : null,
      coverageKm: 0
    };
  }

  function recommend(data, resolution, type, selectedMetros, selectedExternalPaths) {
    if (!resolution || !resolution.primary || !resolution.province) return null;
    return iataScopes.profile(data, {
      home: resolution.primary.seed.tag,
      province: resolution.province,
      bridge: type === "high-site",
      cities: type === "high-site" ? selectedMetros || [] : [],
      external: type === "high-site" ? selectedExternalPaths || [] : []
    });
  }

  function utf8Bytes(value) {
    if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(String(value)).length;
    return unescape(encodeURIComponent(String(value))).length;
  }

  function regionBudget(tags) {
    return {
      tagCount: tags.length,
      // Firmware's regions response includes the terminating NUL byte.
      responseBytes: utf8Bytes(tags.join(",")) + 1
    };
  }

  function effectiveParentFor(data, tag, parentOverrides) {
    if (parentOverrides && Object.prototype.hasOwnProperty.call(parentOverrides, tag)) {
      return parentOverrides[tag];
    }
    return parentFor(data, tag);
  }

  function regionDefTokens(data, tags, parentOverrides) {
    return tags.map(function (tag, index) {
      if (index === tags.length - 1) return tag;
      var next = tags[index + 1];
      var nextParent = effectiveParentFor(data, next, parentOverrides) || "*";
      return nextParent === tag ? tag : tag + "|" + nextParent;
    });
  }

  function buildCommands(data, recommendation, settings) {
    if (["1.14", "1.15", "1.16"].indexOf(settings.firmware) === -1) throw new Error("Choose a supported firmware version.");
    var lines = radioProfiles ? radioProfiles.commands(settings.radioProfile, settings.hashMode) : [];
    if (settings.standardDefaults && recommendation.companionDefault === "onqc") {
      lines = lines.concat(iataScopes.standardCommands(settings.firmware, false));
    }
    return lines.concat(iataScopes.commands(recommendation, settings.firmware));
  }

  function hueForTag(tag) {
    var hash = 0;
    for (var i = 0; i < tag.length; i += 1) {
      hash = (hash * 31 + tag.charCodeAt(i)) % 360;
    }
    return hash;
  }

  function colorForTag(tag) {
    return "hsl(" + hueForTag(tag) + ", 55%, 45%)";
  }

  function hierarchyLevelName(index, chain) {
    if (index === 0) return "Country";
    if (index === 1) return "Province / Territory";
    if (index === chain.length - 1) {
      return chain.length > 3 ? "Local Region" : "Region";
    }
    return "Area Group";
  }

  function parseCanadianPostalCode(query) {
    var compact = query.trim().replace(/[\s-]+/g, "").toUpperCase();
    return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(compact)
      ? { compact: compact, formatted: compact.slice(0, 3) + " " + compact.slice(3) }
      : null;
  }

  function parseNominatimHit(hit) {
    var address = hit.address || {};
    var parts = String(hit.display_name || "").split(",").map(function (part) {
      return part.trim();
    }).filter(Boolean);
    return {
      lat: parseFloat(hit.lat),
      lon: parseFloat(hit.lon),
      name: parts.slice(0, 4).join(", "),
      countryCode: slug(address.country_code),
      province: address.state || address.province || null
    };
  }

  function normalizeLocationSearch(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  var CANADIAN_PROVINCE_CODES = {
    ab: "AB", alberta: "AB",
    bc: "BC", "british-columbia": "BC",
    mb: "MB", manitoba: "MB",
    nb: "NB", "new-brunswick": "NB",
    nl: "NL", nf: "NL", newfoundland: "NL", "newfoundland-and-labrador": "NL",
    ns: "NS", "nova-scotia": "NS",
    nt: "NT", nwt: "NT", "northwest-territories": "NT",
    nu: "NU", nunavut: "NU",
    on: "ON", ontario: "ON",
    pe: "PE", pei: "PE", "prince-edward-island": "PE",
    qc: "QC", pq: "QC", quebec: "QC",
    sk: "SK", saskatchewan: "SK",
    yt: "YT", yukon: "YT", "yukon-territory": "YT"
  };

  function jurisdictionTagFromGeo(geo) {
    var value = String(geo && geo.province || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    var code = CANADIAN_PROVINCE_CODES[value] || value;
    return slug(code);
  }

  function parseGeocoderCaHit(body, fallbackName) {
    var standard = body && body.standard || {};
    var lat = parseFloat(body && body.latt);
    var lon = parseFloat(body && body.longt);
    var province = CANADIAN_PROVINCE_CODES[slug(standard.prov || standard.province)];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !province) return null;
    return {
      lat: lat,
      lon: lon,
      name: [standard.city, province].filter(Boolean).join(", ") || fallbackName,
      countryCode: "ca",
      province: province
    };
  }

  function localGeocode(data, query) {
    var needle = normalizeLocationSearch(query);
    if (needle.length < 2) return null;
    // Only codes identify a region. Town aliases must resolve their own location,
    // not the seed of a large zone (for example Gatineau, QC versus Ottawa, ON).
    if (!data.seeds.some(function (seed) { return seed.tag === needle; }) &&
        !Object.prototype.hasOwnProperty.call(data.legacyAliases || {}, needle)) return null;
    var matches = (data.seeds || []).filter(function (seed) {
      return seed.resolve !== false;
    }).map(function (seed) {
      var names = unique([seed.tag, labelFor(data, seed.tag)].concat(data.regionAliases[seed.tag] || []).filter(Boolean));
      var score = Infinity;
      names.forEach(function (name) {
        var normalized = normalizeLocationSearch(name);
        if (!normalized) return;
        if (normalized === needle) score = Math.min(score, normalized === normalizeLocationSearch(seed.tag) ? 0 : 1);
        else if (needle.length >= 3 && (normalized.indexOf(needle) !== -1 || needle.indexOf(normalized) !== -1)) score = Math.min(score, 2);
      });
      return { seed: seed, names: names, score: score };
    }).filter(function (item) {
      return Number.isFinite(item.score);
    }).sort(function (a, b) {
      return a.score - b.score;
    });
    if (!matches.length) return null;
    var best = matches[0];
    var tied = matches.filter(function (item) { return item.score === best.score; });
    if (tied.length > 1 && best.score > 1) return null;
    if (tied.length > 1) {
      return {
        ambiguous: true,
        choices: tied.map(function (item) {
          var province = provinceTagFor(data, item.seed.tag);
          return { tag: item.seed.tag, lat: item.seed.lat, lon: item.seed.lon, countryCode: "ca", source: "region",
            name: labelFor(data, item.seed.tag) + " (" + item.seed.provinces.map(function (value) { return value.toUpperCase(); }).join("/") + ")" };
        })
      };
    }
    var displayName = best.names.find(function (name) {
      return normalizeLocationSearch(name) === needle;
    }) || labelFor(data, best.seed.tag);
    if (normalizeLocationSearch(displayName) === normalizeLocationSearch(best.seed.tag)) displayName = best.seed.tag.toUpperCase() + " — " + labelFor(data, best.seed.tag);
    var provinceTag = provinceTagFor(data, best.seed.tag);
    return {
      lat: Number(best.seed.lat),
      lon: Number(best.seed.lon),
      name: [displayName, best.seed.provinces.length === 1 && provinceTag && labelFor(data, provinceTag)].filter(Boolean).join(", "),
      countryCode: "ca",
      province: best.seed.provinces.length === 1 && provinceTag ? labelFor(data, provinceTag) : null,
      tag: best.seed.tag,
      source: "region",
      exactLocalMatch: best.score <= 1
    };
  }

  function nominatimSearch(params, signal) {
    var url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams(Object.assign({
      format: "json",
      limit: "1",
      addressdetails: "1"
    }, params));
    return fetchWithTimeout(url, {
      headers: { "Accept-Language": frenchRuntime ? "fr-CA,fr,en" : "en-CA,en" },
      signal: signal
    }, REQUEST_TIMEOUT_MS)
      .then(function (res) {
        if (!res.ok) throw new Error("Geocoding service error");
        return res.json();
      })
      .then(function (rows) {
        return rows.length ? parseNominatimHit(rows[0]) : null;
      });
  }

  function geocodeCanadianPostal(postal, signal) {
    return nominatimSearch({ postalcode: postal.formatted, country: "ca" }, signal).then(function (hit) {
      if (hit) return hit;
      return nominatimSearch({ q: postal.formatted, countrycodes: "ca" }, signal);
    }).then(function (hit) {
      if (hit) return hit;
      return fetchWithTimeout(
        "https://geocoder.ca/?locate=" + encodeURIComponent(postal.compact) + "&json=1",
        { signal: signal },
        REQUEST_TIMEOUT_MS
      )
        .then(function (res) {
          if (!res.ok) throw new Error("Geocoding service error");
          return res.json();
        })
        .then(function (body) {
          var hit = parseGeocoderCaHit(body, postal.formatted);
          if (!hit) throw new Error("No matching Canadian postal code found");
          hit.name = [postal.formatted, hit.name].filter(Boolean).join(", ");
          return hit;
        });
    });
  }

  function showLocationChoices(target, choices, choose) {
    if (!choices) return;
    choices.forEach(function (geo) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "mcc-button mcc-button-secondary";
      button.textContent = geo.name + (geo.tag ? " (" + geo.tag.toUpperCase() + ")" : "");
      button.addEventListener("click", function () { choose(geo); });
      target.appendChild(button);
    });
  }

  function geocode(data, query, signal) {
    var localMatch = localGeocode(data, query);
    if (localMatch && localMatch.ambiguous) {
      var error = new Error("Choose the region you mean:");
      error.choices = localMatch.choices;
      return Promise.reject(error);
    }
    if (localMatch && localMatch.exactLocalMatch) return Promise.resolve(localMatch);
    var postal = parseCanadianPostalCode(query);
    if (postal) return geocodeCanadianPostal(postal, signal);
    var places = window.MeshCorePlaceSearch;
    return places.lookup(query, frenchRuntime ? "fr" : "en", function (url) {
      return fetchWithTimeout(url, { signal: signal, credentials: "omit" }, REQUEST_TIMEOUT_MS);
    }).then(function (results) {
        var choices = results.map(function (place) {
          return { lat: place.lat, lon: place.lon, name: place.name + ", " + place.province,
            countryCode: "ca", province: places.provinceCode(place.province).toLowerCase() };
        });
        if (choices.length === 1) return choices[0];
        if (!choices.length) throw new Error("Online place lookup is unavailable. Enter coordinates or browse the region list.");
        var error = new Error("Choose the place you mean:");
        error.choices = choices;
        throw error;
      });
  }

  function isCanada(geo) {
    return slug(geo.countryCode) === "ca";
  }

  function setStatus(target, message, type) {
    if (!target) return;
    target.setAttribute("role", type === "error" ? "alert" : "status");
    target.setAttribute("aria-live", type === "error" ? "assertive" : "polite");
    target.setAttribute("aria-atomic", "true");
    target.innerHTML = message
      ? '<div class="mcc-status mcc-status-' + esc(type || "info") + '">' + message + "</div>"
      : "";
  }

  function renderCandidateList(data, target, state, onPick) {
    if (!target || !state.resolution) return;
    target.innerHTML = state.resolution.top5.map(function (entry, index) {
      var tag = entry.seed.tag;
      var selected = tag === state.forcedTag || (!state.forcedTag && index === 0);
      var ancestry = ancestryFor(data, tag).map(function (item) {
        return item;
      }).join(" -> ");
      return '<button type="button" class="mcc-candidate' + (selected ? " is-selected" : "") + '" data-tag="' + esc(tag) + '">' +
        '<span class="mcc-candidate-rank">' + (index + 1) + "</span>" +
        "<span>" +
        '<span class="mcc-candidate-title"><code>' + esc(tag) + "</code> " + esc(labelFor(data, tag)) + "</span>" +
        '<span class="mcc-candidate-meta">' + esc(ancestry) + "</span>" +
        "</span>" +
        '<span class="mcc-candidate-distance">~' + Math.round(entry.km) + " km</span>" +
        "</button>";
    }).join("");

    target.querySelectorAll("[data-tag]").forEach(function (button) {
      button.addEventListener("click", function () {
        onPick(button.getAttribute("data-tag"));
      });
    });
  }

  function renderMetroChips(data, target, state, onChange) {
    if (!target) return;
    if (state.type !== "high-site" || !state.resolution) {
      target.innerHTML = "";
      return;
    }
    var primaryTag = state.resolution.primary.seed.tag;
    if (!state.selectedMetros.length) {
      state.selectedMetros = defaultRepeaterLeaves(data, primaryTag);
    }
    state.selectedExternalPaths = state.selectedExternalPaths || [];
    var sharedArea = sharedRepeaterAreaForTag(data, primaryTag);
    var requiredTags = defaultRepeaterLeaves(data, primaryTag);
    state.selectedMetros = expandSharedRepeaterLeaves(data, state.selectedMetros.concat(requiredTags));
    var nearbyTags = rankSeeds(data, state.lat, state.lon, null).slice(0, 6).map(function (entry) {
      return entry.seed.tag;
    });
    var visibleTags = canonicalLeafOrder(data, state.selectedMetros.concat(nearbyTags));
    var groups = [{ label: "Nearby city zones", tags: visibleTags }];
    var allGroups = [{ label: "Other IATA regions", tags: data.seeds.map(function (seed) { return seed.tag; }).filter(function (tag) { return visibleTags.indexOf(tag) === -1; }) }];
    var sharedNote = sharedArea
      ? '<div class="mcc-shared-area-note"><strong>Shared repeater area</strong><span>' +
        esc(sharedArea.label) + " keeps " + esc(sharedArea.members.map(function (tag) {
          return labelFor(data, tag);
        }).join(" and ")) + " in one repeater configuration.</span></div>"
      : "";
    var externalChoices = (data.externalRegionPathList || []).map(function (record) {
      var checked = state.selectedExternalPaths.indexOf(record.id) !== -1 ? " checked" : "";
      var status = record.status === "documented" ? "community path" : "confirm locally";
      return '<label class="mcc-neighbour-path"><input type="checkbox" data-external-path value="' +
        esc(record.id) + '"' + checked + '><span><strong>' + esc(record.label) + '</strong><small><code>' +
        esc(record.path.join(" › ")) + "</code> · " + esc(status) + "</small></span></label>";
    }).join("");

    target.innerHTML = (state.migrationNeedsReview
      ? '<div class="mcc-note mcc-note-warning"><strong>Review the replacement scope list</strong><p>These saved zones need a new choice:</p><p><code>' + esc((state.unresolvedRegions || []).join(", ")) + '</code></p><label class="mcc-choice"><input type="checkbox" data-action="confirm-scope-migration"><span>I checked the replacement scope list.</span></label></div>'
      : '') +
      '<p class="mcc-hint">Select only city zones this repeater links. Edge mode blocks unscoped floods.</p>' +
      sharedNote +
      '<h3 class="mcc-picker-heading">Canadian regions</h3>' +
      '<p class="mcc-hint">An edge repeater can carry several IATA codes. Its province scope stays the province where it is installed.</p>' +
      '<div class="mcc-served-region-groups">' +
      groups.map(function (group) {
        return '<div class="mcc-chip-group"><strong>' + esc(group.label) + '</strong><div class="mcc-chip-list">' +
          group.tags.map(function (tag) {
            var checked = state.selectedMetros.indexOf(tag) !== -1 ? " checked" : "";
            var required = requiredTags.indexOf(tag) !== -1;
            return '<label class="mcc-chip' + (required ? " is-required" : "") + '"><input type="checkbox" data-canadian-region value="' +
              esc(tag) + '"' + checked + (required ? " disabled" : "") + '> <code>' + esc(tag) + "</code> " +
              esc(labelFor(data, tag)) + (required ? '<span class="mcc-chip-required">required</span>' : "") + "</label>";
          }).join("") +
          "</div></div>";
      }).join("") +
      '</div>' +
      '<label class="mcc-label mcc-add-region-label">Add any Canadian region</label>' +
      '<select class="mcc-select" data-action="add-served-region">' +
      '<option value="">Choose a region</option>' +
      allGroups.map(function (group) {
        return '<optgroup label="' + esc(group.label) + '">' + group.tags.map(function (tag) {
          return '<option value="' + esc(tag) + '">' + esc(labelFor(data, tag)) + " (" + esc(tag) + ")</option>";
        }).join("") + "</optgroup>";
      }).join("") +
      "</select>" +
      (externalChoices
        ? '<div class="mcc-neighbour-paths"><h3 class="mcc-picker-heading">Neighbouring network paths</h3>' +
          '<p class="mcc-hint">Add one only when this repeater should forward traffic for that area. Nothing outside Canada is added to the boundary map.</p>' +
          '<div class="mcc-neighbour-path-list">' + externalChoices + "</div></div>"
        : "");

    target.querySelectorAll("input[data-canadian-region]").forEach(function (input) {
      input.addEventListener("change", function () {
        var selected = Array.prototype.slice.call(target.querySelectorAll("input[data-canadian-region]:checked")).map(function (item) {
          return item.value;
        });
        var changedArea = sharedRepeaterAreaForTag(data, input.value);
        if (changedArea && changedArea.defaultForMembers) {
          selected = input.checked
            ? selected.concat(changedArea.members)
            : selected.filter(function (tag) { return changedArea.members.indexOf(tag) === -1; });
        }
        state.selectedMetros = expandSharedRepeaterLeaves(data, selected.concat(requiredTags));
        renderMetroChips(data, target, state, onChange);
        onChange();
      });
    });
    target.querySelectorAll("input[data-external-path]").forEach(function (input) {
      input.addEventListener("change", function () {
        state.selectedExternalPaths = Array.prototype.slice.call(target.querySelectorAll("input[data-external-path]:checked")).map(function (item) {
          return item.value;
        });
        onChange();
      });
    });
    var addRegion = target.querySelector("[data-action='add-served-region']");
    if (addRegion) {
      addRegion.addEventListener("change", function () {
        if (!addRegion.value) return;
        state.selectedMetros = expandSharedRepeaterLeaves(data, state.selectedMetros.concat(addRegion.value));
        renderMetroChips(data, target, state, onChange);
        onChange();
      });
    }
    var confirm = target.querySelector("[data-action='confirm-scope-migration']");
    var nextButton = target.closest("[data-wizard-step]") && target.closest("[data-wizard-step]").querySelector("[data-next-step]");
    if (nextButton) nextButton.disabled = Boolean(state.migrationNeedsReview);
    if (confirm) confirm.addEventListener("change", function () {
      if (!confirm.checked) return;
      state.migrationNeedsReview = false;
      state.unresolvedRegions = [];
      confirm.disabled = true;
      if (nextButton) nextButton.disabled = false;
      onChange();
    });
  }

  function planningNotice(resolution) {
    if (resolution.sourceTier !== "meshcore-canada") return "";
    var extension = resolution.planningKind === "extension";
    return '<div class="mcc-note mcc-note-warning"><strong>' + (extension ? 'MeshCore Canada planning extension' : 'MeshCore Canada starter region') + '</strong><p>' +
      (extension ? 'This point is outside the published MeshMapper boundary. MeshCore Canada assigns the gap to this nearby IATA region for planning; confirm its use locally.' : 'This broad starter region is assigned by MeshCore Canada, not yet published by MeshMapper. Confirm its use with local operators; it does not promise radio coverage.') +
      '</p><a href="' + esc(regionPageHref("standard") + (extension ? '#planning-extensions' : '#starter-regions')) + '">' + (extension ? 'Planning extension details' : 'Starter region details') + '</a></div>';
  }

  function onqcRolloutNotice() {
    var href = new URL("../proposals/onqc-scopes/", regionPageHref("config")).href +
      (frenchRuntime ? "#ordre-de-deploiement" : "#rollout-order");
    return '<div class="mcc-note mcc-note-warning" data-onqc-rollout><strong>ON/QC rollout: repeaters first</strong>' +
      '<p>Phase 2 is not open. Personal companions keep their default scope empty and channels unscoped until the rollout is announced: January 2027 at the earliest, after the repeaters are ready.</p>' +
      '<a href="' + esc(href) + '">Rollout phases</a></div>';
  }

  function renderResult(data, target, state) {
    if (!target) return;
    if (state.migrationNeedsReview) {
      target.innerHTML = '<div class="mcc-status mcc-status-warning" role="status">Review the replacement scope list in step 3 before copying commands.</div>';
      return;
    }
    if (!state.canGenerate) {
      target.innerHTML = '<div class="mcc-empty-state">' +
        icon("radio-tower") +
        '<strong>No region yet</strong>' +
        '<span>Choose a location first.</span>' +
        '</div>';
      return;
    }

    var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
    if (!rec) {
      target.innerHTML = '<div class="mcc-empty-state">' + icon("radio-tower") + '<strong>No region yet</strong></div>';
      return;
    }
    if (rec.budget.tagCount > 32 || rec.budget.responseBytes > 160) {
      target.innerHTML = '<div class="mcc-empty-state">' +
        icon("triangle-alert") +
        '<strong>Too many regions selected</strong>' +
        '<span>This selection uses ' + esc(rec.budget.tagCount) + ' tags and ' + esc(rec.budget.responseBytes) + ' bytes. Remove regions until it fits the 32-tag and 160-byte limits.</span>' +
        '</div>';
      return;
    }
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    if (["1.14", "1.15", "1.16"].indexOf(firmware) === -1) {
      target.innerHTML = '<div class="mcc-status mcc-status-warning" role="status">Choose a supported firmware version.</div>';
      return;
    }
    var commands = buildCommands(data, rec, state);
    var technicalCommands = commands.concat(["region", "region save", "region"]);
    var titleTag = state.resolution.primary.seed.tag;
    var statusNotes = rec.notes.map(function (note) {
      var warning = note.indexOf("Check locally") === 0 || note.indexOf("Do not use") === 0 ||
        note.indexOf("Approximate") === 0 || note.indexOf("Confirm ") === 0 ||
        note.indexOf("Too many") === 0 || note.indexOf("Region names use") === 0;
      return '<div class="mcc-note' + (warning ? " mcc-note-warning" : "") + '">' + esc(note) + "</div>";
    }).join("");
    var firmwareLabel = firmware === "1.16" ? "v1.16+" : firmware === "1.15" ? "v1.15.x" : "v1.14.x";
    var guided = state.finishPath === "guided";
    var verificationCommands = ["region"];
    if (state.radioProfile !== "keep") verificationCommands.push("get radio");
    if (state.hashMode !== "keep") verificationCommands.push("get path.hash.mode");
    var expectedPaths = rec.paths.map(function (path) { return path.join(" / ") + " — " + labelledPath(data, path); });
    var expectedPathMarkup = '<div class="mcc-region-path-list">' + expectedPaths.map(function (path) {
      return "<span>" + esc(path) + "</span>";
    }).join("") + "</div>";
    var multiProvince = rec.jurisdictions.length > 1;
    var scopeNotices = [];
    if (rec.companionDefault === "onqc") {
      scopeNotices.push(onqcRolloutNotice());
      scopeNotices.push('<div class="mcc-note" data-onqc-settings-summary><strong>' +
        (state.standardDefaults ? 'ON/QC Phase 1 standard settings included' : 'ON/QC Phase 1 standard settings not included') +
        '</strong><p>' + (state.standardDefaults ? '3-byte IDs, local adverts every 4 hours, flood adverts every 47 hours, and a 16-hop flood limit.' :
          'These commands do not include all of the proposal’s standard ID, advert and hop settings. Select the ON/QC option in step 3 if you want to include them.') + '</p></div>');
    }
    if (rec.sharedArea) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Shared repeater area</strong><span>' +
        esc(rec.sharedArea.label) + " combines " + esc(rec.sharedArea.members.map(function (tag) {
          return labelFor(data, tag);
        }).join(" and ")) + " in one repeater setup. All map boundaries remain separate.</span></div>");
    } else if (multiProvince) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Cross-province repeater setup</strong><span>' +
        esc(rec.jurisdictions.map(function (tag) { return labelFor(data, tag); }).join(" + ")) +
        ". Each map region keeps its own boundary.</span></div>");
    }
    if (rec.externalPaths.length) {
      scopeNotices.push('<div class="mcc-shared-area-note"><strong>Neighbouring network paths</strong><span>' +
        esc(rec.externalPaths.map(function (record) { return record.label; }).join(" + ")) +
        " is added to this repeater only. MeshCore Canada does not own or draw those boundaries.</span></div>");
    }
    var scopeNotice = scopeNotices.join("");
    var resultBody = guided
      ? '<div class="mcc-guide-panel">' +
        '<ol class="mcc-guide-steps">' +
        '<li class="mcc-guide-connect"><div><h4>Connect to the repeater CLI</h4><p>Use USB at the repeater or remote management over LoRa.</p>' +
        '<div class="mcc-connect-methods">' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("usb") + '<div><h5>USB serial</h5><small>At the repeater</small></div></div>' +
        '<ol><li>Connect the repeater to a computer with a data-capable USB cable.</li>' +
        '<li>In desktop Chrome or Edge, open the <a href="https://meshcore.io/flasher" target="_blank" rel="noopener noreferrer">MeshCore Flasher</a>. For Gessaman\'s MQTT Observer firmware, use the <a href="https://observer.gessaman.com/" target="_blank" rel="noopener noreferrer">MeshCore Observer Flasher</a> instead.</li>' +
        '<li>Choose <strong>Console</strong>, then approve the repeater\'s serial or COM port when the browser asks.</li></ol></section>' +
        '<section class="mcc-connect-method"><div class="mcc-connect-method-head">' + icon("radio-tower") + '<div><h5>Remote over LoRa</h5><small>Through a companion radio</small></div></div>' +
        '<ol><li>On a phone or computer, connect the <a href="https://meshcore.io/" target="_blank" rel="noopener noreferrer">official MeshCore app</a> to your companion radio.</li>' +
        '<li>Open <strong>Contacts</strong>, select the repeater, then choose <strong>Remote Management</strong> from its menu.</li>' +
        '<li>Enter the repeater admin password, tap <strong>Log In</strong>, then open <strong>Command Line</strong>.</li></ol>' +
        '<p class="mcc-connect-note">If the repeater is missing, open Tools → Discover Nearby Nodes. If a wait timer appears, let it finish before logging in.</p></section>' +
        '</div></div></li>' +
        '<li><div><h4>Confirm the command line</h4><p>Run <code>ver</code> and check the version.</p>' +
        '<button type="button" class="mcc-command-line" data-cmd="ver"><span>ver</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button></div></li>' +
        '<li><div><h4>Apply the settings</h4><p>Run each line in order. Wait for a reply.</p><p>No reply? Check the connection and use Send Again. On 1.15, region put replies OK - (flood allowed).</p>' +
        '<div class="mcc-guide-command-list">' + commands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button>';
        }).join("") + '</div><p class="mcc-guide-stop">Stop on <code>Err</code>. Existing regions are not cleared. Some commands save immediately.</p></div></li>' +
        '<li><div><h4>Check and save</h4><p>Run <code>region</code> and confirm each path:</p>' +
        expectedPathMarkup +
        '<div class="mcc-guide-command-list"><button type="button" class="mcc-command-line" data-cmd="region"><span>region</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button></div>' +
        '<p>Save:</p>' +
        '<div class="mcc-guide-command-list"><button type="button" class="mcc-command-line" data-cmd="region save"><span>region save</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button></div>' +
        '<p>' + (state.radioProfile !== "keep"
          ? 'Restart the device, reconnect, then run these final checks:'
          : 'Run this once more to confirm the saved region:') + '</p>' +
        '<div class="mcc-guide-command-list">' + verificationCommands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button>';
        }).join("") + '</div></div></li>' +
        '</ol>' +
        '<a class="mcc-guide-docs" href="https://docs.meshcore.io/cli_commands/" target="_blank" rel="noopener noreferrer">MeshCore command help ' + icon("external-link") + '</a>' +
        '</div>'
      : '<div class="mcc-command-panel">' +
        '<div class="mcc-command-toolbar"><span>Commands</span></div>' +
        '<pre><code>' +
        technicalCommands.map(function (line) {
          return '<button type="button" class="mcc-command-line" data-cmd="' + esc(line) + '"><span>' + esc(line) + '</span><em>' + icon("copy") + '<span class="mcc-visually-hidden">Copy</span></em></button>';
        }).join("") +
        '</code></pre>' +
        '</div>';

    var sourceBadge = '<span class="mcc-source-tier mcc-source-tier-' + esc(state.resolution.sourceTier || "unknown") + '">' +
      (state.resolution.sourceTier === "meshmapper" ? "Published MeshMapper boundary" : state.resolution.planningKind === "extension" ? "MeshCore Canada planning extension" : "MeshCore Canada starter region") + '</span>';
    var ancestryMarkup = '<div class="mcc-ancestry" aria-label="Region tags">' +
      rec.tags.map(function (tag) {
        var external = Boolean(data.externalTagLabels && data.externalTagLabels[tag]);
        var stateName = external ? "external" : statusFor(data, tag).state || "draft";
        var kind = data.hierarchy[tag] && data.hierarchy[tag].kind;
        var level = external ? "any" : data.policy.reservedScopes.indexOf(tag) !== -1 ? "future" :
          kind === "province" ? "prov" : kind === "mesh-scope" ? "mesh" : "city";
        return '<span class="mcc-tag-pill' + (stateName === "draft" ? " is-draft" : "") +
          (external ? " is-external" : "") + '" data-level="' + level + '"><code>' + esc(tag) + "</code></span>";
      }).join("") +
      "</div>";
    var metaMarkup = '<dl class="mcc-result-meta">' +
      '<div><dt>Firmware</dt><dd>' + esc(firmwareLabel) + '</dd></div>' +
      '<div><dt>Region budget</dt><dd>' + esc(rec.budget.tagCount) + ' / 32 tags · ' +
      esc(rec.budget.responseBytes) + ' / 160 bytes</dd></div>' +
      '</dl>';
    var technicalDetails = guided
      ? '<details class="mcc-advanced-options mcc-result-advanced"><summary>Advanced details</summary>' + sourceBadge + ancestryMarkup + metaMarkup + '</details>'
      : sourceBadge + ancestryMarkup + metaMarkup;

    target.innerHTML =
      '<div class="mcc-result-console">' +
      planningNotice(state.resolution) +
      (firmware === "1.14" ? '<div class="mcc-note mcc-note-warning">On firmware 1.14, this repeater\'s adverts stay unscoped. Upgrade to 1.15 or newer to scope its adverts by city.</div>' : '') +
      '<div class="mcc-note mcc-note-warning"><strong>Before applying a new scope list</strong><p>Back up the current region list. Remove old entries before applying this profile; use USB if possible.</p><a href="' + esc(regionPageHref("standard") + '#existing-devices') + '">Migration instructions</a></div>' +
      '<div class="mcc-result-head">' +
      '<div>' +
      '<h3 class="mcc-result-title"><code>' + esc(titleTag.toUpperCase()) + "</code> — " + esc(labelFor(data, titleTag)) + "</h3>" +
      '<div class="mcc-result-sub">' + esc(state.name || labelFor(data, titleTag)) + "</div>" +
      '<div class="mcc-region-path"><strong>Forwarded scopes:</strong>' +
      expectedPathMarkup + "</div>" +
      '</div>' +
      (!guided ? '<button type="button" class="mcc-button mcc-copy-all">' + icon("copy") + 'Copy commands</button>' : '') +
      '</div>' +
      scopeNotice +
      '<p class="mcc-note">' + esc(radioProfiles ? radioProfiles.label(state.radioProfile) : "Keep current settings") +
      (state.radioProfile !== "keep" ? ' — <span>Radio changes take effect after reboot.</span>' : '') + '</p>' +
      technicalDetails +
      (window.MeshCoreRegionProfile ? window.MeshCoreRegionProfile.render(data, titleTag, state.jurisdictionTag, new URL("../", regionPageHref("config")), state.resolution) : '') +
      '<div data-scope-migration></div>' +
      resultBody +
      '<section class="mcc-record-actions" aria-labelledby="mcc-record-heading">' +
      '<div><h4 id="mcc-record-heading">Setup summary</h4><p>Download or print a summary without exact coordinates, credentials, or device identifiers.</p></div>' +
      '<div><button type="button" class="mcc-button mcc-button-secondary" data-action="download-commissioning">' + icon("download") + 'Download</button>' +
      '<button type="button" class="mcc-button mcc-button-secondary" data-action="print-commissioning">' + icon("printer") + 'Print</button></div>' +
      '</section>' +
      (statusNotes ? '<div class="mcc-notes">' + statusNotes + "</div>" : "") +
      "</div>";

    if (window.MeshCoreScopeMigration) window.MeshCoreScopeMigration.mount(target.querySelector("[data-scope-migration]"), rec, firmware, copyText);
    var copy = target.querySelector(".mcc-copy-all");
    if (copy) {
      copy.addEventListener("click", function () {
        copyText(technicalCommands.join("\n"), copy, "Copy commands");
      });
    }
    target.querySelectorAll(".mcc-command-line").forEach(function (button) {
      button.addEventListener("click", function () {
        copyText(button.getAttribute("data-cmd") || "", button.querySelector("em"), "Copy");
      });
    });
    var downloadSummary = target.querySelector("[data-action='download-commissioning']");
    if (downloadSummary) {
      downloadSummary.addEventListener("click", function () {
        downloadCommissioningSummary(data, state, downloadSummary);
      });
    }
    var printSummary = target.querySelector("[data-action='print-commissioning']");
    if (printSummary) {
      printSummary.addEventListener("click", function () {
        printCommissioningSummary(data, state, printSummary);
      });
    }
  }

  function seedForTag(data, tag) {
    return data.seeds.find(function (seed) {
      return seed.tag === tag;
    }) || null;
  }

  function sourceUrlFor(data, tag) {
    var st = statusFor(data, tag);
    if (st.state === "starter") return regionPageHref("standard") + '#starter-regions';
    if (st.sourceUrl) return st.sourceUrl;
    var meshMapperSource = data.meshMapperSources && data.meshMapperSources[tag] && data.meshMapperSources[tag][0];
    if (meshMapperSource && meshMapperSource.sourceUrl) return meshMapperSource.sourceUrl;
    var seed = seedForTag(data, tag);
    if (seed && seed.pnwAligned && data.meta.attribution) return data.meta.attribution.url;
    if (data.source && data.source.forum) return data.source.forum;
    return null;
  }

  function currentCommands(data, state) {
    if (!state || !state.canGenerate || !state.resolution || state.migrationNeedsReview) return null;
    var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
    if (!rec) return null;
    if (rec.budget.tagCount > 32 || rec.budget.responseBytes > 160) return null;
    var firmware = state.firmware || data.meta.defaultFirmware || "1.16";
    if (["1.14", "1.15", "1.16"].indexOf(firmware) === -1) return null;
    return buildCommands(data, rec, state)
      .concat(["region", "region save", "region"]);
  }

  function commissioningSummary(data, state) {
    if (!state || !state.canGenerate || !state.resolution || !configuratorSupport.commissioningRecord) return null;
    var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
    var commands = currentCommands(data, state);
    if (!rec || !commands) return null;
    var homeTag = state.resolution.primary.seed.tag;
    var summary = configuratorSupport.commissioningRecord({
      generatedAt: new Date().toISOString(),
      locationLabel: labelFor(data, homeTag),
      homeRegion: homeTag + " — " + labelFor(data, homeTag) + " (" + state.jurisdictionTag + ")",
      firmware: state.firmware === "1.16" ? "v1.16+" : "v" + state.firmware + ".x",
      budget: rec.budget.tagCount + " / 32 tags, " + rec.budget.responseBytes + " / 160 bytes",
      radio: radioProfiles ? radioProfiles.label(state.radioProfile) : "Keep current settings",
      hashMode: state.hashMode === "keep" ? "Keep current settings" : (state.hashMode === "0" ? "1 byte" : String(Number(state.hashMode) + 1) + " bytes"),
      paths: rec.paths.map(function (path) { return path.join(" / ") + " — " + labelledPath(data, path); }),
      commands: commands
    });
    return frenchRuntime
      ? summary.split("\n").map(translateRuntimeText).join("\n")
      : summary;
  }

  function announceAction(button, message) {
    var host = button && button.closest ? button.closest("[data-mcc-regions]") : null;
    var live = host && host.querySelector("[data-mcc-copy-status]");
    if (!live) return;
    live.textContent = "";
    window.setTimeout(function () { live.textContent = message; }, 10);
  }

  function downloadCommissioningSummary(data, state, button) {
    var summary = commissioningSummary(data, state);
    if (!summary) return;
    var homeTag = state.resolution.primary.seed.tag;
    var stem = configuratorSupport.safeFileStem
      ? configuratorSupport.safeFileStem(homeTag)
      : "repeater";
    var blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "meshcore-" + stem + "-commissioning.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 0);
    announceAction(button, "Commissioning summary downloaded. Exact coordinates and credentials were omitted.");
  }

  function printCommissioningSummary(data, state, button) {
    var summary = commissioningSummary(data, state);
    if (!summary) return;
    var popup = window.open("", "_blank", "noopener,noreferrer");
    if (!popup) {
      announceAction(button, "The print window was blocked. Download the summary instead.");
      return;
    }
    popup.opener = null;
    popup.document.title = translateRuntimeText("MeshCore Canada commissioning summary");
    var heading = popup.document.createElement("h1");
    heading.textContent = translateRuntimeText("MeshCore Canada commissioning summary");
    var pre = popup.document.createElement("pre");
    pre.textContent = summary;
    popup.document.body.appendChild(heading);
    popup.document.body.appendChild(pre);
    popup.focus();
    popup.print();
    announceAction(button, "Commissioning summary opened for printing. Exact coordinates and credentials were omitted.");
  }
  function renderRegionDetail(data, section, target, state, tag) {
    if (!section || !target) return;
    if (!tag) {
      section.hidden = true;
      target.innerHTML = "";
      return;
    }
    var st = statusFor(data, tag);
    var seed = seedForTag(data, tag);
    var sourceUrl = sourceUrlFor(data, tag);
    var ancestry = ancestryFor(data, tag);
    var sharedArea = sharedRepeaterAreaForTag(data, tag);
    var commands = state && state.canGenerate && state.resolution &&
      state.resolution.primary && state.resolution.primary.seed.tag === tag
      ? currentCommands(data, state)
      : null;
    var pnwAligned = seed && seed.pnwAligned;
    section.hidden = false;
    target.innerHTML =
      '<div class="mcc-detail-head">' +
      '<div><code>' + esc(tag) + '</code><h3>' + esc(labelFor(data, tag)) + '</h3></div>' +
      statusBadge(data, tag) +
      '</div>' +
      '<div class="mcc-detail-ancestry">' +
      ancestry.map(function (item) {
        var index = ancestry.indexOf(item);
        return '<span class="mcc-detail-node">' +
          '<small>' + esc(hierarchyLevelName(index, ancestry)) + '</small>' +
          '<code>' + esc(item) + '</code>' +
          '<em>' + esc(labelFor(data, item)) + '</em>' +
          '</span>';
      }).join('<b>-></b>') +
      '</div>' +
      '<dl class="mcc-detail-list">' +
      '<div><dt>Review</dt><dd>' + esc(st.reviewer || "Unreviewed") + '</dd></div>' +
      '<div><dt>Source</dt><dd>' + esc(st.source || "Not recorded") + '</dd></div>' +
      '<div><dt>Seed</dt><dd>' + (seed
        ? esc(seed.lat.toFixed(4) + ", " + seed.lon.toFixed(4) + " / r " + (seed.r || 0) + " km")
        : "No seed point") + '</dd></div>' +
      (sharedArea
        ? '<div><dt>Repeater area</dt><dd>' + esc(sharedArea.label) + " · " +
          esc(sharedArea.members.map(function (member) { return labelFor(data, member); }).join(" + ")) + "</dd></div>"
        : "") +
      '<div><dt>Source note</dt><dd>' + (pnwAligned ? "BC coastal seed follows the PNW reference data" : "Strategy draft v1.1.1 region") + '</dd></div>' +
      '</dl>' +
      '<div class="mcc-detail-actions">' +
      '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-detail-tag">' + icon("copy") + 'Copy tag</button>' +
      (commands ? '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-detail-commands">' + icon("clipboard") + 'Copy commands</button>' : '') +
      (sourceUrl ? '<a class="mcc-button mcc-button-secondary" href="' + esc(sourceUrl) + '" target="_blank" rel="noopener noreferrer">' + icon("external-link") + 'Open source</a>' : '') +
      '</div>';

    var copyTag = target.querySelector("[data-action='copy-detail-tag']");
    if (copyTag) {
      copyTag.addEventListener("click", function () {
        copyText(tag, copyTag, "Copy tag");
      });
    }
    var copyCommands = target.querySelector("[data-action='copy-detail-commands']");
    if (copyCommands && commands) {
      copyCommands.addEventListener("click", function () {
        copyText(commands.join("\n"), copyCommands, "Copy commands");
      });
    }
  }

  function refreshTool(data, els, state, afterRefresh) {
    if (els.candidatesSection) els.candidatesSection.hidden = !state.canGenerate;
    if (els.resultSection) els.resultSection.hidden = !state.canGenerate;
    if (!state.canGenerate) {
      if (!state.awaitingProvince) state.resolution = null;
      if (els.candidates) els.candidates.innerHTML = "";
      if (els.metro) els.metro.innerHTML = "";
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
      if (afterRefresh) afterRefresh();
      return;
    }
    if (state.canGenerate) {
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag, state.manualSelection);
      if (state.resolution && state.resolution.primary) {
        state.detailTag = state.resolution.primary.seed.tag;
      }
    }
    renderCandidateList(data, els.candidates, state, function (tag) {
      state.forcedTag = tag;
      state.selectedMetros = [];
      state.selectedExternalPaths = [];
      refreshTool(data, els, state, afterRefresh);
    });
    renderMetroChips(data, els.metro, state, function () {
      renderResult(data, els.result, state);
      renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
      if (afterRefresh) afterRefresh();
    });
    renderResult(data, els.result, state);
    renderRegionDetail(data, els.detailSection, els.detail, state, state.detailTag);
    if (afterRefresh) afterRefresh();
  }

  function toolUi() {
    return '' +
      '<div class="mcc-wizard">' +
      '<div class="mcc-visually-hidden" data-mcc-copy-status role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<ol class="mcc-wizard-progress" aria-label="Setup progress">' +
      '<li><button type="button" data-go-step="1" aria-label="Step 1: Device"><span>1</span><strong>Device</strong></button></li>' +
      '<li><button type="button" data-go-step="2" aria-label="Step 2: Location" disabled><span>2</span><strong>Location</strong></button></li>' +
      '<li><button type="button" data-go-step="3" aria-label="Step 3: Coverage" disabled><span>3</span><strong>Coverage</strong></button></li>' +
      '<li><button type="button" data-go-step="4" aria-label="Step 4: Apply" disabled><span>4</span><strong>Apply</strong></button></li>' +
      '</ol>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="1">' +
      '<p class="mcc-step-label">Step 1 of 4</p>' +
      '<h2>What are you configuring?</h2>' +
      '<p class="mcc-step-intro">Choose the city scopes this repeater should forward.</p>' +
      '<p class="mcc-step-browse"><a data-action="view-map" href="' + esc(regionPageHref("map")) + '">Browse the region map</a> · ' +
      '<a href="' + esc(new URL("editor/", regionPageHref("config")).href) + '">Request a zone change</a></p>' +
      '<div class="mcc-choice-list mcc-choice-list-large" role="radiogroup" aria-label="Device and experience">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-role" value="repeater" checked><span><strong>Repeater</strong><small>Recommended for most operators</small></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-role" value="room"><span><strong>Room server with repeating</strong><small>Uses the same scope list</small></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-device-role" value="advanced"><span><strong>Advanced operator</strong><small>Review wide and cross-border paths</small></span></label>' +
      '</div>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button" type="button" data-next-step>Next' + icon("arrow-right") + '</button></div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="2" hidden>' +
      '<p class="mcc-step-label">Step 2 of 4</p>' +
      '<h2>Where is the node?</h2>' +
      '<div class="mcc-location-method">' +
      '<h3>Search a place</h3>' +
      '<label class="mcc-label" for="mcc-location-input">City, airport code, postal code, or region name</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-location-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '</div>' +
      '<div class="mcc-location-options">' +
      '<section class="mcc-location-method">' +
      '<h3>Enter coordinates</h3>' +
      '<div class="mcc-coordinate-grid">' +
      '<label><span>Latitude</span><input class="mcc-input" data-role="latitude" inputmode="decimal" autocomplete="off" placeholder="45.4215"></label>' +
      '<label><span>Longitude</span><input class="mcc-input" data-role="longitude" inputmode="decimal" autocomplete="off" placeholder="-75.6972"></label>' +
      '</div>' +
      '<button class="mcc-button mcc-button-secondary" type="button" data-action="use-coordinates">Use coordinates</button>' +
      '<p class="mcc-hint">Coordinates are checked against the Canadian region data in this page.</p>' +
      '</section>' +
      '<section class="mcc-location-method">' +
      '<h3>Use this device</h3>' +
      '<button class="mcc-button mcc-button-secondary" type="button" data-action="use-browser-location">' + icon("locate-fixed") + 'Use my location</button>' +
      '<p class="mcc-hint">Your browser asks first. MeshCore Canada does not receive or store your coordinates.</p>' +
      '</section>' +
      '</div>' +
      '<div data-role="status"></div>' +
      '<div class="mcc-selected-region" data-role="selected-region" hidden></div>' +
      '<div data-role="location-zone-options"></div>' +
      '<label class="mcc-label" for="mcc-home-province">Province or territory of the repeater</label>' +
      '<select class="mcc-select" id="mcc-home-province" disabled><option value="">Choose a province or territory</option></select>' +
      '<p class="mcc-hint">A MeshMapper zone can cross a provincial border. Use the province where this repeater is installed.</p>' +
      '<details class="mcc-alternate-regions" data-role="region-browser" open>' +
      '<summary>Browse regions without search or a map</summary>' +
      '<div class="mcc-region-breadcrumbs" data-role="config-region-breadcrumbs"></div>' +
      '<div class="mcc-region-children" data-role="config-region-children"></div>' +
      '</details>' +
      '<div class="mcc-wizard-actions">' +
      '<button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button>' +
      '<a class="mcc-button mcc-button-secondary" data-action="view-map" href="' + esc(regionPageHref("map")) + '">' + icon("map") + 'Explore regions</a>' +
      '<button class="mcc-button" type="button" data-next-step disabled>Next' + icon("arrow-right") + '</button>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="3" hidden>' +
      '<p class="mcc-step-label">Step 3 of 4</p>' +
      '<h2>What should this node serve?</h2>' +
      '<div class="mcc-choice-list mcc-choice-list-large" data-role="types" role="radiogroup" aria-label="Repeater forwarding coverage">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="residential" checked><span><strong>City repeater</strong><small>One IATA region; unscoped messages work locally.</small></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-type" value="high-site"><span><strong>Edge repeater</strong><small>Regularly links repeaters in different IATA regions; blocks unscoped floods.</small></span></label>' +
      '</div>' +
      '<p class="mcc-hint" data-role="repeater-type-help">A repeater on the outer boundary stays a city repeater unless it regularly links to another IATA region.</p>' +
      '<p class="mcc-hint">Different cities or map outlines with the same IATA code still count as one region.</p>' +
      '<div data-role="metro"></div>' +
      '<label class="mcc-label" for="mcc-radio-profile">Radio network</label>' +
      '<select class="mcc-select" id="mcc-radio-profile"><option value="keep">Keep current settings</option></select>' +
      '<p class="mcc-hint">Choose a profile only after checking with your community. A region does not select a radio network.</p>' +
      '<label class="mcc-label" for="mcc-hash-mode">Advert ID size</label>' +
      '<select class="mcc-select" id="mcc-hash-mode"><option value="keep">Keep current settings</option><option value="2">3 bytes</option><option value="1">2 bytes</option><option value="0">1 byte</option></select>' +
      '<p class="mcc-hint" data-role="canada-preset-note">The Canada app preset uses 3-byte paths. Here, choose radio and advert ID settings separately. <a href="' + esc(new URL("../provinces/#canada-baseline", regionPageHref("config")).href) + '">Canada preset details</a></p>' +
      '<label class="mcc-choice" data-role="standard-settings"><input type="checkbox" data-action="standard-defaults"><span><strong>Use the proposed ON/QC standard settings</strong><small>3-byte IDs, local adverts every 4 hours, flood adverts every 47 hours, and a 16-hop flood limit.</small></span></label>' +
      '<div data-role="onqc-guidance" hidden><p class="mcc-hint">Leave unchecked for scope commands only. A complete ON/QC Phase 1 setup also needs these standard settings.</p>' + onqcRolloutNotice() + '</div>' +
      '<details class="mcc-advanced-options" data-role="technical-settings">' +
      '<summary>Firmware version</summary>' +
      '<p class="mcc-label">Firmware version</p>' +
      '<div class="mcc-choice-list" data-role="firmware" role="radiogroup" aria-label="Firmware version">' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.16" checked><span><strong>v1.16+</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.15"><span><strong>v1.15.x</strong></span></label>' +
      '<label class="mcc-choice"><input type="radio" name="mcc-firmware" value="1.14"><span><strong>v1.14.x</strong></span></label>' +
      '</div>' +
      '</details>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><button class="mcc-button" type="button" data-next-step>Review' + icon("arrow-right") + '</button></div>' +
      '</section>' +
      '<section class="mcc-card mcc-wizard-step" data-wizard-step="4" hidden>' +
      '<p class="mcc-step-label">Step 4 of 4</p>' +
      '<h2>Review and apply</h2>' +
      '<div class="mcc-review-summary" data-role="review-summary"></div>' +
      '<div class="mcc-finish-paths" role="group" aria-label="Choose setup instructions">' +
      '<button type="button" class="mcc-finish-path is-active" data-finish-path="guided" aria-pressed="true">' + icon("list-checks") + '<span><strong>Guide me</strong><small>Connect, apply, verify, then save</small></span></button>' +
      '<button type="button" class="mcc-finish-path" data-finish-path="technical" aria-pressed="false">' + icon("terminal") + '<span><strong>Copy commands</strong><small>Technical operator flow</small></span></button>' +
      '</div>' +
      '<div data-role="result"><p class="mcc-result-empty">Choose a location first.</p></div>' +
      '<div class="mcc-wizard-actions"><button class="mcc-button mcc-button-secondary" type="button" data-prev-step>' + icon("arrow-left") + 'Back</button><a class="mcc-button mcc-button-secondary" data-action="view-map" href="' + esc(regionPageHref("map")) + '">' + icon("map") + 'Explore regions</a></div>' +
      '</section>' +
      '</div>';
  }

  function initConfig(el, data) {
    el.innerHTML = toolUi();
    var state = {
      lat: null,
      lon: null,
      name: "",
      locationSource: "",
      forcedTag: null,
      jurisdictionTag: null,
      deviceRole: "repeater",
      type: "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      radioProfile: "keep",
      hashMode: "keep",
      standardDefaults: false,
      manualSelection: false,
      awaitingProvince: false,
      migrationNeedsReview: false,
      unresolvedRegions: [],
      selectedMetros: [],
      selectedExternalPaths: [],
      canGenerate: false,
      resolution: null,
      browseTag: data.meta.rootTag || "can",
      finishPath: "guided",
      wizardStep: 1,
      maxStep: 1
    };
    var els = {
      input: el.querySelector("#mcc-location-input"),
      locate: el.querySelector("[data-action='locate']"),
      latitude: el.querySelector("[data-role='latitude']"),
      longitude: el.querySelector("[data-role='longitude']"),
      coordinates: el.querySelector("[data-action='use-coordinates']"),
      browserLocation: el.querySelector("[data-action='use-browser-location']"),
      status: el.querySelector("[data-role='status']"),
      selectedRegion: el.querySelector("[data-role='selected-region']"),
      regionBrowser: el.querySelector("[data-role='region-browser']"),
      breadcrumbs: el.querySelector("[data-role='config-region-breadcrumbs']"),
      children: el.querySelector("[data-role='config-region-children']"),
      candidatesSection: null,
      candidates: null,
      metro: el.querySelector("[data-role='metro']"),
      result: el.querySelector("[data-role='result']"),
      reviewSummary: el.querySelector("[data-role='review-summary']"),
      technicalSettings: el.querySelector("[data-role='technical-settings']"),
      finishPaths: Array.prototype.slice.call(el.querySelectorAll("[data-finish-path]")),
      steps: Array.prototype.slice.call(el.querySelectorAll("[data-wizard-step]")),
      progress: Array.prototype.slice.call(el.querySelectorAll("[data-go-step]")),
      viewMap: Array.prototype.slice.call(el.querySelectorAll("[data-action='view-map']"))
    };
    var activeGeocodeController = null;
    var locationRequestId = 0;
    var provinceSelect = el.querySelector("#mcc-home-province");
    var standardCheckbox = el.querySelector("[data-action='standard-defaults']");
    var standardSection = el.querySelector("[data-role='standard-settings']");
    var onqcGuidance = el.querySelector("[data-role='onqc-guidance']");
    provinceSelect.innerHTML += provinceOptions(data).map(function (tag) {
      return '<option value="' + esc(tag) + '">' + esc(labelFor(data, tag)) + '</option>';
    }).join("");
    standardSection.hidden = true;

    var firmwareInput = el.querySelector("input[name='mcc-firmware'][value='" + state.firmware + "']");
    if (firmwareInput) firmwareInput.checked = true;

    function updateMapLinks() {
      els.viewMap.forEach(function (link) {
        link.hidden = false;
        link.href = state.canGenerate ? mapHrefForState(state) : regionPageHref("map");
      });
    }

    function renderReviewSummary() {
      if (!els.reviewSummary || !state.canGenerate || !state.resolution) return;
      var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
      if (!rec) return;
      var deviceLabels = {
        repeater: "Repeater",
        room: "Room server with repeating",
        advanced: "Advanced operator"
      };
      var paths = rec.paths.map(function (path) {
        return '<li><code>' + esc(path.join(" / ")) + '</code> — ' + esc(labelledPath(data, path)) + '</li>';
      }).join("");
      els.reviewSummary.innerHTML =
        '<h3>Selection</h3>' +
        '<dl class="mcc-review-list">' +
        '<div><dt>Node</dt><dd>' + esc(deviceLabels[state.deviceRole] || deviceLabels.repeater) + '</dd></div>' +
        '<div><dt>Place</dt><dd>' + esc(state.name || labelFor(data, state.resolution.primary.seed.tag)) + '</dd></div>' +
        '<div><dt>Home region</dt><dd><code>' + esc(rec.home) + '</code> — ' + esc(labelFor(data, rec.home)) + ' (' + esc(labelFor(data, rec.province)) + ')</dd></div>' +
        '<div><dt>Radio network</dt><dd>' + esc(radioProfiles ? radioProfiles.label(state.radioProfile) : "Keep current settings") + '</dd></div>' +
        '<div><dt>Advert ID size</dt><dd>' + (state.hashMode === "keep" ? 'Keep current settings' : state.hashMode === "0" ? '1 byte' : esc(Number(state.hashMode) + 1) + ' bytes') + '</dd></div>' +
        '<div><dt>Budget</dt><dd>' + esc(rec.budget.tagCount) + ' / 32 tags · ' + esc(rec.budget.responseBytes) + ' / 160 bytes</dd></div>' +
        '</dl>' +
        '<h3>Forwarded scopes</h3><ul class="mcc-review-paths">' + paths + '</ul>' +
        (rec.externalPaths.length
          ? '<p class="mcc-note mcc-note-warning">Neighbouring paths are included only on this repeater. Confirm provisional paths with the neighbouring operators.</p>'
          : '');
    }

    function showStep(step) {
      var next = Math.max(1, Math.min(4, step));
      if (next > state.maxStep) return;
      var changed = state.wizardStep !== next;
      state.wizardStep = next;
      els.steps.forEach(function (section) {
        section.hidden = Number(section.getAttribute("data-wizard-step")) !== next;
      });
      els.progress.forEach(function (button) {
        var buttonStep = Number(button.getAttribute("data-go-step"));
        button.disabled = buttonStep > state.maxStep;
        button.classList.toggle("is-active", buttonStep === next);
        button.classList.toggle("is-complete", buttonStep < next || buttonStep < state.maxStep);
        if (buttonStep === next) button.setAttribute("aria-current", "step");
        else button.removeAttribute("aria-current");
      });
      if (next === 4) {
        renderReviewSummary();
        renderResult(data, els.result, state);
      }
      if (changed) {
        var activeStep = els.steps.find(function (section) {
          return Number(section.getAttribute("data-wizard-step")) === next;
        });
        var heading = activeStep && activeStep.querySelector("h2");
        if (heading) {
          heading.setAttribute("tabindex", "-1");
          heading.focus({ preventScroll: true });
        }
      }
      updateMapLinks();
    }

    function selectFinishPath(path) {
      state.finishPath = path === "technical" ? "technical" : "guided";
      els.finishPaths.forEach(function (button) {
        var active = button.getAttribute("data-finish-path") === state.finishPath;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      renderResult(data, els.result, state);
      updateMapLinks();
    }

    function advanceStep() {
      if (state.wizardStep === 3 && state.migrationNeedsReview) return;
      if (state.wizardStep === 2 && !state.canGenerate) {
        setStatus(els.status, "Choose a location or browse to a region first.", "error");
        return;
      }
      state.maxStep = Math.max(state.maxStep, Math.min(4, state.wizardStep + 1));
      showStep(state.wizardStep + 1);
    }

    function renderConfigRegionBrowser(tag) {
      if (!data.hierarchy[tag]) tag = data.meta.rootTag || "can";
      state.browseTag = tag;
      var selectedTag = state.resolution && state.resolution.primary
        ? state.resolution.primary.seed.tag
        : null;
      var sharedArea = selectedTag ? sharedRepeaterAreaForTag(data, selectedTag) : null;
      if (els.selectedRegion) {
        els.selectedRegion.hidden = !selectedTag;
        els.selectedRegion.innerHTML = selectedTag
          ? '<strong>Your home region</strong><span>' + esc(ancestryFor(data, selectedTag, state.jurisdictionTag).map(function (item) {
            return labelFor(data, item);
          }).join(" › ")) + '</span>' +
            (sharedArea ? '<span class="mcc-selected-shared-area">Shared repeater area: ' + esc(sharedArea.label) + "</span>" : "")
          : "";
      }
      if (els.regionBrowser) els.regionBrowser.hidden = false;
      if (!els.breadcrumbs || !els.children) return;

      var path = ancestryFor(data, tag, state.jurisdictionTag);
      els.breadcrumbs.innerHTML = path.map(function (item, index) {
        var current = index === path.length - 1;
        return '<button type="button" class="mcc-region-crumb' + (current ? ' is-current' : '') + '" data-config-region-node="' + esc(item) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(labelFor(data, item)) + '</button>';
      }).join('<span aria-hidden="true">›</span>');

      var children = childrenFor(data, tag);
      els.children.innerHTML = children.length
        ? children.map(function (child) {
          var nested = Boolean(data.policy.provinces[child]) || childrenFor(data, child).length > 0;
          var leafCount = leafDescendants(data, child).length;
          return '<button type="button" class="mcc-region-child" data-config-region-node="' + esc(child) + '">' +
            '<span><strong>' + esc(labelFor(data, child)) + '</strong><small>' +
            (nested ? leafCount + ' zones' : child.toUpperCase() + ' · zone') +
            '</small></span><span aria-hidden="true">' + (nested ? '›' : '✓') + '</span></button>';
        }).join("")
        : '<p class="mcc-help">' + (data.policy.provinces[tag] ? 'No MeshMapper zones are published here yet.' : 'Select this region to use it as the home region.') + '</p>';
    }

    function chooseConfigRegionNode(tag) {
      var children = childrenFor(data, tag);
      var province = data.policy.provinces[state.browseTag] ? state.browseTag : null;
      renderConfigRegionBrowser(tag);
      if (!children.length) {
        var seed = seedForTag(data, tag);
        if (seed) {
          useGeo({
            lat: seed.lat,
            lon: seed.lon,
            name: labelFor(data, tag),
            countryCode: "ca",
            tag: tag,
            provinceTag: province,
            source: "region"
          });
        }
      }
    }

    function finishGeo(geo, requestId) {
      if (requestId !== locationRequestId) return;
      var previousTag = state.resolution && state.resolution.primary && state.resolution.primary.seed.tag;
      state.lat = Number(geo.lat);
      state.lon = Number(geo.lon);
      state.name = geo.name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
      state.locationSource = geo.source || "search";
      state.manualSelection = geo.source === "region";
      state.awaitingProvince = false;
      state.forcedTag = geo.tag || null;
      state.jurisdictionTag = geo.provinceTag || jurisdictionTagFromGeo(geo);
      var choices = el.querySelector("[data-role='location-zone-options']");
      choices.innerHTML = "";
      if (!isCanada(geo)) {
        state.canGenerate = false;
        state.resolution = null;
        if (els.selectedRegion) els.selectedRegion.hidden = true;
        setStatus(els.status, "This location is outside Canada.", "warning");
        refreshTool(data, els, state);
        return;
      }
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag, state.manualSelection);
      var nextTag = state.resolution.primary && state.resolution.primary.seed.tag;
      if (previousTag !== nextTag) {
        state.selectedMetros = [];
        state.selectedExternalPaths = [];
        state.unresolvedRegions = [];
        state.migrationNeedsReview = false;
      }
      state.jurisdictionTag = state.resolution.province;
      provinceSelect.value = state.jurisdictionTag || "";
      provinceSelect.disabled = !state.resolution.hasMatch;
      standardSection.hidden = ["on", "qc"].indexOf(state.jurisdictionTag) === -1;
      onqcGuidance.hidden = standardSection.hidden;
      if (standardSection.hidden) {
        if (state.standardDefaults) state.hashMode = state.hashBeforeDefaults || "keep";
        state.standardDefaults = standardCheckbox.checked = false;
        el.querySelector("#mcc-hash-mode").value = state.hashMode;
      }
      if (!state.resolution.hasMatch) {
        state.canGenerate = false;
        if (els.selectedRegion) els.selectedRegion.hidden = true;
        if (state.resolution.matches.length) {
          setStatus(els.status, state.resolution.matches.length > 1
            ? "More than one MeshMapper zone contains this point. Choose your community's zone."
            : "The saved zone differs from this location. Choose the current IATA region.", "warning");
          choices.innerHTML = state.resolution.matches.map(function (feature) {
            return '<button type="button" class="mcc-button mcc-button-secondary" data-zone-choice="' + esc(feature.properties.tag) + '">' + esc(feature.properties.tag.toUpperCase() + " — " + labelFor(data, feature.properties.tag)) + '</button>';
          }).join("");
        } else {
          setStatus(els.status, "No IATA region contains this point. Browse the region list or check with your community.", "warning");
        }
      } else if (!state.resolution.province) {
        state.canGenerate = false;
        state.awaitingProvince = true;
        state.detailTag = state.resolution.primary.seed.tag;
        setStatus(els.status, "Zone found. Choose the province where the repeater is installed.", "warning");
      } else {
        state.canGenerate = true;
        state.maxStep = Math.max(state.maxStep, 3);
        setStatus(els.status, "Region found.", "info");
        if (geo.legacyTag) setStatus(els.status, "This saved link used an older region name. Check the MeshMapper zone and province before applying settings.", "warning");
        renderConfigRegionBrowser(state.resolution.primary.seed.tag);
        document.dispatchEvent(new CustomEvent("meshcore:region-selected", {
          detail: {
            lat: state.lat,
            lon: state.lon,
            label: state.name,
            tag: state.resolution.primary.seed.tag
          }
        }));
      }
      refreshTool(data, els, state, updateMapLinks);
      updateMapLinks();
      var nextButton = el.querySelector("[data-wizard-step='2'] [data-next-step]");
      if (nextButton) nextButton.disabled = !state.canGenerate;
      showStep(2);
    }

    function useGeo(geo) {
      var requestId = ++locationRequestId;
      provinceSelect.disabled = true;
      state.maxStep = Math.max(state.maxStep, 2);
      state.canGenerate = false;
      renderResult(data, els.result, state);
      showStep(2);
      setStatus(els.status, "Checking the Canadian region data…", "info");
      return ensureResolverData(data).then(function () {
        finishGeo(geo, requestId);
      }).catch(function (error) {
        if (requestId !== locationRequestId) return;
        state.canGenerate = false;
        setStatus(els.status, esc(error.message || "Unable to load the Canadian location data."), "error");
      });
    }

    function locate() {
      var query = els.input.value.trim();
      if (!query) {
        setStatus(els.status, "Enter a city, airport code, postal code, or region name.", "error");
        return;
      }
      if (activeGeocodeController) activeGeocodeController.abort();
      activeGeocodeController = typeof AbortController !== "undefined" ? new AbortController() : null;
      var thisController = activeGeocodeController;
      els.locate.disabled = true;
      els.locate.textContent = "Finding";
      geocode(data, query, thisController && thisController.signal).then(function (geo) {
        geo.source = geo.source || "search";
        return useGeo(geo);
      }).catch(function (err) {
        if (err && err.name === "AbortError") return;
        state.canGenerate = false;
        setStatus(els.status, esc(err.message || "Location lookup failed"), "error");
        showLocationChoices(els.status, err.choices, useGeo);
        refreshTool(data, els, state, updateMapLinks);
      }).finally(function () {
        if (activeGeocodeController !== thisController) return;
        els.locate.disabled = false;
        els.locate.innerHTML = icon("search") + "Find";
      });
    }

    function useCoordinates() {
      var coordinates = configuratorSupport.parseCoordinates
        ? configuratorSupport.parseCoordinates(els.latitude.value, els.longitude.value)
        : null;
      if (!coordinates) {
        state.canGenerate = false;
        state.maxStep = 2;
        refreshTool(data, els, state, updateMapLinks);
        el.querySelector("[data-wizard-step='2'] [data-next-step]").disabled = true;
        setStatus(els.status, "Enter a latitude from -90 to 90 and a longitude from -180 to 180.", "error");
        return;
      }
      useGeo({
        lat: coordinates.lat,
        lon: coordinates.lon,
        name: coordinates.lat.toFixed(4) + ", " + coordinates.lon.toFixed(4),
        countryCode: "ca",
        source: "coordinates"
      });
    }

    function useBrowserLocation() {
      if (!navigator.geolocation) {
        setStatus(els.status, "This browser does not provide location access. Enter coordinates or browse regions.", "error");
        return;
      }
      els.browserLocation.disabled = true;
      setStatus(els.status, "Waiting for browser location permission…", "info");
      navigator.geolocation.getCurrentPosition(function (position) {
        els.browserLocation.disabled = false;
        useGeo({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          name: "Current browser location",
          countryCode: "ca",
          source: "browser"
        });
      }, function () {
        els.browserLocation.disabled = false;
        setStatus(els.status, "Location was not available. Enter coordinates or browse regions.", "error");
      }, { enableHighAccuracy: false, timeout: REQUEST_TIMEOUT_MS, maximumAge: 300000 });
    }

    els.locate.addEventListener("click", locate);
    els.input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") locate();
    });
    els.coordinates.addEventListener("click", useCoordinates);
    els.browserLocation.addEventListener("click", useBrowserLocation);
    if (els.breadcrumbs) {
      els.breadcrumbs.addEventListener("click", function (event) {
        var button = event.target.closest("[data-config-region-node]");
        if (button) chooseConfigRegionNode(button.getAttribute("data-config-region-node"));
      });
    }
    if (els.children) {
      els.children.addEventListener("click", function (event) {
        var button = event.target.closest("[data-config-region-node]");
        if (button) chooseConfigRegionNode(button.getAttribute("data-config-region-node"));
      });
    }
    el.querySelectorAll("[data-next-step]").forEach(function (button) {
      button.addEventListener("click", advanceStep);
    });
    el.querySelectorAll("[data-prev-step]").forEach(function (button) {
      button.addEventListener("click", function () { showStep(state.wizardStep - 1); });
    });
    els.progress.forEach(function (button) {
      button.addEventListener("click", function () {
        showStep(Number(button.getAttribute("data-go-step")));
      });
    });
    els.finishPaths.forEach(function (button) {
      button.addEventListener("click", function () {
        selectFinishPath(button.getAttribute("data-finish-path"));
      });
    });
    el.querySelectorAll("input[name='mcc-device-role']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.deviceRole = input.value;
        if (state.deviceRole === "advanced" && els.technicalSettings) els.technicalSettings.open = true;
        updateMapLinks();
      });
    });
    var profileSelect = el.querySelector("#mcc-radio-profile");
    var hashSelect = el.querySelector("#mcc-hash-mode");
    provinceSelect.addEventListener("change", function () {
      if (!state.resolution || !state.resolution.primary) return;
      useGeo({ lat: state.lat, lon: state.lon, name: state.name, countryCode: "ca",
        tag: state.resolution.primary.seed.tag, provinceTag: provinceSelect.value, source: state.locationSource });
    });
    el.querySelector("[data-role='location-zone-options']").addEventListener("click", function (event) {
      var button = event.target.closest("[data-zone-choice]");
      if (button) useGeo({ lat: state.lat, lon: state.lon, name: state.name, countryCode: "ca",
        tag: button.getAttribute("data-zone-choice"), provinceTag: state.jurisdictionTag, source: "coordinates" });
    });
    standardCheckbox.addEventListener("change", function () {
      state.standardDefaults = standardCheckbox.checked;
      if (state.standardDefaults) {
        state.hashBeforeDefaults = state.hashMode;
        state.hashMode = hashSelect.value = "2";
      } else {
        state.hashMode = hashSelect.value = state.hashBeforeDefaults || "keep";
      }
      updateMapLinks();
    });
    profileSelect.addEventListener("change", function () { state.radioProfile = profileSelect.value; updateMapLinks(); });
    hashSelect.addEventListener("change", function () {
      state.hashMode = hashSelect.value;
      if (state.hashMode !== "2") state.standardDefaults = standardCheckbox.checked = false;
      updateMapLinks();
    });
    el.querySelectorAll("input[name='mcc-type']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.type = input.value;
        state.selectedMetros = [];
        state.selectedExternalPaths = [];
        state.unresolvedRegions = [];
        state.migrationNeedsReview = false;
        el.querySelector("[data-wizard-step='3'] [data-next-step]").disabled = false;
        refreshTool(data, els, state, updateMapLinks);
        updateMapLinks();
      });
    });
    el.querySelectorAll("input[name='mcc-firmware']").forEach(function (input) {
      input.addEventListener("change", function () {
        state.firmware = input.value;
        renderResult(data, els.result, state);
        updateMapLinks();
      });
    });
    renderConfigRegionBrowser(state.browseTag);
    updateMapLinks();
    var initialParams = new URLSearchParams(window.location.search);
    keepLanguageSelection(state);
    var profileReady = radioProfiles ? radioProfiles.populate(profileSelect) : Promise.resolve();
    profileReady.then(function () {
      if (Array.from(profileSelect.options).some(function (option) { return option.value === initialParams.get("radio"); })) {
        state.radioProfile = profileSelect.value = initialParams.get("radio");
        updateMapLinks();
        if (state.wizardStep === 4) showStep(4);
      }
    });
    [["firmware", "mcc-firmware", ["1.14", "1.15", "1.16"]],
      ["deviceRole", "mcc-device-role", ["repeater", "room", "advanced"]]].forEach(function (entry) {
      var value = initialParams.get(entry[0] === "deviceRole" ? "role" : entry[0]);
      if (entry[2].indexOf(value) !== -1) {
        state[entry[0]] = value;
        el.querySelector("input[name='" + entry[1] + "'][value='" + value + "']").checked = true;
      } else if (entry[0] === "firmware" && value !== null) {
        state.firmware = "unsupported";
        el.querySelectorAll("input[name='mcc-firmware']").forEach(function (input) { input.checked = false; });
      }
    });
    if (["0", "1", "2"].indexOf(initialParams.get("hash")) !== -1) state.hashMode = hashSelect.value = initialParams.get("hash");
    if (initialParams.get("instructions") === "technical") selectFinishPath("technical");
    var location = initialLocation(data, initialParams);
    var initialQuery = (initialParams.get("place") || "").trim();
    if (location) {
      els.input.value = location.name;
      useGeo(location).then(function () {
        if (initialParams.get("defaults") === "onqc" && !standardSection.hidden) {
          state.standardDefaults = standardCheckbox.checked = true;
          state.hashBeforeDefaults = "keep";
          state.hashMode = hashSelect.value = "2";
        }
        if (initialParams.get("type") === "large") {
          state.type = "high-site";
          el.querySelector("input[name='mcc-type'][value='high-site']").checked = true;
          var saved = migratedCitySelection(data, initialParams.get("regions"));
          state.selectedMetros = saved.tags;
          state.unresolvedRegions = saved.unresolved;
          state.migrationNeedsReview = saved.unresolved.length > 0;
          state.selectedExternalPaths = selectedExternalRegionPaths(data, String(initialParams.get("external") || "").split(",")).map(function (record) { return record.id; });
        }
        if (!state.canGenerate) return;
        state.maxStep = state.migrationNeedsReview ? 3 : 4;
        refreshTool(data, els, state, updateMapLinks);
        showStep(state.migrationNeedsReview ? 3 : /^[1-4]$/.test(initialParams.get("step")) ? Number(initialParams.get("step")) : 3);
      });
    } else if (initialParams.has("tag") || initialParams.has("lat") || initialParams.has("lon")) {
      state.maxStep = 2;
      showStep(2);
      setStatus(els.status, "This saved location is invalid or no longer available. Choose a region again.", "warning");
    } else if (initialQuery) {
      state.maxStep = 2;
      els.input.value = initialQuery;
      showStep(2);
      setTimeout(locate, 0);
    } else {
      showStep(1);
    }
  }

  function loadLeaflet() {
    if (window.L) return Promise.resolve(window.L);
    if (leafletPromise) return leafletPromise;
    leafletPromise = new Promise(function (resolve, reject) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = new URL("vendor/leaflet/leaflet.css", assetBase).href;
      document.head.appendChild(link);

      var script = document.createElement("script");
      script.src = new URL("vendor/leaflet/leaflet.js", assetBase).href;
      script.onload = function () { resolve(window.L); };
      script.onerror = function () {
        leafletPromise = null;
        reject(new Error("Leaflet failed to load"));
      };
      document.head.appendChild(script);
    });
    return leafletPromise;
  }

  function initMap(el, data) {
    el.innerHTML = '' +
      '<div class="mcc-map-experience">' +
      '<div class="mcc-visually-hidden" data-mcc-copy-status role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<div class="mcc-map-mode-switch" role="group" aria-label="Region map view">' +
      '<button type="button" data-map-mode="explore" aria-pressed="true" aria-controls="mcc-explore-panel">Find a region</button>' +
      '<button type="button" data-map-mode="audit" aria-pressed="false" aria-controls="mcc-audit-panel">Region data</button>' +
      '</div>' +
      '<section id="mcc-explore-panel" data-map-panel="explore">' +
      '<div class="mcc-map-shell">' +
      '<aside class="mcc-map-panel" aria-label="Region search and details">' +
      '<section class="mcc-card mcc-card-compact">' +
      '<h3>Find a place</h3>' +
      '<label class="mcc-label" for="mcc-map-location-input">City, airport code, postal code, or region name</label>' +
      '<div class="mcc-input-row">' +
      '<input class="mcc-input" id="mcc-map-location-input" data-role="map-input" type="text" autocomplete="off" spellcheck="false" placeholder="Ottawa, YOW, K1A 0B1">' +
      '<button class="mcc-button" type="button" data-action="map-locate">' + icon("search") + 'Find</button>' +
      '</div>' +
      '<details class="mcc-coordinate-entry"><summary>Enter coordinates instead</summary>' +
      '<div class="mcc-coordinate-grid">' +
      '<label><span>Latitude</span><input class="mcc-input" data-role="map-latitude" inputmode="decimal" autocomplete="off" placeholder="45.4215"></label>' +
      '<label><span>Longitude</span><input class="mcc-input" data-role="map-longitude" inputmode="decimal" autocomplete="off" placeholder="-75.6972"></label>' +
      '</div><button class="mcc-button mcc-button-secondary" type="button" data-action="map-use-coordinates">Use coordinates</button></details>' +
      '<div data-role="map-status"></div>' +
      '</section>' +
      '<details class="mcc-card mcc-card-compact" data-role="map-region-browser">' +
      '<summary>Browse by province or territory</summary>' +
      '<div class="mcc-region-breadcrumbs" data-role="region-breadcrumbs"></div>' +
      '<div class="mcc-region-children" data-role="region-children"></div>' +
      '</details>' +
      '<section class="mcc-card mcc-dynamic-card" data-role="map-result-section" hidden>' +
      '<h3>Selected region</h3><div data-role="map-text-result"></div>' +
      '</section>' +
      '</aside>' +
      '<div class="mcc-map-stage">' +
      '<a class="mcc-skip-map" href="#mcc-region-list">Skip the interactive map</a>' +
      '<div class="mcc-visually-hidden" data-role="map-ready-status" role="status" aria-live="polite" aria-atomic="true"></div>' +
      '<p class="mcc-map-progress" data-role="map-boundary-status" role="status" hidden>Loading regional boundaries…</p>' +
      '<div class="mcc-map-loading" data-role="map-loading">' +
      '<div>' + icon("map") + '<h3>Loading interactive map…</h3>' +
      '<p data-role="map-load-status" role="status" aria-live="polite">Loading Canadian boundaries and OpenStreetMap tiles.</p>' +
      '<button class="mcc-button" type="button" data-action="load-map" hidden>Retry map</button></div>' +
      '</div>' +
      '<div class="mcc-map-area" data-role="map-area" hidden>' +
      '<div class="mcc-map-canvas" data-role="map-canvas" role="region" aria-label="Interactive Canadian region map" tabindex="0"></div>' +
      '<details class="mcc-map-legend"><summary>Map legend</summary><p><span><i class="mcc-legend-published"></i>Published MeshMapper boundary</span><span><i class="mcc-legend-starter"></i>MeshCore Canada planning</span></p></details>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<details class="mcc-card mcc-map-list-card" id="mcc-region-list">' +
      '<summary>Browse all regions</summary>' +
      '<div class="mcc-section-head"><div><p class="mcc-eyebrow">Can\'t use the map?</p><p>Search the full region list.</p></div></div>' +
      '<div data-role="map-region-table"></div>' +
      '</details>' +
      '</section>' +
      '<section id="mcc-audit-panel" class="mcc-audit-panel" data-map-panel="audit" hidden>' +
      '<div class="mcc-status mcc-status-info" data-role="audit-status" role="status">Audit data loads when this view is opened.</div>' +
      '<div data-role="audit-content"></div>' +
      '</section>' +
      '</div>';

    var mapParams = new URLSearchParams(window.location.search);
    var requestedLargeCoverage = mapParams.get("type") === "large";
    var requestedCitySelection = migratedCitySelection(data, mapParams.get("regions"));
    var requestedCanadianRegions = requestedCitySelection.tags;
    var requestedExternalPaths = selectedExternalRegionPaths(
      data,
      String(mapParams.get("external") || "").split(",").map(slug).filter(Boolean)
    ).map(function (record) { return record.id; });
    var state = {
      lat: null,
      lon: null,
      name: "",
      forcedTag: null,
      jurisdictionTag: null,
      type: requestedLargeCoverage ? "high-site" : "residential",
      firmware: data.meta.defaultFirmware || "1.16",
      radioProfile: "keep",
      hashMode: ["0", "1", "2"].indexOf(mapParams.get("hash")) !== -1 ? mapParams.get("hash") : "keep",
      standardDefaults: mapParams.get("defaults") === "onqc",
      manualSelection: false,
      selectedMetros: requestedLargeCoverage ? requestedCanadianRegions : [],
      unresolvedRegions: requestedLargeCoverage ? requestedCitySelection.unresolved : [],
      selectedExternalPaths: requestedLargeCoverage ? requestedExternalPaths : [],
      canGenerate: false,
      resolution: null,
      detailTag: null,
      browseTag: data.meta.rootTag || "can"
    };
    var els = {
      input: el.querySelector("[data-role='map-input']"),
      locate: el.querySelector("[data-action='map-locate']"),
      latitude: el.querySelector("[data-role='map-latitude']"),
      longitude: el.querySelector("[data-role='map-longitude']"),
      coordinates: el.querySelector("[data-action='map-use-coordinates']"),
      status: el.querySelector("[data-role='map-status']"),
      breadcrumbs: el.querySelector("[data-role='region-breadcrumbs']"),
      children: el.querySelector("[data-role='region-children']"),
      resultSection: el.querySelector("[data-role='map-result-section']"),
      textResult: el.querySelector("[data-role='map-text-result']"),
      table: el.querySelector("[data-role='map-region-table']"),
      loadMap: el.querySelector("[data-action='load-map']"),
      mapStage: el.querySelector(".mcc-map-stage"),
      mapLoading: el.querySelector("[data-role='map-loading']"),
      mapLoadStatus: el.querySelector("[data-role='map-load-status']"),
      mapReadyStatus: el.querySelector("[data-role='map-ready-status']"),
      boundaryStatus: el.querySelector("[data-role='map-boundary-status']"),
      mapArea: el.querySelector("[data-role='map-area']"),
      canvas: el.querySelector("[data-role='map-canvas']"),
      auditStatus: el.querySelector("[data-role='audit-status']"),
      auditContent: el.querySelector("[data-role='audit-content']")
    };
    var map = null;
    var marker = null;
    var browseLayer = null;
    var selectedLayer = null;
    var activeGeocodeController = null;
    var locationRequestId = 0;
    var auditLoaded = false;
    var mapIsLoading = false;

    function setMapMode(mode) {
      var next = mode === "audit" ? "audit" : "explore";
      el.querySelectorAll("[data-map-mode]").forEach(function (button) {
        var active = button.getAttribute("data-map-mode") === next;
        button.setAttribute("aria-pressed", active ? "true" : "false");
      });
      el.querySelectorAll("[data-map-panel]").forEach(function (panel) {
        panel.hidden = panel.getAttribute("data-map-panel") !== next;
      });
      if (next === "audit") loadAudit();
      if (next === "explore" && map) window.setTimeout(function () { map.invalidateSize(); }, 0);
    }

    function renderAudit() {
        els.auditStatus.hidden = true;
        els.auditContent.innerHTML =
          '<div class="mcc-audit-grid">' +
          '<section class="mcc-card"><h3>MeshMapper snapshot</h3><p>' + esc(data.version) + '</p>' +
          '<dl class="mcc-audit-list"><div><dt>Published zones</dt><dd>' + data.regionCounts.meshmapper + '</dd></div>' +
          '<div><dt>Starter regions</dt><dd>' + data.regionCounts.starters + '</dd></div>' +
          '<div><dt>Planning extensions</dt><dd>' + data.regionCounts.extensions + '</dd></div>' +
          '<div><dt>Fetched</dt><dd>' + esc(data.source.fetchedAt) + '</dd></div></dl>' +
          '<p><a href="https://meshmapper.net/" target="_blank" rel="noopener noreferrer">Open MeshMapper</a></p></section>' +
          '<section class="mcc-card"><h3>Flat scopes</h3><p>City, province, mesh scope where defined, can, and na. Each scope is independent.</p>' +
          '<p>onqc is for Ontario and Québec. can and na are reserved for future use, not companion defaults or active cross-border routes.</p></section>' +
          '<section class="mcc-card"><h3>Map limits</h3><p>Published MeshMapper zones are unchanged. Labelled planning regions fill the remaining gaps across Canada.</p>' +
          '<p>Planning regions follow provincial borders and nearby hubs. Newfoundland and Labrador are separate. Published MeshMapper zones take priority.</p></section>' +
          '</div>' +
          '<section class="mcc-card mcc-audit-artifacts"><h3>Source files</h3>' +
          '<dl class="mcc-hash-list"><div><dt>IATA boundaries SHA-256</dt><dd><code>' + esc(data.source.boundarySha256) + '</code></dd></div></dl>' +
          '<div class="mcc-detail-actions">' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("meshmapper-iata-boundaries.geojson", assetBase).href) + '" download>Download MeshMapper boundaries</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("iata-boundaries.geojson", assetBase).href) + '" download>Download IATA boundaries</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(new URL("iata-regions.json", assetBase).href) + '" download>Download catalog</a>' +
          '<a class="mcc-button mcc-button-secondary" href="' + esc(regionPageHref("standard")) + '">Open standard and change process</a>' +
          '</div></section>';
        auditLoaded = true;
    }

    function loadAudit() {
      if (auditLoaded) return;
      els.auditStatus.textContent = "Loading release evidence…";
      renderAudit();
    }

    function renderRegionBrowser(tag, fitSelection) {
      if (!data.hierarchy[tag]) tag = data.meta.rootTag || "can";
      state.browseTag = tag;
      var path = ancestryFor(data, tag, state.jurisdictionTag);
      els.breadcrumbs.innerHTML = path.map(function (item, index) {
        var current = index === path.length - 1;
        return '<button type="button" class="mcc-region-crumb' + (current ? ' is-current' : '') + '" data-region-node="' + esc(item) + '"' + (current ? ' aria-current="page"' : '') + '>' + esc(labelFor(data, item)) + '</button>';
      }).join('<span aria-hidden="true">›</span>');
      var children = childrenFor(data, tag);
      els.children.innerHTML = children.length ? children.map(function (child) {
        var nested = Boolean(data.policy.provinces[child]) || childrenFor(data, child).length > 0;
        var leafCount = leafDescendants(data, child).length;
        return '<button type="button" class="mcc-region-child" data-region-node="' + esc(child) + '">' +
          '<span><strong>' + esc(labelFor(data, child)) + '</strong><small>' +
          (nested ? leafCount + ' zones' : child.toUpperCase() + ' · zone') +
          '</small></span><span aria-hidden="true">' + (nested ? '›' : '✓') + '</span></button>';
      }).join("") : '<p class="mcc-help">' + (data.policy.provinces[tag] ? 'No MeshMapper zones are published here yet.' : 'Select this city zone to see its scope options.') + '</p>';
      if (!map || !browseLayer) return;
      browseLayer.clearLayers();
      if (tag !== (data.meta.rootTag || "can") && data.partitionByTag) {
        browseLayer.addData(featuresForNode(data, tag));
        browseLayer.bringToFront();
        if (selectedLayer) selectedLayer.bringToFront();
        if (fitSelection && browseLayer.getBounds().isValid()) {
          map.fitBounds(browseLayer.getBounds(), { padding: [28, 28], maxZoom: children.length ? 6 : 8 });
        }
      } else if (fitSelection) {
        map.fitBounds(data.meta.map.bounds || [[41.5, -141.5], [83.5, -52]], { padding: [24, 24], maxZoom: 4 });
      }
    }

    function updateMapVisuals(recenter) {
      if (!map || !selectedLayer) return;
      selectedLayer.clearLayers();
      if (state.canGenerate) {
        var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
        if (data.partitionByTag) {
          var selectedTags = rec ? rec.leaves : [state.resolution.primary.seed.tag];
          selectedLayer.addData({
            type: "FeatureCollection",
            features: data.partitionRegions.features.filter(function (feature) { return selectedTags.indexOf(feature.properties.tag) !== -1; })
          });
          selectedLayer.bringToFront();
          if (recenter && selectedLayer.getBounds().isValid()) {
            map.fitBounds(selectedLayer.getBounds(), { padding: [28, 28], maxZoom: 9 });
          }
        }
        if (marker) marker.setLatLng([state.lat, state.lon]);
        else marker = window.L.marker([state.lat, state.lon]).addTo(map);
      }
    }

    function renderTextResult() {
      if (!state.canGenerate || !state.resolution) {
        els.resultSection.hidden = true;
        els.textResult.innerHTML = "";
        return;
      }
      var tag = state.resolution.primary.seed.tag;
      var rec = recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
      var aliases = (data.regionAliases[tag] || []).filter(function (alias) {
        return normalizeLocationSearch(alias) !== normalizeLocationSearch(tag) &&
          normalizeLocationSearch(alias) !== normalizeLocationSearch(labelFor(data, tag));
      });
      aliases = aliases.filter(function (alias, index) {
        return aliases.findIndex(function (item) { return normalizeLocationSearch(item) === normalizeLocationSearch(alias); }) === index;
      });
      var communityUrl = new URL("../provinces/", regionPageHref("config"));
      communityUrl.searchParams.set("region", tag);
      els.resultSection.hidden = false;
      els.textResult.innerHTML =
        '<p class="mcc-deterministic-result"><strong>' + esc(state.name) + '</strong> resolves to <strong>' +
        esc(labelFor(data, tag)) + '</strong> (<code>' + esc(tag) + '</code>).</p>' +
        '<p class="mcc-region-path">' + esc(data.hierarchy[tag].provinces.map(function (province) { return labelFor(data, province); }).join(" / ")) + '</p>' +
        (state.resolution.sourceTier === "meshcore-canada"
          ? planningNotice(state.resolution)
          : '<p>These are published MeshMapper zones, not radio coverage or scope-enforcement boundaries.</p><p><a href="' + esc(seedForTag(data, tag).sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open this zone in MeshMapper</a></p>') +
        (window.MeshCoreRegionProfile ? window.MeshCoreRegionProfile.render(data, tag, state.jurisdictionTag, new URL("../", regionPageHref("config")), state.resolution) : '') +
        '<p><a href="' + esc(communityUrl.href) + '">Find a community</a></p>' +
        '<details><summary>Region details</summary><dl class="mcc-review-list"><div><dt>Province or territory</dt><dd>' + esc(state.jurisdictionTag ? labelFor(data, state.jurisdictionTag) : "Choose the repeater province in the configurator") + '</dd></div>' +
        '<div><dt>Status</dt><dd>' + esc(state.resolution.planningKind === "extension" ? "Planning extension" : statusLabel(statusFor(data, tag).state || "draft")) + '</dd></div>' +
        '<div><dt>Aliases</dt><dd>' + esc(aliases.length ? aliases.join(", ") : "None recorded") + '</dd></div>' +
        '<div><dt>Repeater paths</dt><dd>' + esc(rec ? rec.paths.length : 1) + '</dd></div></dl></details>' +
        '<div class="mcc-detail-actions"><a class="mcc-button" href="' + esc(configHrefForState(state)) + '">Configure this region</a>' +
        '<button type="button" class="mcc-button mcc-button-secondary" data-action="copy-region-link">' + icon("link") + 'Copy link</button></div>';
      var copyLink = els.textResult.querySelector("[data-action='copy-region-link']");
      if (copyLink) copyLink.addEventListener("click", function () {
        copyText(mapHrefForState(state), copyLink, "Copy link");
      });
    }

    function finishGeo(geo, forcedTag, recenter, requestId) {
      if (requestId !== locationRequestId) return;
      state.lat = Number(geo.lat);
      state.lon = Number(geo.lon);
      state.name = geo.name || (state.lat.toFixed(4) + ", " + state.lon.toFixed(4));
      state.forcedTag = forcedTag || geo.tag || null;
      state.manualSelection = geo.source === "region";
      state.jurisdictionTag = geo.provinceTag || jurisdictionTagFromGeo(geo);
      if (!isCanada(geo)) {
        state.canGenerate = false;
        state.resolution = null;
        setStatus(els.status, "This location is outside Canada.", "warning");
        renderTextResult();
        return;
      }
      state.resolution = resolveLocation(data, state.lat, state.lon, state.forcedTag, state.jurisdictionTag, state.manualSelection);
      state.jurisdictionTag = state.resolution.province;
      state.canGenerate = state.resolution.hasMatch;
      state.detailTag = state.canGenerate ? state.resolution.primary.seed.tag : null;
      if (!state.canGenerate) {
        setStatus(els.status, state.resolution.matches.length > 1
          ? "More than one MeshMapper zone contains this point. Select your community's zone on the map."
          : state.resolution.matches.length
            ? "The saved zone differs from this location. Choose the current IATA region."
            : "No IATA region contains this point. Browse the region list or check with your community.", "warning");
      } else {
        setStatus(els.status, "Region found.", "info");
        renderRegionBrowser(state.detailTag, false);
      }
      renderTextResult();
      updateMapVisuals(recenter);
    }

    function useGeo(geo, recenter, forcedTag) {
      var requestId = ++locationRequestId;
      state.canGenerate = false;
      renderTextResult();
      setStatus(els.status, "Checking the Canadian region data…", "info");
      return ensureResolverData(data).then(function () {
        finishGeo(geo, forcedTag, recenter, requestId);
      }).catch(function (error) {
        if (requestId !== locationRequestId) return;
        setStatus(els.status, esc(error.message || "Unable to load the Canadian location data."), "error");
      });
    }

    function chooseRegionNode(tag) {
      var children = childrenFor(data, tag);
      var province = data.policy.provinces[state.browseTag] ? state.browseTag : null;
      renderRegionBrowser(tag, true);
      if (!children.length) {
        var seed = seedForTag(data, tag);
        if (seed) useGeo({ lat: seed.lat, lon: seed.lon, name: labelFor(data, tag), countryCode: "ca", tag: tag, source: "region", provinceTag: province }, true, tag);
      }
    }

    function locate() {
      var query = els.input.value.trim();
      if (!query) {
        setStatus(els.status, "Enter a city, airport code, postal code, or region name.", "error");
        return;
      }
      if (activeGeocodeController) activeGeocodeController.abort();
      activeGeocodeController = typeof AbortController !== "undefined" ? new AbortController() : null;
      var thisController = activeGeocodeController;
      els.locate.disabled = true;
      els.locate.textContent = "Finding";
      geocode(data, query, thisController && thisController.signal)
        .then(function (geo) { return useGeo(geo, true, geo.tag); })
        .catch(function (error) {
          if (error && error.name === "AbortError") return;
          state.canGenerate = false;
          renderTextResult();
          setStatus(els.status, esc(error.message || "Location lookup failed"), "error");
          showLocationChoices(els.status, error.choices, function (geo) { return useGeo(geo, true, geo.tag); });
        }).finally(function () {
          if (activeGeocodeController !== thisController) return;
          els.locate.disabled = false;
          els.locate.innerHTML = icon("search") + "Find";
        });
    }

    function useCoordinates() {
      var coordinates = configuratorSupport.parseCoordinates
        ? configuratorSupport.parseCoordinates(els.latitude.value, els.longitude.value)
        : null;
      if (!coordinates) {
        setStatus(els.status, "Enter a latitude from -90 to 90 and a longitude from -180 to 180.", "error");
        return;
      }
      useGeo({
        lat: coordinates.lat,
        lon: coordinates.lon,
        name: coordinates.lat.toFixed(4) + ", " + coordinates.lon.toFixed(4),
        countryCode: "ca"
      }, true, null);
    }

    function loadInteractiveMap() {
      if (map || mapIsLoading) return;
      mapIsLoading = true;
      els.loadMap.hidden = true;
      els.mapStage.setAttribute("aria-busy", "true");
      els.boundaryStatus.hidden = false;
      els.mapLoadStatus.textContent = "Loading Canadian boundaries and map tools…";
      els.mapReadyStatus.textContent = "Loading the interactive region map.";
      loadLeaflet().then(function (L) {
        L.Icon.Default.imagePath = new URL("vendor/leaflet/images/", assetBase).href;
        els.mapArea.hidden = false;
        map = L.map(els.canvas, { minZoom: 1, maxZoom: 13 });
        var loadingMap = map;
        activeMaps.push({ container: el, map: map });
        var initialRec = state.canGenerate && recommend(data, state.resolution, state.type, state.selectedMetros, state.selectedExternalPaths);
        var initialFeatures = initialRec && data.partitionRegions
          ? data.partitionRegions.features.filter(function (feature) { return initialRec.leaves.indexOf(feature.properties.tag) !== -1; }) : [];
        var initialBounds = initialFeatures.length ? L.geoJSON(initialFeatures).getBounds() : null;
        map.fitBounds(initialBounds && initialBounds.isValid() ? initialBounds : data.meta.map.bounds || [[41.5, -141.5], [83.5, -52]],
          { padding: [28, 28], maxZoom: initialFeatures.length ? 9 : 4, animate: false });
        var tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" rel="noopener noreferrer">OpenStreetMap</a> contributors'
        }).addTo(map);
        browseLayer = L.geoJSON(null, { interactive: false, style: function (feature) {
          return { color: "#ffd166", opacity: 1, weight: 3, fillOpacity: 0, dashArray: feature.properties.regionSource === "meshcore-canada" ? "8 5" : null };
        } }).addTo(map);
        selectedLayer = L.geoJSON(null, { interactive: false, style: function (feature) {
          var planning = feature.properties.regionSource === "meshcore-canada";
          return { color: "#ffffff", opacity: 1, weight: 4, dashArray: planning ? "8 5" : null, fillColor: "#4287ff", fillOpacity: 0.3 };
        } }).addTo(map);
        updateMapVisuals(false);
        // Paint tiles first; the much larger boundary overlay can arrive independently.
        var boundariesReady = loadDisplayPartition(data).then(function (partition) {
          if (map !== loadingMap) return;
          applyGeneratedPartition(data, partition, null);
          L.geoJSON(data.partitionRegions, {
            bubblingMouseEvents: false,
            style: function (feature) {
              var starter = feature.properties.regionSource === "meshcore-canada";
              return { color: starter ? "#ffd166" : "#aeb8ff", opacity: 0.8, weight: starter ? 2 : 1,
                dashArray: starter ? "6 4" : null, fillColor: colorForTag(feature.properties.tag), fillOpacity: 0.2 };
            },
            onEachFeature: function (feature, layer) {
              var label = (frenchRuntime && feature.properties.nameFr) || feature.properties.label || feature.properties.name || feature.properties.tag.toUpperCase();
              layer.bindTooltip('<strong>' + esc(feature.properties.tag.toUpperCase()) + '</strong> - ' + esc(label) + (feature.properties.regionSource === "meshcore-canada" ? '<br>' + (frenchRuntime ? 'Planification MeshCore Canada' : 'MeshCore Canada planning') : ''));
              layer.on("click", function (event) {
                if (event.originalEvent) L.DomEvent.stopPropagation(event.originalEvent);
                useGeo({ lat: event.latlng.lat, lon: event.latlng.lng, name: label, countryCode: "ca", tag: feature.properties.tag }, false, feature.properties.tag);
              });
            }
          }).addTo(map);
          renderRegionBrowser(state.browseTag, false);
          updateMapVisuals(false);
        });
        map.on("click", function (event) {
          useGeo({
            lat: event.latlng.lat,
            lon: event.latlng.lng,
            name: event.latlng.lat.toFixed(4) + ", " + event.latlng.lng.toFixed(4),
            countryCode: "ca"
          }, false, null);
        });
        window.setTimeout(function () { if (map === loadingMap) map.invalidateSize(); }, 0);
        var tilesReady = new Promise(function (resolve, reject) {
          var settled = false;
          var timeout = window.setTimeout(function () {
            if (settled) return;
            settled = true;
            reject(new Error("OpenStreetMap tiles did not load. Search and the region list still work."));
          }, 10000);
          tileLayer.once("tileload", function () {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            if (map === loadingMap) els.mapLoading.hidden = true;
            resolve();
          });
          tileLayer.once("load", function () {
            if (settled) return;
            settled = true;
            window.clearTimeout(timeout);
            reject(new Error("OpenStreetMap tiles could not load. Search and the region list still work."));
          });
        });
        return Promise.all([tilesReady, boundariesReady]);
      }).then(function () {
        els.mapLoading.hidden = true;
        els.boundaryStatus.hidden = true;
        els.mapLoadStatus.textContent = "";
        els.mapStage.setAttribute("aria-busy", "false");
        els.mapReadyStatus.textContent = "Interactive region map loaded.";
        mapIsLoading = false;
      }).catch(function (error) {
        if (map) {
          var failedMap = map;
          try { map.remove(); } catch (cleanupError) { /* Leaflet may have failed during setup. */ }
          activeMaps = activeMaps.filter(function (entry) { return entry.map !== failedMap; });
          map = null;
          marker = null;
          browseLayer = null;
          selectedLayer = null;
        }
        els.mapArea.hidden = true;
        els.mapLoading.hidden = false;
        els.boundaryStatus.hidden = true;
        els.loadMap.hidden = false;
        mapIsLoading = false;
        els.mapLoadStatus.textContent = error.message || "The map could not load. Search and the region list still work.";
        els.mapStage.setAttribute("aria-busy", "false");
        els.mapReadyStatus.textContent = els.mapLoadStatus.textContent;
      });
    }

    el.querySelectorAll("[data-map-mode]").forEach(function (button) {
      button.addEventListener("click", function () { setMapMode(button.getAttribute("data-map-mode")); });
    });
    els.breadcrumbs.addEventListener("click", function (event) {
      var button = event.target.closest("[data-region-node]");
      if (button) chooseRegionNode(button.getAttribute("data-region-node"));
    });
    els.children.addEventListener("click", function (event) {
      var button = event.target.closest("[data-region-node]");
      if (button) chooseRegionNode(button.getAttribute("data-region-node"));
    });
    els.locate.addEventListener("click", locate);
    els.input.addEventListener("keydown", function (event) { if (event.key === "Enter") locate(); });
    els.coordinates.addEventListener("click", useCoordinates);
    els.loadMap.addEventListener("click", loadInteractiveMap);
    renderRegionBrowser(state.browseTag, false);
    var regionList = el.querySelector("#mcc-region-list");
    function ensureRegionTable() {
      if (!els.table.firstChild) renderRegionTable(els.table, data);
    }
    regionList.addEventListener("toggle", function () {
      if (regionList.open) ensureRegionTable();
    });
    el.querySelector(".mcc-skip-map").addEventListener("click", function () {
      regionList.open = true;
      ensureRegionTable();
    });
    function observeInteractiveMap() {
      // Text lookup is useful on its own; download the display layer only when it is visible.
      if ("IntersectionObserver" in window) {
        var mapObserver = new IntersectionObserver(function (entries) {
          if (entries.some(function (entry) { return entry.isIntersecting; })) {
            mapObserver.disconnect();
            loadInteractiveMap();
          }
        });
        mapObserver.observe(els.mapStage);
      } else {
        window.setTimeout(loadInteractiveMap, 0);
      }
    }

    keepLanguageSelection(state);
    // Load the same validated profile list used by the configurator before carrying a choice back.
    if (radioProfiles) radioProfiles.populate(document.createElement("select")).then(function () {
      try {
        radioProfiles.commands(mapParams.get("radio"), "keep");
        state.radioProfile = mapParams.get("radio") || "keep";
      } catch (_) { state.radioProfile = "keep"; }
      renderTextResult();
    });
    if (mapParams.has("firmware")) state.firmware = ["1.14", "1.15", "1.16"].indexOf(mapParams.get("firmware")) !== -1 ? mapParams.get("firmware") : "unsupported";
    if (["repeater", "room", "advanced"].indexOf(mapParams.get("role")) !== -1) state.deviceRole = mapParams.get("role");
    if (["guided", "technical"].indexOf(mapParams.get("instructions")) !== -1) state.finishPath = mapParams.get("instructions");
    var initialGeo = initialLocation(data, mapParams);
    if (initialGeo) {
      els.input.value = initialGeo.name;
      // Text lookup and visible map tiles must not wait on each other's data.
      useGeo(initialGeo, true, initialGeo.tag);
      observeInteractiveMap();
    } else {
      if (mapParams.has("tag") || mapParams.has("lat") || mapParams.has("lon")) {
        setStatus(els.status, "This saved location is invalid or no longer available. Choose a region again.", "warning");
      }
      observeInteractiveMap();
    }
    setMapMode(mapParams.get("view") === "audit" ? "audit" : "explore");
  }

  function regionRows(data) {
    return (data.consolidatedRegionTags || Object.keys(data.hierarchy)).map(function (tag) {
      var item = data.hierarchy[tag];
      var st = statusFor(data, tag);
      var seed = seedForTag(data, tag);
      var hasGeneratedBoundary = Boolean(seed);
      return {
        tag: tag,
        label: labelFor(data, tag),
        parent: item.parent || "",
        ancestry: ancestryText(data, tag),
        province: provinceTagFor(data, tag),
        provinces: item.provinces || [],
        state: st.state || "draft",
        statusLabel: statusLabel(st.state || "draft"),
        source: st.source || "",
        reviewer: st.reviewer || "",
        seed: seedText(seed),
        sourceTier: seed.regionSource,
        boundaryType: seed.regionSource === "meshmapper" ? "meshmapper-zone" : "starter-region",
        planningExtension: st.planningExtension === true,
        sourceUrl: sourceUrlFor(data, tag),
        basis: st.basis || item.basis || "proposed"
      };
    });
  }

  function renderRegionTable(el, data) {
    var provinces = provinceOptions(data);
    el.innerHTML =
      '<div class="mcc-table-console">' +
      '<div class="mcc-table-controls">' +
      '<label class="mcc-search-field">' + icon("search") + '<input class="mcc-input mcc-table-filter" data-role="table-filter" type="search" placeholder="Search regions" aria-label="Search regions"></label>' +
      '<select class="mcc-select" data-role="table-province" aria-label="Filter by area">' +
      '<option value="">All areas</option>' +
      provinces.map(function (tag) {
        return '<option value="' + esc(tag) + '">' + esc(labelFor(data, tag)) + '</option>';
      }).join("") +
      '</select>' +
      '<span class="mcc-table-count" data-role="table-count" role="status" aria-live="polite"></span>' +
      '</div>' +
      '<div class="mcc-table-layout">' +
      '<div class="mcc-region-table-wrap" role="region" aria-label="Region directory table" tabindex="0"><table class="mcc-region-table"><thead><tr><th scope="col">City zone</th><th scope="col">Province or territory</th><th scope="col">Source</th></tr></thead><tbody></tbody></table></div>' +
      '</div>' +
      '</div>';
    var input = el.querySelector("[data-role='table-filter']");
    var province = el.querySelector("[data-role='table-province']");
    var count = el.querySelector("[data-role='table-count']");
    var body = el.querySelector("tbody");
    var rows = regionRows(data);

    function draw() {
      var filter = slug(input.value);
      var provinceFilter = province.value;
      var shown = rows.filter(function (row) {
        var haystack = slug([row.tag, row.label, row.parent, row.ancestry].join(" "));
        if (filter && haystack.indexOf(filter) === -1) return false;
        if (provinceFilter && row.provinces.indexOf(provinceFilter) === -1) return false;
        return true;
      });
      count.textContent = shown.length === rows.length ? rows.length + " regions" : shown.length + " of " + rows.length + " regions";
      body.innerHTML = shown.map(function (row) {
        return "<tr>" +
          '<td><code>' + esc(row.tag) + "</code> " + esc(row.label) + "</td>" +
          "<td>" + esc(row.provinces.map(function (province) { return labelFor(data, province); }).join(" / ")) + "</td>" +
          '<td><a href="' + esc(row.sourceUrl) + '">' + esc(row.sourceTier === "meshmapper" ? "MeshMapper" : "MeshCore Canada starter region") + '</a>' +
          (row.planningExtension ? '<br><a href="' + esc(regionPageHref("standard") + '#planning-extensions') + '">Planning extension</a>' : '') + '</td>' +
          "</tr>";
      }).join("");
    }
    input.addEventListener("input", draw);
    province.addEventListener("change", draw);
    draw();
  }

  function renderDashboard(el, data) {
    el.innerHTML =
      '<div class="mcc-dashboard">' +
      '<section class="mcc-console-header mcc-dashboard-header">' +
      '<h2>Canadian regions</h2>' +
      '<div class="mcc-dashboard-actions">' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("config")) + '">' + icon("list-checks") + '<span><strong>Setup</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("map")) + '">' + icon("map") + '<span><strong>Map</strong></span></a>' +
      '<a class="mcc-action-button" href="' + esc(regionPageHref("standard")) + '">' + icon("book-open-check") + '<span><strong>Standard</strong></span></a>' +
      '</div>' +
      '</section>' +
      '<section class="mcc-stat-grid" aria-label="Region status summary">' +
      '<div class="mcc-stat"><span>Regions</span><strong>' + data.regionCounts.total + '</strong></div>' +
      '<div class="mcc-stat"><span>Local regions</span><strong>' + data.regionCounts.meshmapper + '</strong></div>' +
      '<div class="mcc-stat"><span>Provinces &amp; territories</span><strong>' + provinceOptions(data).length + '</strong></div>' +
      '</section>' +
      '<section class="mcc-card mcc-dashboard-table">' +
      '<div class="mcc-section-head"><div><h2>Regions</h2></div></div>' +
      '<div data-role="dashboard-table"></div>' +
      '</section>' +
      '</div>';
    renderRegionTable(el.querySelector("[data-role='dashboard-table']"), data);
  }

  function initRegions() {
    frenchRuntime = /^fr(?:-|$)/i.test(document.documentElement.lang || "");
    activeMaps = activeMaps.filter(function (entry) {
      if (entry.container.isConnected) return true;
      try { entry.map.remove(); } catch (error) { /* The old document is already gone. */ }
      return false;
    });
    var nodes = Array.prototype.slice.call(document.querySelectorAll("[data-mcc-regions]"));
    if (!nodes.length) return;
    nodes.forEach(function (node) {
      if (!node.isConnected || node.dataset.mccReady === "1" || node.dataset.mccLoading === "1") return;
      var mode = node.getAttribute("data-mcc-regions");
      node.dataset.mccLoading = "1";
      enableRuntimeLocalization(node);
      node.innerHTML = '<div class="mcc-status mcc-status-info" role="status">Loading Canadian regions…</div>';
      loadData(mode).then(function (data) {
        if (!node.isConnected) return;
        delete node.dataset.mccLoading;
        node.dataset.mccReady = "1";
        if (mode === "config") initConfig(node, data);
        if (mode === "map") initMap(node, data);
        if (mode === "dashboard") renderDashboard(node, data);
        if (mode === "table") renderRegionTable(node, data);
      }).catch(function (err) {
        if (!node.isConnected) return;
        delete node.dataset.mccLoading;
        delete node.dataset.mccReady;
        node.innerHTML = '<div class="mcc-status mcc-status-error" role="alert"><p>' + esc(err.message) + '</p><button type="button" class="mcc-button mcc-button-secondary" data-action="retry-regions">Try again</button></div>';
        var retry = node.querySelector("[data-action='retry-regions']");
        if (retry) retry.addEventListener("click", initRegions, { once: true });
      });
    });
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(initRegions);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRegions);
  } else {
    initRegions();
  }
}());
