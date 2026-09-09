import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const sourceRevision = "76a4262a354a111d19ddf8cc4abb25b1267fd9db";
const pages = ["docs/hardware/repeater-solar-1w-diy-build.md", "docs/hardware/repeater-solar-1w-diy-build.fr.md"];
const downloads = ["plate-and-battery-holder.3mf", "plate.stl", "3x18650-battery-holder.stl"];

for (const path of pages) {
  const source = readFileSync(path, "utf8");
  test(`${path} preserves the original contributor, parts, steps, and illustrations`, () => {
    assert.match(source, /MrAlders0n \(Ottawa\)/);
    assert.ok(source.includes(sourceRevision), "Link to the exact pre-overhaul source");
    assert.match(source, /January 1, 2026|1er janvier 2026/);
    assert.match(source, /^scope: ottawa-field-practice$/m);
    assert.match(source, /^status: draft$/m);
    const steps = [...source.matchAll(/^(\d+)\. /gm)].map(match => Number(match[1]));
    assert.deepEqual(steps, Array.from({ length: 28 }, (_, i) => i + 1));
    const parts = [...source.matchAll(/^\| (\d+) \|/gm)].map(match => Number(match[1]));
    assert.deepEqual(parts, Array.from({ length: 16 }, (_, i) => i + 1));
    for (let i = 1; i <= 9; i++) {
      const file = `repeater-solar-1w-diy-build-${i}.${i === 9 ? "svg" : "jpg"}`;
      assert.ok(source.includes(`images/${file}`), `${file} must remain visible`);
      assert.ok(existsSync(`docs/hardware/images/${file}`));
    }
    for (const ending of downloads) {
      const file = `repeater-solar-1w-diy-build-${ending}`;
      assert.ok(source.includes(`files/${file}`), `${file} must remain downloadable`);
      assert.ok(existsSync(`docs/hardware/files/${file}`));
    }
    assert.match(source, /mc-table-wrap/);
    assert.match(source, /mc-build-diagram/);
  });

  test(`${path} retains the useful prices, quantities, wiring, and firmware values`, () => {
    assert.match(source, /280[-–]290/);
    assert.match(source, /300[-–]310/);
    assert.match(source, /M3x35[^\n]*\| 4 \|/);
    assert.match(source, /M3x5[^\n]*\| 8 \|/);
    for (const term of ["0.4.0", "Callboost", "Alfa", "JST PH2.0", "CH1+", "CH1-", "CH3+", "CH3-", "BOOT", "GND", "VCC", "SCL", "SDA"]) {
      assert.ok(source.includes(term), `${term} is restored build data`);
    }
    assert.match(source, /6[-–]8 dBi/);
    assert.match(source, /5[.,]8 dBi/);
    assert.match(source, /ikoka_stick_nrf_30dbm_repeater/);
    assert.match(source, /\$\{ikoka_stick_nrf_repeater\.build_flags\}/);
    assert.match(source, /\$\{ikoka_stick_nrf_e22_30dbm\.build_flags\}/);
    assert.match(source, /-D TELEM_INA3221_ADDRESS=0x40/);
    assert.match(source, /-UENV_INCLUDE_INA219/);
    assert.match(source, /-D TELEM_INA3221_SHUNT_VALUE=0\.05/);
    assert.ok(source.includes("https://www.aliexpress.com/item/1005004468960058.html"), "Alternative filter source");
    assert.ok(source.includes("https://www.alibaba.com/product-detail/50W-890-960MHz-4-Cavity-Filter_1601399651944.html"));
    assert.match(source, /No warranty|Sans garantie/);
    assert.match(source, /Antenna required|Antenne obligatoire/);
    assert.match(source, /^destructive: true$/m);
    assert.doesNotMatch(source, /Do not build or deploy this design|Default:.*omit optional telemetry|No hardware or firmware claim|Ne construisez et ne déployez pas ce modèle/);
  });
}

test("both restored guides use the same telemetry build configuration", () => {
  const blocks = pages.map(path => readFileSync(path, "utf8").match(/```ini\n([\s\S]*?)\n```/)?.[1]);
  assert.ok(blocks[0]);
  assert.equal(blocks[0], blocks[1]);
});
