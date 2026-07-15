import { validateProposal } from "./validate.js";
import { buildRegionProposalIssue } from "./issue.js";

(function () {
  "use strict";

  var ASSETS = new URL("../../assets/regions/", window.location.href);

  function assetUrl(name) {
    return new URL(name, ASSETS).href;
  }

  async function fetchOk(name, options) {
    var response = await fetch(assetUrl(name), options || {});
    if (!response.ok) {
      throw new Error("The editor data could not be loaded (" + name + ").");
    }
    return response;
  }

  async function sha256Hex(buffer) {
    var digest = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(digest)).map(function (b) {
      return b.toString(16).padStart(2, "0");
    }).join("");
  }

  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = "";
    var inQuotes = false;
    for (var i = 0; i < text.length; i += 1) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { field += '"'; i += 1; } else { inQuotes = false; }
        } else { field += ch; }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field); field = "";
      } else if (ch === "\n") {
        row.push(field); field = "";
        if (row.length > 1 || row[0] !== "") rows.push(row);
        row = [];
      } else if (ch !== "\r") {
        field += ch;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows;
  }

  var allMembership = new Map();   // DGUID -> {leaf_tag, PRUID}
  var leafProvinces = new Map();   // leaf_tag -> Set of PRUID

  async function loadMembershipCsv() {
    var response = await fetchOk("canada-region-membership.csv");
    var buffer = await response.arrayBuffer();
    state.baseMembershipSha256 = await sha256Hex(buffer);
    var rows = parseCsv(new TextDecoder().decode(buffer));
    var header = rows.shift();
    var col = {};
    header.forEach(function (name, index) { col[name] = index; });
    rows.forEach(function (cells) {
      var record = {
        DGUID: cells[col.DGUID], DAUID: cells[col.DAUID], PRUID: cells[col.PRUID],
        CDNAME: cells[col.CDNAME], CSDUID: cells[col.CSDUID], CSDNAME: cells[col.CSDNAME],
        leaf_tag: cells[col.leaf_tag]
      };
      allMembership.set(record.DGUID, record);
      if (record.leaf_tag && record.PRUID) {
        if (!leafProvinces.has(record.leaf_tag)) leafProvinces.set(record.leaf_tag, new Set());
        leafProvinces.get(record.leaf_tag).add(record.PRUID);
      }
    });
  }

  var provinceNames = {
    "10": "Newfoundland and Labrador",
    "11": "Prince Edward Island",
    "12": "Nova Scotia",
    "13": "New Brunswick",
    "24": "Quebec",
    "35": "Ontario",
    "46": "Manitoba",
    "47": "Saskatchewan",
    "48": "Alberta",
    "59": "British Columbia",
    "60": "Yukon",
    "61": "Northwest Territories",
    "62": "Nunavut"
  };

  var elements = {
    province: document.getElementById("province-select"),
    target: document.getElementById("target-select"),
    loadStatus: document.getElementById("load-status"),
    mapHeading: document.getElementById("map-heading"),
    panMode: document.getElementById("pan-mode"),
    paintMode: document.getElementById("paint-mode"),
    cellDetails: document.getElementById("cell-details"),
    municipality: document.getElementById("municipality-button"),
    undo: document.getElementById("undo-button"),
    redo: document.getElementById("redo-button"),
    clear: document.getElementById("clear-button"),
    before: document.getElementById("before-view"),
    after: document.getElementById("after-view"),
    changeCount: document.getElementById("change-count"),
    submittedBy: document.getElementById("submitted-by"),
    reason: document.getElementById("reason"),
    validation: document.getElementById("validation-message"),
    submit: document.getElementById("submit-button"),
    export: document.getElementById("export-button")
  };

  var state = {
    catalog: null,
    partition: null,
    membership: new Map(),
    baseMembershipSha256: "",
    features: [],
    featureById: new Map(),
    layerById: new Map(),
    proposed: new Map(),
    undoStack: [],
    redoStack: [],
    selectedId: "",
    target: "",
    province: "",
    mode: "pan",
    view: "after",
    painting: false,
    paintAction: null,
    loadController: null
  };

  var map = L.map("editor-map", {
    center: [56.1304, -106.3468],
    zoom: 4,
    minZoom: 2,
    maxZoom: 16,
    preferCanvas: true
  });
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  var partitionLayer = L.geoJSON(null, {
    interactive: false,
    style: function () {
      return { color: "#8d93ae", weight: 1, opacity: 0.4, fillOpacity: 0.025 };
    }
  }).addTo(map);
  var cellLayer = L.geoJSON(null, {
    style: styleFeature,
    onEachFeature: wireCell
  }).addTo(map);

  function setStatus(message, kind) {
    elements.loadStatus.textContent = message;
    elements.loadStatus.className = "status-line" + (kind ? " " + kind : "");
  }

  function setValidation(message, kind) {
    elements.validation.textContent = message;
    elements.validation.className = "validation-message" + (kind ? " " + kind : "");
  }

  function leafLabel(tag) {
    var hierarchy = state.catalog && state.catalog.hierarchy;
    var entry = hierarchy && hierarchy[tag];
    return entry && entry.label ? entry.label : tag;
  }

  function colourForTag(tag) {
    var hash = 0;
    for (var index = 0; index < tag.length; index += 1) {
      hash = ((hash << 5) - hash + tag.charCodeAt(index)) | 0;
    }
    var hue = Math.abs(hash) % 360;
    return "hsl(" + hue + " 58% 58%)";
  }

  function originalLeaf(dguid) {
    var row = state.membership.get(dguid);
    return row ? row.leaf_tag : "";
  }

  function effectiveLeaf(dguid) {
    return state.proposed.get(dguid) || originalLeaf(dguid);
  }

  function styleFeature(feature) {
    var dguid = String(feature.properties.DGUID || "");
    var original = originalLeaf(dguid) || String(feature.properties.leaf_tag || "");
    var proposed = state.proposed.get(dguid) || original;
    var shown = state.view === "before" ? original : proposed;
    var changed = proposed !== original;
    var selected = state.selectedId === dguid;
    return {
      color: selected ? "#ffffff" : (changed ? "#ffd166" : colourForTag(shown)),
      fillColor: colourForTag(shown),
      fillOpacity: selected ? 0.55 : (changed ? 0.46 : 0.31),
      opacity: 0.95,
      weight: selected ? 3.5 : (changed ? 2.2 : 0.8)
    };
  }

  function tooltipNode(feature) {
    var properties = feature.properties || {};
    var node = document.createElement("span");
    var municipality = properties.CSDNAME || properties.CDNAME || "Unnamed census area";
    var dguid = String(properties.DGUID || "");
    node.textContent = municipality + " · " + leafLabel(effectiveLeaf(dguid));
    return node;
  }

  function wireCell(feature, layer) {
    var dguid = String(feature.properties.DGUID || "");
    if (!dguid) {
      return;
    }
    state.layerById.set(dguid, layer);
    layer.bindTooltip(tooltipNode(feature), {
      className: "mcc-cell-tooltip",
      direction: "top",
      sticky: true
    });
    layer.on("click", function () {
      selectCell(dguid);
      if (state.mode === "paint" && state.target) {
        applyTransaction([dguid], state.target);
      }
    });
    layer.on("mousedown", function (event) {
      if (state.mode !== "paint" || !state.target) {
        return;
      }
      L.DomEvent.preventDefault(event.originalEvent);
      selectCell(dguid);
      beginPaint();
      paintCell(dguid);
    });
    layer.on("mouseover", function () {
      if (state.painting) {
        paintCell(dguid);
      }
    });
  }

  function refreshLayer(dguid) {
    var layer = state.layerById.get(dguid);
    if (layer) {
      layer.setStyle(styleFeature(layer.feature));
      if (layer.getTooltip()) {
        layer.setTooltipContent(tooltipNode(layer.feature));
      }
    }
  }

  function refreshAllStyles() {
    cellLayer.setStyle(styleFeature);
    state.layerById.forEach(function (layer) {
      if (layer.getTooltip()) {
        layer.setTooltipContent(tooltipNode(layer.feature));
      }
    });
  }

  function selectCell(dguid) {
    var previous = state.selectedId;
    state.selectedId = dguid;
    if (previous) {
      refreshLayer(previous);
    }
    refreshLayer(dguid);
    var feature = state.featureById.get(dguid);
    if (!feature) {
      return;
    }
    var properties = feature.properties;
    var rows = elements.cellDetails.querySelectorAll("dd");
    rows[0].textContent = properties.DAUID || properties.DGUID || "—";
    rows[1].textContent = properties.CSDNAME || properties.CDNAME || "—";
    rows[2].textContent = leafLabel(effectiveLeaf(dguid)) + " (" + effectiveLeaf(dguid) + ")";
    rows[3].textContent = properties.seed_tag ? leafLabel(properties.seed_tag) + " (fixed)" : "No";
    elements.municipality.disabled = !properties.CSDUID || !state.target;
  }

  function setEffective(dguid, leaf) {
    var original = originalLeaf(dguid);
    if (!original) {
      return;
    }
    if (leaf === original) {
      state.proposed.delete(dguid);
    } else {
      state.proposed.set(dguid, leaf);
    }
    refreshLayer(dguid);
    if (state.selectedId === dguid) {
      selectCell(dguid);
    }
  }

  function buildAction(dguids, target) {
    var changes = [];
    var seen = new Set();
    dguids.forEach(function (dguid) {
      if (seen.has(dguid) || !state.membership.has(dguid)) {
        return;
      }
      seen.add(dguid);
      var before = effectiveLeaf(dguid);
      if (before !== target) {
        changes.push({ DGUID: dguid, before: before, after: target });
      }
    });
    return changes;
  }

  function commitAction(changes) {
    if (!changes.length) {
      return;
    }
    changes.forEach(function (change) {
      setEffective(change.DGUID, change.after);
    });
    state.undoStack.push(changes);
    state.redoStack = [];
    updateReview();
  }

  function applyTransaction(dguids, target) {
    var protectedCell = dguids.find(function (dguid) {
      var feature = state.featureById.get(dguid);
      var seedTag = feature && String(feature.properties.seed_tag || "");
      return seedTag && seedTag !== target;
    });
    if (protectedCell) {
      var seedFeature = state.featureById.get(protectedCell);
      setValidation(
        "That selection contains the fixed anchor for " + leafLabel(seedFeature.properties.seed_tag) + ".",
        "error"
      );
      return;
    }
    commitAction(buildAction(dguids, target));
  }

  function beginPaint() {
    if (state.painting) {
      return;
    }
    state.painting = true;
    state.paintAction = new Map();
  }

  function paintCell(dguid) {
    if (!state.painting || !state.target) {
      return;
    }
    var feature = state.featureById.get(dguid);
    var seedTag = feature && String(feature.properties.seed_tag || "");
    if (seedTag && seedTag !== state.target) {
      setValidation("The fixed anchor for " + leafLabel(seedTag) + " cannot be moved.", "error");
      return;
    }
    var before = effectiveLeaf(dguid);
    if (!state.paintAction.has(dguid)) {
      state.paintAction.set(dguid, { DGUID: dguid, before: before, after: state.target });
    } else {
      state.paintAction.get(dguid).after = state.target;
    }
    setEffective(dguid, state.target);
    updateReview();
  }

  function endPaint() {
    if (!state.painting) {
      return;
    }
    state.painting = false;
    var changes = Array.from(state.paintAction.values()).filter(function (change) {
      return change.before !== change.after;
    });
    state.paintAction = null;
    if (changes.length) {
      state.undoStack.push(changes);
      state.redoStack = [];
    }
    updateReview();
  }

  function undo() {
    var action = state.undoStack.pop();
    if (!action) {
      return;
    }
    action.forEach(function (change) {
      setEffective(change.DGUID, change.before);
    });
    state.redoStack.push(action);
    updateReview();
  }

  function redo() {
    var action = state.redoStack.pop();
    if (!action) {
      return;
    }
    action.forEach(function (change) {
      setEffective(change.DGUID, change.after);
    });
    state.undoStack.push(action);
    updateReview();
  }

  function clearChanges() {
    var changes = Array.from(state.proposed.keys()).map(function (dguid) {
      return { DGUID: dguid, before: effectiveLeaf(dguid), after: originalLeaf(dguid) };
    });
    commitAction(changes);
  }

  function updateReview() {
    var count = state.proposed.size;
    elements.changeCount.textContent = count + (count === 1 ? " change" : " changes");
    elements.undo.disabled = state.undoStack.length === 0;
    elements.redo.disabled = state.redoStack.length === 0;
    elements.clear.disabled = count === 0;
    elements.submit.disabled = count === 0 || !state.baseMembershipSha256;
    elements.export.disabled = count === 0 || !state.baseMembershipSha256;
    if (count) {
      setValidation("Ready to validate " + count + (count === 1 ? " cell." : " cells."), "");
    } else {
      setValidation("", "");
    }
  }

  function setMode(mode) {
    state.mode = mode;
    elements.panMode.classList.toggle("active", mode === "pan");
    elements.paintMode.classList.toggle("active", mode === "paint");
    elements.panMode.setAttribute("aria-pressed", String(mode === "pan"));
    elements.paintMode.setAttribute("aria-pressed", String(mode === "paint"));
    if (mode === "paint") {
      map.dragging.disable();
      map.getContainer().classList.add("paint-mode");
    } else {
      endPaint();
      map.dragging.enable();
      map.getContainer().classList.remove("paint-mode");
    }
  }

  function setView(view) {
    state.view = view;
    elements.before.classList.toggle("active", view === "before");
    elements.after.classList.toggle("active", view === "after");
    elements.before.setAttribute("aria-pressed", String(view === "before"));
    elements.after.setAttribute("aria-pressed", String(view === "after"));
    refreshAllStyles();
  }

  function populateProvinceOptions(manifest) {
    var available = new Set();
    var collections = [manifest && manifest.provinces, manifest && manifest.jurisdictions, manifest && manifest.files];
    collections.forEach(function (collection) {
      if (!Array.isArray(collection)) {
        return;
      }
      collection.forEach(function (item) {
        var value = typeof item === "string" ? item : (item.PRUID || item.pruid || item.id || item.province);
        var match = String(value || "").match(/[0-9]{2}/);
        if (match && provinceNames[match[0]]) {
          available.add(match[0]);
        }
      });
    });
    if (!available.size && manifest && manifest.artifacts && typeof manifest.artifacts === "object") {
      Object.keys(manifest.artifacts).forEach(function (key) {
        var match = key.match(/[0-9]{2}/);
        if (match && provinceNames[match[0]]) {
          available.add(match[0]);
        }
      });
    }
    if (!available.size) {
      Object.keys(provinceNames).forEach(function (pruid) { available.add(pruid); });
    }
    elements.province.replaceChildren();
    Array.from(available).sort().forEach(function (pruid) {
      var option = document.createElement("option");
      option.value = pruid;
      option.textContent = provinceNames[pruid];
      elements.province.appendChild(option);
    });
    elements.province.value = available.has("35") ? "35" : Array.from(available)[0];
  }

  function populateTargets() {
    var tags = new Set();
    state.membership.forEach(function (row) {
      if (row.leaf_tag) {
        tags.add(row.leaf_tag);
      }
    });
    var previous = state.target;
    elements.target.replaceChildren();
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Choose a target region";
    elements.target.appendChild(blank);
    Array.from(tags).sort(function (left, right) {
      return leafLabel(left).localeCompare(leafLabel(right));
    }).forEach(function (tag) {
      var option = document.createElement("option");
      option.value = tag;
      option.textContent = leafLabel(tag) + " (" + tag + ")";
      elements.target.appendChild(option);
    });
    elements.target.disabled = tags.size === 0;
    if (tags.has(previous)) {
      elements.target.value = previous;
    } else {
      state.target = "";
    }
  }

  function decodeArc(topology, arcIndex, cache) {
    var reverse = arcIndex < 0;
    var index = reverse ? ~arcIndex : arcIndex;
    if (!cache[index]) {
      var source = topology.arcs[index];
      var output = [];
      var x = 0;
      var y = 0;
      source.forEach(function (point) {
        if (topology.transform) {
          x += point[0];
          y += point[1];
          output.push([
            x * topology.transform.scale[0] + topology.transform.translate[0],
            y * topology.transform.scale[1] + topology.transform.translate[1]
          ]);
        } else {
          output.push([point[0], point[1]]);
        }
      });
      cache[index] = output;
    }
    var coordinates = cache[index];
    return reverse ? coordinates.slice().reverse() : coordinates;
  }

  function stitchRing(topology, indexes, cache) {
    var result = [];
    indexes.forEach(function (arcIndex, position) {
      var arc = decodeArc(topology, arcIndex, cache);
      result.push.apply(result, position ? arc.slice(1) : arc);
    });
    return result;
  }

  function topologyGeometry(topology, geometry, cache) {
    if (geometry.type === "Polygon") {
      return {
        type: "Polygon",
        coordinates: geometry.arcs.map(function (ring) { return stitchRing(topology, ring, cache); })
      };
    }
    if (geometry.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: geometry.arcs.map(function (polygon) {
          return polygon.map(function (ring) { return stitchRing(topology, ring, cache); });
        })
      };
    }
    throw new Error("Editor cells contain an unsupported geometry type.");
  }

  function topologyToFeatures(topology) {
    if (!topology || topology.type !== "Topology" || !topology.objects || !topology.objects.cells) {
      throw new Error("Editor cell topology is invalid.");
    }
    var object = topology.objects.cells;
    var geometries = object.type === "GeometryCollection" ? object.geometries : [object];
    var cache = [];
    return geometries.map(function (geometry) {
      return {
        type: "Feature",
        id: geometry.id,
        properties: Object.assign({}, geometry.properties || {}),
        geometry: topologyGeometry(topology, geometry, cache)
      };
    });
  }

  function resetEdits() {
    state.proposed.clear();
    state.undoStack = [];
    state.redoStack = [];
    state.selectedId = "";
    state.painting = false;
    state.paintAction = null;
    updateReview();
    var rows = elements.cellDetails.querySelectorAll("dd");
    rows[0].textContent = "Select a cell on the map";
    rows[1].textContent = "—";
    rows[2].textContent = "—";
    rows[3].textContent = "—";
    elements.municipality.disabled = true;
  }

  async function loadProvince(pruid) {
    if (!pruid) {
      return;
    }
    if (state.loadController) {
      state.loadController.abort();
    }
    state.loadController = new AbortController();
    var signal = state.loadController.signal;
    setStatus("Loading " + provinceNames[pruid] + "…", "");
    elements.target.disabled = true;
    resetEdits();
    try {
      var topology = await (await fetchOk("cells/cells-" + pruid + ".topo.json", { signal: signal })).json();
      state.membership = new Map();
      allMembership.forEach(function (row, dguid) {
        if (row.PRUID === pruid) state.membership.set(dguid, row);
      });
      state.province = pruid;
      state.features = topologyToFeatures(topology);
      state.featureById = new Map();
      state.features.forEach(function (feature) {
        var dguid = String(feature.properties.DGUID || "");
        var membership = state.membership.get(dguid);
        if (membership) {
          feature.properties = Object.assign({}, feature.properties, membership);
          state.featureById.set(dguid, feature);
        }
      });
      state.features = state.features.filter(function (feature) {
        return state.featureById.has(String(feature.properties.DGUID || ""));
      });
      state.layerById.clear();
      cellLayer.clearLayers();
      cellLayer.addData({ type: "FeatureCollection", features: state.features });
      populateTargets();
      elements.mapHeading.textContent = provinceNames[pruid];
      if (cellLayer.getBounds().isValid()) {
        map.fitBounds(cellLayer.getBounds(), { padding: [18, 18] });
      }
      partitionLayer.bringToBack();
      setStatus(
        state.features.length.toLocaleString() + " editable census cells loaded.",
        "success"
      );
    } catch (error) {
      if (error.name === "AbortError") {
        return;
      }
      state.membership.clear();
      state.features = [];
      state.featureById.clear();
      state.layerById.clear();
      cellLayer.clearLayers();
      setStatus(error.message, "error");
    }
  }

  function municipalityCells() {
    var selected = state.featureById.get(state.selectedId);
    if (!selected || !selected.properties.CSDUID) {
      return [];
    }
    var csduid = String(selected.properties.CSDUID);
    return state.features.filter(function (feature) {
      return String(feature.properties.CSDUID || "") === csduid;
    }).map(function (feature) {
      return String(feature.properties.DGUID);
    });
  }

  function localProposal() {
    var changes = Array.from(state.proposed.entries()).map(function (entry) {
      return { DGUID: entry[0], from: originalLeaf(entry[0]), to: entry[1] };
    }).sort(function (left, right) {
      return left.DGUID.localeCompare(right.DGUID);
    });
    var proposal = {
      schema: "mcc-region-editor-proposal/v1",
      baseMembershipSha256: state.baseMembershipSha256,
      changes: changes
    };
    var submittedBy = elements.submittedBy.value.trim();
    var reason = elements.reason.value.trim();
    if (submittedBy) {
      proposal.submittedBy = submittedBy;
    }
    proposal.reason = reason;
    return proposal;
  }

  function validatedProposal() {
    if (!state.proposed.size) {
      setValidation("Choose at least one census cell.", "error");
      return null;
    }
    var seedTags = new Map();
    state.featureById.forEach(function (feature, dguid) {
      var seed = String(feature.properties.seed_tag || "");
      if (seed) seedTags.set(dguid, seed);
    });
    var hierarchy = (state.catalog && state.catalog.hierarchy) || {};
    var parents = new Set();
    Object.keys(hierarchy).forEach(function (tag) {
      var parent = hierarchy[tag] && hierarchy[tag].parent;
      if (parent) parents.add(String(parent));
    });
    var leafTags = new Set(Object.keys(hierarchy).filter(function (tag) { return !parents.has(tag); }));
    var result = validateProposal(localProposal(), {
      baseMembershipSha256: state.baseMembershipSha256,
      membership: allMembership,
      leafTags: leafTags,
      leafProvinces: leafProvinces,
      seedTags: seedTags
    });
    if (!result.ok) {
      setValidation(result.errors[0].message, "error");
      return null;
    }
    return result.canonical;
  }

  function downloadProposal(canonical) {
    var stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..*/, "Z");
    var blob = new Blob([JSON.stringify(canonical, null, 2) + "\n"], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "mcc-region-proposal-" + stamp + ".json";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function exportProposal() {
    var canonical = validatedProposal();
    if (!canonical) return;
    downloadProposal(canonical);
    setValidation("Proposal validated locally and downloaded. Submit it for review — it is not live until merged.", "success");
  }

  function submitProposal() {
    var canonical = validatedProposal();
    if (!canonical) return;
    var issue = buildRegionProposalIssue(canonical, { labelForTag: leafLabel });
    window.open(issue.url, "_blank", "noopener");
    if (issue.requiresAttachment) {
      downloadProposal(canonical);
      setValidation("Proposal validated and downloaded. GitHub will open; attach the JSON file before submitting.", "success");
    } else {
      setValidation("Proposal validated. Review the prefilled GitHub issue, then submit it for public review.", "success");
    }
  }

  async function initialise() {
    setStatus("Loading editor data…", "");
    try {
      state.catalog = await (await fetchOk("canada-regions.json")).json();
      await loadMembershipCsv();
      var manifest = null;
      try { manifest = await (await fetchOk("cells/manifest.json")).json(); } catch (_e) {}
      populateProvinceOptions(manifest);
      try {
        var partition = await (await fetchOk("canada-region-partition.geojson")).json();
        partitionLayer.clearLayers();
        partitionLayer.addData(partition);
      } catch (_e) {}
      await loadProvince(elements.province.value);
    } catch (error) {
      setStatus(error.message, "error");
    }
  }

  elements.province.addEventListener("change", function () {
    if (state.proposed.size && !window.confirm("Discard this unfinished proposal and load another area?")) {
      elements.province.value = state.province;
      return;
    }
    loadProvince(elements.province.value);
  });
  elements.target.addEventListener("change", function () {
    state.target = elements.target.value;
    elements.municipality.disabled = !state.selectedId || !state.target;
  });
  elements.panMode.addEventListener("click", function () { setMode("pan"); });
  elements.paintMode.addEventListener("click", function () { setMode("paint"); });
  elements.before.addEventListener("click", function () { setView("before"); });
  elements.after.addEventListener("click", function () { setView("after"); });
  elements.undo.addEventListener("click", undo);
  elements.redo.addEventListener("click", redo);
  elements.clear.addEventListener("click", clearChanges);
  elements.municipality.addEventListener("click", function () {
    if (!state.target) {
      setValidation("Choose a target region first.", "error");
      return;
    }
    applyTransaction(municipalityCells(), state.target);
  });
  elements.submit.addEventListener("click", submitProposal);
  elements.export.addEventListener("click", exportProposal);
  document.addEventListener("mouseup", endPaint);
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    }
  });

  initialise();
}());
