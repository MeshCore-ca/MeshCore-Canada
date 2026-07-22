# Route migration registry

The overhaul preserves every useful public URL. The initial implementation
changes navigation and canonical journeys before moving source files.

| Current route | Target role | Initial action |
|---|---|---|
| `/` | Task-first national homepage | Rebuild in place |
| `/resources/getting-started/` | Canonical Start | Preserve and redirect to `/start/` after migration |
| `/meshcore/general-overview/` | What is MeshCore | Repurpose; onboarding moves to `/start/` |
| `/meshcore/general-meshcore-roles/` | Role comparison | Preserve; canonical alias under `/learn/roles/` later |
| `/meshcore/general-faq/` | Searchable FAQ | Preserve; canonical alias under `/learn/faq/` later |
| `/meshcore/general-howto/` | Task index | Preserve; split child tasks later |
| `/provinces/` | Community finder | Preserve while canonical `/communities/` is introduced |
| `/provinces/british-columbia/` | Generated BC directory | Preserve |
| `/provinces/alberta/` | Generated Alberta directory | Preserve |
| `/provinces/saskatchewan/` | Generated Saskatchewan directory | Preserve |
| `/provinces/manitoba/` | Generated Manitoba directory | Preserve |
| `/provinces/ontario/` | Generated Ontario directory | Preserve |
| `/provinces/quebec/` | Generated Quebec directory | Preserve |
| `/provinces/new-brunswick/` | Generated New Brunswick directory | Preserve |
| `/provinces/nova-scotia/` | Generated Nova Scotia directory | Preserve |
| `/provinces/prince-edward-island/` | Generated PEI directory | Preserve |
| `/provinces/newfoundland-and-labrador/` | Generated NL directory | Preserve |
| `/provinces/territories/` | Generated territories directory | Preserve |
| `/hardware/overview/` | Devices and builds chooser | Preserve; canonical hub later |
| `/hardware/recommended-companions/` | Companion recommendations | Preserve |
| `/hardware/recommended-repeaters/` | Repeater recommendations | Preserve |
| `/hardware/recommended-antenna/` | Antenna recommendations | Preserve |
| `/hardware/repeater-solar-300mw-diy-build/` | 300 mW build | Preserve |
| `/hardware/repeater-solar-1w-diy-build/` | 1 W build | Preserve |
| `/hardware/repeater-mounting-options/` | Mounting guide | Preserve after repair |
| `/hardware/repeater-solar-batteries/` | Power guide | Remove from nav until reviewed; URL retained |
| `/hardware/wire-connector-types/` | Connector reference | Remove from nav until reviewed; URL retained |
| `/meshcore/flash-companion/` | Companion flash journey | Preserve and rebuild safely |
| `/meshcore/flash-repeater/` | Repeater flash journey | Preserve and rebuild safely |
| `/meshcore/flash-room-server/` | Room server journey | Preserve and rebuild safely |
| `/meshcore/update-repeater-ota/` | Advanced OTA flow | Preserve and rebuild safely |
| `/meshcore/generate-repeater-id/` | Legacy exception | Preserve with legacy status |
| `/meshcore/firmware-rak-custom-display/` | Unverified archive | Remove from nav; URL retained with warning |
| `/meshcore/firmware-heltec-v3-wifi/` | Experimental archive | Remove from beginner nav; URL retained |
| `/analyzer/intro/` | Observer method chooser | Preserve and rebuild |
| `/analyzer/data-collection-access/` | Data/privacy policy | Preserve |
| `/analyzer/verify/` | Observer verification | Preserve |
| `/analyzer/troubleshooting/` | Symptom-first troubleshooting | Preserve and rebuild |
| `/analyzer/broker-reference/` | Advanced broker reference | Preserve |
| `/analyzer/iata-codes/` | Searchable location codes | Preserve and generate later |
| `/analyzer/remoteterm/` | RemoteTerm method | Preserve |
| `/analyzer/builds/mctomqtt/` | MCtoMQTT method | Preserve and rebuild trust flow |
| `/analyzer/builds/meshcore-ha/` | Home Assistant method | Preserve |
| `/analyzer/builds/mqtt-firmware/` | Standalone observer method | Preserve; extract secure builder |
| `/analyzer/builds/pymc/` | PyMC method | Preserve |
| `/config/` | Repeater configurator | Preserve exact route and domain outputs |
| `/config/map/` | Region Explore/Audit tool | Preserve exact route |
| `/config/standard/` | Regional explainer/operator/standard | Preserve exact route |
| `/config/editor/` | No-index proposal editor | Preserve exact route and authority |
| `/submit-idea/` | Anonymous Share an Idea | Preserve exact route |
| `/contributing/` | Contribute hub | Rebuild in place |
| `/resources/glossary/` | Glossary | Preserve; canonical alias later |
| `/resources/links/` | Curated external resources | Preserve and rebuild |
| `/assets/regions/vendor/` | Technical asset path | Exclude from nav, search, and sitemap |

## Canonical route state

This branch implements two new task hubs:

- `/start/`
- `/tools/`

Existing public routes remain the canonical destinations for communities,
hardware, builds, learning, contributing, and privacy. The planned aliases
`/communities/`, `/devices/`, `/builds/`, `/learn/`, `/contribute/`, and
`/policies/privacy/` are **not implemented** and must not be advertised as live.

A future alias becomes canonical only after its page or redirect exists, old
bookmarks have an automated route test, and both the production root and the
Canadaverse subpath build pass the link and browser gates.

## Staging base path

The Pi 5 build is produced with a staging site URL rooted at:

`https://canadaverse.org/meshcore-canada/`

Absolute MeshCore Canada paths must not escape that base during staging.
Production builds continue to use `https://meshcore.ca/`.
