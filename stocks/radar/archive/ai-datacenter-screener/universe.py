"""
The investable universe for the AI Data Center buildout, organized by the
six-layer framework (Land -> Power -> Cooling -> Compute -> Networking -> Software)
plus the cross-cutting bottlenecks.

This file is the HEART of the screener. It is meant to be edited by hand as your
thesis evolves: add/remove tickers, retag names, tweak the one-line thesis.

Each holding:
    {
        "ticker":   "ETN",
        "name":     "Eaton",
        "exposure": "moderate",                 # how levered to the THEME (see below)
        "tags":     ["switchgear", "ups"],      # free-form theme labels
        "thesis":   "Core electrical gear ...", # one-line why-it's-here
    }

`exposure` = how much of the BUSINESS is driven by the AI data-center theme.
It is a judgment call, not a precise number, and it's the single most useful
field for everyday scanning:
    "pure"        -> business is essentially all AI / data-center infrastructure
    "high"        -> a major and growing driver, but the company does other things
    "moderate"    -> meaningful but one of several segments
    "diversified" -> large conglomerate; AI data center is a smaller slice
Edit these freely to match your own read.

`tags` are free-form theme labels (e.g. "gpu", "hbm", "transformer", "nuclear")
used for filtering. A ticker can legitimately appear in more than one layer
(e.g. Vertiv = power + cooling); that's expected and the UI flags it.
"""

import json
import os

# ---------------------------------------------------------------------- #
# Data overrides — a clean place to handle known yfinance glitches.
# Two forms per ticker:
#   "TICK": {"exclude": True}              -> drop from the universe entirely
#   "TICK": {"market_cap": 1.5e11, ...}    -> override specific fetched fields
# Field overrides are merged onto the live market data (any field in fetch_one:
# market_cap, price, trailing_pe, ...). Remove an entry to re-enable a ticker.
DATA_OVERRIDES = {
    # yfinance reports KLAC sharesOutstanding ~10x too high (≈1.3B vs KLA's real
    # ~132M), producing a bogus ~$3T market cap that dominates cap-based sorts.
    # No authoritative correction is available, so we exclude it. To patch
    # instead of dropping, replace with e.g. {"market_cap": 1.5e11}.
    "KLAC": {"exclude": True},
}


def is_excluded(ticker):
    return bool(DATA_OVERRIDES.get(ticker, {}).get("exclude"))


def market_overrides(ticker):
    """Field overrides to merge onto fetched market data (drops the control key)."""
    return {k: v for k, v in DATA_OVERRIDES.get(ticker, {}).items() if k != "exclude"}


# Ordered strongest-exposure first; drives sorting and the filter chips.
EXPOSURE_LEVELS = ["pure", "high", "moderate", "diversified"]


def exposure_rank(level):
    """Lower number = more levered to the theme. Unknown sinks to the bottom."""
    try:
        return EXPOSURE_LEVELS.index(level)
    except ValueError:
        return len(EXPOSURE_LEVELS)


