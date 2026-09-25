---
title: Proposition de portées de région ON/QC
description: Une proposition pour simplifier les portées de région MeshCore en Ontario et au Québec, avec des codes de ville, de province et de réseau.
audience:
  - repeater-operator
  - companion-user
task: review-onqc-scopes-proposal
scope: experimental
status: experimental
status_notice: false
owner: region-maintainers
last_reviewed: 2026-09-24
review_by: 2026-12-24
difficulty: intermediate
estimated_time: 10 minutes
destructive: false
search:
  exclude: true
page_styles:
  - assets/styles/scopes-proposal.css?v=20260924-4
page_scripts:
  - assets/javascripts/scopes-picker.js?v=20260924-3
---

# Proposition de portées de région ON/QC

<div class="scp-hero">
  <p class="mc-eyebrow">Proposition à discuter</p>
  <p class="mc-lede">Les portées de région empêchent les échanges locaux d’inonder tout le réseau. La configuration actuelle est difficile à suivre. Cette proposition la ramène à quatre niveaux de codes faciles à retenir partout en Ontario et au Québec.</p>
  <ul class="scp-hero__badges">
    <li data-kind="proposal">Pas encore adoptée</li>
    <li>Projet pilote Ontario + Québec</li>
    <li>Micrologiciel du répéteur 1.16+</li>
    <li>Application MeshCore 1.43+</li>
  </ul>
</div>

## En bref

Il y a quatre niveaux de portée. Chaque répéteur porte un code de chacun :
sa ville, sa province, `onqc` et `can`. Quand vous envoyez un message, vous
choisissez le niveau à utiliser, et c’est ce qui décide jusqu’où il va. `can`
est réservé pour plus tard; pour l’instant, vous choisissez parmi les trois
premiers.

<div class="scp-levels-cards">
  <div class="scp-level-card" data-level="city">
    <h3>Ville</h3>
    <span class="scp-tag" data-level="city">yow</span> <span class="scp-tag" data-level="city">yul</span> <span class="scp-tag" data-level="city">yqb</span>
    <p>Votre secteur. Les mêmes codes que <a href="https://meshmapper.net/">MeshMapper</a>.</p>
  </div>
  <div class="scp-level-card" data-level="prov">
    <h3>Province</h3>
    <span class="scp-tag" data-level="prov">on</span> <span class="scp-tag" data-level="prov">qc</span>
    <p>Tous les répéteurs de la province.</p>
  </div>
  <div class="scp-level-card" data-level="mesh">
    <h3>Réseau</h3>
    <span class="scp-tag" data-level="mesh">onqc</span>
    <p>Tous les répéteurs de l’Ontario et du Québec.</p>
  </div>
  <div class="scp-level-card" data-level="future">
    <h3>Canada</h3>
    <span class="scp-tag" data-level="future">can</span>
    <p>Tout le Canada. Réservé pour plus tard : porté dès maintenant, pas encore utilisé.</p>
  </div>
</div>

- **Les répéteurs** portent leur ville, leur province, `onqc` et `can`.
- **Les appareils compagnons** utilisent `onqc` par défaut, pour que les
  messages privés joignent tout le monde, une fois les répéteurs autour d’eux
  configurés.
- **`Public`** utilise `onqc`, pour que tout le monde en Ontario et au Québec
  puisse se parler.
- **Les canaux de test et les robots** utilisent votre ville, pour rester
  locaux.
- **Les messages sans portée** fonctionnent encore dans chaque ville. Les
  répéteurs de bordure, ceux qui entendent une autre ville, les rejettent, pour
  qu’ils n’inondent pas la ville voisine.

## Qu’est-ce qu’une portée?

Une portée est un nom court joint à un message, par exemple `yow`. Les
répéteurs s’en servent pour décider s’ils relaient le message.

<div class="mc-callout" markdown>
Une portée n’est **pas** du chiffrement et **pas** une clôture GPS. Quiconque
connaît le nom peut l’utiliser, et il n’a rien à voir avec l’endroit où vous
êtes. C’est
seulement une étiquette qui dit : « les répéteurs qui portent ce nom, relayez
ce message ».
</div>

Votre application transforme le nom en un petit code et le place dans
l’en-tête du message. Chaque répéteur garde une liste des noms qu’il relaie.
Quand un message arrive, le répéteur compare le code à sa liste.

## Comment un répéteur décide

Voici un répéteur d’Ottawa configuré selon cette proposition, et ce qu’il fait
avec cinq messages différents.

