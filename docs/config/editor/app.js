import { validateProposal } from "./validate.js";
import {
  PROPOSAL_TYPE_BOUNDARY,
  PROPOSAL_TYPE_NEW_REGION,
  PROPOSAL_SCHEMA_V1,
  PROPOSAL_SCHEMA_V2,
  buildEditorProposal,
  hierarchyPath,
  isEditableTarget,
  schemaForProposalType
} from "./domain/proposal-types.js";
import {
  hasStaleDraft,
  loadDraft,
  removeDraft,
  saveDraft
} from "./infrastructure/draft-store.js";
import {
  configuredSubmissionEndpoint,
  fetchSubmissionConfig,
  loadTurnstile,
  renderTurnstile,
  submitRegionProposal
} from "./issue.js";

(function () {
  "use strict";

  var ASSETS = new URL("../../assets/regions/", window.location.href);

  function assetUrl(name) {
    return new URL(name, ASSETS).href;
  }

  async function fetchOk(name, options) {
    var response = await fetch(assetUrl(name), options || {});
    if (!response.ok) {
      throw new Error("Could not load editor data (" + name + ").");
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
  var provinceTags = {
    "10": "nl", "11": "pe", "12": "ns", "13": "nb", "24": "qc",
    "35": "on", "46": "mb", "47": "sk", "48": "ab", "59": "bc",
    "60": "yt", "61": "nt", "62": "nu"
  };

  var elements = {
    proposalTypes: Array.from(document.querySelectorAll('input[name="proposal-type"]')),
    areaPanel: document.getElementById("area-panel"),
    buildPanel: document.getElementById("build-panel"),
    province: document.getElementById("province-select"),
    target: document.getElementById("target-select"),
    existingTargetFields: document.querySelector("#existing-target-fields"),
    newRegionFields: document.getElementById("new-region-fields"),
    newRegionName: document.getElementById("new-region-name"),
    newRegionTag: document.getElementById("new-region-tag"),
    newRegionNameError: document.getElementById("new-region-name-error"),
    newRegionTagError: document.getElementById("new-region-tag-error"),
    tagSuggestionRow: document.getElementById("tag-suggestion-row"),
    tagSuggestion: document.getElementById("tag-suggestion"),
    useTagSuggestion: document.getElementById("use-tag-suggestion"),
    derivedParent: document.getElementById("derived-parent"),
    hierarchyPath: document.getElementById("hierarchy-path"),
    anchorControls: document.getElementById("anchor-controls"),
    anchorSelect: document.getElementById("anchor-select"),
    anchor: document.getElementById("anchor-button"),
    anchorStatus: document.getElementById("anchor-status"),
    sharedAreaNote: document.getElementById("shared-area-note"),
    loadStatus: document.getElementById("load-status"),
    draftStatus: document.getElementById("draft-status"),
    discardDraft: document.getElementById("discard-draft-button"),
    mapHeading: document.getElementById("map-heading"),
    panMode: document.getElementById("pan-mode"),
    inspectMode: document.getElementById("inspect-mode"),
    paintMode: document.getElementById("paint-mode"),
    paintAcknowledgement: document.getElementById("advanced-paint-ack"),
    cellDetails: document.getElementById("cell-details"),
    municipality: document.getElementById("municipality-button"),
    municipalitySelect: document.getElementById("municipality-select"),
    moveMunicipality: document.getElementById("move-municipality-button"),
    undo: document.getElementById("undo-button"),
    redo: document.getElementById("redo-button"),
    clear: document.getElementById("clear-button"),
    before: document.getElementById("before-view"),
    after: document.getElementById("after-view"),
    changeCount: document.getElementById("change-count"),
    textSummary: document.getElementById("text-summary"),
    changesTableBody: document.getElementById("changes-table-body"),
    changesTableNote: document.getElementById("changes-table-note"),
    readinessList: document.getElementById("readiness-list"),
    submittedBy: document.getElementById("submitted-by"),
    reason: document.getElementById("reason"),
    website: document.getElementById("website"),
    turnstileContainer: document.getElementById("turnstile-container"),
    antiSpamStatus: document.getElementById("anti-spam-status"),
    antiSpamRetry: document.getElementById("anti-spam-retry"),
    submissionResult: document.getElementById("submission-result"),
    validation: document.getElementById("validation-message"),
    submit: document.getElementById("submit-button"),
    export: document.getElementById("export-button"),
    discardDialog: document.getElementById("discard-dialog"),
    discardDialogTitle: document.getElementById("discard-dialog-title"),
    discardDialogMessage: document.getElementById("discard-dialog-message"),
    discardDialogContext: document.getElementById("discard-dialog-context"),
    discardDialogCancel: document.getElementById("discard-dialog-cancel"),
    discardDialogConfirm: document.getElementById("discard-dialog-confirm")
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
    proposalType: "",
    province: "",
    creatingNewRegion: false,
    newRegionAnchor: "",
    newRegionTagTouched: false,
    mode: "inspect",
    view: "after",
    painting: false,
    paintAction: null,
    loadController: null,
    submissionConfig: null,
    submissionInitialising: false,
    submitting: false,
    proposalRevision: 0,
    turnstile: null,
    turnstileWidgetId: null,
    turnstileToken: "",
    turnstileResetTimer: null,
    draftSaveTimer: null,
    draftStatusTimer: null,
    restoringDraft: false,
    dialogResolver: null,
    dialogPreviousFocus: null
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

  function setDraftStatus(message, kind) {
    elements.draftStatus.textContent = message;
    elements.draftStatus.className = "draft-status" + (kind ? " " + kind : "");
  }

  function draftStorage() {
    try {
      return window.localStorage;
    } catch (_error) {
      return null;
    }
  }

  function currentSchema() {
    return schemaForProposalType(state.proposalType);
  }

  function draftSnapshot() {
    var schema = currentSchema();
    var draft = {
      schema: schema,
      baseMembershipSha256: state.baseMembershipSha256,
      province: state.province,
      target: state.target,
      reason: elements.reason.value,
      changes: Array.from(state.proposed.entries()).map(function (entry) {
        return { DGUID: entry[0], to: entry[1] };
      }).sort(function (left, right) { return left.DGUID.localeCompare(right.DGUID); }),
      savedAt: Date.now()
    };
    if (schema === PROPOSAL_SCHEMA_V2) {
      draft.newRegion = {
        label: elements.newRegionName.value,
        tag: elements.newRegionTag.value,
        anchorDguid: state.newRegionAnchor
      };
    }
    return draft;
  }

  function draftHasContent() {
    return Boolean(
      state.proposed.size ||
      elements.reason.value.trim() ||
      state.target ||
      (state.creatingNewRegion && (elements.newRegionName.value.trim() || elements.newRegionTag.value.trim()))
    );
  }

  function flushDraftSave() {
    if (state.draftSaveTimer) {
      window.clearTimeout(state.draftSaveTimer);
      state.draftSaveTimer = null;
    }
    if (state.restoringDraft || !currentSchema() || !state.baseMembershipSha256 || !state.province) return;
    var storage = draftStorage();
    if (!storage) {
      setDraftStatus("Local draft storage is unavailable. Download before leaving.", "error");
      return;
    }
    if (!draftHasContent()) {
      removeDraft(storage, currentSchema(), state.baseMembershipSha256, state.province);
      elements.discardDraft.hidden = true;
      setDraftStatus("No saved draft.", "");
      return;
    }
    var result = saveDraft(storage, draftSnapshot());
    elements.discardDraft.hidden = !result.ok;
    setDraftStatus(result.ok ? "Saved locally." : "Draft could not be saved locally. Download before leaving.", result.ok ? "saved" : "error");
  }

  function scheduleDraftSave() {
    if (state.restoringDraft || !currentSchema()) return;
    setDraftStatus("Unsaved changes…", "");
    if (state.draftSaveTimer) window.clearTimeout(state.draftSaveTimer);
    state.draftSaveTimer = window.setTimeout(flushDraftSave, 250);
  }

  function setAntiSpamStatus(message, kind) {
    elements.antiSpamStatus.textContent = message;
    elements.antiSpamStatus.className = "anti-spam-status" + (kind ? " " + kind : "");
  }

  function clearSubmissionResult() {
    elements.submissionResult.replaceChildren();
  }

  function markProposalChanged() {
    state.proposalRevision += 1;
    clearSubmissionResult();
    scheduleDraftSave();
  }

  function showSubmissionResult(result, changedWhileSubmitting, submittedSchema) {
    var heading = document.createElement("strong");
    heading.textContent = changedWhileSubmitting
      ? "An earlier draft was submitted"
      : (result.duplicate ? "This proposal was already submitted" : "Public review created");
    var issueLine = document.createElement("p");
    var link = document.createElement("a");
    link.href = result.issueUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "GitHub issue #" + result.issueNumber;
    issueLine.append("Open ", link);
    var details = document.createElement("dl");
    [
      ["Schema", submittedSchema],
      ["Proposal hash", result.submissionSha256],
      ["Submitted version", String(state.proposalRevision)]
    ].forEach(function (entry) {
      var row = document.createElement("div");
      var term = document.createElement("dt");
      var value = document.createElement("dd");
      term.textContent = entry[0];
      value.textContent = entry[1];
      row.append(term, value);
      details.appendChild(row);
    });
    var next = document.createElement("p");
    next.textContent = "Next: community review, maintainer approval, then independent repository validation. Submission alone does not change the map.";
    elements.submissionResult.replaceChildren(heading, issueLine, details, next);
  }

  function leafLabel(tag) {
    if (state.creatingNewRegion && tag === state.target && elements.newRegionName.value.trim()) {
      return elements.newRegionName.value.trim();
    }
    var hierarchy = state.catalog && state.catalog.hierarchy;
    var entry = hierarchy && hierarchy[tag];
    return entry && entry.label ? entry.label : tag;
  }

  function normalizedRegionLabel(value) {
    return String(value || "").normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function regionTag(value) {
    return normalizedRegionLabel(value).replace(/ /g, "-").slice(0, 29);
  }

  function authorityNameAndTagIndex() {
    var catalog = state.catalog || {};
    var hierarchy = catalog.hierarchy || {};
    var tags = new Set(Object.keys(hierarchy));
    var names = new Set();
    function rememberName(value) {
      var normalized = normalizedRegionLabel(value);
      if (normalized) names.add(normalized);
      var possibleTag = String(value || "").trim().toLowerCase();
      if (/^[a-z0-9][a-z0-9-]{0,28}$/.test(possibleTag)) tags.add(possibleTag);
    }
    Object.keys(hierarchy).forEach(function (tag) { rememberName(hierarchy[tag] && hierarchy[tag].label); });
    var retired = catalog.retiredCanonicalTags || {};
    (Array.isArray(retired) ? retired : Object.keys(retired)).forEach(function (tag) { tags.add(String(tag)); });
    Object.values(catalog.aliases || {}).forEach(function (values) {
      (Array.isArray(values) ? values : []).forEach(rememberName);
    });
    Object.entries(catalog.searchGroups || {}).forEach(function (entry) {
      tags.add(String(entry[0]));
      rememberName(entry[1] && entry[1].label);
    });
    Object.values(catalog.externalRegionPaths || {}).forEach(function (entry) {
      (entry.path || []).forEach(function (tag) { tags.add(String(tag)); });
      rememberName(entry.label);
      Object.values(entry.tagLabels || {}).forEach(rememberName);
    });
    return { names: names, tags: tags };
  }

  function updateNewRegionFieldFeedback() {
    if (!state.creatingNewRegion) return { nameOk: true, tagOk: true };
    var name = elements.newRegionName.value.trim();
    var tag = elements.newRegionTag.value.trim();
    var index = authorityNameAndTagIndex();
    var normalizedName = normalizedRegionLabel(name);
    var nameMessage = "";
    var tagMessage = "";
    if (name && index.names.has(normalizedName)) {
      nameMessage = "That public region name is already used or reserved.";
    }
    if (tag && !/^[a-z0-9][a-z0-9-]{0,28}$/.test(tag)) {
      tagMessage = "Use lowercase letters, numbers and single hyphens; do not start with a hyphen.";
    } else if (tag && index.tags.has(tag)) {
      tagMessage = "That canonical tag is already used or reserved.";
    }
    elements.newRegionNameError.textContent = nameMessage;
    elements.newRegionNameError.className = "field-message" + (nameMessage ? " error" : "");
    elements.newRegionName.setAttribute("aria-invalid", String(Boolean(nameMessage)));
    elements.newRegionTagError.textContent = tagMessage;
    elements.newRegionTagError.className = "field-message" + (tagMessage ? " error" : "");
    elements.newRegionTag.setAttribute("aria-invalid", String(Boolean(tagMessage)));
    var suggestion = regionTag(name);
    elements.tagSuggestion.textContent = suggestion;
    elements.tagSuggestionRow.hidden = !suggestion || suggestion === tag;
    return {
      nameOk: Boolean(name) && !nameMessage,
      tagOk: Boolean(tag) && !tagMessage
    };
  }

  function newRegionParent() {
    var hierarchy = state.catalog && state.catalog.hierarchy || {};
    var sources = Array.from(new Set(Array.from(state.proposed.keys()).map(originalLeaf)));
    var chains = sources.map(function (tag) {
      var chain = [];
      var seen = new Set();
      var current = hierarchy[tag] && hierarchy[tag].parent;
      while (current && !seen.has(current) && hierarchy[current]) {
        chain.push(String(current));
        seen.add(current);
        current = hierarchy[current].parent;
      }
      return chain;
    }).filter(function (chain) { return chain.length; });
    if (!chains.length) return provinceTags[state.province] || "";
    return chains[0].find(function (candidate) {
      return candidate !== "can" && chains.every(function (chain) { return chain.includes(candidate); });
    }) || provinceTags[state.province] || "";
  }

  function parentChainLabels(parentTag) {
    var hierarchy = state.catalog && state.catalog.hierarchy || {};
    var labels = [];
    var seen = new Set();
    var current = parentTag;
    while (current && current !== "can" && !seen.has(current) && hierarchy[current]) {
      labels.unshift(hierarchy[current].label || current);
      seen.add(current);
      current = hierarchy[current].parent;
    }
    return labels;
  }

  function updateHierarchyUi() {
    if (!state.creatingNewRegion) return;
    var parent = newRegionParent();
    var parentLabel = leafLabel(parent) || parent || "Not derived yet";
    var label = elements.newRegionName.value.trim() || "Proposed region";
    elements.derivedParent.textContent = state.proposed.size
      ? "Derived parent: " + parentLabel + " (" + parent + ")"
      : "Add cells to derive the parent.";
    elements.hierarchyPath.textContent = hierarchyPath({
      jurisdictionLabel: provinceNames[state.province] || "Province or territory",
      parentLabels: parentChainLabels(parent),
      leafLabel: label
    }).join(" › ");
  }

  function updateAnchorUi() {
    var active = state.creatingNewRegion;
    elements.anchorControls.hidden = !active;
    if (!active) return;
    if (
      state.newRegionAnchor &&
      (!state.proposed.has(state.newRegionAnchor) || state.proposed.get(state.newRegionAnchor) !== state.target)
    ) {
      state.newRegionAnchor = "";
    }
    var priorChoice = elements.anchorSelect.value;
    var candidates = Array.from(state.proposed.keys()).filter(function (dguid) {
      var feature = state.featureById.get(dguid);
      return state.proposed.get(dguid) === state.target && feature && !feature.properties.seed_tag;
    }).sort(function (left, right) {
      var leftFeature = state.featureById.get(left);
      var rightFeature = state.featureById.get(right);
      var leftName = leftFeature.properties.CSDNAME || leftFeature.properties.CDNAME || left;
      var rightName = rightFeature.properties.CSDNAME || rightFeature.properties.CDNAME || right;
      return leftName.localeCompare(rightName) || left.localeCompare(right);
    });
    elements.anchorSelect.replaceChildren();
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = candidates.length ? "Choose a changed cell" : "Add cells before choosing an anchor";
    elements.anchorSelect.appendChild(blank);
    candidates.forEach(function (dguid) {
      var feature = state.featureById.get(dguid);
      var option = document.createElement("option");
      option.value = dguid;
      option.textContent = (feature.properties.CSDNAME || feature.properties.CDNAME || "Census area") + " — " + dguid;
      elements.anchorSelect.appendChild(option);
    });
    var suggested = candidates.includes(state.selectedId) ? state.selectedId : "";
    elements.anchorSelect.value = candidates.includes(priorChoice) ? priorChoice : suggested;
    elements.anchorSelect.disabled = candidates.length === 0;
    elements.anchor.disabled = !elements.anchorSelect.value || elements.anchorSelect.value === state.newRegionAnchor;
    if (state.newRegionAnchor) {
      var feature = state.featureById.get(state.newRegionAnchor);
      var name = feature && (feature.properties.CSDNAME || feature.properties.CDNAME);
      elements.anchorStatus.textContent = "Confirmed anchor: " + (name || "Census area") + " — " + state.newRegionAnchor;
    } else {
      elements.anchorStatus.textContent = "Choose a changed cell near the centre, then confirm it. No anchor is selected automatically.";
    }
    updateHierarchyUi();
  }

  function sharedRepeaterAreaForTag(tag) {
    var groups = state.catalog && state.catalog.searchGroups || {};
    var id = Object.keys(groups).find(function (candidate) {
      var group = groups[candidate];
      return group && group.repeaterConfig &&
        group.repeaterConfig.mode === "shared-member-paths" &&
        Array.isArray(group.members) &&
        group.members.indexOf(tag) !== -1;
    });
    if (!id) return null;
    return Object.assign({ id: id }, groups[id]);
  }

  function provinceLabelForLeaf(tag) {
    var provinces = leafProvinces.get(tag);
    if (!provinces || !provinces.size) return "";
    return Array.from(provinces).map(function (pruid) {
      return provinceNames[pruid] || pruid;
    }).join(" / ");
  }

  function updateSharedAreaNote() {
    if (!elements.sharedAreaNote) return;
    var selectedTag = state.selectedId ? effectiveLeaf(state.selectedId) : "";
    var areas = [selectedTag, state.target].filter(Boolean).map(sharedRepeaterAreaForTag).filter(Boolean);
    var area = areas[0] || null;
    var heading = elements.sharedAreaNote.querySelector("strong");
    var text = elements.sharedAreaNote.querySelector("span");
    if (!area) {
      heading.textContent = "Repeater paths";
      text.textContent = "This editor changes Canadian map cells only. Choose cross-province and U.S. paths in the configurator.";
      return;
    }
    heading.textContent = area.label;
    text.textContent = area.members.map(function (tag) {
      var province = provinceLabelForLeaf(tag);
      return (province ? province + ": " : "") + leafLabel(tag);
    }).join(" + ") + ". Edit each province separately; repeater setup keeps the paths together.";
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
      if (state.mode === "pan") return;
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
    updateAnchorUi();
    updateSharedAreaNote();
  }

  function setEffective(dguid, leaf) {
    var original = originalLeaf(dguid);
    if (!original) {
      return;
    }
    if (leaf === original) {
      state.proposed.delete(dguid);
      if (state.newRegionAnchor === dguid) state.newRegionAnchor = "";
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
    updateAnchorUi();
    markProposalChanged();
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
    markProposalChanged();
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
    markProposalChanged();
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
    markProposalChanged();
    state.undoStack.push(action);
    updateReview();
  }

  function clearChanges() {
    var changes = Array.from(state.proposed.keys()).map(function (dguid) {
      return { DGUID: dguid, before: effectiveLeaf(dguid), after: originalLeaf(dguid) };
    });
    commitAction(changes);
  }

  function changeRecords() {
    return Array.from(state.proposed.keys()).sort().map(function (dguid) {
      var feature = state.featureById.get(dguid);
      var properties = feature && feature.properties || {};
      return {
        DGUID: dguid,
        DAUID: properties.DAUID || dguid,
        CSDUID: properties.CSDUID || "",
        municipality: properties.CSDNAME || properties.CDNAME || "Unnamed census area",
        from: originalLeaf(dguid),
        to: state.proposed.get(dguid)
      };
    });
  }

  function updateChangesTable(records) {
    elements.changesTableBody.replaceChildren();
    if (!records.length) {
      var emptyRow = document.createElement("tr");
      var emptyCell = document.createElement("td");
      emptyCell.colSpan = 4;
      emptyCell.textContent = "No proposed changes.";
      emptyRow.appendChild(emptyCell);
      elements.changesTableBody.appendChild(emptyRow);
      elements.changesTableNote.textContent = "";
      return;
    }
    records.slice(0, 200).forEach(function (record) {
      var row = document.createElement("tr");
      var area = document.createElement("td");
      area.textContent = record.municipality + " — " + record.DAUID;
      var before = document.createElement("td");
      before.textContent = leafLabel(record.from) + " (" + record.from + ")";
      var after = document.createElement("td");
      after.textContent = leafLabel(record.to) + " (" + record.to + ")";
      var action = document.createElement("td");
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "table-action";
      remove.dataset.revertDguid = record.DGUID;
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", "Remove proposed change for " + record.municipality + " " + record.DAUID);
      action.appendChild(remove);
      row.append(area, before, after, action);
      elements.changesTableBody.appendChild(row);
    });
    elements.changesTableNote.textContent = records.length > 200
      ? "Showing 200 of " + records.length.toLocaleString() + " changes. The downloaded proposal contains all changes."
      : "";
  }

  function updateTextSummary(records) {
    var heading = document.createElement("h3");
    heading.textContent = "Proposal summary";
    if (!state.proposalType) {
      var empty = document.createElement("p");
      empty.textContent = "Choose a proposal type and geography to build a text review.";
      elements.textSummary.replaceChildren(heading, empty);
      return;
    }
    var csds = new Map();
    var sources = new Map();
    records.forEach(function (record) {
      var csdKey = record.CSDUID || record.DGUID;
      if (!csds.has(csdKey)) csds.set(csdKey, record.municipality);
      sources.set(record.from, (sources.get(record.from) || 0) + 1);
    });
    var parent = state.creatingNewRegion ? newRegionParent() : "";
    var path = state.creatingNewRegion ? hierarchyPath({
      jurisdictionLabel: provinceNames[state.province] || "Province or territory",
      parentLabels: parentChainLabels(parent),
      leafLabel: elements.newRegionName.value.trim() || "Proposed region"
    }).join(" › ") : "Canada › " + (provinceNames[state.province] || "Province or territory") + " › " + (leafLabel(state.target) || "Target region");
    var anchorFeature = state.featureById.get(state.newRegionAnchor);
    var anchorName = anchorFeature && (anchorFeature.properties.CSDNAME || anchorFeature.properties.CDNAME);
    var items = [
      ["Proposal type", state.creatingNewRegion ? "New region/subregion (v2)" : "Existing boundary adjustment (v1)"],
      ["Jurisdiction and hierarchy", path],
      ["Destination", (leafLabel(state.target) || "Not chosen") + (state.target ? " (" + state.target + ")" : "")],
      ["Official geography", records.length.toLocaleString() + " census cells across " + csds.size.toLocaleString() + " municipalities/CSDs"],
      ["Sources", Array.from(sources.entries()).map(function (entry) { return leafLabel(entry[0]) + " (" + entry[0] + "): " + entry[1]; }).join("; ") || "None yet"],
      ["Anchor", state.creatingNewRegion ? (state.newRegionAnchor ? (anchorName || "Census area") + " — " + state.newRegionAnchor + " (confirmed)" : "Not confirmed") : "Existing fixed anchors remain protected"],
      ["Authority base", state.baseMembershipSha256 ? state.baseMembershipSha256.slice(0, 16) + "…" : "Loading"],
      ["Validation", "Client checks run before export. The gateway and repository independently revalidate every authority rule."],
      ["Lifecycle", "Public review → maintainer approval → national validation → publication"]
    ];
    var list = document.createElement("dl");
    list.className = "details-list summary-list";
    items.forEach(function (item) {
      var row = document.createElement("div");
      var term = document.createElement("dt");
      var value = document.createElement("dd");
      term.textContent = item[0];
      value.textContent = item[1];
      row.append(term, value);
      list.appendChild(row);
    });
    elements.textSummary.replaceChildren(heading, list);
  }

  function setReadiness(name, ready, hidden) {
    var item = elements.readinessList.querySelector('[data-check="' + name + '"]');
    if (!item) return;
    item.classList.toggle("ready", ready);
    item.hidden = Boolean(hidden);
  }

  function updateReview(announce) {
    var count = state.proposed.size;
    elements.changeCount.textContent = count + (count === 1 ? " change" : " changes");
    elements.undo.disabled = state.undoStack.length === 0;
    elements.redo.disabled = state.redoStack.length === 0;
    elements.clear.disabled = count === 0;
    var fieldValidity = updateNewRegionFieldFeedback();
    var typeReady = Boolean(state.proposalType);
    var areaReady = typeReady && Boolean(state.province && state.membership.size);
    var targetReady = state.creatingNewRegion
      ? Boolean(state.target && fieldValidity.nameOk && fieldValidity.tagOk)
      : Boolean(state.target);
    var changesReady = count > 0;
    var anchorReady = !state.creatingNewRegion || Boolean(
      state.newRegionAnchor &&
      state.proposed.get(state.newRegionAnchor) === state.target
    );
    var reasonReady = Boolean(elements.reason.value.trim());
    var antiSpamReady = Boolean(state.submissionConfig && state.turnstileToken);
    setReadiness("type", typeReady);
    setReadiness("area", areaReady);
    setReadiness("target", targetReady);
    setReadiness("changes", changesReady);
    setReadiness("anchor", anchorReady, !state.creatingNewRegion);
    setReadiness("reason", reasonReady);
    setReadiness("anti-spam", antiSpamReady);
    var exportReady = typeReady && areaReady && targetReady && changesReady && anchorReady && reasonReady && Boolean(state.baseMembershipSha256);
    elements.submit.disabled = !exportReady || !antiSpamReady || state.submitting;
    elements.export.disabled = !exportReady;
    var records = changeRecords();
    updateAnchorUi();
    updateChangesTable(records);
    updateTextSummary(records);
    if (announce === false) {
      return;
    }
    if (count) {
      setValidation(exportReady ? "Client checks are ready." : "Complete the readiness checklist.", exportReady ? "success" : "");
    } else {
      setValidation("", "");
    }
  }

  function setMode(mode) {
    if (mode === "paint" && !elements.paintAcknowledgement.checked) return;
    state.mode = mode;
    elements.panMode.classList.toggle("active", mode === "pan");
    elements.inspectMode.classList.toggle("active", mode === "inspect");
    elements.paintMode.classList.toggle("active", mode === "paint");
    elements.panMode.setAttribute("aria-pressed", String(mode === "pan"));
    elements.inspectMode.setAttribute("aria-pressed", String(mode === "inspect"));
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
    elements.target.disabled = state.proposalType !== PROPOSAL_TYPE_BOUNDARY || tags.size === 0;
    if (tags.has(previous)) {
      elements.target.value = previous;
    } else {
      state.target = "";
    }
  }

  function populateMunicipalityOptions() {
    var municipalities = new Map();
    state.features.forEach(function (feature) {
      var properties = feature.properties || {};
      var id = String(properties.CSDUID || "");
      if (!id) return;
      if (!municipalities.has(id)) {
        municipalities.set(id, { name: properties.CSDNAME || properties.CDNAME || "Unnamed municipality", count: 0 });
      }
      municipalities.get(id).count += 1;
    });
    elements.municipalitySelect.replaceChildren();
    var blank = document.createElement("option");
    blank.value = "";
    blank.textContent = "Choose a municipality";
    elements.municipalitySelect.appendChild(blank);
    Array.from(municipalities.entries()).sort(function (left, right) {
      return left[1].name.localeCompare(right[1].name) || left[0].localeCompare(right[0]);
    }).forEach(function (entry) {
      var option = document.createElement("option");
      option.value = entry[0];
      option.textContent = entry[1].name + " — " + entry[1].count + (entry[1].count === 1 ? " cell" : " cells");
      elements.municipalitySelect.appendChild(option);
    });
    elements.municipalitySelect.disabled = !state.proposalType || municipalities.size === 0;
    elements.moveMunicipality.disabled = true;
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

  function resetEdits(silent) {
    if (!silent) markProposalChanged();
    state.proposed.clear();
    state.undoStack = [];
    state.redoStack = [];
    state.selectedId = "";
    state.newRegionAnchor = "";
    state.painting = false;
    state.paintAction = null;
    updateAnchorUi();
    updateReview();
    var rows = elements.cellDetails.querySelectorAll("dd");
    rows[0].textContent = "Select a cell on the map";
    rows[1].textContent = "—";
    rows[2].textContent = "—";
    rows[3].textContent = "—";
    elements.municipality.disabled = true;
    updateSharedAreaNote();
  }

  function restoreCurrentDraft() {
    var schema = currentSchema();
    if (!schema) {
      state.restoringDraft = false;
      setDraftStatus("Choose a proposal type to begin.", "");
      return false;
    }
    var storage = draftStorage();
    var draft = loadDraft(storage, schema, state.baseMembershipSha256, state.province);
    if (!draft) {
      var stale = hasStaleDraft(storage, schema, state.baseMembershipSha256, state.province);
      state.restoringDraft = false;
      elements.discardDraft.hidden = true;
      setDraftStatus(
        stale
          ? "A draft from older map data remains stored but was not restored."
          : "No saved draft.",
        stale ? "error" : ""
      );
      updateReview(false);
      return false;
    }
    state.proposed.clear();
    draft.changes.forEach(function (change) {
      if (state.membership.has(change.DGUID)) state.proposed.set(change.DGUID, change.to);
    });
    state.undoStack = [];
    state.redoStack = [];
    state.selectedId = "";
    state.target = draft.target;
    elements.reason.value = draft.reason;
    if (schema === PROPOSAL_SCHEMA_V2) {
      elements.newRegionName.value = draft.newRegion && draft.newRegion.label || "";
      elements.newRegionTag.value = draft.newRegion && draft.newRegion.tag || "";
      state.target = elements.newRegionTag.value;
      state.newRegionAnchor = draft.newRegion && draft.newRegion.anchorDguid || "";
      state.newRegionTagTouched = Boolean(elements.newRegionTag.value);
    } else {
      elements.target.value = state.target;
      state.newRegionAnchor = "";
    }
    state.restoringDraft = false;
    refreshAllStyles();
    updateReview(false);
    elements.discardDraft.hidden = false;
    setDraftStatus(
      "Draft restored from " + new Date(draft.savedAt).toLocaleString() + ". Contributor identity was not stored.",
      "saved"
    );
    return true;
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
    state.restoringDraft = true;
    state.target = "";
    state.newRegionAnchor = "";
    state.newRegionTagTouched = false;
    elements.newRegionName.value = "";
    elements.newRegionTag.value = "";
    elements.reason.value = "";
    resetEdits(true);
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
      populateMunicipalityOptions();
      restoreCurrentDraft();
      elements.mapHeading.textContent = provinceNames[pruid];
      if (cellLayer.getBounds().isValid()) {
        map.fitBounds(cellLayer.getBounds(), { padding: [18, 18] });
      }
      partitionLayer.bringToBack();
      setStatus(
        state.features.length.toLocaleString() + " census cells loaded.",
        "success"
      );
    } catch (error) {
      if (error.name === "AbortError") {
        state.restoringDraft = false;
        return;
      }
      state.membership.clear();
      state.features = [];
      state.featureById.clear();
      state.layerById.clear();
      cellLayer.clearLayers();
      state.restoringDraft = false;
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

  function municipalityCellsById(csduid) {
    return state.features.filter(function (feature) {
      return String(feature.properties.CSDUID || "") === String(csduid || "");
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
    return buildEditorProposal({
      schema: currentSchema(),
      baseMembershipSha256: state.baseMembershipSha256,
      changes: changes,
      newRegion: {
        tag: state.target,
        label: elements.newRegionName.value.trim(),
        parent: newRegionParent(),
        anchorDguid: state.newRegionAnchor
      },
      submittedBy: elements.submittedBy.value,
      reason: elements.reason.value
    });
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
    var retired = state.catalog.retiredCanonicalTags || {};
    var reservedTags = new Set((Array.isArray(retired) ? retired : Object.keys(retired)).map(String));
    var regionLabels = new Set();
    function rememberAuthorityName(value) {
      var name = String(value || "").trim();
      var normalized = normalizedRegionLabel(name);
      if (normalized) regionLabels.add(normalized);
      var possibleTag = name.toLowerCase();
      if (/^[a-z0-9][a-z0-9-]{0,28}$/.test(possibleTag)) reservedTags.add(possibleTag);
    }
    Object.keys(hierarchy).forEach(function (tag) {
      rememberAuthorityName(hierarchy[tag] && hierarchy[tag].label);
    });
    Object.values(state.catalog.aliases || {}).forEach(function (names) {
      (Array.isArray(names) ? names : []).forEach(rememberAuthorityName);
    });
    Object.entries(state.catalog.searchGroups || {}).forEach(function (entry) {
      rememberAuthorityName(entry[0]);
      rememberAuthorityName(entry[1] && entry[1].label);
    });
    Object.values(state.catalog.externalRegionPaths || {}).forEach(function (entry) {
      (entry.path || []).forEach(function (tag) { reservedTags.add(String(tag)); });
      rememberAuthorityName(entry.label);
      Object.values(entry.tagLabels || {}).forEach(rememberAuthorityName);
    });
    var result = validateProposal(localProposal(), {
      baseMembershipSha256: state.baseMembershipSha256,
      membership: allMembership,
      leafTags: leafTags,
      leafProvinces: leafProvinces,
      seedTags: seedTags,
      hierarchyTags: new Set(Object.keys(hierarchy)),
      hierarchyParents: new Map(Object.keys(hierarchy).map(function (tag) {
        return [tag, hierarchy[tag] && hierarchy[tag].parent ? String(hierarchy[tag].parent) : null];
      })),
      reservedTags: reservedTags,
      regionLabels: regionLabels,
      jurisdictionTag: provinceTags[state.province] || ""
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
    setValidation("Proposal downloaded. It is not live until merged.", "success");
  }

  function resetTurnstile(message) {
    state.turnstileToken = "";
    if (state.turnstileResetTimer) {
      window.clearTimeout(state.turnstileResetTimer);
      state.turnstileResetTimer = null;
    }
    if (state.turnstile && state.turnstileWidgetId !== null) {
      try {
        setAntiSpamStatus(message || "Retrying check…", "");
        state.turnstile.reset(state.turnstileWidgetId);
      } catch (_error) {
        if (typeof state.turnstile.remove === "function") {
          try { state.turnstile.remove(state.turnstileWidgetId); } catch (_removeError) {}
        }
        state.turnstileWidgetId = null;
        elements.turnstileContainer.replaceChildren();
        setAntiSpamStatus("Check failed. Retry.", "error");
        elements.antiSpamRetry.hidden = false;
      }
    }
    updateReview(false);
  }

  function scheduleTurnstileReset(message, delay) {
    state.turnstileToken = "";
    updateReview(false);
    if (state.turnstileResetTimer) window.clearTimeout(state.turnstileResetTimer);
    state.turnstileResetTimer = window.setTimeout(function () {
      resetTurnstile(message);
    }, delay);
  }

  function turnstileCallbacks() {
    return {
      onToken: function (token) {
        state.turnstileToken = String(token || "");
        setAntiSpamStatus("Check complete.", "success");
        elements.antiSpamRetry.hidden = true;
        updateReview(false);
      },
      onError: function () {
        setAntiSpamStatus("Check failed. Retrying…", "error");
        scheduleTurnstileReset("Retrying check…", 1000);
      },
      onExpired: function () {
        setAntiSpamStatus("Check expired. Retrying…", "");
        scheduleTurnstileReset("Retrying check…", 250);
      },
      onTimeout: function () {
        setAntiSpamStatus("Check timed out. Retrying…", "error");
        scheduleTurnstileReset("Retrying check…", 1000);
      }
    };
  }

  async function initialiseSubmission() {
    if (state.submissionInitialising) return;
    state.submissionInitialising = true;
    elements.antiSpamRetry.hidden = true;
    setAntiSpamStatus("Loading check…", "");
    try {
      var endpoint = configuredSubmissionEndpoint(document);
      var config = await fetchSubmissionConfig({ endpoint: endpoint });
      var turnstile = await loadTurnstile();
      state.submissionConfig = config;
      state.turnstile = turnstile;
      if (state.turnstileWidgetId === null) {
        setAntiSpamStatus("Complete the check.", "");
        state.turnstileWidgetId = renderTurnstile(
          turnstile,
          elements.turnstileContainer,
          config,
          turnstileCallbacks()
        );
      } else {
        resetTurnstile("Retrying check…");
      }
    } catch (error) {
      state.submissionConfig = null;
      state.turnstileToken = "";
      setAntiSpamStatus(error.message || "Anti-spam protection is unavailable.", "error");
      elements.antiSpamRetry.hidden = false;
    } finally {
      state.submissionInitialising = false;
      updateReview(false);
    }
  }

  async function submitProposal() {
    flushDraftSave();
    var canonical = validatedProposal();
    if (!canonical) return;
    if (!state.submissionConfig || !state.turnstileToken || state.submitting) {
      setValidation("Complete the check first.", "error");
      return;
    }
    var token = state.turnstileToken;
    var submittedRevision = state.proposalRevision;
    state.turnstileToken = "";
    state.submitting = true;
    elements.submit.textContent = "Submitting…";
    elements.submit.setAttribute("aria-busy", "true");
    clearSubmissionResult();
    updateReview(false);
    setValidation("Submitting…", "");
    try {
      var result = await submitRegionProposal({
        endpoint: state.submissionConfig.endpoint,
        proposal: canonical,
        turnstileToken: token,
        website: elements.website.value
      });
      var changedWhileSubmitting = state.proposalRevision !== submittedRevision;
      showSubmissionResult(result, changedWhileSubmitting, canonical.schema);
      setValidation(
        changedWhileSubmitting
          ? "Submitted, but later edits were not included. Submit again to include them."
          : result.duplicate
          ? "Already submitted. Open the issue below."
          : "Submitted for review.",
        "success"
      );
    } catch (error) {
      var nextStep = error.code === "stale_base"
        ? " Reload and try again."
        : (error.retryable
          ? " Your edits are saved here. Complete the check and try again."
          : " Download the proposal to share it.");
      setValidation(
        (error.message || "The proposal could not be submitted.") + nextStep,
        "error"
      );
    } finally {
      state.submitting = false;
      elements.submit.textContent = "Submit for review";
      elements.submit.removeAttribute("aria-busy");
      resetTurnstile("Preparing another check…");
      updateReview(false);
    }
  }

  function closeDecisionDialog(confirmed) {
    if (!state.dialogResolver) return;
    var resolve = state.dialogResolver;
    var priorFocus = state.dialogPreviousFocus;
    state.dialogResolver = null;
    state.dialogPreviousFocus = null;
    elements.discardDialog.hidden = true;
    resolve(Boolean(confirmed));
    if (priorFocus && typeof priorFocus.focus === "function") priorFocus.focus();
  }

  function decisionDialog(options) {
    if (state.dialogResolver) return Promise.resolve(false);
    state.dialogPreviousFocus = document.activeElement;
    elements.discardDialogTitle.textContent = options.title;
    elements.discardDialogMessage.textContent = options.message;
    elements.discardDialogContext.textContent = options.context;
    elements.discardDialogConfirm.textContent = options.confirmLabel;
    elements.discardDialog.hidden = false;
    window.setTimeout(function () { elements.discardDialogCancel.focus(); }, 0);
    return new Promise(function (resolve) { state.dialogResolver = resolve; });
  }

  function draftContext() {
    return (currentSchema() || "No schema") + " · " +
      (provinceNames[state.province] || "No province selected") + " · " +
      state.proposed.size + (state.proposed.size === 1 ? " changed cell" : " changed cells");
  }

  function setProposalType(type, restore) {
    state.proposalType = type;
    state.creatingNewRegion = type === PROPOSAL_TYPE_NEW_REGION;
    elements.proposalTypes.forEach(function (input) { input.checked = input.value === type; });
    elements.areaPanel.setAttribute("aria-disabled", "false");
    elements.buildPanel.setAttribute("aria-disabled", "false");
    elements.province.disabled = false;
    elements.existingTargetFields.hidden = state.creatingNewRegion;
    elements.newRegionFields.hidden = !state.creatingNewRegion;
    elements.anchorControls.hidden = !state.creatingNewRegion;
    if (state.creatingNewRegion) {
      state.target = elements.newRegionTag.value.trim();
      elements.target.disabled = true;
    } else {
      state.newRegionAnchor = "";
      populateTargets();
      state.target = elements.target.value;
    }
    populateMunicipalityOptions();
    if (restore !== false) restoreCurrentDraft();
    updateAnchorUi();
    updateSharedAreaNote();
    updateReview(false);
  }

  async function changeProposalType(nextType) {
    var previousType = state.proposalType;
    if (nextType === previousType) return;
    flushDraftSave();
    if (previousType && draftHasContent()) {
      var proceed = await decisionDialog({
        title: "Switch proposal type?",
        message: "The current on-screen draft will be put away. Its local saved copy will remain under the current schema.",
        context: draftContext(),
        confirmLabel: "Switch type"
      });
      if (!proceed) {
        elements.proposalTypes.forEach(function (input) { input.checked = input.value === previousType; });
        return;
      }
    }
    state.restoringDraft = true;
    resetEdits(true);
    elements.reason.value = "";
    elements.newRegionName.value = "";
    elements.newRegionTag.value = "";
    state.target = "";
    state.newRegionAnchor = "";
    state.restoringDraft = false;
    setProposalType(nextType, true);
  }

  async function changeProvince(nextProvince) {
    if (nextProvince === state.province) return;
    flushDraftSave();
    if (draftHasContent()) {
      var proceed = await decisionDialog({
        title: "Switch province or territory?",
        message: "The current on-screen draft will be put away. Its local saved copy will remain under this province and schema.",
        context: draftContext(),
        confirmLabel: "Switch area"
      });
      if (!proceed) {
        elements.province.value = state.province;
        return;
      }
    }
    await loadProvince(nextProvince);
  }

  async function initialise() {
    setStatus("Loading editor…", "");
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

  elements.proposalTypes.forEach(function (input) {
    input.addEventListener("change", function () {
      if (input.checked) changeProposalType(input.value);
    });
  });
  elements.province.addEventListener("change", function () {
    changeProvince(elements.province.value);
  });
  elements.target.addEventListener("change", function () {
    state.target = elements.target.value;
    markProposalChanged();
    elements.municipality.disabled = !state.selectedId || !state.target;
    elements.moveMunicipality.disabled = !elements.municipalitySelect.value || !state.target;
    updateAnchorUi();
    updateSharedAreaNote();
    updateReview(false);
  });
  elements.newRegionName.addEventListener("input", function () {
    markProposalChanged();
    refreshAllStyles();
    updateReview(false);
  });
  elements.newRegionTag.addEventListener("input", function () {
    state.newRegionTagTouched = true;
    var prior = state.target;
    var next = elements.newRegionTag.value.trim();
    state.target = next;
    if (prior !== next) {
      state.proposed.forEach(function (tag, dguid) {
        if (tag === prior) state.proposed.set(dguid, next);
      });
      refreshAllStyles();
    }
    markProposalChanged();
    elements.municipality.disabled = !state.selectedId || !state.target;
    elements.moveMunicipality.disabled = !elements.municipalitySelect.value || !state.target;
    updateReview(false);
  });
  elements.useTagSuggestion.addEventListener("click", function () {
    var suggestion = elements.tagSuggestion.textContent;
    if (!suggestion) return;
    var prior = state.target;
    elements.newRegionTag.value = suggestion;
    state.newRegionTagTouched = true;
    state.target = suggestion;
    state.proposed.forEach(function (tag, dguid) {
      if (tag === prior) state.proposed.set(dguid, suggestion);
    });
    markProposalChanged();
    refreshAllStyles();
    updateReview(false);
    elements.newRegionTag.focus();
  });
  elements.anchorSelect.addEventListener("change", function () {
    elements.anchor.disabled = !elements.anchorSelect.value || elements.anchorSelect.value === state.newRegionAnchor;
  });
  elements.anchor.addEventListener("click", function () {
    if (elements.anchor.disabled) return;
    state.newRegionAnchor = elements.anchorSelect.value;
    markProposalChanged();
    updateAnchorUi();
    updateReview(false);
  });
  elements.panMode.addEventListener("click", function () { setMode("pan"); });
  elements.inspectMode.addEventListener("click", function () { setMode("inspect"); });
  elements.paintMode.addEventListener("click", function () { setMode("paint"); });
  elements.paintAcknowledgement.addEventListener("change", function () {
    elements.paintMode.disabled = !elements.paintAcknowledgement.checked;
    if (!elements.paintAcknowledgement.checked && state.mode === "paint") setMode("inspect");
  });
  elements.before.addEventListener("click", function () { setView("before"); });
  elements.after.addEventListener("click", function () { setView("after"); });
  elements.undo.addEventListener("click", undo);
  elements.redo.addEventListener("click", redo);
  elements.clear.addEventListener("click", clearChanges);
  elements.municipalitySelect.addEventListener("change", function () {
    elements.moveMunicipality.disabled = !elements.municipalitySelect.value || !state.target;
  });
  elements.moveMunicipality.addEventListener("click", function () {
    if (!state.target) {
      setValidation("Choose or define the destination region first.", "error");
      return;
    }
    applyTransaction(municipalityCellsById(elements.municipalitySelect.value), state.target);
  });
  elements.municipality.addEventListener("click", function () {
    if (!state.target) {
      setValidation("Choose or define the destination region first.", "error");
      return;
    }
    applyTransaction(municipalityCells(), state.target);
  });
  elements.changesTableBody.addEventListener("click", function (event) {
    var button = event.target.closest("[data-revert-dguid]");
    if (!button) return;
    var dguid = button.dataset.revertDguid;
    commitAction(buildAction([dguid], originalLeaf(dguid)));
  });
  elements.submit.addEventListener("click", submitProposal);
  elements.export.addEventListener("click", exportProposal);
  elements.antiSpamRetry.addEventListener("click", initialiseSubmission);
  elements.submittedBy.addEventListener("input", function () {
    markProposalChanged();
    updateReview(false);
  });
  elements.reason.addEventListener("input", function () {
    markProposalChanged();
    updateReview(false);
  });
  elements.discardDialogCancel.addEventListener("click", function () { closeDecisionDialog(false); });
  elements.discardDialogConfirm.addEventListener("click", function () { closeDecisionDialog(true); });
  elements.discardDialog.addEventListener("click", function (event) {
    if (event.target === elements.discardDialog) closeDecisionDialog(false);
  });
  elements.discardDraft.addEventListener("click", async function () {
    var proceed = await decisionDialog({
      title: "Discard the saved copy?",
      message: "This removes the local saved copy for this schema and province. The current on-screen proposal stays open until it changes or you leave.",
      context: draftContext(),
      confirmLabel: "Discard saved copy"
    });
    if (!proceed) return;
    removeDraft(draftStorage(), currentSchema(), state.baseMembershipSha256, state.province);
    elements.discardDraft.hidden = true;
    setDraftStatus("Saved copy discarded. Current on-screen work is unchanged.", "");
  });
  document.addEventListener("mouseup", endPaint);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && state.dialogResolver) {
      event.preventDefault();
      closeDecisionDialog(false);
      return;
    }
    if (!(event.ctrlKey || event.metaKey) || isEditableTarget(event.target)) return;
    var key = event.key.toLowerCase();
    if (key !== "z" && key !== "y") return;
    event.preventDefault();
    if (key === "y" || event.shiftKey) redo(); else undo();
  });
  window.addEventListener("beforeunload", flushDraftSave);

  initialise();
  initialiseSubmission();
}());