LAYERS = [
    # ------------------------------------------------------------------ #
    {
        "id": "land",
        "name": "Layer 1 — Land & Physical Shell",
        "blurb": "Real estate, data-center REITs, construction/engineering firms "
                 "and the raw materials (aggregates, steel) that build the shell. "
                 "18–36 months from groundbreaking to move-in.",
        "holdings": [
            {"ticker": "DLR",  "name": "Digital Realty Trust", "exposure": "high", "tags": ["reit"],
             "thesis": "Largest pure-play data-center REIT; landlord to hyperscalers."},
            {"ticker": "EQIX", "name": "Equinix", "exposure": "high", "tags": ["reit", "colocation"],
             "thesis": "Global interconnection / colocation REIT."},
            {"ticker": "IRM",  "name": "Iron Mountain", "exposure": "moderate", "tags": ["reit"],
             "thesis": "Records giant pivoting hard into data-center capacity."},
            {"ticker": "AMT",  "name": "American Tower", "exposure": "diversified", "tags": ["reit", "towers"],
             "thesis": "Tower REIT with growing data-center/edge exposure."},
            {"ticker": "PWR",  "name": "Quanta Services", "exposure": "moderate", "tags": ["construction", "electrical"],
             "thesis": "Builds the electrical & grid infrastructure feeding sites."},
            {"ticker": "EME",  "name": "EMCOR Group", "exposure": "moderate", "tags": ["construction", "mechanical"],
             "thesis": "Mechanical/electrical construction for large facilities."},
            {"ticker": "FIX",  "name": "Comfort Systems USA", "exposure": "high", "tags": ["construction", "hvac"],
             "thesis": "HVAC/mechanical contractor; heavy data-center backlog."},
            {"ticker": "STRL", "name": "Sterling Infrastructure", "exposure": "moderate", "tags": ["construction", "sitework"],
             "thesis": "Site development / earthwork for big data-center pads."},
            {"ticker": "MTZ",  "name": "MasTec", "exposure": "diversified", "tags": ["construction", "electrical"],
             "thesis": "Infrastructure construction incl. power & communications."},
            {"ticker": "VMC",  "name": "Vulcan Materials", "exposure": "diversified", "tags": ["materials", "aggregates"],
             "thesis": "Aggregates for the concrete/roads of massive campuses."},
            {"ticker": "MLM",  "name": "Martin Marietta", "exposure": "diversified", "tags": ["materials", "aggregates"],
             "thesis": "Aggregates & heavy building materials."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "CCI",  "name": "Crown Castle", "exposure": "diversified", "tags": ["reit", "towers", "fiber"],
             "thesis": "Tower & fiber REIT; small-cell/fiber feeding edge compute."},
            {"ticker": "SBAC", "name": "SBA Communications", "exposure": "diversified", "tags": ["reit", "towers"],
             "thesis": "Tower REIT; wireless/edge infrastructure landlord."},
            {"ticker": "DBRG", "name": "DigitalBridge Group", "exposure": "high", "tags": ["reit", "digital-infra", "asset-manager"],
             "thesis": "Pure digital-infrastructure asset manager (data centers, towers, fiber)."},
            {"ticker": "ACM",  "name": "AECOM", "exposure": "diversified", "tags": ["engineering", "construction"],
             "thesis": "Global engineering/design firm building data-center & power infra."},
            {"ticker": "J",    "name": "Jacobs Solutions", "exposure": "diversified", "tags": ["engineering", "construction"],
             "thesis": "Engineering & technical services incl. data-center design."},
            {"ticker": "FLR",  "name": "Fluor", "exposure": "diversified", "tags": ["construction", "epc"],
             "thesis": "EPC contractor for large industrial & power projects."},
            {"ticker": "PRIM", "name": "Primoris Services", "exposure": "moderate", "tags": ["construction", "power", "comms"],
             "thesis": "Infrastructure construction across power & communications."},
            {"ticker": "GVA",  "name": "Granite Construction", "exposure": "diversified", "tags": ["construction", "sitework"],
             "thesis": "Civil construction & site development for big pads."},
            {"ticker": "EXP",  "name": "Eagle Materials", "exposure": "diversified", "tags": ["materials", "cement", "aggregates"],
             "thesis": "Cement & aggregates for large-scale concrete builds."},
            {"ticker": "CRH",  "name": "CRH plc", "exposure": "diversified", "tags": ["materials", "aggregates"],
             "thesis": "World's largest building-materials supplier."},
            {"ticker": "AGX",  "name": "Argan", "exposure": "high", "tags": ["epc", "power-construction"],
             "thesis": "Builds gas/renewable power plants that feed data centers."},
            {"ticker": "IESC", "name": "IES Holdings", "exposure": "high", "tags": ["electrical", "construction", "data-center"],
             "thesis": "Electrical infrastructure incl. heavy data-center buildouts."},
            {"ticker": "STN",  "name": "Stantec", "exposure": "diversified", "tags": ["engineering"],
             "thesis": "Engineering & design services for infrastructure."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "DY",   "name": "Dycom Industries", "exposure": "moderate", "tags": ["construction", "fiber", "telecom"],
             "thesis": "Telecom/fiber network construction — the fiber buildout for AI."},
            {"ticker": "MYRG", "name": "MYR Group", "exposure": "moderate", "tags": ["construction", "electrical", "transmission"],
             "thesis": "Electrical construction incl. T&D and data-center work."},
            {"ticker": "ROAD", "name": "Construction Partners", "exposure": "diversified", "tags": ["construction", "civil", "sitework"],
             "thesis": "Civil infrastructure & site construction."},
            {"ticker": "AMRC", "name": "Ameresco", "exposure": "moderate", "tags": ["energy-efficiency", "infrastructure"],
             "thesis": "Energy efficiency & infrastructure projects incl. data centers."},
            {"ticker": "WLDN", "name": "Willdan Group", "exposure": "moderate", "tags": ["engineering", "energy"],
             "thesis": "Energy & engineering services for facilities and utilities."},
            {"ticker": "MTRX", "name": "Matrix Service", "exposure": "moderate", "tags": ["construction", "industrial"],
             "thesis": "Industrial & infrastructure construction/engineering."},
            {"ticker": "NWPX", "name": "NWPX Infrastructure", "exposure": "diversified", "tags": ["materials", "pipe", "infrastructure"],
             "thesis": "Engineered water & infrastructure pipe/products."},
            {"ticker": "IIIN", "name": "Insteel Industries", "exposure": "diversified", "tags": ["materials", "steel", "rebar"],
             "thesis": "Steel wire & rebar for concrete construction."},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "power",
        "name": "Layer 2 — Power Infrastructure (the bottleneck)",
        "blurb": "Grid connection, transformers, switchgear, UPS, generators and "
                 "the utilities / power generators (incl. nuclear & SMRs) that feed "
                 "the factory. Power is the single defining constraint on growth.",
        "holdings": [
            {"ticker": "ETN",  "name": "Eaton", "exposure": "moderate", "tags": ["switchgear", "ups", "electrical"],
             "thesis": "Core electrical gear across the grid-to-rack power chain."},
            {"ticker": "VRT",  "name": "Vertiv Holdings", "exposure": "pure", "tags": ["ups", "power", "cooling"],
             "thesis": "Power & thermal management; pure data-center play."},
            {"ticker": "GEV",  "name": "GE Vernova", "exposure": "high", "tags": ["generation", "grid", "turbines"],
             "thesis": "Gas turbines, grid equipment & nuclear — generation side."},
            {"ticker": "POWL", "name": "Powell Industries", "exposure": "high", "tags": ["switchgear", "electrical"],
             "thesis": "Switchgear & electrical distribution; sold-out backlog."},
            {"ticker": "HUBB", "name": "Hubbell", "exposure": "moderate", "tags": ["electrical", "grid"],
             "thesis": "Electrical & utility-grade connection products."},
            {"ticker": "NVT",  "name": "nVent Electric", "exposure": "high", "tags": ["electrical", "enclosures", "cooling"],
             "thesis": "Electrical enclosures, connections & liquid-cooling gear."},
            {"ticker": "GNRC", "name": "Generac", "exposure": "moderate", "tags": ["generators", "backup"],
             "thesis": "Backup generation / standby power."},
            {"ticker": "CMI",  "name": "Cummins", "exposure": "diversified", "tags": ["generators", "backup"],
             "thesis": "Diesel/gas gensets for facility-scale backup."},
            {"ticker": "BE",   "name": "Bloom Energy", "exposure": "high", "tags": ["fuel-cell", "onsite-power"],
             "thesis": "On-site fuel-cell power; signing data-center deals (speculative)."},
            {"ticker": "SBGSY","name": "Schneider Electric (ADR)", "exposure": "moderate", "tags": ["switchgear", "ups", "electrical"],
             "thesis": "Global leader in data-center electrical & energy mgmt."},
            {"ticker": "ABBNY","name": "ABB (ADR)", "exposure": "diversified", "tags": ["electrical", "transformer", "grid"],
             "thesis": "Electrification & grid automation incl. transformers."},
            {"ticker": "SIEGY","name": "Siemens (ADR)", "exposure": "diversified", "tags": ["electrical", "grid", "automation"],
             "thesis": "Grid tech, switchgear & industrial automation."},
            {"ticker": "CEG",  "name": "Constellation Energy", "exposure": "high", "tags": ["utility", "nuclear", "generation"],
             "thesis": "Largest US nuclear fleet; PPAs to power AI campuses."},
            {"ticker": "VST",  "name": "Vistra", "exposure": "high", "tags": ["utility", "generation", "nuclear"],
             "thesis": "Independent power producer; nuclear + gas for AI demand."},
            {"ticker": "TLN",  "name": "Talen Energy", "exposure": "high", "tags": ["utility", "nuclear", "generation"],
             "thesis": "Nuclear-adjacent IPP signing data-center power deals."},
            {"ticker": "NRG",  "name": "NRG Energy", "exposure": "moderate", "tags": ["utility", "generation"],
             "thesis": "Power generation & retail exposed to load growth."},
            {"ticker": "NEE",  "name": "NextEra Energy", "exposure": "diversified", "tags": ["utility", "renewables", "generation"],
             "thesis": "Largest US utility; huge data-center power pipeline."},
            {"ticker": "CCJ",  "name": "Cameco", "exposure": "moderate", "tags": ["nuclear", "uranium", "fuel"],
             "thesis": "Uranium fuel supply for the nuclear build."},
            {"ticker": "OKLO", "name": "Oklo", "exposure": "pure", "tags": ["nuclear", "smr"],
             "thesis": "Small modular reactor developer (speculative)."},
            {"ticker": "SMR",  "name": "NuScale Power", "exposure": "pure", "tags": ["nuclear", "smr"],
             "thesis": "SMR technology (speculative)."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "SO",   "name": "Southern Company", "exposure": "diversified", "tags": ["utility", "nuclear", "generation"],
             "thesis": "Southeast utility; Vogtle nuclear + data-center load growth."},
            {"ticker": "D",    "name": "Dominion Energy", "exposure": "diversified", "tags": ["utility", "generation"],
             "thesis": "Virginia 'data-center alley' utility; huge load pipeline."},
            {"ticker": "DUK",  "name": "Duke Energy", "exposure": "diversified", "tags": ["utility", "generation"],
             "thesis": "Large Southeast utility serving data-center demand."},
            {"ticker": "AEP",  "name": "American Electric Power", "exposure": "diversified", "tags": ["utility", "grid", "transmission"],
             "thesis": "Largest US transmission network; load-growth exposure."},
            {"ticker": "EXC",  "name": "Exelon", "exposure": "diversified", "tags": ["utility", "grid"],
             "thesis": "Pure transmission/distribution utility levered to demand."},
            {"ticker": "ETR",  "name": "Entergy", "exposure": "diversified", "tags": ["utility", "generation"],
             "thesis": "Gulf-South utility with data-center & industrial load."},
            {"ticker": "SRE",  "name": "Sempra", "exposure": "diversified", "tags": ["utility", "grid"],
             "thesis": "California/Texas utility & energy infrastructure."},
            {"ticker": "AES",  "name": "AES Corp", "exposure": "diversified", "tags": ["utility", "generation", "renewables"],
             "thesis": "Global power producer signing data-center PPAs."},
            {"ticker": "PEG",  "name": "Public Service Enterprise Group", "exposure": "diversified", "tags": ["utility", "nuclear"],
             "thesis": "NJ utility with a nuclear fleet."},
            {"ticker": "BWXT", "name": "BWX Technologies", "exposure": "high", "tags": ["nuclear", "components", "smr"],
             "thesis": "Nuclear components & SMR/microreactor manufacturing."},
            {"ticker": "LEU",  "name": "Centrus Energy", "exposure": "high", "tags": ["nuclear", "enrichment", "fuel"],
             "thesis": "Uranium enrichment; HALEU fuel for advanced reactors."},
            {"ticker": "UEC",  "name": "Uranium Energy", "exposure": "moderate", "tags": ["nuclear", "uranium"],
             "thesis": "US-focused uranium miner for the nuclear build."},
            {"ticker": "FSLR", "name": "First Solar", "exposure": "moderate", "tags": ["solar", "generation"],
             "thesis": "US solar manufacturer; data-center power via PPAs."},
            {"ticker": "NXT",  "name": "Nextracker", "exposure": "moderate", "tags": ["solar", "trackers"],
             "thesis": "Solar-tracker leader enabling utility-scale generation."},
            {"ticker": "FLNC", "name": "Fluence Energy", "exposure": "high", "tags": ["storage", "grid", "battery"],
             "thesis": "Grid-scale battery storage smoothing data-center load."},
            {"ticker": "AEIS", "name": "Advanced Energy Industries", "exposure": "high", "tags": ["power-conversion", "electrical"],
             "thesis": "Precision power conversion for semis & data centers."},
            {"ticker": "ATKR", "name": "Atkore", "exposure": "moderate", "tags": ["electrical", "conduit", "cable"],
             "thesis": "Electrical conduit & cable for power distribution."},
            {"ticker": "ENS",  "name": "EnerSys", "exposure": "moderate", "tags": ["battery", "dc-power", "backup"],
             "thesis": "Industrial batteries & DC power/backup systems."},
            {"ticker": "PLUG", "name": "Plug Power", "exposure": "moderate", "tags": ["fuel-cell", "hydrogen", "onsite-power"],
             "thesis": "Hydrogen fuel cells for on-site power (speculative)."},
            {"ticker": "NNE",  "name": "NANO Nuclear Energy", "exposure": "pure", "tags": ["nuclear", "smr", "microreactor"],
             "thesis": "Microreactor developer (speculative)."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "NXE",  "name": "NexGen Energy", "exposure": "moderate", "tags": ["nuclear", "uranium"],
             "thesis": "Large uranium development project for the nuclear build."},
            {"ticker": "UUUU", "name": "Energy Fuels", "exposure": "moderate", "tags": ["nuclear", "uranium", "rare-earths"],
             "thesis": "US uranium & rare-earths producer."},
            {"ticker": "DNN",  "name": "Denison Mines", "exposure": "moderate", "tags": ["nuclear", "uranium"],
             "thesis": "Uranium developer leveraged to nuclear fuel demand."},
            {"ticker": "URG",  "name": "Ur-Energy", "exposure": "moderate", "tags": ["nuclear", "uranium"],
             "thesis": "US in-situ uranium producer."},
            {"ticker": "EOSE", "name": "Eos Energy Enterprises", "exposure": "high", "tags": ["storage", "grid", "battery"],
             "thesis": "Long-duration grid battery storage (speculative)."},
            {"ticker": "ENVX", "name": "Enovix", "exposure": "moderate", "tags": ["battery", "storage"],
             "thesis": "Advanced battery technology (speculative)."},
            {"ticker": "AMPX", "name": "Amprius Technologies", "exposure": "moderate", "tags": ["battery", "storage"],
             "thesis": "High-energy-density batteries (speculative)."},
            {"ticker": "AMSC", "name": "American Superconductor", "exposure": "moderate", "tags": ["grid", "power-electronics"],
             "thesis": "Grid power systems & superconductor cabling."},
            {"ticker": "FCEL", "name": "FuelCell Energy", "exposure": "moderate", "tags": ["fuel-cell", "onsite-power"],
             "thesis": "Fuel-cell power platforms for on-site generation (speculative)."},
            {"ticker": "ASPI", "name": "ASP Isotopes", "exposure": "high", "tags": ["isotopes", "nuclear", "enrichment"],
             "thesis": "Isotope enrichment with nuclear-fuel (HALEU) ambitions (speculative)."},
            {"ticker": "LTBR", "name": "Lightbridge", "exposure": "pure", "tags": ["nuclear", "fuel"],
             "thesis": "Advanced nuclear fuel technology (speculative)."},
            # --- expanded universe (micro-cap, $50M+) ---
            {"ticker": "SHLS", "name": "Shoals Technologies", "exposure": "moderate", "tags": ["electrical", "solar", "bos"],
             "thesis": "Electrical balance-of-system for solar/EV power."},
            {"ticker": "ARRY", "name": "Array Technologies", "exposure": "moderate", "tags": ["solar", "trackers"],
             "thesis": "Solar trackers for utility-scale generation."},
            {"ticker": "NRGV", "name": "Energy Vault", "exposure": "moderate", "tags": ["storage", "grid"],
             "thesis": "Gravity/battery grid storage (speculative)."},
            {"ticker": "UROY", "name": "Uranium Royalty", "exposure": "moderate", "tags": ["nuclear", "uranium", "royalty"],
             "thesis": "Uranium royalty/streaming play on the fuel cycle."},
            {"ticker": "EU",   "name": "enCore Energy", "exposure": "moderate", "tags": ["nuclear", "uranium"],
             "thesis": "US in-situ uranium producer (speculative)."},
            {"ticker": "WWR",  "name": "Westwater Resources", "exposure": "moderate", "tags": ["graphite", "battery", "materials"],
             "thesis": "Battery-grade graphite developer (speculative micro-cap)."},
            {"ticker": "BWEN", "name": "Broadwind", "exposure": "moderate", "tags": ["wind", "industrial", "gearing"],
             "thesis": "Wind & industrial power components (speculative micro-cap)."},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "cooling",
        "name": "Layer 3 — Cooling Systems",
        "blurb": "Liquid cooling, rear-door heat exchangers, CRAH/CRAC, cooling "
                 "towers. AI racks run 120–600 kW; air cooling alone no longer works.",
        "holdings": [
            {"ticker": "VRT",  "name": "Vertiv Holdings", "exposure": "pure", "tags": ["cooling", "liquid", "thermal"],
             "thesis": "Thermal management & liquid cooling for AI racks."},
            {"ticker": "MOD",  "name": "Modine Manufacturing", "exposure": "high", "tags": ["cooling", "liquid", "thermal"],
             "thesis": "Data-center cooling / coolant distribution units."},
            {"ticker": "SPXC", "name": "SPX Technologies", "exposure": "moderate", "tags": ["cooling", "towers", "thermal"],
             "thesis": "Cooling towers & heat rejection for large facilities."},
            {"ticker": "TT",   "name": "Trane Technologies", "exposure": "moderate", "tags": ["cooling", "hvac"],
             "thesis": "HVAC & chillers for facility-scale heat rejection."},
            {"ticker": "JCI",  "name": "Johnson Controls", "exposure": "diversified", "tags": ["cooling", "hvac", "controls"],
             "thesis": "Building HVAC, chillers & controls."},
            {"ticker": "CARR", "name": "Carrier Global", "exposure": "diversified", "tags": ["cooling", "hvac"],
             "thesis": "Cooling & thermal management systems."},
            {"ticker": "FIX",  "name": "Comfort Systems USA", "exposure": "high", "tags": ["cooling", "hvac", "construction"],
             "thesis": "Installs the mechanical cooling backbone."},
            {"ticker": "NVT",  "name": "nVent Electric", "exposure": "high", "tags": ["cooling", "liquid"],
             "thesis": "Liquid-cooling & enclosure thermal solutions."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "AAON", "name": "AAON", "exposure": "high", "tags": ["cooling", "hvac", "data-center"],
             "thesis": "Custom HVAC & purpose-built data-center cooling units."},
            {"ticker": "LII",  "name": "Lennox International", "exposure": "diversified", "tags": ["cooling", "hvac"],
             "thesis": "HVAC manufacturer; commercial cooling systems."},
            {"ticker": "FLS",  "name": "Flowserve", "exposure": "diversified", "tags": ["pumps", "liquid", "thermal"],
             "thesis": "Pumps & flow control for liquid-cooling loops."},
            {"ticker": "ITT",  "name": "ITT Inc", "exposure": "diversified", "tags": ["pumps", "thermal", "components"],
             "thesis": "Industrial pumps & components incl. thermal management."},
            {"ticker": "XYL",  "name": "Xylem", "exposure": "diversified", "tags": ["pumps", "water", "cooling"],
             "thesis": "Water/pump technology supporting cooling systems."},
            {"ticker": "GTLS", "name": "Chart Industries", "exposure": "moderate", "tags": ["thermal", "cryogenic", "cooling"],
             "thesis": "Engineered thermal/cooling & industrial-gas equipment."},
            {"ticker": "PH",   "name": "Parker-Hannifin", "exposure": "diversified", "tags": ["fluid", "thermal", "connectors"],
             "thesis": "Motion & fluid systems incl. liquid-cooling connectors."},
            {"ticker": "DCI",  "name": "Donaldson", "exposure": "diversified", "tags": ["filtration", "thermal"],
             "thesis": "Filtration & thermal-management components."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "LMB",  "name": "Limbach Holdings", "exposure": "high", "tags": ["hvac", "mechanical", "data-center"],
             "thesis": "Mechanical/HVAC building-systems contractor; growing data-center backlog."},
            {"ticker": "SXI",  "name": "Standex International", "exposure": "diversified", "tags": ["thermal", "electronics", "engineered"],
             "thesis": "Engineered products incl. thermal & electronics."},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "compute",
        "name": "Layer 4 — Compute Hardware (GPUs, HBM, packaging)",
        "blurb": "The brain: GPUs, HBM memory, CoWoS packaging, the foundry and the "
                 "semicap tools behind them, plus server OEMs. Bottleneck has moved "
                 "upstream to packaging & memory substrates.",
        "holdings": [
            {"ticker": "NVDA", "name": "NVIDIA", "exposure": "high", "tags": ["gpu", "networking", "software"],
             "thesis": "Dominant AI GPU + NVLink + CUDA ecosystem."},
            {"ticker": "AMD",  "name": "Advanced Micro Devices", "exposure": "high", "tags": ["gpu", "cpu"],
             "thesis": "MI-series GPUs; #2 merchant AI accelerator."},
            {"ticker": "AVGO", "name": "Broadcom", "exposure": "high", "tags": ["asic", "networking", "custom-silicon"],
             "thesis": "Custom AI ASICs + networking silicon for hyperscalers."},
            {"ticker": "MRVL", "name": "Marvell Technology", "exposure": "high", "tags": ["asic", "networking", "custom-silicon"],
             "thesis": "Custom silicon & optical DSPs for AI infra."},
            {"ticker": "TSM",  "name": "TSMC (ADR)", "exposure": "moderate", "tags": ["foundry", "cowos", "packaging"],
             "thesis": "Near-monopoly foundry + CoWoS advanced packaging."},
            {"ticker": "MU",   "name": "Micron Technology", "exposure": "moderate", "tags": ["hbm", "memory"],
             "thesis": "HBM memory supplier ramping into AI demand."},
            {"ticker": "ONTO", "name": "Onto Innovation", "exposure": "high", "tags": ["semicap", "packaging", "metrology"],
             "thesis": "Advanced-packaging metrology — direct CoWoS/HBM bottleneck play."},
            {"ticker": "AMKR", "name": "Amkor Technology", "exposure": "high", "tags": ["packaging", "osat", "cowos"],
             "thesis": "OSAT — outsourced advanced packaging & test for AI accelerators."},
            {"ticker": "ASX",  "name": "ASE Technology (ADR)", "exposure": "moderate", "tags": ["packaging", "osat"],
             "thesis": "World's largest OSAT; advanced-packaging capacity."},
            {"ticker": "CAMT", "name": "Camtek", "exposure": "high", "tags": ["semicap", "packaging", "inspection"],
             "thesis": "Inspection/metrology for advanced packaging (HBM & CoWoS)."},
            {"ticker": "BESIY","name": "BE Semiconductor (ADR)", "exposure": "high", "tags": ["semicap", "packaging", "hybrid-bonding"],
             "thesis": "Hybrid-bonding die-attach tools for next-gen packaging."},
            {"ticker": "MPWR", "name": "Monolithic Power Systems", "exposure": "high", "tags": ["power-mgmt", "vrm", "analog"],
             "thesis": "Power-management / VRM silicon feeding GPU boards."},
            {"ticker": "000660.KS", "name": "SK Hynix", "exposure": "high", "tags": ["hbm", "memory", "foreign"],
             "thesis": "Leading HBM supplier to NVIDIA — the memory bottleneck (KRW-listed)."},
            {"ticker": "005930.KS", "name": "Samsung Electronics", "exposure": "diversified", "tags": ["hbm", "memory", "foundry", "foreign"],
             "thesis": "Memory + foundry giant racing to catch up in HBM (KRW-listed)."},
            {"ticker": "4062.T", "name": "Ibiden", "exposure": "high", "tags": ["substrate", "packaging", "foreign"],
             "thesis": "Top IC-substrate maker for advanced AI packages (JPY-listed)."},
            {"ticker": "2317.TW", "name": "Hon Hai (Foxconn)", "exposure": "moderate", "tags": ["odm", "server", "integration", "foreign"],
             "thesis": "World's largest EMS; major AI-server & rack integrator (TWD-listed)."},
            {"ticker": "6669.TW", "name": "Wiwynn", "exposure": "high", "tags": ["odm", "server", "foreign"],
             "thesis": "AI-server ODM building hyperscaler racks at scale (TWD-listed)."},
            {"ticker": "ASML", "name": "ASML (ADR)", "exposure": "moderate", "tags": ["semicap", "lithography"],
             "thesis": "EUV lithography monopoly — upstream of every chip."},
            {"ticker": "AMAT", "name": "Applied Materials", "exposure": "moderate", "tags": ["semicap", "packaging"],
             "thesis": "Wafer-fab & advanced-packaging equipment."},
            {"ticker": "LRCX", "name": "Lam Research", "exposure": "moderate", "tags": ["semicap", "etch"],
             "thesis": "Etch/deposition tools; HBM & advanced nodes."},
            {"ticker": "KLAC", "name": "KLA Corp", "exposure": "moderate", "tags": ["semicap", "inspection"],
             "thesis": "Process control / inspection for advanced packaging."},
            {"ticker": "ARM",  "name": "Arm Holdings (ADR)", "exposure": "moderate", "tags": ["ip", "cpu"],
             "thesis": "CPU IP inside Grace & custom data-center silicon."},
            {"ticker": "SMCI", "name": "Super Micro Computer", "exposure": "pure", "tags": ["server", "oem", "liquid"],
             "thesis": "AI server / rack OEM with liquid-cooling focus."},
            {"ticker": "DELL", "name": "Dell Technologies", "exposure": "moderate", "tags": ["server", "oem"],
             "thesis": "AI server systems integrator at scale."},
            {"ticker": "HPE",  "name": "Hewlett Packard Enterprise", "exposure": "moderate", "tags": ["server", "oem"],
             "thesis": "AI/HPC servers (Cray) & systems."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "INTC", "name": "Intel", "exposure": "diversified", "tags": ["cpu", "foundry", "gpu"],
             "thesis": "x86 CPUs, Gaudi accelerators & foundry ambitions."},
            {"ticker": "QCOM", "name": "Qualcomm", "exposure": "diversified", "tags": ["cpu", "arm", "datacenter"],
             "thesis": "Arm CPUs / AI pushing into the data center."},
            {"ticker": "TXN",  "name": "Texas Instruments", "exposure": "diversified", "tags": ["analog", "power"],
             "thesis": "Analog & power chips across server boards."},
            {"ticker": "ADI",  "name": "Analog Devices", "exposure": "diversified", "tags": ["analog", "power", "signal"],
             "thesis": "High-performance analog/power for compute & comms."},
            {"ticker": "NXPI", "name": "NXP Semiconductors", "exposure": "diversified", "tags": ["analog", "processors"],
             "thesis": "Mixed-signal & processors (auto/industrial/edge)."},
            {"ticker": "MCHP", "name": "Microchip Technology", "exposure": "diversified", "tags": ["mcu", "analog"],
             "thesis": "Microcontrollers & analog across systems."},
            {"ticker": "TER",  "name": "Teradyne", "exposure": "moderate", "tags": ["test", "semicap"],
             "thesis": "Semiconductor test incl. AI accelerators & HBM."},
            {"ticker": "ENTG", "name": "Entegris", "exposure": "high", "tags": ["materials", "cmp", "filtration"],
             "thesis": "Advanced materials & purity for leading-edge fabs."},
            {"ticker": "MKSI", "name": "MKS Inc", "exposure": "moderate", "tags": ["semicap", "subsystems"],
             "thesis": "Semicap subsystems (vacuum, lasers, RF)."},
            {"ticker": "UCTT", "name": "Ultra Clean Holdings", "exposure": "moderate", "tags": ["semicap", "subsystems"],
             "thesis": "Critical subsystems for wafer-fab equipment."},
            {"ticker": "ICHR", "name": "Ichor Holdings", "exposure": "moderate", "tags": ["semicap", "fluid-delivery"],
             "thesis": "Fluid-delivery subsystems for semicap tools."},
            {"ticker": "FORM", "name": "FormFactor", "exposure": "high", "tags": ["test", "probe", "hbm"],
             "thesis": "Probe cards & test for advanced / HBM chips."},
            {"ticker": "NVMI", "name": "Nova", "exposure": "high", "tags": ["metrology", "semicap"],
             "thesis": "Process-control metrology for advanced nodes."},
            {"ticker": "KLIC", "name": "Kulicke & Soffa", "exposure": "high", "tags": ["packaging", "bonding"],
             "thesis": "Bonding equipment for advanced packaging."},
            {"ticker": "VECO", "name": "Veeco Instruments", "exposure": "high", "tags": ["semicap", "packaging", "litho"],
             "thesis": "Process equipment incl. advanced-packaging litho."},
            {"ticker": "RMBS", "name": "Rambus", "exposure": "high", "tags": ["memory-interface", "hbm", "cxl"],
             "thesis": "Memory-interface IP & chips for HBM/CXL."},
            {"ticker": "SITM", "name": "SiTime", "exposure": "high", "tags": ["timing", "clocks"],
             "thesis": "MEMS timing/clocks for AI servers & networking."},
            {"ticker": "LSCC", "name": "Lattice Semiconductor", "exposure": "moderate", "tags": ["fpga"],
             "thesis": "Low-power FPGAs across servers & edge."},
            {"ticker": "POWI", "name": "Power Integrations", "exposure": "moderate", "tags": ["power-semi"],
             "thesis": "High-voltage power-conversion semiconductors."},
            {"ticker": "PSTG", "name": "Pure Storage", "exposure": "high", "tags": ["storage", "flash"],
             "thesis": "All-flash storage for AI data pipelines."},
            {"ticker": "NTAP", "name": "NetApp", "exposure": "moderate", "tags": ["storage"],
             "thesis": "Enterprise & cloud storage for AI workloads."},
            {"ticker": "WDC",  "name": "Western Digital", "exposure": "moderate", "tags": ["storage", "hdd", "flash"],
             "thesis": "HDD/flash storage for data-center capacity."},
            {"ticker": "STX",  "name": "Seagate Technology", "exposure": "moderate", "tags": ["storage", "hdd"],
             "thesis": "Nearline HDDs for AI data lakes."},
            {"ticker": "LNVGY","name": "Lenovo Group (ADR)", "exposure": "moderate", "tags": ["server", "oem"],
             "thesis": "Global AI-server & systems OEM (ADR)."},
            {"ticker": "AOSL", "name": "Alpha & Omega Semiconductor", "exposure": "moderate", "tags": ["power-mgmt", "analog"],
             "thesis": "Power semiconductors for boards & systems."},
            {"ticker": "ALGM", "name": "Allegro MicroSystems", "exposure": "moderate", "tags": ["power", "sensing", "analog"],
             "thesis": "Power & magnetic-sensing analog."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "ACLS", "name": "Axcelis Technologies", "exposure": "moderate", "tags": ["semicap", "ion-implant"],
             "thesis": "Ion-implant equipment for chip manufacturing."},
            {"ticker": "PLAB", "name": "Photronics", "exposure": "high", "tags": ["photomasks", "semicap"],
             "thesis": "Photomasks — a critical input to every chip made."},
            {"ticker": "COHU", "name": "Cohu", "exposure": "moderate", "tags": ["test", "handlers", "semicap"],
             "thesis": "Semiconductor test handlers & contactors."},
            {"ticker": "AEHR", "name": "Aehr Test Systems", "exposure": "high", "tags": ["test", "burn-in"],
             "thesis": "Burn-in/test systems for AI & SiC devices."},
            {"ticker": "AIP",  "name": "Arteris", "exposure": "high", "tags": ["ip", "noc", "chip-design"],
             "thesis": "Network-on-chip IP inside AI accelerators."},
            {"ticker": "CEVA", "name": "Ceva", "exposure": "moderate", "tags": ["ip", "dsp", "ai"],
             "thesis": "DSP & AI IP licensed into edge/AI silicon."},
            {"ticker": "LASR", "name": "nLIGHT", "exposure": "moderate", "tags": ["lasers", "photonics"],
             "thesis": "Industrial & directed-energy lasers; photonics."},
            # --- expanded universe (micro-cap, $50M+) ---
            {"ticker": "PENG", "name": "Penguin Solutions", "exposure": "high", "tags": ["memory", "ai-infra", "integration"],
             "thesis": "AI infrastructure & advanced-memory systems (ex-SMART Global)."},
            {"ticker": "AMBA", "name": "Ambarella", "exposure": "high", "tags": ["edge-ai", "vision", "soc"],
             "thesis": "Edge-AI vision processors / inference SoCs."},
            {"ticker": "LAES", "name": "SEALSQ", "exposure": "high", "tags": ["security", "semiconductor", "pqc"],
             "thesis": "Post-quantum security chips (speculative)."},
            {"ticker": "NVEC", "name": "NVE Corporation", "exposure": "moderate", "tags": ["spintronics", "sensors"],
             "thesis": "Spintronic sensors & signal couplers (micro-cap)."},
            {"ticker": "QUIK", "name": "QuickLogic", "exposure": "moderate", "tags": ["fpga", "edge"],
             "thesis": "Embedded FPGA & edge devices (micro-cap)."},
            {"ticker": "VLN",  "name": "Valens Semiconductor", "exposure": "moderate", "tags": ["connectivity", "serdes"],
             "thesis": "High-speed connectivity chips (micro-cap)."},
            {"ticker": "MX",   "name": "Magnachip Semiconductor", "exposure": "moderate", "tags": ["power-semi", "display"],
             "thesis": "Power & display semiconductors (micro-cap)."},
            {"ticker": "INTT", "name": "inTEST", "exposure": "moderate", "tags": ["test", "thermal", "semicap"],
             "thesis": "Semiconductor test & thermal subsystems (micro-cap)."},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "networking",
        "name": "Layer 5 — Networking (making GPUs act as one)",
        "blurb": "NVLink, InfiniBand/Ethernet fabrics, optical transceivers and the "
                 "fiber/copper that connect tens of thousands of GPUs. Elevated to "
                 "the same strategic level as power.",
        "holdings": [
            {"ticker": "ANET", "name": "Arista Networks", "exposure": "high", "tags": ["ethernet", "switching"],
             "thesis": "High-end Ethernet switching for AI back-end fabrics."},
            {"ticker": "COHR", "name": "Coherent", "exposure": "high", "tags": ["optical", "transceivers", "laser"],
             "thesis": "Optical transceivers & laser components for AI fabrics."},
            {"ticker": "GLW",  "name": "Corning", "exposure": "moderate", "tags": ["fiber", "optical"],
             "thesis": "Optical fiber & cabling — demand surging with cluster size."},
            {"ticker": "LITE", "name": "Lumentum", "exposure": "high", "tags": ["optical", "transceivers", "laser"],
             "thesis": "Lasers & optical components for datacom."},
            {"ticker": "CIEN", "name": "Ciena", "exposure": "high", "tags": ["optical", "transport"],
             "thesis": "Optical transport / DCI between campuses."},
            {"ticker": "FN",   "name": "Fabrinet", "exposure": "high", "tags": ["optical", "manufacturing"],
             "thesis": "Contract manufacturer of optical/photonic modules."},
            {"ticker": "CRDO", "name": "Credo Technology", "exposure": "pure", "tags": ["connectivity", "serdes"],
             "thesis": "Active electrical cables & SerDes for AI racks."},
            {"ticker": "ALAB", "name": "Astera Labs", "exposure": "pure", "tags": ["connectivity", "interconnect"],
             "thesis": "Connectivity silicon (PCIe/CXL) inside AI servers."},
            {"ticker": "APH",  "name": "Amphenol", "exposure": "diversified", "tags": ["connectors", "cable"],
             "thesis": "High-speed connectors & cabling (incl. NVLink copper)."},
            {"ticker": "TEL",  "name": "TE Connectivity", "exposure": "diversified", "tags": ["connectors", "cable"],
             "thesis": "High-speed connectors & interconnect for AI servers."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "CSCO", "name": "Cisco Systems", "exposure": "diversified", "tags": ["ethernet", "switching", "networking"],
             "thesis": "Networking incumbent pushing AI Ethernet fabrics."},
            {"ticker": "NOK",  "name": "Nokia (ADR)", "exposure": "diversified", "tags": ["optical", "networking", "dci"],
             "thesis": "Optical & IP networking incl. data-center interconnect."},
            {"ticker": "EXTR", "name": "Extreme Networks", "exposure": "moderate", "tags": ["networking", "switching"],
             "thesis": "Enterprise/campus networking & switching."},
            {"ticker": "VIAV", "name": "Viavi Solutions", "exposure": "moderate", "tags": ["test", "optical"],
             "thesis": "Network test & optical components."},
            {"ticker": "AAOI", "name": "Applied Optoelectronics", "exposure": "high", "tags": ["optical", "transceivers"],
             "thesis": "Optical transceivers for data-center links (speculative)."},
            {"ticker": "MTSI", "name": "MACOM Technology", "exposure": "moderate", "tags": ["rf", "optical", "components"],
             "thesis": "RF & optical/analog components for AI links."},
            {"ticker": "SMTC", "name": "Semtech", "exposure": "moderate", "tags": ["signal-integrity", "optical"],
             "thesis": "Signal-integrity & optical-DSP connectivity."},
            {"ticker": "BDC",  "name": "Belden", "exposure": "moderate", "tags": ["connectors", "cable"],
             "thesis": "Signal/power connectivity & cabling."},
            {"ticker": "LFUS", "name": "Littelfuse", "exposure": "diversified", "tags": ["circuit-protection", "components"],
             "thesis": "Circuit protection & power components."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "ATEN", "name": "A10 Networks", "exposure": "moderate", "tags": ["networking", "security", "app-delivery"],
             "thesis": "Application delivery & DDoS protection for data centers."},
            {"ticker": "POET", "name": "POET Technologies", "exposure": "high", "tags": ["optical", "photonics", "interposer"],
             "thesis": "Optical interposer/photonics for transceivers (speculative)."},
            {"ticker": "LWLG", "name": "Lightwave Logic", "exposure": "high", "tags": ["optical", "photonics", "modulator"],
             "thesis": "Electro-optic polymer modulators for optical links (speculative)."},
            {"ticker": "CLFD", "name": "Clearfield", "exposure": "moderate", "tags": ["fiber", "management"],
             "thesis": "Fiber-management & connectivity products."},
            # --- expanded universe (micro-cap, $50M+) ---
            {"ticker": "RBBN", "name": "Ribbon Communications", "exposure": "moderate", "tags": ["networking", "optical", "transport"],
             "thesis": "IP/optical networking & secure transport."},
        ],
    },
    # ------------------------------------------------------------------ #
    {
        "id": "software",
        "name": "Layer 6 — Software, Operations & Demand",
        "blurb": "CUDA, orchestration, monitoring, security, digital-twin design — "
                 "plus the hyperscalers / neoclouds whose capex funds the whole "
                 "buildout (the demand side).",
        "holdings": [
            {"ticker": "MSFT", "name": "Microsoft", "exposure": "moderate", "tags": ["hyperscaler", "cloud", "demand"],
             "thesis": "Azure capex + OpenAI; primary demand driver."},
            {"ticker": "GOOGL","name": "Alphabet", "exposure": "moderate", "tags": ["hyperscaler", "cloud", "tpu", "demand"],
             "thesis": "Google Cloud + TPU; major buildout spender."},
            {"ticker": "AMZN", "name": "Amazon", "exposure": "moderate", "tags": ["hyperscaler", "cloud", "demand"],
             "thesis": "AWS + Trainium; largest cloud capex."},
            {"ticker": "META", "name": "Meta Platforms", "exposure": "moderate", "tags": ["hyperscaler", "demand"],
             "thesis": "Prometheus 1GW supercluster; huge GPU buyer."},
            {"ticker": "ORCL", "name": "Oracle", "exposure": "high", "tags": ["cloud", "demand"],
             "thesis": "OCI capacity deals; fast-growing AI cloud backlog."},
            {"ticker": "CRWV", "name": "CoreWeave", "exposure": "pure", "tags": ["neocloud", "gpu-cloud", "demand"],
             "thesis": "GPU-native neocloud renting out AI capacity."},
            {"ticker": "NBIS", "name": "Nebius Group", "exposure": "pure", "tags": ["neocloud", "gpu-cloud", "demand"],
             "thesis": "European GPU-cloud / neocloud (speculative)."},
            {"ticker": "SNPS", "name": "Synopsys", "exposure": "moderate", "tags": ["eda", "digital-twin", "software"],
             "thesis": "EDA & chip design software; AI-design tailwind."},
            {"ticker": "CDNS", "name": "Cadence Design Systems", "exposure": "moderate", "tags": ["eda", "software"],
             "thesis": "EDA + system design & data-center digital twins."},
            {"ticker": "PLTR", "name": "Palantir", "exposure": "high", "tags": ["software", "ai-apps"],
             "thesis": "Application/ops layer monetizing deployed AI (speculative)."},
            # --- expanded universe ($1B+ market cap) ---
            {"ticker": "NOW",  "name": "ServiceNow", "exposure": "moderate", "tags": ["software", "ai-apps", "ops"],
             "thesis": "AI-driven workflow/ops platform."},
            {"ticker": "CRM",  "name": "Salesforce", "exposure": "diversified", "tags": ["software", "ai-apps"],
             "thesis": "CRM platform embedding AI agents."},
            {"ticker": "IBM",  "name": "IBM", "exposure": "diversified", "tags": ["hybrid-cloud", "ai", "software"],
             "thesis": "Hybrid cloud, consulting & watsonx AI."},
            {"ticker": "SAP",  "name": "SAP (ADR)", "exposure": "diversified", "tags": ["software", "enterprise-ai"],
             "thesis": "Enterprise software embedding AI."},
            {"ticker": "ADBE", "name": "Adobe", "exposure": "diversified", "tags": ["software", "ai-apps"],
             "thesis": "Creative/document AI (Firefly)."},
            {"ticker": "PANW", "name": "Palo Alto Networks", "exposure": "moderate", "tags": ["security"],
             "thesis": "Securing AI infrastructure & cloud."},
            {"ticker": "CRWD", "name": "CrowdStrike", "exposure": "moderate", "tags": ["security"],
             "thesis": "Endpoint/cloud security for AI-era infra."},
            {"ticker": "ZS",   "name": "Zscaler", "exposure": "moderate", "tags": ["security", "cloud"],
             "thesis": "Cloud security / zero-trust."},
            {"ticker": "NET",  "name": "Cloudflare", "exposure": "high", "tags": ["edge", "inference", "network"],
             "thesis": "Edge network & inference platform."},
            {"ticker": "DDOG", "name": "Datadog", "exposure": "high", "tags": ["observability", "monitoring"],
             "thesis": "Observability for AI infrastructure."},
            {"ticker": "MDB",  "name": "MongoDB", "exposure": "moderate", "tags": ["database", "vector"],
             "thesis": "Developer database with vector/AI features."},
            {"ticker": "SNOW", "name": "Snowflake", "exposure": "high", "tags": ["data-cloud", "ai"],
             "thesis": "Data cloud powering AI analytics."},
            {"ticker": "ESTC", "name": "Elastic", "exposure": "moderate", "tags": ["search", "vector"],
             "thesis": "Search & vector platform for AI retrieval."},
            {"ticker": "PATH", "name": "UiPath", "exposure": "moderate", "tags": ["automation", "ai"],
             "thesis": "AI-powered automation (RPA)."},
            {"ticker": "APP",  "name": "AppLovin", "exposure": "high", "tags": ["ai-apps", "adtech"],
             "thesis": "AI-driven ad engine monetizing apps."},
            {"ticker": "AKAM", "name": "Akamai Technologies", "exposure": "diversified", "tags": ["edge", "compute", "cdn"],
             "thesis": "Edge compute/CDN expanding into cloud."},
            {"ticker": "DOCN", "name": "DigitalOcean", "exposure": "moderate", "tags": ["cloud", "gpu"],
             "thesis": "Developer cloud with GPU offerings."},
            {"ticker": "S",    "name": "SentinelOne", "exposure": "moderate", "tags": ["security"],
             "thesis": "AI-native endpoint security."},
            {"ticker": "AI",   "name": "C3.ai", "exposure": "high", "tags": ["ai-apps", "enterprise"],
             "thesis": "Enterprise AI applications (speculative)."},
            {"ticker": "SOUN", "name": "SoundHound AI", "exposure": "high", "tags": ["ai-apps", "voice"],
             "thesis": "Voice AI platform (speculative)."},
            {"ticker": "APLD", "name": "Applied Digital", "exposure": "high", "tags": ["neocloud", "hpc", "hosting"],
             "thesis": "AI/HPC data-center hosting (speculative)."},
            {"ticker": "IREN", "name": "IREN", "exposure": "high", "tags": ["neocloud", "hpc", "gpu-cloud"],
             "thesis": "Bitcoin miner pivoting to AI HPC / GPU cloud (speculative)."},
            # --- expanded universe (small/mid-cap, $200M+) ---
            {"ticker": "GDS",  "name": "GDS Holdings (ADR)", "exposure": "high", "tags": ["data-center", "operator", "demand"],
             "thesis": "Major China data-center operator (ADR)."},
            {"ticker": "VNET", "name": "VNET Group (ADR)", "exposure": "high", "tags": ["data-center", "operator", "demand"],
             "thesis": "China internet data-center / colocation operator (ADR)."},
            {"ticker": "WULF", "name": "TeraWulf", "exposure": "high", "tags": ["neocloud", "hpc", "hosting"],
             "thesis": "Power-rich miner building AI/HPC data centers (speculative)."},
            {"ticker": "HUT",  "name": "Hut 8", "exposure": "high", "tags": ["neocloud", "hpc", "hosting"],
             "thesis": "Energy & compute infrastructure incl. AI/HPC (speculative)."},
            {"ticker": "CIFR", "name": "Cipher Mining", "exposure": "high", "tags": ["neocloud", "hpc", "gpu-cloud"],
             "thesis": "Bitcoin miner expanding into AI HPC hosting (speculative)."},
            {"ticker": "BTDR", "name": "Bitdeer Technologies", "exposure": "high", "tags": ["neocloud", "hpc", "hosting"],
             "thesis": "Compute hosting expanding into AI (speculative, ADR)."},
            {"ticker": "INOD", "name": "Innodata", "exposure": "high", "tags": ["ai-data", "data-engineering"],
             "thesis": "AI data engineering & model-training data services."},
            {"ticker": "FSLY", "name": "Fastly", "exposure": "high", "tags": ["edge", "inference", "cdn"],
             "thesis": "Edge compute/CDN for delivery & inference."},
            {"ticker": "BBAI", "name": "BigBear.ai", "exposure": "high", "tags": ["ai-apps", "analytics"],
             "thesis": "AI analytics & decision intelligence (speculative)."},
            {"ticker": "PL",   "name": "Planet Labs", "exposure": "moderate", "tags": ["geospatial", "ai-data"],
             "thesis": "Geospatial imagery & AI analytics data."},
            {"ticker": "GTLB", "name": "GitLab", "exposure": "moderate", "tags": ["devops", "software", "ai"],
             "thesis": "DevSecOps platform with AI features."},
            # --- expanded universe (micro-cap, $50M+) ---
            {"ticker": "VERI", "name": "Veritone", "exposure": "high", "tags": ["ai-apps", "media"],
             "thesis": "Enterprise AI applications & aiWARE platform (speculative micro-cap)."},
            {"ticker": "DOMO", "name": "Domo", "exposure": "moderate", "tags": ["analytics", "bi", "ai"],
             "thesis": "Cloud BI/analytics with AI features (micro-cap)."},
        ],
    },
]


def all_tickers():
    """Flat, de-duplicated list of every (non-excluded) ticker in the universe."""
    seen = []
    for layer in LAYERS:
        for h in layer["holdings"]:
            if h["ticker"] in seen or is_excluded(h["ticker"]):
                continue
            seen.append(h["ticker"])
    return seen


def layer_index():
    """Map ticker -> list of layer ids it appears in (for cross-layer awareness)."""
    idx = {}
    for layer in LAYERS:
        for h in layer["holdings"]:
            idx.setdefault(h["ticker"], []).append(layer["id"])
    return idx


# ---------------------------------------------------------------------- #
# User-added stocks — looked up in the app and assigned to a layer. Stored
# separately from the curated universe (in user_stocks.json) so they persist
# across restarts and never get tangled with hand-curated holdings.
_USER_STOCKS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_stocks.json")


def load_user_stocks():
    try:
        with open(_USER_STOCKS_PATH) as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:  # noqa: BLE001 — missing/corrupt file -> no user stocks
        return []


def _save_user_stocks(items):
    with open(_USER_STOCKS_PATH, "w") as f:
        json.dump(items, f, indent=2)


def _holding_from(item):
    return {
        "ticker": item["ticker"],
        "name": item.get("name") or item["ticker"],
        "exposure": item.get("exposure", "moderate"),
        "tags": item.get("tags", []),
        "thesis": item.get("thesis", ""),
        "user_added": True,
    }


def apply_user_stocks():
    """Merge persisted user stocks into LAYERS (call once at import)."""
    for item in load_user_stocks():
        layer = next((L for L in LAYERS if L["id"] == item.get("layer")), None)
        if not layer:
            continue
        if any(h["ticker"] == item["ticker"] for h in layer["holdings"]):
            continue
        layer["holdings"].append(_holding_from(item))


def add_user_stock(item):
    """Persist a user stock and merge it into the in-memory LAYERS immediately."""
    items = [x for x in load_user_stocks()
             if not (x["ticker"] == item["ticker"] and x["layer"] == item["layer"])]
    items.append(item)
    _save_user_stocks(items)
    layer = next((L for L in LAYERS if L["id"] == item["layer"]), None)
    if layer and not any(h["ticker"] == item["ticker"] for h in layer["holdings"]):
        layer["holdings"].append(_holding_from(item))


def remove_user_stock(ticker, layer_id):
    items = [x for x in load_user_stocks()
             if not (x["ticker"] == ticker and x["layer"] == layer_id)]
    _save_user_stocks(items)
    layer = next((L for L in LAYERS if L["id"] == layer_id), None)
    if layer:
        layer["holdings"] = [h for h in layer["holdings"]
                             if not (h["ticker"] == ticker and h.get("user_added"))]


apply_user_stocks()
