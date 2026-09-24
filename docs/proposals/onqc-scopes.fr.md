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
  - assets/styles/scopes-proposal.css?v=20260924-1
---

# Proposition de portées de région ON/QC

<div class="scp-hero">
  <p class="mc-eyebrow">Proposition à discuter</p>
  <p class="mc-lede">Les portées de région empêchent les échanges locaux d’inonder tout le réseau. La configuration actuelle est difficile à suivre. Cette proposition la ramène à trois codes faciles à retenir partout en Ontario et au Québec.</p>
  <ul class="scp-hero__badges">
    <li data-kind="proposal">Pas encore adoptée</li>
    <li>Projet pilote Ontario + Québec</li>
    <li>Micrologiciel du répéteur 1.16+</li>
    <li>Application MeshCore 1.43+</li>
  </ul>
</div>

## En bref

Il y a trois niveaux de portée. Chaque répéteur porte un code de chaque
niveau : sa ville, sa province et `onqc`. Quand vous envoyez un message, vous
choisissez le niveau à utiliser, et c’est ce qui décide jusqu’où il va.

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
</div>

- **Les répéteurs** portent leur ville, leur province et `onqc`.
- **Les téléphones** utilisent `onqc` par défaut, pour que les messages privés
  joignent tout le monde.
- **Les canaux locaux** comme `#public` sont réglés sur votre ville, pour que
  les échanges restent locaux.
- **Les messages sans portée** continuent de fonctionner pendant le projet
  pilote.

## Qu’est-ce qu’une portée?

Une portée est un nom court joint à un message, par exemple `yow`. Les
répéteurs s’en servent pour décider s’ils relaient le message.

<div class="mc-callout" markdown>
Une portée n’est **pas** du chiffrement et **pas** une clôture GPS. Tout le
monde peut lire le nom, et il n’a rien à voir avec l’endroit où vous êtes. C’est
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
  <figcaption>Le MP porte <code>onqc</code> parce que <code>onqc</code> est la portée par défaut du téléphone dans cette proposition. <a href="#pourquoi-le-telephone-utilise-onqc-par-defaut">Voir pourquoi plus bas</a>. Le répéteur entend quand même tous les messages. La portée décide seulement s’il les relaie. Votre téléphone reçoit aussi tout ce qui l’atteint.</figcaption>
</figure>

Trois détails piègent souvent :

- **L’orthographe doit être exacte.** `yow`, `YOW` et `ott` sont trois noms
  différents. Un téléphone réglé sur `yow` est ignoré par un répéteur qui ne
  porte que `ott`.
- **Seules les diffusions (flood) sont vérifiées.** Dès qu’un message privé a
  un chemin connu, il suit ce chemin directement et les portées ne comptent
  plus.
- **Il n’y a pas d’héritage.** Porter `on` ne veut pas dire porter `yow`.
  Chaque nom doit être sur la liste à part entière.

## Les trois niveaux

<figure class="scp-figure">
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
          <div class="scp-city"><strong>yul</strong><span>Montréal, Trois-Rivières, Rigaud</span></div>
          <div class="scp-city"><strong>yqb</strong><span>Ville de Québec</span></div>
          <div class="scp-city"><strong>yow</strong><span>Gatineau (partagé avec Ottawa)</span></div>
          <div class="scp-city"><strong>ytf</strong><span>Saguenay–Lac-Saint-Jean</span></div>
          <div class="scp-city" data-more><strong>…</strong><span>Autres zones MeshMapper</span></div>
        </div>
      </div>
    </div>
  </div>
  <div class="scp-flat">
    <strong>Ce qu’un répéteur d’Ottawa garde vraiment :</strong>
    <span class="scp-flat__list"><span class="scp-tag" data-level="any">*</span><span class="scp-tag" data-level="city">yow</span><span class="scp-tag" data-level="prov">on</span><span class="scp-tag" data-level="mesh">onqc</span></span>
    <span>Une simple liste de noms. Les boîtes ci-dessus servent aux gens, pas au répéteur.</span>
  </div>
  <figcaption>La zone <code>yow</code> traverse la rivière des Outaouais. Les répéteurs de Gatineau utilisent <code>yow</code> pour leur ville et <code>qc</code> pour leur province.</figcaption>
</figure>

### Pourquoi des codes d’aéroport?

- Ce sont les mêmes codes que MeshMapper utilise déjà, par exemple
  `yow.meshmapper.net`.
- Il n’y a ni accent ni majuscule à se tromper. `montréal`, `Montreal` et
  `montreal` seraient trois portées différentes.
- Ils sont faciles à diviser plus tard. Si Renfrew veut un jour son propre
  secteur, il peut prendre son propre code d’aéroport et garder `on` et `onqc`.
  Rien d’autre ne change.

La première fois, écrivez toujours le code avec son secteur, par exemple
`yow` (secteur Ottawa–Gatineau), pour que les gens l’apprennent.

## Lire `region def yow|* on|* onqc`

`region def` construit la liste d’un répéteur en une ligne. La commande garde un
**curseur** qui part du sommet, `*`. Chaque nom est créé sous le curseur, et
`|*` ramène le curseur au sommet.

