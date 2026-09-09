import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = path => readFileSync(path, "utf8");
const announcement = "https://github.com/meshcore-dev/MeshCore/issues/3302#issuecomment-5598886579";
// Liam Cottle's September 9 announcement: Canada sets path_hash_size=3;
// USA retains the same RF tuple and does not set a path hash size.
const radio = { frequency_mhz: 910.525, bandwidth_khz: 62.5, spreading_factor: 7, coding_rate: 5 };

test("Canada's named preset matches the announced RF values and CLI byte mapping", () => {
  const directory = JSON.parse(read("data/communities.json"));
  const observer = JSON.parse(read("docs/analyzer/observer-config.json"));
  const profiles = JSON.parse(read("docs/assets/radio-profiles.json"));
  assert.equal(directory.national_defaults.radio_preset, "Canada");
  assert.deepEqual(directory.national_defaults.raw_radio, radio);
  assert.equal(directory.national_defaults.path_hash_mode, "3-byte");
  assert.equal(directory.national_defaults.cli_path_setting, "set path.hash.mode 2");
  assert.equal(observer.network.preset, "Canada");
  for (const [key, value] of Object.entries(radio)) assert.equal(observer.network[key], value);
  assert.equal(observer.network.path_hash_bytes, 3);
  assert.equal(observer.network.path_hash_mode, 2, "3-byte paths use CLI mode 2, not mode 3");
  assert.deepEqual(profiles.find(profile => profile.id === "canada").radio, radio);
  assert.equal(profiles.find(profile => profile.id === "bc-mesh").radio.frequency_mhz, 910.425);
});

for (const suffix of [".md", ".fr.md"]) {
  test(`${suffix} onboarding and observer pages name Canada and link the older-app fallback`, () => {
    const paths = [
      ...["companion", "repeater", "room-server", "observer"].map(role => `docs/start/${role}${suffix}`),
      ...["companion", "repeater", "room-server"].map(role => `docs/meshcore/flash-${role}${suffix}`),
      `docs/analyzer/intro${suffix}`, `docs/analyzer/builds/mqtt-firmware${suffix}`,
    ];
    for (const path of paths) {
      const source = read(path);
      assert.ok(source.includes("**Canada**"), path);
      assert.ok(source.includes("provinces/index.md#canada-baseline"), path);
      assert.ok(!source.includes("**USA/Canada (Recommended)**"), `${path}: old name must not remain the primary instruction`);
    }
  });

  test(`${suffix} preset reference explains the USA distinction and legacy compatibility`, () => {
    const directory = read(`docs/provinces/index${suffix}`);
    const home = read(`docs/index${suffix}`);
    const faq = read(`docs/meshcore/general-faq${suffix}`);
    for (const source of [directory, home, faq]) {
      assert.ok(source.includes(announcement), "The completed change needs its exact upstream source");
      assert.match(source, /USA/);
    }
    assert.match(directory, /\| (?:Radio preset|Préréglage radio) \| `Canada` \|/);
    assert.match(directory, /USA\/Canada \(Recommended\)/);
    assert.match(directory, /1\.14/);
    assert.match(directory, /3-byte|3 octets/);
    assert.match(home, /\| (?:Radio preset|Préréglage radio) \| \*\*Canada\*\* \|/);
    assert.doesNotMatch(home, /Planned:|Prévu :/);
    assert.match(home, /leaves the path-hash setting unchanged|ne modifie pas la taille du hachage/);
    assert.doesNotMatch(home, /Canada \(Recommended\)/);
  });
}
