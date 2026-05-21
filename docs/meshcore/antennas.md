# Recommended Antennas

Antenna choice and placement usually affect MeshCore range more than the exact board model. Start with a known-good 915 MHz antenna, mount it cleanly, and test before chasing firmware changes.

## Antenna Basics

| Concept | Practical meaning |
|---------|-------------------|
| Frequency match | Use antennas intended for the Canadian/US 902-928 MHz band |
| Gain | Higher gain can help in the right direction, but may reduce coverage above and below the antenna |
| Placement | Height and line of sight often matter more than advertised gain |
| Feedline loss | Long or poor coax can waste the antenna improvement |
| Connector quality | Loose adapters and mismatched connectors cause hard-to-debug range issues |

!!! warning "Check local rules"
    You are responsible for legal operation, including power, antenna gain, and duty cycle limits that apply to your station and location.

## Companion Antennas

| Use case | Good fit | Notes |
|----------|----------|-------|
| Pocket node | Short 915 MHz whip | Convenient, but range is limited indoors |
| Portable testing | Longer flexible whip | Better than tiny stock antennas for field checks |
| Desk or window | Small magnetic/base antenna | Move it away from USB hubs, laptops, and metal blinds |

If a companion seems deaf, test with a second known-good antenna before reflashing.

## Repeater / Base Antennas

| Use case | Good fit | Notes |
|----------|----------|-------|
| Local neighborhood | Outdoor vertical | Simple, broad coverage pattern |
| Valley or corridor | Directional antenna | Useful when coverage is needed mostly one way |
| Rooftop reference node | Outdoor vertical plus short feedline | Keep cable loss low and weatherproof connectors |

Outdoor repeaters should be tested at ground level first, then tested again after final mounting. Record the antenna and cable used in the deployment notes.

## Installation Tips

- Keep the antenna clear of metal siding, gutters, and solar panel frames.
- Do not rely on a connector adapter stack outdoors.
- Weatherproof outdoor coax connections.
- Avoid sharp coax bends and strain at the board connector.
- Re-check range after heavy rain, snow, or enclosure changes.

## DIY Antennas

DIY antennas can work well, but they should be measured or compared against a known-good antenna. A visually neat antenna can still be off-frequency. For shared community repeaters, prefer tested commercial antennas unless someone can validate the build.