<figure class="scp-figure">
  <div class="scp-filter">
    <div class="scp-repeater">
      <svg class="scp-repeater__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8M6.2 2.4a8.3 8.3 0 0 0 0 11.2M17.8 2.4a8.3 8.3 0 0 1 0 11.2"/></svg>
      <p>Répéteur d’Ottawa</p>
      <div class="scp-repeater__list">
        <span class="scp-tag" data-level="any">*</span>
        <span class="scp-tag" data-level="city">yow</span>
        <span class="scp-tag" data-level="prov">on</span>
        <span class="scp-tag" data-level="mesh">onqc</span>
        <span class="scp-tag" data-level="future">can</span>
      </div>
      <small>Sa liste de noms à relayer</small>
    </div>
    <ul class="scp-checks">
      <li><span class="scp-packet"><span class="scp-tag" data-level="city">yow</span> Canal d’Ottawa</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Relayé</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="mesh">onqc</span> MP vers Québec, envoyé avec la portée par défaut</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Relayé</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="any">aucune</span> Ancienne appli, sans portée</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="ok">Relayé</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="city">yul</span> Canal de Montréal</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="drop">Rejeté</span></li>
      <li><span class="scp-packet"><span class="scp-tag" data-level="prov">qc</span> Canal de tout le Québec</span><span class="scp-checks__arrow" aria-hidden="true">→</span><span class="scp-result" data-result="drop">Rejeté</span></li>
    </ul>
  </div>
  <div class="scp-rule">
    <div class="scp-rule__item" data-result="ok"><strong>Le nom est sur la liste :</strong> il le relaie.</div>
    <div class="scp-rule__item" data-result="drop"><strong>Le nom n’est pas sur la liste :</strong> il le rejette.</div>
    <div class="scp-rule__item" data-result="ok"><strong>Aucune portée :</strong> le message compte comme <code>*</code>. Il est relayé seulement si <code>*</code> est permis.</div>
    <div class="scp-rule__item" data-result="drop"><strong>Trop de sauts :</strong> rejeté dès qu’il dépasse <code>flood.max</code>, peu importe sa portée.</div>
  </div>
  <figcaption>Le MP porte <code>onqc</code> parce que <code>onqc</code> est la portée par défaut de l’appareil compagnon dans cette proposition. <a href="#pourquoi-lappareil-compagnon-utilise-onqc-par-defaut">Voir pourquoi plus bas</a>. Le répéteur entend quand même tous les messages. La portée décide seulement s’il les relaie. Votre appareil compagnon reçoit aussi tout ce qui l’atteint.</figcaption>
</figure>

Quatre détails piègent souvent :

- **L’orthographe doit être exacte.** `yow`, `YOW` et `ott` sont trois noms
  différents. Un appareil compagnon réglé sur `yow` est ignoré par un répéteur qui ne
  porte que `ott`.
- **Seules les diffusions (flood) sont vérifiées.** Dès qu’un message privé a
  un chemin connu, il suit ce chemin directement et les portées ne comptent
  plus.
- **Il n’y a pas d’héritage.** Porter `on` ne veut pas dire porter `yow`.
  Chaque nom doit être sur la liste à part entière.
- **Un répéteur sans régions rejette tous les messages avec portée.** Par
  défaut, un répéteur ne porte que `*` : il relaie les messages sans portée et
  rien d’autre. Les messages avec portée fonctionnent seulement une fois les
  répéteurs du trajet configurés.

## Les quatre niveaux

<figure class="scp-figure">
  <div class="scp-zone" data-level="future">
  <p class="scp-zone__title"><span class="scp-tag" data-level="future">can</span> Canada <span>Réservé pour plus tard. Porté dès maintenant, pas encore utilisé.</span></p>
  <div class="scp-zone" data-level="mesh">
    <p class="scp-zone__title"><span class="scp-tag" data-level="mesh">onqc</span> Réseau <span>Tous les répéteurs de l’Ontario et du Québec</span></p>
    <div class="scp-zone__row">
      <div class="scp-zone" data-level="prov">
        <p class="scp-zone__title"><span class="scp-tag" data-level="prov">on</span> Ontario</p>
        <div class="scp-cities">
          <div class="scp-city"><strong>yow</strong><span>Ottawa, Lanark, Calabogie, Renfrew, Alfred, Hawkesbury</span></div>
          <div class="scp-city"><strong>yyz</strong><span>Toronto</span></div>
          <div class="scp-city"><strong>ygk</strong><span>Kingston</span></div>
          <div class="scp-city"><strong>ykf</strong><span>Waterloo</span></div>
          <div class="scp-city" data-more><strong>…</strong><span>Autres zones MeshMapper</span></div>
        </div>
      </div>
      <div class="scp-zone" data-level="prov">
        <p class="scp-zone__title"><span class="scp-tag" data-level="prov">qc</span> Québec</p>
        <div class="scp-cities">
          <div class="scp-city"><strong>yul</strong><span>Montréal, Trois-Rivières</span></div>
          <div class="scp-city"><strong>yqb</strong><span>Ville de Québec</span></div>
          <div class="scp-city"><strong>yow</strong><span>Gatineau, Rigaud (partagé avec Ottawa)</span></div>
          <div class="scp-city"><strong>ytf</strong><span>Saguenay–Lac-Saint-Jean</span></div>
          <div class="scp-city" data-more><strong>…</strong><span>Autres zones MeshMapper</span></div>
        </div>
      </div>
    </div>
  </div>
  </div>
  <div class="scp-flat">
    <strong>Ce qu’un répéteur d’Ottawa garde vraiment :</strong>
    <span class="scp-flat__list"><span class="scp-tag" data-level="any">*</span><span class="scp-tag" data-level="city">yow</span><span class="scp-tag" data-level="prov">on</span><span class="scp-tag" data-level="mesh">onqc</span><span class="scp-tag" data-level="future">can</span></span>
    <span>Une simple liste de noms. Les boîtes ci-dessus servent aux gens, pas au répéteur.</span>
  </div>
  <figcaption>La zone <code>yow</code> traverse la rivière des Outaouais. Les répéteurs de Gatineau utilisent <code>yow</code> pour leur ville et <code>qc</code> pour leur province.</figcaption>