<figure class="scp-figure">
  <div class="scp-tape" aria-label="region def yow|* on|* onqc">
    <span class="scp-tape__cmd">region def</span>
    <span class="scp-tape__tok"><b>1</b>yow</span>
    <span class="scp-tape__tok" data-kind="jump"><b>2</b>|*</span>
    <span class="scp-tape__tok"><b>3</b>on</span>
    <span class="scp-tape__tok" data-kind="jump"><b>4</b>|*</span>
    <span class="scp-tape__tok"><b>5</b>onqc</span>
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
    <li>Crée <code>onqc</code>. Terminé.<div class="scp-tree">*
├ yow
├ on
└ <mark>onqc</mark></div></li>
  </ol>
  <figcaption>Le résultat est une liste à plat : tous les codes sont côte à côte sous <code>*</code>. Le nom surligné indique la position du curseur.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
`region def` ajoute ou déplace des noms seulement. La commande ne supprime
jamais ceux qui existent déjà. Lancez `region` ensuite pour voir la liste
complète.
</div>

## Configuration du répéteur

### Étape 1 : Effacer les anciennes régions

Beaucoup de répéteurs ont déjà des régions de l’ancienne configuration, comme
`can`, `on-alg` ou `ott`. `region def` ne supprime jamais rien, alors effacez-les
d’abord.

1. Lancez `region` pour voir ce qui s’y trouve.
2. Retirez chaque nom sauf `*` avec `region remove <nom>`. Commencez par la
   ligne la plus en retrait et remontez. Si vous voyez `Err - not empty`, un
   nom est encore en retrait sous celui-ci; retirez-le d’abord.
3. Lancez `region save`.

Par exemple, un répéteur configuré avec l’ancien chemin d’Ottawa :

```text
region remove ott
region remove on-alg
region remove on
region remove can
region save
```

Retirer `on` ne pose pas de problème. Les réglages de région de l’étape 3 le
remettent. Lancez `region` de nouveau : vous ne devriez voir que `* F`.

### Étape 2 : Réglages standard de MeshCore Canada

```text
set path.hash.mode 2
set advert.interval 240
set flood.advert.interval 47
set flood.max 16
```

<dl class="scp-explain">
  <dt>path.hash.mode 2</dt><dd>Utilise des identifiants de répéteur de 3 octets dans les chemins, pour que moins de répéteurs partagent un identifiant.</dd>
  <dt>advert.interval 240</dt><dd>Annonce ce répéteur à ses voisins directs toutes les 4 heures.</dd>
  <dt>flood.advert.interval 47</dt><dd>Annonce ce répéteur dans tout le réseau toutes les 47 heures.</dd>
  <dt>flood.max 16</dt><dd>Aucune diffusion ne fait plus de 16 sauts, avec ou sans portée.</dd>
</dl>

### Étape 3 : Réglages de région

