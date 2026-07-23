(function () {
  "use strict";

  var pathIsFrench = /(?:^|\/)fr(?:\/|$)/.test(window.location.pathname);
  var declaredLanguage = (document.documentElement.lang || "").toLowerCase();
  var isFrench = pathIsFrench || declaredLanguage === "fr" || declaredLanguage.indexOf("fr-") === 0;

  var dictionary = {
    "External link": "Lien externe",
    "Site search": "Recherche sur le site",
    "Open navigation": "Ouvrir la navigation",
    "Close navigation": "Fermer la navigation",
    "Open site search": "Ouvrir la recherche sur le site",
    "Close site search": "Fermer la recherche sur le site",
    "Zoom in": "Zoom avant",
    "Zoom out": "Zoom arrière",
    "Start using MeshCore": "Commencer avec MeshCore",
    "Region boundary editor · MeshCore Canada": "Éditeur des limites régionales · MeshCore Canada",
    "Skip the map and choose a municipality": "Passer la carte et choisir une municipalité",
    "Region boundary editor": "Éditeur des limites régionales",
    "Editor": "Éditeur",
    "Home": "Accueil",
    "Standard": "Norme",
    "Help": "Aide",
    "Exit editor": "Quitter l’éditeur",
    "Boundary editing controls": "Commandes de modification des limites",
    "Region proposal": "Proposition régionale",
    "Suggest a region change": "Proposer une modification régionale",
    "Submitting creates a public proposal for review; it does not change the map.": "La soumission crée une proposition publique à examiner; elle ne modifie pas la carte.",
    "Read the region rules": "Lire les règles régionales",
    "1. Choose proposal type": "1. Choisir le type de proposition",
    "Proposal type": "Type de proposition",
    "Adjust an existing boundary": "Modifier une limite existante",
    "Move official census areas to an existing region.": "Déplacer des zones de recensement officielles vers une région existante.",
    "Advanced: propose a new region/subregion": "Avancé : proposer une nouvelle région ou sous-région",
    "Define a new public name, tag, cells, and anchor for review.": "Définir un nouveau nom public, un identifiant, des cellules et un point d’ancrage à examiner.",
    "2. Choose an area": "2. Choisir une zone",
    "Province or territory": "Province ou territoire",
    "Loading editor…": "Chargement de l’éditeur…",
    "Choose a proposal type to begin.": "Choisissez un type de proposition pour commencer.",
    "Discard saved draft": "Supprimer le brouillon enregistré",
    "3. Build the proposal": "3. Préparer la proposition",
    "Move selected areas to": "Déplacer les zones sélectionnées vers",
    "Choose a target region": "Choisir une région de destination",
    "New region name": "Nom de la nouvelle région",
    "Short tag": "Identifiant court",
    "Lowercase letters, numbers and hyphens; up to 29 characters.": "Lettres minuscules, chiffres et traits d’union; 29 caractères au maximum.",
    "Suggested tag:": "Identifiant proposé :",
    "Use suggestion": "Utiliser la suggestion",
    "Proposed hierarchy": "Hiérarchie proposée",
    "Add cells to derive the parent.": "Ajoutez des cellules pour déterminer la région parente.",
    "Canada › Province or territory › Proposed region": "Canada › Province ou territoire › Région proposée",
    "The parent comes from the shared ancestry of the selected cells and is verified by the server.": "La région parente vient de la hiérarchie commune des cellules sélectionnées et sera vérifiée par le serveur.",
    "Municipality or census subdivision": "Municipalité ou subdivision de recensement",
    "Choose a municipality": "Choisir une municipalité",
    "Add whole municipality": "Ajouter toute la municipalité",
    "Start with a whole municipality. You do not need the map to submit a proposal.": "Commencez par une municipalité entière. La carte n’est pas nécessaire pour soumettre une proposition.",
    "Repeater paths": "Chemins des répéteurs",
    "This editor changes Canadian map cells only. Set cross-province and U.S. paths in the configurator.": "Cet éditeur modifie seulement les cellules canadiennes. Réglez les chemins interprovinciaux et américains dans le configurateur.",
    "Read the rule": "Lire la règle",
    "Advanced: split a municipality by census cell": "Avancé : diviser une municipalité par cellule de recensement",
    "Use individual cells only when a full municipality does not fit the boundary.": "Utilisez des cellules individuelles seulement si la municipalité entière ne correspond pas à la limite.",
    "This creates a finer boundary for review.": "Cela crée une limite plus précise à examiner.",
    "Map editing mode": "Mode de modification de la carte",
    "Pan": "Déplacer",
    "Inspect": "Examiner",
    "Paint": "Peindre",
    "Map inspection": "Examen de la carte",
    "Area": "Zone",
    "Select a cell on the map": "Sélectionnez une cellule sur la carte",
    "Municipality": "Municipalité",
    "Current region": "Région actuelle",
    "Region anchor": "Point d’ancrage régional",
    "Move entire municipality": "Déplacer toute la municipalité",
    "New region anchor": "Point d’ancrage de la nouvelle région",
    "Choose a changed cell": "Choisir une cellule modifiée",
    "Confirm this anchor": "Confirmer ce point d’ancrage",
    "Choose a changed cell near the centre, then confirm it. Existing fixed anchors cannot be used.": "Choisissez une cellule modifiée près du centre, puis confirmez-la. Les points d’ancrage fixes existants ne peuvent pas être utilisés.",
    "4. Review": "4. Relire",
    "0 changes": "0 modification",
    "Undo": "Annuler",
    "Redo": "Rétablir",
    "Clear": "Effacer",
    "Boundary comparison": "Comparaison des limites",
    "Before": "Avant",
    "After": "Après",
    "Proposal summary": "Résumé de la proposition",
    "Choose a proposal type and geography to build a text review.": "Choisissez un type de proposition et une zone géographique pour produire le résumé.",
    "Proposed ownership changes": "Modifications proposées de l’attribution",
    "Before and after by official census area": "Avant et après par zone de recensement officielle",
    "Municipality / area": "Municipalité ou zone",
    "Action": "Action",
    "No proposed changes.": "Aucune modification proposée.",
    "Submitted by": "Soumis par",
    "optional": "facultatif",
    "This field is never stored in the local draft.": "Ce champ n’est jamais enregistré dans le brouillon local.",
    "Reason": "Raison",
    "Why should this cell move?": "Pourquoi cette cellule devrait-elle être déplacée?",
    "Ready to submit?": "Prêt à soumettre?",
    "Choose a proposal type": "Choisir un type de proposition",
    "Choose a province or territory": "Choisir une province ou un territoire",
    "Choose or define the destination region": "Choisir ou définir la région de destination",
    "Add at least one official census cell": "Ajouter au moins une cellule de recensement officielle",
    "Confirm an anchor for a new region": "Confirmer un point d’ancrage pour la nouvelle région",
    "Explain the reason": "Expliquer la raison",
    "Complete the anti-spam check": "Effectuer la vérification antipourriel",
    "Website": "Site Web",
    "Anti-spam check": "Vérification antipourriel",
    "Loading check…": "Chargement de la vérification…",
    "Retry check": "Réessayer la vérification",
    "Submit for review": "Soumettre aux fins d’examen",
    "Download proposal": "Télécharger la proposition",
    "No account needed. Submission starts public review; it does not change the map.": "Aucun compte n’est nécessaire. La soumission lance l’examen public; elle ne modifie pas la carte.",
    "Region map editor": "Éditeur de la carte des régions",
    "Inspect cells or use the municipality list; yellow means changed": "Examinez les cellules ou utilisez la liste des municipalités; le jaune indique une modification",
    "Optional interactive region boundary map": "Carte interactive facultative des limites régionales",
    "The map is optional. Use the municipality list in step three for a full non-map flow. In Inspect mode, select a cell to read its details. Enable the advanced acknowledgement before painting individual cells.": "La carte est facultative. Utilisez la liste des municipalités à l’étape trois pour travailler sans carte. En mode Examiner, sélectionnez une cellule pour voir ses détails. Confirmez l’option avancée avant de peindre des cellules individuelles.",
    "Proposed change": "Modification proposée",
    "Discard this draft?": "Supprimer ce brouillon?",
    "Keep editing": "Continuer la modification",
    "Discard draft": "Supprimer le brouillon",
    "British Columbia": "Colombie-Britannique",
    "Alberta": "Alberta",
    "Saskatchewan": "Saskatchewan",
    "Manitoba": "Manitoba",
    "Ontario": "Ontario",
    "Quebec": "Québec",
    "New Brunswick": "Nouveau-Brunswick",
    "Nova Scotia": "Nouvelle-Écosse",
    "Prince Edward Island": "Île-du-Prince-Édouard",
    "Newfoundland and Labrador": "Terre-Neuve-et-Labrador",
    "Yukon": "Yukon",
    "Northwest Territories": "Territoires du Nord-Ouest",
    "Nunavut": "Nunavut",
    "Local draft storage is unavailable. Download before leaving.": "Le stockage local des brouillons n’est pas disponible. Téléchargez la proposition avant de partir.",
    "No saved draft.": "Aucun brouillon enregistré.",
    "Saved locally.": "Brouillon enregistré sur cet appareil.",
    "Draft could not be saved locally. Download before leaving.": "Le brouillon n’a pas pu être enregistré sur cet appareil. Téléchargez la proposition avant de partir.",
    "Unsaved changes…": "Modifications non enregistrées…",
    "An earlier draft was submitted": "Une version antérieure du brouillon a été soumise",
    "This proposal was already submitted": "Cette proposition a déjà été soumise",
    "Public review created": "Examen public créé",
    "Open": "Ouvrir",
    "Schema": "Schéma",
    "Proposal hash": "Hachage de la proposition",
    "Submitted version": "Version soumise",
    "Next: community review, maintainer approval, then independent repository validation. Submission alone does not change the map.": "Ensuite : examen par la communauté, approbation par l’équipe de maintenance, puis validation indépendante dans le dépôt. La soumission seule ne modifie pas la carte.",
    "That public region name is already used or reserved.": "Ce nom de région public est déjà utilisé ou réservé.",
    "Use lowercase letters, numbers and single hyphens; do not start with a hyphen.": "Utilisez des lettres minuscules, des chiffres et des traits d’union simples; ne commencez pas par un trait d’union.",
    "That canonical tag is already used or reserved.": "Cet identifiant canonique est déjà utilisé ou réservé.",
    "Not derived yet": "Pas encore déterminée",
    "Proposed region": "Région proposée",
    "Add cells before choosing an anchor": "Ajoutez des cellules avant de choisir un point d’ancrage",
    "Census area": "Zone de recensement",
    "Choose a changed cell near the centre, then confirm it. No anchor is selected automatically.": "Choisissez une cellule modifiée près du centre, puis confirmez-la. Aucun point d’ancrage n’est sélectionné automatiquement.",
    "This editor changes Canadian map cells only. Choose cross-province and U.S. paths in the configurator.": "Cet éditeur modifie seulement les cellules canadiennes. Choisissez les chemins interprovinciaux et américains dans le configurateur.",
    "Edit each province separately; repeater setup keeps the paths together.": "Modifiez chaque province séparément; la configuration du répéteur conserve les chemins ensemble.",
    "Unnamed census area": "Zone de recensement sans nom",
    "Remove": "Retirer",
    "Proposal type": "Type de proposition",
    "New region/subregion (v2)": "Nouvelle région ou sous-région (v2)",
    "Existing boundary adjustment (v1)": "Modification d’une limite existante (v1)",
    "Jurisdiction and hierarchy": "Champ de compétence et hiérarchie",
    "Destination": "Destination",
    "Not chosen": "Non choisie",
    "Official geography": "Géographie officielle",
    "Sources": "Sources",
    "None yet": "Aucune pour le moment",
    "Anchor": "Point d’ancrage",
    "Not confirmed": "Non confirmé",
    "Existing fixed anchors remain protected": "Les points d’ancrage fixes existants restent protégés",
    "Authority base": "Base faisant autorité",
    "Loading": "Chargement",
    "Validation": "Validation",
    "Client checks run before export. The gateway and repository independently revalidate every authority rule.": "Les vérifications du navigateur s’exécutent avant l’exportation. La passerelle et le dépôt revérifient indépendamment toutes les règles faisant autorité.",
    "Lifecycle": "Cycle de traitement",
    "Public review → maintainer approval → national validation → publication": "Examen public → approbation de l’équipe de maintenance → validation nationale → publication",
    "Client checks are ready.": "Les vérifications du navigateur sont terminées.",
    "Complete the readiness checklist.": "Terminez la liste de vérification.",
    "Editor cells contain an unsupported geometry type.": "Les cellules de l’éditeur contiennent un type de géométrie non pris en charge.",
    "Editor cell topology is invalid.": "La topologie des cellules de l’éditeur est invalide.",
    "Check failed. Retrying…": "La vérification a échoué. Nouvelle tentative…",
    "Retrying check…": "Nouvelle tentative de vérification…",
    "Check expired. Retrying…": "La vérification a expiré. Nouvelle tentative…",
    "Check timed out. Retrying…": "La vérification a pris trop de temps. Nouvelle tentative…",
    "Complete the check.": "Effectuez la vérification.",
    "Anti-spam protection is unavailable.": "La protection antipourriel n’est pas disponible.",
    "Complete the check first.": "Effectuez d’abord la vérification.",
    "Submitting…": "Soumission…",
    "Submitted, but later edits were not included. Submit again to include them.": "La proposition a été soumise, mais les modifications plus récentes n’y figurent pas. Soumettez-la de nouveau pour les inclure.",
    "Already submitted. Open the issue below.": "Déjà soumise. Ouvrez le billet ci-dessous.",
    "Submitted for review.": "Soumise aux fins d’examen.",
    "The proposal could not be submitted.": "La proposition n’a pas pu être soumise.",
    "Reload and try again.": "Rechargez la page et réessayez.",
    "Your edits are saved here. Complete the check and try again.": "Vos modifications sont conservées ici. Effectuez la vérification et réessayez.",
    "Download the proposal to share it.": "Téléchargez la proposition pour la partager.",
    "Preparing another check…": "Préparation d’une nouvelle vérification…",
    "No schema": "Aucun schéma",
    "No province selected": "Aucune province sélectionnée",
    "Switch proposal type?": "Changer de type de proposition?",
    "The current on-screen draft will be put away. Its local saved copy will remain under the current schema.": "Le brouillon affiché sera mis de côté. Sa copie locale restera enregistrée sous le schéma actuel.",
    "Switch type": "Changer de type",
    "Switch province or territory?": "Changer de province ou de territoire?",
    "The current on-screen draft will be put away. Its local saved copy will remain under this province and schema.": "Le brouillon affiché sera mis de côté. Sa copie locale restera enregistrée sous cette province et ce schéma.",
    "Switch area": "Changer de zone",
    "Confirm the public-content statement before saving a draft.": "Confirmez que le contenu peut être public avant d’enregistrer un brouillon.",
    "Draft saved on this device. Turnstile and anti-spam values are never stored.": "Brouillon enregistré sur cet appareil. Les valeurs Turnstile et antipourriel ne sont jamais conservées.",
    "This browser blocked draft storage. Your answers remain in the form.": "Ce navigateur a bloqué l’enregistrement du brouillon. Vos réponses restent dans le formulaire.",
    "Saved draft updated on this device.": "Brouillon mis à jour sur cet appareil.",
    "Saved draft cleared.": "Brouillon enregistré supprimé.",
    "An incompatible saved draft was removed.": "Un brouillon enregistré incompatible a été supprimé.",
    "Draft restored. Confirm the public-content statement before updating or submitting it.": "Brouillon restauré. Confirmez que le contenu peut être public avant de le mettre à jour ou de le soumettre.",
    "The saved draft could not be read and was removed.": "Le brouillon enregistré était illisible et a été supprimé.",
    "You can now save a draft on this device.": "Vous pouvez maintenant enregistrer un brouillon sur cet appareil.",
    "Update preview": "Mettre l’aperçu à jour",
    "Review changes again": "Relire les changements",
    "Review idea": "Relire l’idée",
    "Earlier version submitted. New changes are not included.": "Une version antérieure a été soumise. Les nouvelles modifications n’y figurent pas.",
    "Already submitted.": "Déjà soumise.",
    "Open issue": "Ouvrir le billet",
    "Maintainers will review the public issue and respond there.": "L’équipe de maintenance examinera le billet public et y répondra.",
    "Answers changed. Review them again before submitting.": "Les réponses ont changé. Relisez-les avant de soumettre.",
    "Check failed. Retry.": "La vérification a échoué. Réessayez.",
    "Check complete.": "Vérification terminée.",
    "Retrying the anti-spam check…": "Nouvelle tentative de vérification antipourriel…",
    "Anonymous submission is unavailable. Copy the idea or use GitHub.": "La soumission anonyme n’est pas disponible. Copiez l’idée ou utilisez GitHub.",
    "Fix the fields listed above, then review again.": "Corrigez les champs indiqués ci-dessus, puis relisez la proposition.",
    "Too long to prefill. Copy the text, then use GitHub.": "Le texte est trop long pour être prérempli. Copiez-le, puis utilisez GitHub.",
    "Preview ready. Nothing has been submitted. You can now submit.": "L’aperçu est prêt. Rien n’a été soumis. Vous pouvez maintenant soumettre l’idée.",
    "Preview ready. Nothing has been submitted. Complete the verification next.": "L’aperçu est prêt. Rien n’a été soumis. Effectuez maintenant la vérification.",
    "Check the form and try again.": "Vérifiez le formulaire et réessayez.",
    "Copied.": "Texte copié.",
    "Copy blocked. Copy the selected preview.": "La copie a été bloquée. Copiez l’aperçu sélectionné.",
    "Review the latest answers.": "Relisez les réponses les plus récentes.",
    "Submitted. Saved draft cleared from this device.": "Soumise. Le brouillon enregistré a été supprimé de cet appareil.",
    "The reviewed version was submitted. Review and submit again to include your newer changes.": "La version relue a été soumise. Relisez et soumettez de nouveau pour inclure les modifications plus récentes.",
    "The idea could not be submitted.": "L’idée n’a pas pu être soumise.",
    "Your answers remain in the form. Complete the check and try again.": "Vos réponses restent dans le formulaire. Effectuez la vérification et réessayez.",
    "Your answers remain in the form. Copy the text or use GitHub.": "Vos réponses restent dans le formulaire. Copiez le texte ou utilisez GitHub.",
    "Submit idea": "Soumettre l’idée",
    "Review the idea first.": "Relisez d’abord l’idée.",
    "The submission request was not accepted.": "La demande de soumission n’a pas été acceptée.",
    "The submission was not accepted.": "La soumission n’a pas été acceptée.",
    "The proposal no longer matches the current region data.": "La proposition ne correspond plus aux données régionales actuelles.",
    "The region map changed after this edit began. Reload the editor and try again.": "La carte des régions a changé depuis le début de cette modification. Rechargez l’éditeur et réessayez.",
    "This submission is too large to send at once. Save it and contact a maintainer.": "Cette soumission est trop volumineuse pour être envoyée en une fois. Enregistrez-la et communiquez avec l’équipe de maintenance.",
    "The anti-spam check was not accepted. Let it refresh and try again.": "La vérification antipourriel n’a pas été acceptée. Laissez-la se renouveler, puis réessayez.",
    "Too many submissions were sent from this connection. Wait a few minutes and try again.": "Trop de soumissions ont été envoyées depuis cette connexion. Attendez quelques minutes, puis réessayez.",
    "The submission service is temporarily unavailable. Try again shortly.": "Le service de soumission est temporairement indisponible. Réessayez dans quelques instants.",
    "The submission service address is invalid.": "L’adresse du service de soumission est invalide.",
    "The submission service must use HTTPS.": "Le service de soumission doit utiliser HTTPS.",
    "A validated submission is required.": "Une soumission validée est requise.",
    "This browser cannot verify the submitted data.": "Ce navigateur ne peut pas vérifier les données soumises.",
    "The submission service returned invalid public configuration.": "Le service de soumission a renvoyé une configuration publique invalide.",
    "This browser cannot contact the submission service.": "Ce navigateur ne peut pas joindre le service de soumission.",
    "The submission service took too long to respond. Try again shortly.": "Le service de soumission a pris trop de temps à répondre. Réessayez dans quelques instants.",
    "The submission service could not be reached. Try again shortly.": "Le service de soumission est inaccessible. Réessayez dans quelques instants.",
    "Spam protection is temporarily unavailable. Try again shortly.": "La protection antipourriel est temporairement indisponible. Réessayez dans quelques instants.",
    "The submission service returned an unreadable configuration.": "Le service de soumission a renvoyé une configuration illisible.",
    "Complete the anti-spam check before submitting.": "Effectuez la vérification antipourriel avant de soumettre.",
    "The submission could not be sent.": "La soumission n’a pas pu être envoyée.",
    "Choose a valid contribution type.": "Choisissez un type de contribution valide.",
    "Choose a valid MeshCore experience level.": "Choisissez un niveau d’expérience MeshCore valide.",
    "Confirm that this submission can be public.": "Confirmez que cette soumission peut être publique.",
    "Contribution type": "Type de contribution",
    "MeshCore experience": "Expérience avec MeshCore",
    "Short title": "Titre court",
    "What is difficult now": "Ce qui est difficile en ce moment",
    "What would help": "Ce qui aiderait",
    "City or broad region": "Ville ou grande région",
    "Additional context": "Autres précisions",
    "Public contact": "Contact public",
    "This field": "Ce champ",
    "A draft from older map data remains stored but was not restored.": "Un brouillon fondé sur d’anciennes données cartographiques est toujours enregistré, mais n’a pas été restauré.",
    "Discard the saved copy?": "Supprimer la copie enregistrée?",
    "This removes the local saved copy for this schema and province. The current on-screen proposal stays open until it changes or you leave.": "Cela supprime la copie enregistrée sur cet appareil pour ce schéma et cette province. La proposition affichée reste ouverte jusqu’à sa modification ou votre départ.",
    "Discard saved copy": "Supprimer la copie enregistrée",
    "Saved copy discarded. Current on-screen work is unchanged.": "La copie enregistrée a été supprimée. Le travail affiché reste inchangé.",
    "Choose at least one census cell.": "Choisissez au moins une cellule de recensement.",
    "Choose or define the destination region first.": "Choisissez ou définissez d’abord la région de destination.",
    "Proposal downloaded. It is not live until merged.": "La proposition a été téléchargée. Elle ne sera publiée qu’après sa fusion.",
    "Spam protection cannot load in this browser.": "La protection antipourriel ne peut pas se charger dans ce navigateur.",
    "Spam protection did not start. Reload the page and try again.": "La protection antipourriel n’a pas démarré. Rechargez la page et réessayez.",
    "Spam protection could not load. Check your connection and try again.": "La protection antipourriel n’a pas pu se charger. Vérifiez votre connexion et réessayez.",
    "Spam protection is unavailable.": "La protection antipourriel est indisponible.",
    "The submission service took too long to respond. Your work is still here; try again.": "Le service de soumission a pris trop de temps à répondre. Votre travail est toujours ici; réessayez.",
    "The submission service could not be reached. Your work is still here; try again.": "Le service de soumission est inaccessible. Votre travail est toujours ici; réessayez.",
    "The submission service returned an unreadable response.": "Le service de soumission a renvoyé une réponse illisible.",
    "The proposal format is not supported.": "Le format de la proposition n’est pas pris en charge.",
    "The proposal contains unsupported fields.": "La proposition contient des champs non pris en charge.",
    "The map changed after this edit began. Reload and try again.": "La carte a changé depuis le début de cette modification. Rechargez la page et réessayez.",
    "Choose at least one cell before exporting.": "Choisissez au moins une cellule avant d’exporter.",
    "Choose fewer cells before exporting.": "Choisissez moins de cellules avant d’exporter.",
    "The proposal contains an invalid change.": "La proposition contient une modification invalide.",
    "The proposal contains a duplicate cell.": "La proposition contient une cellule en double.",
    "One or more cells no longer exist. Reload and try again.": "Une ou plusieurs cellules n’existent plus. Rechargez la page et réessayez.",
    "A proposal may change cells in only one province or territory.": "Une proposition peut modifier les cellules d’une seule province ou d’un seul territoire.",
    "Add a valid name, tag, and anchor for the new region.": "Ajoutez un nom, un identifiant et un point d’ancrage valides pour la nouvelle région.",
    "The new region has the wrong catalogue parent.": "La région parente indiquée pour la nouvelle région ne correspond pas au catalogue.",
    "That region tag is already in use.": "Cet identifiant régional est déjà utilisé.",
    "That region already exists. Choose it from the list.": "Cette région existe déjà. Choisissez-la dans la liste.",
    "Choose one changed cell without an existing region anchor.": "Choisissez une cellule modifiée qui ne sert pas déjà de point d’ancrage régional.",
    "Every changed cell must move to the new region.": "Chaque cellule modifiée doit être déplacée vers la nouvelle région.",
    "A target region must belong to the same province or territory.": "La région de destination doit appartenir à la même province ou au même territoire.",
    "A region anchor cell cannot be moved away from its region.": "Une cellule servant de point d’ancrage régional ne peut pas être déplacée hors de sa région.",
    "The proposal contains a change that has no effect.": "La proposition contient une modification sans effet.",
    "The submitted-by value is invalid.": "Le nom de la personne qui soumet la proposition est invalide.",
    "Add a short reason for this boundary change.": "Ajoutez une courte raison pour cette modification de limite.",
    "No": "Non",
    "Target region": "Région de destination",
    "Unnamed municipality": "Municipalité sans nom",
    "The submission was received, but the review link was invalid.": "La soumission a été reçue, mais le lien d’examen était invalide."
  };

  var patterns = [
    [/^(.*) \(opens in a new tab\)$/, function (match) { return match[1] + " (s’ouvre dans un nouvel onglet)"; }],
    [/^Loading (.+)…$/, function (match) { return "Chargement de " + translate(match[1]) + "…"; }],
    [/^(\d[\d\s,.]*) census cells loaded\.$/, function (match) { return match[1] + " cellules de recensement chargées."; }],
    [/^(\d+) change$/, function (match) { return match[1] + " modification"; }],
    [/^(\d+) changes$/, function (match) { return match[1] + " modifications"; }],
    [/^(\d+) changed cell$/, function (match) { return match[1] + " cellule modifiée"; }],
    [/^(\d+) changed cells$/, function (match) { return match[1] + " cellules modifiées"; }],
    [/^Showing 200 of (.+) changes\. The downloaded proposal contains all changes\.$/, function (match) { return "Affichage de 200 modifications sur " + match[1] + ". La proposition téléchargée contient toutes les modifications."; }],
    [/^Remove proposed change for (.+)$/, function (match) { return "Retirer la modification proposée pour " + match[1]; }],
    [/^Confirmed anchor: (.+)$/, function (match) { return "Point d’ancrage confirmé : " + match[1]; }],
    [/^Derived parent: (.+)$/, function (match) { return "Région parente déterminée : " + match[1]; }],
    [/^GitHub issue #(\d+)$/, function (match) { return "Billet GitHub no " + match[1]; }],
    [/^Open issue #(\d+)$/, function (match) { return "Ouvrir le billet no " + match[1]; }],
    [/^(.+) — (\d+) cell$/, function (match) { return match[1] + " — " + match[2] + " cellule"; }],
    [/^(.+) — (\d+) cells$/, function (match) { return match[1] + " — " + match[2] + " cellules"; }],
    [/^(\d[\d\s,.]*) census cells across (\d[\d\s,.]*) municipalities\/CSDs$/, function (match) { return match[1] + " cellules de recensement dans " + match[2] + " municipalités ou SDR"; }],
    [/^Draft restored from (.+)\. Contributor identity was not stored\.$/, function (match) { return "Brouillon restauré depuis le " + match[1] + ". L’identité de la personne n’a pas été enregistrée."; }],
    [/^(.+) is required\.$/, function (match) { return "Le champ « " + translate(match[1]) + " » est obligatoire."; }],
    [/^(.+) is too long\.$/, function (match) { return "Le champ « " + translate(match[1]) + " » est trop long."; }],
    [/^(.+) contains invalid text\.$/, function (match) { return "Le champ « " + translate(match[1]) + " » contient du texte invalide."; }],
    [/^Could not load editor data \((.+)\)\.$/, function (match) { return "Impossible de charger les données de l’éditeur (" + match[1] + ")."; }],
    [/^That selection contains the fixed anchor for (.+)\.$/, function (match) { return "Cette sélection contient le point d’ancrage fixe de " + match[1] + "."; }],
    [/^The fixed anchor for (.+) cannot be moved\.$/, function (match) { return "Le point d’ancrage fixe de " + match[1] + " ne peut pas être déplacé."; }],
    [/^(.+)\. Edit each province separately; repeater setup keeps the paths together\.$/, function (match) { return match[1] + ". Modifiez chaque province séparément; la configuration du répéteur conserve les chemins ensemble."; }],
    [/^(.+) \(confirmed\)$/, function (match) { return match[1] + " (confirmé)"; }],
    [/^\. (.+)$/, function (match) { return ". " + translate(match[1]); }],
    [/^(.+\.) (Reload and try again\.|Your edits are saved here\. Complete the check and try again\.|Download the proposal to share it\.|Your answers remain in the form\. Complete the check and try again\.|Your answers remain in the form\. Copy the text or use GitHub\.)$/, function (match) { return translate(match[1]) + " " + translate(match[2]); }],
    [/^(.+) \(fixed\)$/, function (match) { return match[1] + " (fixe)"; }]
  ];

  function translate(value) {
    if (!isFrench || typeof value !== "string") return value;
    var leading = value.match(/^\s*/)[0];
    var trailing = value.match(/\s*$/)[0];
    var normalized = value.trim().replace(/\s+/g, " ");
    if (!normalized) return value;
    var translated = dictionary[normalized];
    if (!translated) {
      for (var index = 0; index < patterns.length; index += 1) {
        var match = normalized.match(patterns[index][0]);
        if (match) {
          translated = patterns[index][1](match);
          break;
        }
      }
    }
    return translated ? leading + translated + trailing : value;
  }

  function shouldSkip(node) {
    var element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    return Boolean(element && element.closest("script, style, code, pre, kbd, samp, textarea, [data-i18n-ignore]"));
  }

  function localizeTextNode(node) {
    if (!node || node.nodeType !== Node.TEXT_NODE || shouldSkip(node)) return;
    var next = translate(node.nodeValue);
    if (next !== node.nodeValue) node.nodeValue = next;
  }

  function localizeElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE || shouldSkip(element)) return;
    ["aria-label", "placeholder", "title"].forEach(function (name) {
      if (!element.hasAttribute(name)) return;
      var current = element.getAttribute(name);
      var next = translate(current);
      if (next !== current) element.setAttribute(name, next);
    });
  }

  function localize(root) {
    if (!isFrench || !root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      localizeTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) localizeElement(root);
    var elementWalker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    while (elementWalker.nextNode()) localizeElement(elementWalker.currentNode);
    var textWalker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (textWalker.nextNode()) localizeTextNode(textWalker.currentNode);
  }

  function configureEditorLanguageLinks() {
    var links = document.querySelectorAll("[data-editor-language]");
    if (!links.length) return;
    var pathname = window.location.pathname;
    var englishPath = pathname.replace(/\/fr\/config\/editor(?:\/index\.html|\/)?$/, "/config/editor/");
    if (!/\/config\/editor\/$/.test(englishPath)) {
      englishPath = pathname.replace(/\/config\/editor(?:\/index\.html|\/)?$/, "/config/editor/");
    }
    var frenchPath = englishPath.replace(/\/config\/editor\/$/, "/fr/config/editor/");
    links.forEach(function (link) {
      var locale = link.getAttribute("data-editor-language");
      link.href = locale === "fr" ? frenchPath : englishPath;
      link.lang = locale;
      link.hreflang = locale;
      if ((locale === "fr") === isFrench) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  window.MeshCoreCanadaI18n = Object.freeze({
    locale: isFrench ? "fr" : "en",
    isFrench: isFrench,
    t: translate,
    localize: localize
  });

  function initialise() {
    if (isFrench) {
      document.documentElement.lang = "fr";
      document.title = translate(document.title);
      localize(document.body);
      new MutationObserver(function (records) {
        records.forEach(function (record) {
          if (record.type === "characterData") localizeTextNode(record.target);
          if (record.type === "attributes") localizeElement(record.target);
          record.addedNodes.forEach(localize);
        });
      }).observe(document.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ["aria-label", "placeholder", "title"]
      });
    }
    configureEditorLanguageLinks();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