</figure>

### Et `can`?

Chaque répéteur porte `can` dès maintenant pour qu’une portée pancanadienne
fonctionne plus tard sans que personne n’ait à reconfigurer son répéteur. Bien
des répéteurs configurés avec le configurateur actuel le portent déjà.

**N’utilisez pas encore `can` sur votre appareil compagnon ni dans vos canaux.**
Aujourd’hui, il joint les mêmes répéteurs que `onqc`. Continuez d’utiliser
`onqc`. Quand d’autres provinces porteront aussi `can`, il deviendra la façon
d’aller plus loin, et `onqc` restera « seulement le réseau de l’Ontario et du
Québec ».

### Pourquoi des codes d’aéroport?

- Ce sont les mêmes codes que MeshMapper utilise déjà, par exemple
  `yow.meshmapper.net`.
- MeshCore utilise déjà les codes d’aéroport ailleurs, par exemple pour le
  [code d’emplacement que chaque observateur transmet](../analyzer/iata-codes.md).
  Ils ne sont pas parfaits pour des secteurs de réseau, mais ça ne changera
  pas, et d’autres noms seulement pour les régions ajouteraient de la
  confusion avec le temps.
- Il n’y a ni accent ni majuscule à se tromper. `montréal`, `Montreal` et
  `montreal` seraient trois portées différentes.
- Ils sont faciles à diviser plus tard. Si Renfrew veut un jour son propre
  secteur, il peut prendre son propre code d’aéroport et garder `on` et `onqc`.
  Rien d’autre ne change.

La première fois, écrivez toujours le code avec son secteur, par exemple
`yow` (secteur Ottawa–Gatineau), pour que les gens l’apprennent.

## Lire `region def yow|* on|* onqc|* can`

`region def` construit la liste d’un répéteur en une ligne. La commande garde un
**curseur** qui part du sommet, `*`. Chaque nom est créé sous le curseur, et
`|*` ramène le curseur au sommet.

<figure class="scp-figure">
  <div class="scp-tape" aria-label="region def yow|* on|* onqc|* can">
    <span class="scp-tape__cmd">region def</span>
    <span class="scp-tape__tok"><b>1</b>yow</span>
    <span class="scp-tape__tok" data-kind="jump"><b>2</b>|*</span>
    <span class="scp-tape__tok"><b>3</b>on</span>
    <span class="scp-tape__tok" data-kind="jump"><b>4</b>|*</span>
    <span class="scp-tape__tok"><b>5</b>onqc</span>
    <span class="scp-tape__tok" data-kind="jump"><b>6</b>|*</span>
    <span class="scp-tape__tok"><b>7</b>can</span>
  </div>
  <ol class="scp-steps">
    <li>Crée <code>yow</code> sous le curseur. Le curseur entre dans <code>yow</code>.<div class="scp-tree">*
└ <mark>yow</mark></div></li>
    <li><code>|*</code> ramène le curseur au sommet.<div class="scp-tree"><mark>*</mark>
└ yow</div></li>
    <li>Crée <code>on</code> sous le curseur. Le curseur entre dans <code>on</code>.<div class="scp-tree">*
├ yow
└ <mark>on</mark></div></li>
    <li><code>|*</code> ramène encore le curseur au sommet.<div class="scp-tree"><mark>*</mark>
├ yow
└ on</div></li>
    <li>Crée <code>onqc</code>.<div class="scp-tree">*
├ yow
├ on
└ <mark>onqc</mark></div></li>
    <li><code>|*</code> ramène au sommet.<div class="scp-tree"><mark>*</mark>
├ yow
├ on
└ onqc</div></li>
    <li>Crée <code>can</code>. Terminé.<div class="scp-tree">*
├ yow
├ on
├ onqc
└ <mark>can</mark></div></li>
  </ol>
  <figcaption>Le résultat est une liste à plat : tous les codes sont côte à côte sous <code>*</code>. Le nom surligné indique la position du curseur.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
`region def` ajoute ou déplace des noms seulement. La commande ne supprime
jamais ceux qui existent déjà. Lancez `region` ensuite pour voir la liste
complète.
</div>

## Configuration du répéteur

Entrez ces commandes dans la ligne de commande du répéteur **une à la fois** :
dans l’application MeshCore, ouvrez le répéteur, connectez-vous comme
administrateur et utilisez la zone de commande de **Repeater Admin**, ou
utilisez la console USB. Chaque commande a son propre bouton de copie.
Attendez `OK` avant d’envoyer la suivante.

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Liste des contacts filtrée pour trouver un répéteur](../assets/images/onqc-scopes/repeater-01-contacts.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-01-contacts.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Dans <strong>Contacts</strong>, trouvez votre répéteur (cherchez par nom) et touchez-le.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Repeater Login avec un champ de mot de passe](../assets/images/onqc-scopes/repeater-02-login.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-02-login.webp)
<figcaption markdown="span"><span class="scp-shot__num">2</span> Entrez le mot de passe administrateur et touchez <strong>Log In</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Repeater Admin avec Command Line en bas](../assets/images/onqc-scopes/repeater-03-admin.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-03-admin.webp)
<figcaption markdown="span"><span class="scp-shot__num">3</span> Vérifiez <strong>You are logged in as an Admin</strong>, puis touchez <strong>Command Line</strong> en bas.</figcaption>
</figure>

