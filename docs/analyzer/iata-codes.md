# IATA Region Codes

Each observer identifies its region with a real 3-letter IATA airport code. Use the airport code nearest to the observer's real location.

The firmware and helper scripts are not limited to the list below. If your nearest real IATA code is missing here, you can still use it and the public broker will accept it as long as it is a valid airport code. The live site will add observed regions to the picker automatically, but codes missing from the friendly-name list may appear as the bare code until we add a label.

The live region picker is traffic-driven. If a valid code such as `YTR` is absent from the picker, that usually means no current observer is publishing packet or status traffic under that code; it does not mean the broker rejects the code.

Do not use placeholders or made-up region names such as `XXX` or `HOME`. Do not use `CAN` as shorthand for Canada; it is a real airport code for Guangzhou and will tag your observer to the wrong region.

Host-side helper scripts show this same quick list interactively when you omit `--iata`.

??? note "Ontario"

    | Code | Region |
    |------|--------|
    | YYZ | Toronto (Pearson) |
    | YTZ | Toronto (Billy Bishop) |
    | YOW | Ottawa |
    | YHM | Hamilton |
    | YKF | Kitchener / Waterloo |
    | YXU | London |
    | YOO | Oshawa |
    | YKZ | Buttonville / Markham |
    | YAM | Sault Ste. Marie |
    | YQT | Thunder Bay |
    | YSB | Sudbury |
    | YTS | Timmins |
    | YQG | Windsor |
    | YYB | North Bay |
    | YGK | Kingston |
    | YPQ | Peterborough |
    | YTR | Trenton / Quinte West |
    | YHD | Dryden |
    | YPL | Pickle Lake |
    | YND | Gatineau (Ottawa area) |

??? note "Quebec"

    | Code | Region |
    |------|--------|
    | YUL | Montreal (Trudeau) |
    | YMX | Montreal (Mirabel) |
    | YQB | Quebec City |
    | YBG | Bagotville / Saguenay |
    | YVO | Val-d'Or |
    | YHU | Montreal (St-Hubert) |
    | YRJ | Roberval |
    | YGL | La Grande Riviere |
    | YSC | Sherbrooke |
    | YTQ | Tasiujaq |
    | YUY | Rouyn-Noranda |
    | YZV | Sept-Iles |
    | YGP | Gaspe |
    | YRQ | Trois-Rivieres |
    | YBC | Baie-Comeau |

??? note "British Columbia"

    | Code | Region |
    |------|--------|
    | YVR | Vancouver |
    | YYJ | Victoria |
    | YXX | Abbotsford / Fraser Valley |
    | YLW | Kelowna |
    | YXS | Prince George |
    | YPR | Prince Rupert |
    | YXT | Terrace |
    | YQQ | Comox / Courtenay |
    | YCD | Nanaimo |
    | YYD | Smithers |
    | YDQ | Dawson Creek |
    | YXJ | Fort St. John |
    | YYF | Penticton |
    | YCG | Castlegar |
    | YKA | Kamloops |
    | YXC | Cranbrook |

??? note "Alberta"

    | Code | Region |
    |------|--------|
    | YYC | Calgary |
    | YEG | Edmonton |
    | YMM | Fort McMurray |
    | YQU | Grande Prairie |
    | YQL | Lethbridge |
    | YXH | Medicine Hat |

??? note "Saskatchewan"

    | Code | Region |
    |------|--------|
    | YQR | Regina |
    | YXE | Saskatoon |
    | YPA | Prince Albert |

??? note "Manitoba"

    | Code | Region |
    |------|--------|
    | YWG | Winnipeg |
    | YBR | Brandon |
    | YTH | Thompson |
    | YDN | Dauphin |
    | YPG | Portage la Prairie |

??? note "New Brunswick"

    | Code | Region |
    |------|--------|
    | YFC | Fredericton |
    | YSJ | Saint John |
    | YQM | Moncton |
    | ZBF | Bathurst |

??? note "Nova Scotia"

    | Code | Region |
    |------|--------|
    | YHZ | Halifax |
    | YQY | Sydney |
    | YQI | Yarmouth |

??? note "Prince Edward Island"

    | Code | Region |
    |------|--------|
    | YYG | Charlottetown |

??? note "Newfoundland and Labrador"

    | Code | Region |
    |------|--------|
    | YYT | St. John's |
    | YQX | Gander |
    | YDF | Deer Lake |
    | YYR | Goose Bay |
    | YWK | Wabush |

??? note "Territories (YT / NT / NU)"

    | Code | Region |
    |------|--------|
    | YXY | Whitehorse (Yukon) |
    | YZF | Yellowknife (NWT) |
    | YFB | Iqaluit (Nunavut) |
    | YEV | Inuvik (NWT) |
    | YHY | Hay River (NWT) |
