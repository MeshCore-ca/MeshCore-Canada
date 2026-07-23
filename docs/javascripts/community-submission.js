export const COMMUNITY_IDEA_SCHEMA = "mcc-community-idea/v1";
export const COMMUNITY_SUBMISSION_ENDPOINT =
  "https://api.meshcore.ca:21323/api/meshcore-canada/submissions";
export const COMMUNITY_ISSUE_ENDPOINT =
  "https://github.com/MeshCore-ca/MeshCore-Canada/issues/new";
export const COMMUNITY_SOURCE_PAGE = "https://meshcore.ca/submit-idea/";
export const COMMUNITY_FRENCH_SOURCE_PAGE = "https://meshcore.ca/fr/submit-idea/";
export const MAX_GITHUB_URL_LENGTH = 7000;

export const COMMUNITY_CATEGORIES = Object.freeze([
  "Newcomer or accessibility improvement",
  "Documentation correction",
  "Hardware or build-guide idea",
  "Regional community information",
  "Network tool or service idea",
  "Feature or project idea",
  "Other community feedback"
]);

export const MESHCORE_EXPERIENCE_LEVELS = Object.freeze([
  "Brand new / researching",
  "Setting up my first node",
  "Active mesh user",
  "Repeater, room server, or observer operator",
  "Developer or documentation contributor"
]);

function cleanText(value) {
  return String(value || "").replace(/\r\n?/g, "\n").trim();
}

function hasUnpairedSurrogate(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return true;
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      return true;
    }
  }
  return false;
}

function boundedText(value, maximum, label, required = false, multiline = false) {
  const cleaned = cleanText(value);
  if (required && !cleaned) throw new Error(`${label} is required.`);
  if (cleaned.length > maximum) throw new Error(`${label} is too long.`);
  if (/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/.test(cleaned) || (!multiline && cleaned.includes("\n")) || hasUnpairedSurrogate(cleaned)) {
    throw new Error(`${label} contains invalid text.`);
  }
  return cleaned;
}

export function buildCommunityIdea(data) {
  const category = boundedText(data.category, 80, "Contribution type", true);
  const experience = boundedText(data.experience, 80, "MeshCore experience", true);
  if (!COMMUNITY_CATEGORIES.includes(category)) {
    throw new Error("Choose a valid contribution type.");
  }
  if (!MESHCORE_EXPERIENCE_LEVELS.includes(experience)) {
    throw new Error("Choose a valid MeshCore experience level.");
  }
  if (data.publicAcknowledged !== true) {
    throw new Error("Confirm that this submission can be public.");
  }

  const proposal = {
    schema: COMMUNITY_IDEA_SCHEMA,
    category,
    experience,
    summary: boundedText(data.summary, 100, "Short title", true),
    need: boundedText(data.need, 2000, "What is difficult now", true, true),
    idea: boundedText(data.idea, 2000, "What would help", true, true),
    publicAcknowledged: true
  };
  const optional = {
    region: boundedText(data.region, 100, "City or broad region"),
    context: boundedText(data.context, 2000, "Additional context", false, true),
    followUp: boundedText(data.followUp, 120, "Public contact")
  };
  Object.entries(optional).forEach(([key, value]) => {
    if (value) proposal[key] = value;
  });
  return proposal;
}

function section(heading, value, fallback = "Not provided") {
  return `## ${heading}\n\n${value || fallback}`;
}

export function buildSubmissionText(proposal) {
  return [
    `# ${proposal.summary}`,
    section("Contribution type", proposal.category),
    section("MeshCore experience", proposal.experience),
    section("City or broad region", proposal.region),
    section("Problem", proposal.need),
    section("Suggested change", proposal.idea),
    section("Additional context", proposal.context),
    section(
      "Public contact",
      proposal.followUp,
      "Please reply in the submission thread."
    ),
    "---\n\n_Prepared on meshcore.ca._"
  ].join("\n\n");
}

const FRENCH_SUBMISSION_VALUES = Object.freeze({
  "Newcomer or accessibility improvement": "Amélioration pour les personnes qui débutent ou en matière d’accessibilité",
  "Documentation correction": "Correction de la documentation",
  "Hardware or build-guide idea": "Idée de matériel ou de guide de montage",
  "Regional community information": "Renseignements sur une communauté régionale",
  "Network tool or service idea": "Idée d’outil ou de service réseau",
  "Feature or project idea": "Idée de fonctionnalité ou de projet",
  "Other community feedback": "Autre commentaire de la communauté",
  "Brand new / researching": "Je découvre MeshCore ou je me renseigne",
  "Setting up my first node": "Je configure mon premier nœud",
  "Active mesh user": "J’utilise activement un réseau MeshCore",
  "Repeater, room server, or observer operator": "Je m’occupe d’un répéteur, d’un serveur de salon ou d’un observateur",
  "Developer or documentation contributor": "Je contribue au développement ou à la documentation"
});

export function buildFrenchSubmissionText(proposal) {
  const value = (text) => FRENCH_SUBMISSION_VALUES[text] || text;
  const frenchSection = (heading, text, fallback = "Non fourni") =>
    section(heading, value(text), fallback);
  return [
    `# ${proposal.summary}`,
    frenchSection("Type de contribution", proposal.category),
    frenchSection("Expérience avec MeshCore", proposal.experience),
    frenchSection("Ville ou grande région", proposal.region),
    frenchSection("Problème", proposal.need),
    frenchSection("Changement proposé", proposal.idea),
    frenchSection("Autres précisions", proposal.context),
    frenchSection(
      "Contact public",
      proposal.followUp,
      "Veuillez répondre dans le fil de soumission."
    ),
    "---\n\n_Préparé sur meshcore.ca._"
  ].join("\n\n");
}

export function buildManualGithubLink(
  proposal,
  sourcePage = COMMUNITY_SOURCE_PAGE,
) {
  if (![COMMUNITY_SOURCE_PAGE, COMMUNITY_FRENCH_SOURCE_PAGE].includes(sourcePage)) {
    throw new Error("Choose a valid source page.");
  }
  const params = new URLSearchParams({
    template: "community_idea.yml",
    title: `[Community idea] ${proposal.summary}`,
    category: proposal.category,
    experience: proposal.experience,
    summary: proposal.summary,
    region: proposal.region || "",
    need: proposal.need,
    idea: proposal.idea,
    context: proposal.context || "",
    follow_up: proposal.followUp || "",
    source_page: sourcePage
  });
  const url = `${COMMUNITY_ISSUE_ENDPOINT}?${params.toString()}`;
  if (url.length <= MAX_GITHUB_URL_LENGTH) {
    return Object.freeze({ url, fullyPrefilled: true });
  }
  const fallback = new URLSearchParams({
    template: "community_idea.yml",
    title: `[Community idea] ${proposal.summary}`,
    source_page: sourcePage
  });
  return Object.freeze({
    url: `${COMMUNITY_ISSUE_ENDPOINT}?${fallback.toString()}`,
    fullyPrefilled: false
  });
}