</div>

<div class="mc-callout" markdown>
**Astuce :** chaque commande devrait recevoir une réponse, habituellement `OK`.
Si rien ne revient après quelques secondes, renvoyez-la : touchez longuement
la commande et choisissez **Send Again**. Envoyer une commande deux fois ne
cause pas de problème.
</div>

### Étape 1 : Vérifier le micrologiciel et décrire votre répéteur

<div class="scp-card">
<ol class="scp-cmds"><li class="scp-cmd"><code>ver</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: ver"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li></ol>
</div>

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Ligne de commande avec la commande ver envoyée](../assets/images/onqc-scopes/repeater-05-ver.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-05-ver.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Tapez <code>ver</code> et touchez envoyer. La version du micrologiciel apparaît en dessous, par exemple <code>v1.15.0</code>.</figcaption>
</figure>

</div>

Décrivez ensuite votre répéteur. Les étapes 3 et 4 affichent les bonnes
commandes pour lui. Votre secteur est votre **zone MeshMapper** : ouvrez
[MeshMapper](https://meshmapper.net/) et trouvez la zone où se trouve votre
répéteur. Ces zones suivent les limites MeshMapper qui existent déjà. Elles ne
sont pas parfaites, mais c’est ainsi que la plupart des gens voient déjà la
carte aujourd’hui; il n’y a donc rien de nouveau à apprendre.

<div class="scp-picker" data-scp-picker data-copy-label="Copier" data-copied-label="Copié" hidden>
  <label class="scp-picker__field"><span>Secteur</span><select data-scp-area><option value="ottawa" data-city="yow" data-province="on">Ottawa et environs</option><option value="gatineau" data-city="yow" data-province="qc">Gatineau</option><option value="montreal" data-city="yul" data-province="qc">Montréal et environs</option><option value="quebec" data-city="yqb" data-province="qc">Ville de Québec</option></select></label>
  <label class="scp-picker__field"><span>Micrologiciel</span><select data-scp-firmware><option value="116">1.16 ou plus récent</option><option value="115">1.15</option><option value="114">1.14</option><option value="110">1.10 à 1.13</option></select></label>
  <label class="scp-picker__field"><span>Type de répéteur</span><select data-scp-type><option value="city">Répéteur de ville</option><option value="edge">Répéteur de bordure</option></select><small class="scp-picker__hint">Choisissez bordure s’il entend souvent une autre ville.</small></label>
  <label class="scp-picker__field" data-scp-extra-field hidden><span>Ville voisine (facultatif)</span><select data-scp-extra><option value="">Aucune</option><option value="yow">Ottawa / Gatineau (yow)</option><option value="yul">Montréal (yul)</option><option value="yqb">Ville de Québec (yqb)</option></select></label>
</div>

### Étape 2 : Effacer les anciennes régions

Beaucoup de répéteurs ont déjà des régions de l’ancienne configuration, comme
`can`, `on-alg` ou `ott`. Les nouvelles commandes ne suppriment jamais rien,
alors effacez-les d’abord. Affichez ce qui s’y trouve avec `region`, puis
retirez chaque nom sauf `*`, un à la fois, en commençant par la ligne la plus
en retrait. Par exemple, l’ancienne configuration d’Ottawa :

<div class="scp-card">
<p class="scp-variant__label">Exemple : l’ancienne configuration d’Ottawa</p>
<ol class="scp-cmds"><li class="scp-cmd"><code>region</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region remove ott</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region remove ott"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region remove on-alg</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region remove on-alg"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region remove on</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region remove on"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region remove can</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region remove can"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region save</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region save"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li></ol>
</div>

- `Err - not empty` veut dire qu’un autre nom est encore en retrait sous
  celui-ci. Retirez-le d’abord.
- Retirer un nom deux fois répond simplement `Err - not found`. Ce n’est pas
  grave.
- Retirer `on` et `can` ne pose pas de problème non plus. L’étape 4 les remet.
- Le dernier `region` devrait afficher seulement `*^ F`.

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Ligne de commande qui retire les anciennes régions d’Ottawa](../assets/images/onqc-scopes/repeater-clear-old.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-clear-old.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> L’ancienne configuration d’Ottawa, retirée du bas vers le haut. Retirer un nom deux fois répond simplement <code>Err - not found</code>. Ce n’est pas grave.</figcaption>
</figure>

</div>

### Étape 3 : Réglages standard de MeshCore Canada

<div class="scp-card">
<p class="scp-variant__label" data-scp-summary>Ottawa et environs · 1.16 ou plus récent · Répéteur de ville</p>
<ol class="scp-cmds" data-scp-output="standard"><li class="scp-cmd"><code>set path.hash.mode 2</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: set path.hash.mode 2"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>set advert.interval 240</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: set advert.interval 240"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>set flood.advert.interval 47</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: set flood.advert.interval 47"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>set flood.max 16</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: set flood.max 16"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li></ol>
<p class="scp-note scp-note--info" data-scp-note="no-hash" hidden><code>set path.hash.mode 2</code> est omis : il exige le micrologiciel 1.14 ou plus récent.</p>
<p class="scp-note" data-scp-nojs>Ces commandes sont pour un répéteur de ville du secteur d’Ottawa avec le micrologiciel 1.16 ou plus récent. Activez JavaScript pour les adapter à votre répéteur.</p>
</div>

<dl class="scp-explain">
  <dt>path.hash.mode 2</dt><dd>Utilise des identifiants de répéteur de 3 octets dans les chemins, pour que moins de répéteurs partagent un identifiant. Exige le micrologiciel 1.14 ou plus récent.</dd>
  <dt>advert.interval 240</dt><dd>Annonce ce répéteur à ses voisins directs toutes les 4 heures.</dd>
  <dt>flood.advert.interval 47</dt><dd>Annonce ce répéteur dans tout le réseau toutes les 47 heures.</dd>
  <dt>flood.max 16</dt><dd>Aucune diffusion ne fait plus de 16 sauts, avec ou sans portée.</dd>
</dl>

Ces réglages s’enregistrent d’eux-mêmes. Pas besoin de `region save`. Si une
commande répond `Err - ??`, votre micrologiciel n’a pas ce réglage; passez-la.

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Ligne de commande avec les quatre réglages standard qui répondent OK](../assets/images/onqc-scopes/repeater-standard-settings.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-standard-settings.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Chaque réglage répond <code>OK</code>.</figcaption>
</figure>

</div>

### Étape 4 : Réglages de région

Ces commandes suivent vos réponses de l’étape 1. Lancez-les dans l’ordre.

<div class="scp-card">
<p class="scp-variant__label" data-scp-summary>Ottawa et environs · 1.16 ou plus récent · Répéteur de ville</p>
<ol class="scp-cmds" data-scp-output="region"><li class="scp-cmd"><code>region def yow|* on|* onqc|* can</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region def yow|* on|* onqc|* can"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region allowf *</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region allowf *"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region default yow</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region default yow"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li><li class="scp-cmd"><code>region save</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region save"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li></ol>
<p class="scp-note scp-note--info" data-scp-note="fw-116" hidden><code>region def</code> répond avec la liste terminée, donc vous voyez tout de suite que ça a fonctionné.</p>
<p class="scp-note scp-note--info" data-scp-note="fw-115" hidden>Chaque <code>region put</code> répond <code>OK - (flood allowed)</code>, et <code>region default</code> répond <code>default scope is now …</code>.</p>
<p class="scp-note scp-note--info" data-scp-note="fw-put-allow" hidden>Avec ce micrologiciel, une nouvelle région commence avec la diffusion <strong>désactivée</strong>, donc chacune a aussi besoin de <code>region allowf</code>. Il n’y a pas de <code>region default</code>, donc les annonces du répéteur restent sans portée. Une mise à jour du micrologiciel vaut la peine.</p>
<p class="scp-note" data-scp-note="edge" hidden><strong>Répéteur de bordure :</strong> rejette les messages sans portée, pour qu’ils n’inondent pas la ville voisine. Utilisez-le pour tout répéteur qui entend souvent une autre ville, par exemple près d’une limite de zone, sur un site élevé ou avec des voisins d’une autre ville. Sinon, les messages sans portée passent par lui. Les gens tout près sans portée ne sont pas relayés par lui; évitez-le là où c’est le seul répéteur. Voir <a href="#qui-recoit-quoi">Qui reçoit quoi</a>.</p>
<p class="scp-note" data-scp-note="extra" hidden><strong>Ville voisine :</strong> cela aide seulement les gens près de ce répéteur à participer aux canaux de cette ville. Tous les autres joignent l’autre ville par <code>onqc</code>. Rigaud, par exemple, porte <code>yul</code> en plus de <code>yow</code>.</p>
<p class="scp-note" data-scp-nojs>Ces commandes sont pour un répéteur de ville du secteur d’Ottawa avec le micrologiciel 1.16 ou plus récent. Activez JavaScript pour les adapter à votre répéteur.</p>
</div>

<dl class="scp-explain">
  <dt>region def / region put</dt><dd>Porter votre ville, votre province, <code>onqc</code> et <code>can</code>.</dd>
  <dt>region allowf * / region denyf *</dt><dd>Les répéteurs de ville relaient les messages <strong>sans portée</strong> (déjà permis par défaut, réglé pour que vous le voyiez). Les répéteurs de bordure les rejettent.</dd>
  <dt>region default &lt;ville&gt;</dt><dd>Les annonces de ce répéteur utilisent la portée de votre ville, pour rester locales. Absent avant 1.15.</dd>
  <dt>region save</dt><dd>Conserve les réglages de région après un redémarrage.</dd>
</dl>

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Ligne de commande avec region def et sa réponse sur le micrologiciel 1.16](../assets/images/onqc-scopes/repeater-region-def-116.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-region-def-116.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Micrologiciel 1.16 ou plus récent : <code>region def</code> répond avec la liste terminée.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Ligne de commande avec les commandes region put sur le micrologiciel 1.15](../assets/images/onqc-scopes/repeater-07-region-put-115.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-07-region-put-115.webp)
<figcaption markdown="span"><span class="scp-shot__num">2</span> Micrologiciel 1.15 : chaque <code>region put</code> répond <code>OK - (flood allowed)</code>.</figcaption>
</figure>

</div>

### Étape 5 : Vérifier le résultat

<div class="scp-card">
<ol class="scp-cmds"><li class="scp-cmd"><code>region</code><button type="button" class="scp-copy" title="Copier" aria-label="Copier: region"><svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19 21H8V7h11m0-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2m-3-4H4a2 2 0 0 0-2 2v14h2V3h12z"/></svg></button></li></ol>
</div>

Pour Ottawa, vous devriez voir :

```text
*^ F
 yow F
 on F
 onqc F
 can F
```

`F` veut dire « diffusion permise » : le répéteur relaie ce nom. Le `^` à côté
de `*` indique la région d’attache du répéteur; quand aucune n’est réglée, il
se place sur `*`. Vous pouvez l’ignorer.

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Ligne de commande affichant la liste finale des régions](../assets/images/onqc-scopes/repeater-08-region-result.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/repeater-08-region-result.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> La liste terminée sur un répéteur d’Ottawa.</figcaption>
</figure>

</div>

### Permettre ou rejeter : aide-mémoire

| Commande | Effet |
| --- | --- |
| `region allowf <nom>` | Relayer les messages portant ce nom |
| `region denyf <nom>` | Rejeter les messages portant ce nom. Le répéteur les reçoit quand même. |
| `<nom>` | Peut être `*` pour les messages sans portée, ou un code comme `yow` |
| `set flood.max.unscoped <sauts>` | Une limite de sauts séparée pour les messages sans portée. Elle compte seulement si elle est plus basse que `flood.max`. `0` a le même effet que `region denyf *`. |
| `region save` | À lancer après chaque `allowf` ou `denyf` |

## Configuration de l’appareil compagnon

<div class="mc-callout" data-kind="warning" markdown>
**Attendez que les répéteurs autour de vous soient configurés.** Un répéteur
sans régions rejette tous les messages avec portée. Si vous réglez votre
portée par défaut sur `onqc` avant que les répéteurs de vos trajets la
portent, vos messages de canal et vos premiers MP n’iront pas loin. D’ici là,
laissez **Default Region Scope** vide. Vous recevrez quand même tout.
</div>

### Étape 1 : Régler votre portée par défaut

Dans l’application MeshCore, ouvrez **Settings**. Sous **Network Settings**,
touchez **Default Region Scope**, ajoutez `onqc` et sélectionnez-le.

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Liste des contacts de l’application MeshCore avec la roue des réglages en haut à droite](../assets/images/onqc-scopes/companion-01-connected.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-01-connected.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Connectez votre appareil compagnon à l’application MeshCore et touchez la <strong>roue des réglages</strong> en haut à droite.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Settings avec Network Settings et Default Region Scope](../assets/images/onqc-scopes/companion-02-settings.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-02-settings.webp)
<figcaption markdown="span"><span class="scp-shot__num">2</span> Descendez jusqu’à <strong>Network Settings</strong> et touchez <strong>Default Region Scope</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Select Region sans région et bouton Add Region](../assets/images/onqc-scopes/companion-03-select-region.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-03-select-region.webp)
<figcaption markdown="span"><span class="scp-shot__num">3</span> Si <code>onqc</code> n’est pas dans la liste, touchez <strong>Add Region</strong>, ou le <strong>+</strong> en haut à droite.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Add Region avec onqc tapé](../assets/images/onqc-scopes/companion-04-add-region.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-04-add-region.webp)
<figcaption markdown="span"><span class="scp-shot__num">4</span> Tapez <code>onqc</code>, tout en minuscules, et touchez le <strong>crochet</strong> en haut à droite.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Select Region avec onqc dans la liste](../assets/images/onqc-scopes/companion-05-pick-onqc.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-05-pick-onqc.webp)
<figcaption markdown="span"><span class="scp-shot__num">5</span> Touchez <code>onqc</code> pour le sélectionner.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Settings avec onqc comme portée par défaut et le message Settings Saved](../assets/images/onqc-scopes/companion-06-saved.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-06-saved.webp)
<figcaption markdown="span"><span class="scp-shot__num">6</span> Default Region Scope affiche maintenant <code>onqc</code>. Touchez le <strong>crochet</strong> en haut à droite. Il tourne pendant l’enregistrement, puis <strong>Settings Saved!</strong> apparaît.</figcaption>
</figure>

