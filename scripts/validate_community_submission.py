"""Fail when the website helper and GitHub community issue form drift apart."""

from html.parser import HTMLParser
from pathlib import Path

import yaml


ROOT = Path(__file__).resolve().parents[1]
HELPER_PATH = ROOT / "docs" / "submit-idea.md"
ISSUE_FORM_PATH = ROOT / ".github" / "ISSUE_TEMPLATE" / "community_idea.yml"
SOURCE_PAGE = "https://meshcore.ca/submit-idea/"


class CommunityFormParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.in_form = False
        self.form_attributes: dict[str, str | None] = {}
        self.controls: dict[str, dict[str, str | None]] = {}
        self.select_options: dict[str, list[str]] = {}
        self._select_name: str | None = None
        self._option_parts: list[str] | None = None

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        if tag == "form" and attributes.get("id") == "community-submission-form":
            self.in_form = True
            self.form_attributes = attributes
            return

        if not self.in_form:
            return

        if tag in {"input", "select", "textarea"} and attributes.get("name"):
            name = attributes["name"]
            assert name is not None
            self.controls[name] = attributes

        if tag == "select":
            self._select_name = attributes.get("name")
            if self._select_name:
                self.select_options[self._select_name] = []
        elif tag == "option" and self._select_name:
            self._option_parts = []

    def handle_data(self, data: str) -> None:
        if self._option_parts is not None:
            self._option_parts.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == "option" and self._option_parts is not None and self._select_name:
            value = "".join(self._option_parts).strip()
            if value:
                self.select_options[self._select_name].append(value)
            self._option_parts = None
        elif tag == "select":
            self._select_name = None
        elif tag == "form" and self.in_form:
            self.in_form = False


def is_issue_field_required(field: dict) -> bool:
    if field["type"] == "checkboxes":
        return any(option.get("required", False) for option in field["attributes"]["options"])
    return field.get("validations", {}).get("required", False)


def main() -> None:
    parser = CommunityFormParser()
    parser.feed(HELPER_PATH.read_text(encoding="utf-8"))

    assert parser.form_attributes, "Community submission form was not found"
    assert parser.form_attributes.get("method") == "get", "No-JavaScript fallback must use GET"
    assert parser.form_attributes.get("action") == (
        "https://github.com/MeshCore-ca/MeshCore-Canada/issues/new"
    ), "No-JavaScript fallback must open the repository issue form"
    assert parser.controls.get("template", {}).get("value") == (
        "community_idea.yml"
    ), "No-JavaScript fallback must select the community issue template"
    assert parser.controls.get("source_page", {}).get("value") == SOURCE_PAGE, (
        "No-JavaScript fallback must identify its source page"
    )

    issue_form = yaml.safe_load(ISSUE_FORM_PATH.read_text(encoding="utf-8"))
    issue_fields = {
        field["id"]: field for field in issue_form["body"] if field["type"] != "markdown"
    }
    assert issue_fields["source_page"]["attributes"].get("value") == SOURCE_PAGE, (
        "GitHub issue form must preserve the source-page backlink"
    )
    helper_fields = set(parser.controls) - {"template"}
    assert helper_fields == set(issue_fields), (
        "Helper fields do not match GitHub issue fields: "
        f"helper-only={sorted(helper_fields - set(issue_fields))}, "
        f"GitHub-only={sorted(set(issue_fields) - helper_fields)}"
    )

    for field_id, issue_field in issue_fields.items():
        helper_required = "required" in parser.controls[field_id]
        issue_required = is_issue_field_required(issue_field)
        assert helper_required == issue_required, (
            f"Required state differs for {field_id}: "
            f"helper={helper_required}, GitHub={issue_required}"
        )

        if issue_field["type"] == "dropdown":
            helper_options = parser.select_options[field_id][1:]
            issue_options = issue_field["attributes"]["options"]
            assert helper_options == issue_options, (
                f"Dropdown options differ for {field_id}: "
                f"helper={helper_options}, GitHub={issue_options}"
            )

    print(f"Community submission helper matches {len(issue_fields)} GitHub issue fields.")


if __name__ == "__main__":
    main()