Votre code de ville est votre **zone MeshMapper**. Ouvrez
[MeshMapper](https://meshmapper.net/), trouvez la zone où se trouve votre
répéteur et utilisez son code. C’est une carte que tout le monde utilise déjà,
donc rien de nouveau à chercher.

Le modèle est toujours le même :

```text
region def <ville>|* <on ou qc>|* onqc
```

Exemples :

=== "Ottawa"

    ```text
    region def yow|* on|* onqc
    region allowf *
    region default yow
    region save
    ```

=== "Gatineau"

    ```text
    region def yow|* qc|* onqc
    region allowf *
    region default yow
    region save
    ```

=== "Montréal"

    ```text
    region def yul|* qc|* onqc
    region allowf *
    region default yul
    region save
    ```

=== "Ville de Québec"

    ```text
    region def yqb|* qc|* onqc
    region allowf *
    region default yqb
    region save
    ```

<dl class="scp-explain">
  <dt>region def …</dt><dd>Porter votre ville, votre province et <code>onqc</code>.</dd>
  <dt>region allowf *</dt><dd>Relayer aussi les messages <strong>sans portée</strong>. C’est déjà le réglage par défaut. On le règle quand même pour que vous le voyiez.</dd>
  <dt>region default yow</dt><dd>Les annonces de ce répéteur utilisent la portée de votre ville, pour rester locales.</dd>
  <dt>region save</dt><dd>Conserve les réglages de région après un redémarrage. Les commandes <code>set</code> s’enregistrent d’elles-mêmes.</dd>
</dl>

Pour vérifier, lancez `region`. Pour Ottawa, vous devriez voir :

```text
* F
 yow F
 on F
 onqc F
```

`F` veut dire « diffusion permise » : le répéteur relaie ce nom.

### Répéteurs passerelles

Un répéteur qui relie volontairement deux zones de ville porte **les deux**
codes de ville. Par exemple, un répéteur à **Rigaud** se trouve dans la zone
`yul` et relie Montréal à la zone d’Ottawa :

```text
region def yul|* yow|* qc|* onqc
region allowf *
region default yul
region save
```

Il relaie les messages de ville d’Ottawa et de Montréal, ainsi que `qc` et
`onqc`. Ses propres annonces restent dans sa zone, `yul`. N’ajoutez une ville
voisine que si le répéteur relie vraiment les deux secteurs; sinon, les
messages de ville iront plus loin que prévu.

### Permettre ou rejeter : aide-mémoire

| Commande | Effet |
| --- | --- |
| `region allowf <nom>` | Relayer les messages portant ce nom |
| `region denyf <nom>` | Rejeter les messages portant ce nom. Le répéteur les reçoit quand même. |
| `<nom>` | Peut être `*` pour les messages sans portée, ou un code comme `yow` |
| `set flood.max.unscoped <sauts>` | Une limite de sauts séparée pour les messages sans portée. Elle compte seulement si elle est plus basse que `flood.max`. `0` a le même effet que `region denyf *`. |
| `region save` | À lancer après chaque `allowf` ou `denyf` |

## Configuration du téléphone et de l’appareil compagnon

1. Ouvrez l’application MeshCore, puis **Settings → Experimental Settings →
   Default Region Scope**. Ajoutez `onqc` et sélectionnez-le.
2. Ouvrez chaque canal local, comme `#public`. Dans le menu du canal, touchez
   **Set Region Scope** et choisissez le code de votre ville, par exemple
   `yow`.
3. Pour un canal qui doit aller plus loin, choisissez plutôt `on`, `qc` ou
   `onqc`.

## Pourquoi le téléphone utilise `onqc` par défaut

On ne peut pas choisir la portée d’un seul message privé. Quand un MP n’a pas
encore de chemin connu, il est diffusé avec votre **portée par défaut**. La
réponse qui indique le chemin à votre téléphone revient avec la portée par
défaut **de votre contact**.

<figure class="scp-figure">
  <div class="scp-route">
    <div class="scp-route__head">Portée par défaut <span class="scp-tag" data-level="city">yow</span><span class="scp-route__verdict" data-result="drop">N’arrive jamais</span></div>
    <ol class="scp-track">
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Vous, Ottawa</strong><small>envoie yow</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc</small></li>
      <li data-link="drop"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="repeater" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Québec</strong><small>yqb qc onqc</small></li>
      <li data-link="none"><span class="scp-stop" data-kind="phone" data-state="dim"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Ami, Québec</strong><small>défaut yqb</small></li>
    </ol>
    <p class="scp-route__note">Le répéteur de Montréal ne porte pas <code>yow</code>, donc le message s’arrête là. Même s’il passait, la réponse de votre ami utiliserait <code>yqb</code> et s’arrêterait au retour.</p>
  </div>
  <div class="scp-route">
    <div class="scp-route__head">Portée par défaut <span class="scp-tag" data-level="mesh">onqc</span><span class="scp-route__verdict" data-result="ok">Livré</span></div>
    <ol class="scp-track" data-animate>
      <li><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Vous, Ottawa</strong><small>envoie onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur d’Ottawa</strong><small>yow on onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Montréal</strong><small>yul qc onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="repeater"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 10v11M8 21h8M9.5 21 12 10l2.5 11"/><circle cx="12" cy="8" r="1.6"/><path d="M8.6 4.6a5 5 0 0 0 0 6.8M15.4 4.6a5 5 0 0 1 0 6.8"/></svg></span><strong>Répéteur de Québec</strong><small>yqb qc onqc</small></li>
      <li data-link="ok"><span class="scp-stop" data-kind="phone"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2"/><path d="M11 18.5h2"/></svg></span><strong>Ami, Québec</strong><small>défaut onqc</small></li>
    </ol>
    <p class="scp-route__note">Tous les répéteurs portent <code>onqc</code>, dans les deux sens. Une fois le chemin trouvé, les MP suivants passent directement et les portées ne comptent plus.</p>
  </div>
  <figcaption>Les connexions à un répéteur ou à un serveur de salon fonctionnent de la même façon quand aucun chemin n’est connu.</figcaption>
</figure>

<div class="mc-callout" data-kind="warning" markdown>
**Le piège :** un canal sans portée propre utilise aussi votre portée par
défaut. Avec `onqc` par défaut, un `#public` sans portée joindrait tout
l’Ontario et le Québec. C’est pourquoi l’étape 2 de la configuration du
téléphone règle les canaux locaux sur votre ville.
</div>

## Déploiement

<ol class="scp-timeline">
  <li data-phase="Phase 1"><h3>Répéteurs</h3><p>Les propriétaires effacent les anciennes régions, ajoutent leurs trois codes et gardent <code>*</code> permis. Rien ne brise pour personne.</p></li>
  <li data-phase="Phase 2"><h3>Téléphones</h3><p>Les utilisateurs règlent leur portée par défaut sur <code>onqc</code> et leurs canaux locaux sur leur ville.</p></li>
  <li data-phase="Phase 3"><h3>Bascule</h3><p>À une date convenue, les répéteurs lancent <code>set flood.max.unscoped 3</code>. Les messages sans portée restent alors à 3 sauts ou moins, tandis que les messages avec portée atteignent encore 16 sauts.</p></li>
</ol>

## À savoir

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