</div>

### Étape 2 : Régler la portée de chaque canal

Ouvrez le canal, touchez **⋮** en haut à droite, choisissez
**Set Region Scope** et choisissez la portée selon ce tableau :

| Canal | Portée | Pourquoi |
| --- | --- | --- |
| `Public` | `onqc` | Tout le monde en Ontario et au Québec peut se parler |
| Canaux de test, comme `#testing` | Votre ville, par exemple `yow` | Les tests restent locaux |
| Canaux de robots, comme `#bots` | Votre ville, par exemple `yow` | Les réponses des robots restent locales |
| Vos propres canaux | Votre ville, `on`/`qc` ou `onqc` | Choisissez jusqu’où ils doivent aller |

Si vous faites fonctionner un robot, réglez aussi sa propre **Default Region
Scope** sur votre ville.

**Exemple : `Public` sur `onqc`**

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Liste des canaux avec Public en haut](../assets/images/onqc-scopes/companion-07-channels.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-07-channels.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Touchez <strong>Channels</strong> dans la barre du bas et ouvrez <strong>Public</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Menu du canal Public avec Set Region Scope](../assets/images/onqc-scopes/companion-09-channel-menu.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-09-channel-menu.webp)
<figcaption markdown="span"><span class="scp-shot__num">2</span> Touchez <strong>⋮</strong> en haut à droite et choisissez <strong>Set Region Scope</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Liste Select Region avec onqc](../assets/images/onqc-scopes/companion-10-public-pick-onqc.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-10-public-pick-onqc.webp)
<figcaption markdown="span"><span class="scp-shot__num">3</span> Touchez <code>onqc</code>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![En-tête du canal Public affichant Region: onqc](../assets/images/onqc-scopes/companion-11-public-scoped.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-11-public-scoped.webp)
<figcaption markdown="span"><span class="scp-shot__num">4</span> L’en-tête affiche maintenant <strong>Region: onqc</strong>, et une bannière indique que seuls les répéteurs qui permettent cette région relaieront. La limite passe à 127 caractères.</figcaption>
</figure>

