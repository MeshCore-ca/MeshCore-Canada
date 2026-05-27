# MQTT Firmware (Standalone Observer)

Flash standalone MQTT observer firmware with the [MeshCore observer flasher](https://observer.gessaman.com/). MeshCore Canada no longer hosts separate observer firmware binaries on this page.

!!! success "MeshCore Canada presets verified"
    The observer firmware currently offered by `observer.gessaman.com` is built from Adam Gessaman's `mqtt-bridge-implementation-flex` branch at commit `c0c845f5`. That branch includes the built-in presets `meshcore-ca-1` and `meshcore-ca-2`, pointing to `mqtt1.meshcore.ca` and `mqtt2.meshcore.ca`.

## Flash The Observer

1. Open [observer.gessaman.com](https://observer.gessaman.com/).
2. Pick your board under **MQTT Observer Firmware**.
3. Choose **Repeater** or **Room Server**.
4. For a new board or a board you are repurposing, enable **Erase device** and flash the merged image.
5. When flashing finishes, use **Configure via USB** for the repeater or room server setup screen, or use **Console** for CLI setup.

!!! warning "First flash can erase settings"
    First flashing observer firmware, especially on boards with a changed partition layout, can wipe stored settings and identity data. Back up an existing device private key before repurposing it.

## Required MeshCore Canada Settings

Use the repeater or room server setup screen where possible. If a setting is not exposed in the setup screen, use the console on the flasher page and paste the CLI commands below.

| Setting | Value |
|---------|-------|
| Radio preset | **USA/Canada (Recommended)** |
| Raw radio values | `910.525 MHz / 62.5 kHz / SF7 / CR5` |
| CLI radio command | `set radio 910.525,62.5,7,5` |
| Path hash mode | 3-byte advert path hashes: `set path.hash.mode 2` |
| MQTT slot 1 | `meshcore-ca-1` |
| MQTT slot 2 | `meshcore-ca-2` |
| IATA | A real 3-letter IATA airport code near the observer |
| WiFi | 2.4 GHz network credentials |

!!! note "IATA codes"
    Use a real airport code such as `YOW`, `YYZ`, `YUL`, `YVR`, or `YYC`. Do not use placeholders such as `XXX` or `HOME`. Do not use `CAN` as shorthand for Canada; it is an airport code for Guangzhou. See the [IATA region code list](../iata-codes.md) for Canadian quick choices.

## Command Builder

Use this builder to create a CLI block for the flasher **Console**. It runs only in your browser.

<div class="mc-command-builder" id="observer-command-builder">
  <div class="mc-command-grid">
    <label>
      <span>IATA</span>
      <input id="observer-iata" list="observer-iata-list" maxlength="3" value="YOW" autocomplete="off">
      <datalist id="observer-iata-list">
        <option value="YOW">Ottawa</option>
        <option value="YYZ">Toronto Pearson</option>
        <option value="YTZ">Toronto Billy Bishop</option>
        <option value="YUL">Montreal Trudeau</option>
        <option value="YQB">Quebec City</option>
        <option value="YVR">Vancouver</option>
        <option value="YYJ">Victoria</option>
        <option value="YYC">Calgary</option>
        <option value="YEG">Edmonton</option>
        <option value="YXE">Saskatoon</option>
        <option value="YQR">Regina</option>
        <option value="YWG">Winnipeg</option>
        <option value="YHZ">Halifax</option>
        <option value="YYT">St. John's</option>
        <option value="YXY">Whitehorse</option>
        <option value="YZF">Yellowknife</option>
        <option value="YFB">Iqaluit</option>
      </datalist>
    </label>
    <label>
      <span>Role</span>
      <select id="observer-role">
        <option value="Repeater">Repeater</option>
        <option value="Room-Server">Room Server</option>
      </select>
    </label>
    <label>
      <span>Node number</span>
      <input id="observer-number" value="01" autocomplete="off">
    </label>
    <label>
      <span>WiFi SSID</span>
      <input id="observer-ssid" value="YourWiFiNetwork" autocomplete="off">
    </label>
    <label>
      <span>WiFi password</span>
      <input id="observer-password" value="YourWiFiPassword" autocomplete="off">
    </label>
    <label>
      <span>Repeating</span>
      <select id="observer-repeat">
        <option value="on">Repeat mesh packets</option>
        <option value="off">Observe only</option>
      </select>
    </label>
  </div>
  <div class="mc-command-actions">
    <button type="button" id="observer-copy-commands">Copy commands</button>
    <span id="observer-copy-status" aria-live="polite"></span>
  </div>
  <pre><code id="observer-command-output"></code></pre>
</div>

<style>
  .mc-command-builder {
    border: 1px solid var(--md-default-fg-color--lightest);
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0 1.5rem;
    background: var(--md-code-bg-color);
  }
  .mc-command-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 0.75rem;
  }
  .mc-command-builder label {
    display: grid;
    gap: 0.35rem;
    margin: 0;
  }
  .mc-command-builder label span {
    font-size: 0.78rem;
    font-weight: 600;
  }
  .mc-command-builder input,
  .mc-command-builder select {
    min-height: 2.25rem;
    width: 100%;
    box-sizing: border-box;
    border: 1px solid var(--md-default-fg-color--lightest);
    border-radius: 6px;
    padding: 0.4rem 0.5rem;
    background: var(--md-default-bg-color);
    color: var(--md-default-fg-color);
    font: inherit;
  }
  .mc-command-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0.9rem 0 0.75rem;
  }
  .mc-command-actions button {
    border: 1px solid var(--md-accent-fg-color);
    border-radius: 6px;
    padding: 0.45rem 0.7rem;
    background: transparent;
    color: var(--md-accent-fg-color);
    font: inherit;
    cursor: pointer;
  }
  .mc-command-actions span {
    min-height: 1.2rem;
    font-size: 0.8rem;
    opacity: 0.8;
  }
  .mc-command-builder pre {
    margin-bottom: 0;
  }
