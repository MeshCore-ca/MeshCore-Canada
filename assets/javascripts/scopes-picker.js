// Show the region commands that match the selected area and firmware version.
(function () {
  function setUp(picker) {
    var area = picker.querySelector("[data-scp-area]");
    var firmware = picker.querySelector("[data-scp-firmware]");
    var group = picker.closest("[data-scp-picker-group]") || document;
    var variants = group.querySelectorAll("[data-scp-variant]");

    function update() {
      variants.forEach(function (variant) {
        variant.hidden = !(
          variant.getAttribute("data-area") === area.value &&
          variant.getAttribute("data-firmware") === firmware.value
        );
      });
    }

    area.addEventListener("change", update);
    firmware.addEventListener("change", update);
    picker.hidden = false;
    update();
  }

  document.querySelectorAll("[data-scp-picker]").forEach(setUp);
})();