</div>

<div class="mc-callout" markdown>
**Les messages avec portée sont un peu plus courts.** Dès qu’un canal a une
portée, l’application permet moins de caractères par message. Lors de nos
essais, la limite sur `Public` est passée de 137 à 127 caractères après l’avoir
réglé sur `onqc`. L’application fixe la limite exacte, qui peut varier selon le
nom de votre nœud et la version de l’application.
</div>

**Exemple : `#testing` sur votre ville**

<div class="scp-shots" markdown>

<figure class="scp-shot" markdown>
[![Menu du canal #testing avec Set Region Scope](../assets/images/onqc-scopes/companion-13-testing-menu.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-13-testing-menu.webp)
<figcaption markdown="span"><span class="scp-shot__num">1</span> Ouvrez le canal, touchez <strong>⋮</strong> et choisissez <strong>Set Region Scope</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Écran Add Region avec yow tapé](../assets/images/onqc-scopes/companion-15-add-yow.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-15-add-yow.webp)
<figcaption markdown="span"><span class="scp-shot__num">2</span> Si votre code de ville n’est pas dans la liste, touchez <strong>+</strong>, tapez-le (par exemple <code>yow</code>) et touchez le <strong>crochet</strong>.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![Liste Select Region avec onqc et yow et le message Region has been added](../assets/images/onqc-scopes/companion-16-yow-added.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-16-yow-added.webp)
<figcaption markdown="span"><span class="scp-shot__num">3</span> <strong>Region has been added!</strong> Touchez votre code de ville pour le sélectionner.</figcaption>
</figure>

<figure class="scp-shot" markdown>
[![En-tête du canal #testing affichant Region: yow](../assets/images/onqc-scopes/companion-17-testing-scoped.webp){ loading=lazy width="600" height="1304" }](../assets/images/onqc-scopes/companion-17-testing-scoped.webp)
<figcaption markdown="span"><span class="scp-shot__num">4</span> L’en-tête affiche maintenant <strong>Region: yow</strong>.</figcaption>
</figure>

</div>

## Pourquoi l’appareil compagnon utilise `onqc` par défaut

On ne peut pas choisir la portée d’un seul message privé. Quand un MP n’a pas
encore de chemin connu, il est diffusé avec votre **portée par défaut**. La
réponse qui indique le chemin à votre appareil compagnon revient avec la portée par
défaut **de votre contact**.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">Portée par défaut <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="drop">N’arrive jamais</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Vous, Ottawa</strong><small>envoie yow</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc can</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Québec</strong><small>yqb qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Ami, Québec</strong><small>défaut yqb</small></li>
    </ol>
    <p class="scp-route__note">Le répéteur de Montréal ne porte pas <code>yow</code>, donc le message s’arrête là. Même s’il passait, la réponse de votre ami utiliserait <code>yqb</code> et s’arrêterait au retour.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">Portée par défaut <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Livré</span></div>
    <ol class="scp-track" data-animate>
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Vous, Ottawa</strong><small>envoie onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Québec</strong><small>yqb qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Ami, Québec</strong><small>défaut onqc</small></li>
    </ol>
    <p class="scp-route__note">Tous les répéteurs portent <code>onqc</code>, dans les deux sens. Une fois le chemin trouvé, les MP suivants passent directement et les portées ne comptent plus.</p>
  </div>
  <figcaption>Les connexions à un répéteur ou à un serveur de salon fonctionnent de la même façon quand aucun chemin n’est connu.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
**Le piège :** un canal sans portée propre utilise aussi votre portée par
défaut, `onqc`, donc il joint tout l’Ontario et le Québec. C’est ce qu’on veut
pour `Public`, mais pas pour les canaux de test et les robots. C’est pourquoi
l’étape 2 de la configuration de l’appareil compagnon les règle sur votre
ville.
</div>

## Qui reçoit quoi

Quand les répéteurs de bordure rejettent les messages sans portée, un nouvel
utilisateur qui n’a pas encore réglé de portée joint quand même tout le monde
dans sa ville. Ses messages ne passent simplement pas dans la ville voisine.
Voici le lien Ottawa–Montréal par Rigaud, un répéteur de bordure qui porte
aussi le code de Montréal, `yul`.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">Nouvel utilisateur à Ottawa, sans portée <span class="scp-tag" data-level="any">aucune</span><span class="scp-route__verdict" data-result="ok">Tout le secteur d’Ottawa</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Nouvel utilisateur, Ottawa</strong><small>sans portée</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>permet *</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Bordure de Rigaud</strong><small>rejette *</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>permet *</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Utilisateur de Montréal</strong><small>ne le voit jamais</small></li>
    </ol>
    <p class="scp-route__note">Chaque répéteur de la zone d’Ottawa le relaie, donc le nouvel utilisateur joint tout le secteur d’Ottawa. Rigaud l’entend mais ne le relaie pas, donc Montréal n’est jamais inondé.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">Robot d’Ottawa ou MeshMapper, avec portée <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="ok">Zone d’Ottawa seulement</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Robot, Ottawa</strong><small>envoie yow</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Bordure de Rigaud</strong><small>yow yul qc onqc can</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc can</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Utilisateur de Montréal</strong><small>ne le voit jamais</small></li>
    </ol>
    <p class="scp-route__note">Rigaud porte <code>yow</code>, donc il relaie le message. Les répéteurs de Montréal ne portent pas <code>yow</code>, donc le message s’arrête à la limite de la zone.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">MP avec la portée par défaut <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Tout le réseau</span></div>
    <ol class="scp-track" data-animate>
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Vous, Ottawa</strong><small>envoie onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Bordure de Rigaud</strong><small>yow yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc can</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Ami, Montréal</strong><small>défaut onqc</small></li>
    </ol>
    <p class="scp-route__note">Tous les répéteurs portent <code>onqc</code>, y compris le répéteur de bordure, donc les MP traversent encore tout le réseau.</p>
  </div>
  <figcaption>La même chose se produit à chaque bordure entre deux villes.</figcaption>
</figure>

D’autres exemples sur le même lien :

| Message | Répéteurs d’Ottawa<br>`* yow on onqc can` | Bordure de Rigaud<br>`yow yul qc onqc can` | Répéteurs de Montréal<br>`* yul qc onqc can` | Qui le reçoit |
| --- | --- | --- | --- | --- |
| Nouvel utilisateur à Ottawa, sans portée | ✅ Relaie | ❌ Rejette | Jamais atteint | Tout le secteur d’Ottawa |
| Nouvel utilisateur à Montréal, sans portée | Jamais atteint | ❌ Rejette | ✅ Relaie | Tout le secteur de Montréal |
| Canal ou robot d’Ottawa, `yow` | ✅ Relaie | ✅ Relaie | ❌ Rejette | Zone d’Ottawa seulement |
| Canal ou robot de Montréal, `yul` | ❌ Rejette | ✅ Relaie | ✅ Relaie | Zone de Montréal seulement |
| Canal de tout le Québec, `qc` | ❌ Rejette | ✅ Relaie | ✅ Relaie | Côté québécois, y compris Gatineau |
| MP avec la portée par défaut, `onqc` | ✅ Relaie | ✅ Relaie | ✅ Relaie | Tout le réseau ON/QC |

C’est pourquoi les robots et MeshMapper devraient avoir la portée de leur ville :
ils restent contenus quoi qu’il arrive, et les nouveaux utilisateurs qui n’ont
pas encore réglé de portée fonctionnent quand même localement.

## Déploiement

<ol class="scp-timeline">
  <li data-phase="Phase 1"><h3>Répéteurs</h3><p>Les propriétaires effacent les anciennes régions et ajoutent leurs codes. Les répéteurs de ville gardent <code>*</code> permis; les répéteurs de bordure le rejettent. Rien ne brise dans aucune ville.</p></li>
  <li data-phase="Phase 2"><h3>Appareils compagnons</h3><p>Une fois les répéteurs autour d’eux configurés, les utilisateurs règlent leur portée par défaut et <code>Public</code> sur <code>onqc</code>, et leurs canaux de test et robots sur leur ville.</p></li>
  <li data-phase="Phase 3"><h3>Seulement au besoin</h3><p>Si les messages sans portée sont encore trop bruyants dans une ville, les répéteurs peuvent aussi lancer <code>set flood.max.unscoped 3</code>. Les messages avec portée atteignent encore 16 sauts.</p></li>
</ol>

## À savoir

- **Les messages avec portée ont environ 10 caractères de moins.**
  L’application réduit la longueur maximale sur les canaux avec portée (de
  137 à 127 lors de nos essais).
- **Les annonces des répéteurs restent dans leur ville.** Les utilisateurs de
  Montréal ne verront pas les répéteurs d’Ottawa par les annonces diffusées.
- **16 sauts doivent suffire.** `flood.max` s’applique aussi à `onqc`. Si le
  plus long chemin réel dans le réseau dépasse 16 sauts, les messages qui
  traversent le réseau s’arrêteront en chemin.
- **Versions :** `region def` exige le micrologiciel 1.16 ou plus récent sur le
  répéteur. La portée par défaut dans l’application exige MeshCore 1.43 ou plus
  récent.

## Prochaines étapes

- S’entendre sur la liste des codes de ville pour l’Ontario et le Québec.
- Ajouter à meshcore.ca un outil « trouvez votre ville » qui affiche votre code.
- Publier les commandes de nettoyage et de configuration pour chaque ville.
- Ajouter un mode simple Ontario et Québec au
  [configurateur de répéteur](../config/index.md).
- Les autres provinces gardent la configuration actuelle jusqu’à ce que le
  projet pilote ait fait ses preuves.

Des idées? Partagez-les sur le
[Discord de MeshCore Canada](https://discord.gg/BESFVMt7yk) ou sur le
[forum](https://forum.meshcore.ca/).