</style>

<script>
(function () {
  var root = document.getElementById("observer-command-builder");
  if (!root) return;

  var fields = {
    iata: document.getElementById("observer-iata"),
    role: document.getElementById("observer-role"),
    number: document.getElementById("observer-number"),
    ssid: document.getElementById("observer-ssid"),
    password: document.getElementById("observer-password"),
    repeat: document.getElementById("observer-repeat")
  };
  var output = document.getElementById("observer-command-output");
  var status = document.getElementById("observer-copy-status");

  function value(el, fallback) {
    var text = (el.value || "").trim();
    return text || fallback;
  }

  function iataValue() {
    return value(fields.iata, "YOW").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3) || "YOW";
  }

  function render() {
    var iata = iataValue();
    var role = value(fields.role, "Repeater");
    var number = value(fields.number, "01");
    var nodeName = iata + "-" + role + "-" + number;
    var commands = [
      "set name " + nodeName,
      "set radio 910.525,62.5,7,5",
      "set path.hash.mode 2",
      "set mqtt.iata " + iata,
      "set wifi.ssid " + value(fields.ssid, "YourWiFiNetwork"),
      "set wifi.pwd " + value(fields.password, "YourWiFiPassword"),
      "set wifi.powersave none",
      "set mqtt1.preset meshcore-ca-1",
      "set mqtt2.preset meshcore-ca-2",
      "set mqtt3.preset none",
      "set mqtt4.preset none",
      "set mqtt5.preset none",
      "set mqtt6.preset none",
      "set mqtt.status on",
      "set mqtt.packets on",
      "set mqtt.raw off",
      "set mqtt.rx on",
      "set mqtt.tx advert",
      "set bridge.enabled on",
      "set repeat " + value(fields.repeat, "on"),
      "advert",
      "reboot"
    ];
    output.textContent = commands.join("\n");
  }

  root.addEventListener("input", render);
  document.getElementById("observer-copy-commands").addEventListener("click", function () {
    navigator.clipboard.writeText(output.textContent).then(function () {
      status.textContent = "Copied";
      setTimeout(function () { status.textContent = ""; }, 1600);
    }, function () {
      status.textContent = "Select the block and copy manually";
    });
  });
  render();
})();
</script>

## Manual CLI Reference

If you prefer to type commands manually, replace `YOW`, `YourWiFiNetwork`, and `YourWiFiPassword` with your own values:

```text
set name YOW-Repeater-01
set radio 910.525,62.5,7,5
set path.hash.mode 2
set mqtt.iata YOW
set wifi.ssid YourWiFiNetwork
set wifi.pwd YourWiFiPassword
set wifi.powersave none
set mqtt1.preset meshcore-ca-1
set mqtt2.preset meshcore-ca-2
set mqtt3.preset none
set mqtt4.preset none
set mqtt5.preset none
set mqtt6.preset none
set mqtt.status on
set mqtt.packets on
set mqtt.raw off
set mqtt.rx on
set mqtt.tx advert
set bridge.enabled on
set repeat on
advert
reboot
```

For an observe-only node that should not repeat mesh traffic, use:

```text
set repeat off
```

## Verify

After the device reboots, reopen the flasher **Console** and run:

```text
get wifi.status
get mqtt.iata
get mqtt1.preset
get mqtt2.preset
get mqtt.status
get path.hash.mode
```

Expected broker presets:

```text
get mqtt1.preset
> meshcore-ca-1
get mqtt2.preset
> meshcore-ca-2
```

Once WiFi and MQTT are connected, use [Check Your Observer](../verify.md) to confirm packets are reaching MeshCore Canada.

## Useful Links

<div class="grid cards" markdown>

-   :material-flash:{ .lg .middle } **Observer Flasher**

    ---

    Flash MQTT observer firmware and open the serial console.

    [:octicons-arrow-right-24: observer.gessaman.com](https://observer.gessaman.com/)

-   :material-airplane:{ .lg .middle } **IATA Region Codes**

    ---

    Pick the real 3-letter airport code nearest to the observer.

    [:octicons-arrow-right-24: IATA codes](../iata-codes.md)

-   :material-check-circle:{ .lg .middle } **Check Your Observer**

    ---

    Confirm that the observer is online and reporting.

    [:octicons-arrow-right-24: verify status](../verify.md)

</div>
