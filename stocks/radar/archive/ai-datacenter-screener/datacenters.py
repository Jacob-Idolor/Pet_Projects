"""
Curated global data-center infrastructure — the large AI/hyperscale campuses
that anchor the buildout. HAND-MAINTAINED from public announcements; capacities
are approximate and often the *planned / target* peak (a campus ramps over
years), not a live or audited figure.

Edit this file freely — it's the heart of the Global Map the way universe.py is
the heart of the screener. Sites announced later can also be added live from the
map UI (they persist in user_datacenters.json, separate from this curated list).

Each site:
    {
      "name": "...", "operator": "...",        # operator lists the key partners
      "lat": 32.45, "lng": -99.74,
      "mw": 1200,                                # approx peak / planned MW
      "status": "construction",                  # operational | construction | planned
      "power": "Gas",                            # Grid | Gas | Nuclear | Renewables | Hydro | Mixed
      "country": "USA", "region": "Texas",
      "note": "one-line context",
      "tickers": ["ORCL", "NVDA"],               # related public names in the screener
    }
"""

import json
import os

DISCLAIMER = (
    "Approximate, hand-curated figures from public announcements — many are "
    "planned/target peak capacity and may change. Not an authoritative feed."
)

# valid power-source buckets (used for the map's colour-by-power mode + filters)
POWER_SOURCES = ["Grid", "Gas", "Nuclear", "Renewables", "Hydro", "Mixed"]

SITES = [
    # ---- United States --------------------------------------------------
    {"name": "Stargate — Abilene", "operator": "OpenAI · Oracle · Crusoe · SoftBank",
     "lat": 32.45, "lng": -99.74, "mw": 1200, "status": "construction", "power": "Gas",
     "country": "USA", "region": "Texas",
     "note": "Flagship Stargate site; first OpenAI/Oracle supercluster, on-site gas turbines.",
     "tickers": ["ORCL", "NVDA", "CRWV", "VRT"]},
    {"name": "Meta Hyperion", "operator": "Meta · Entergy",
     "lat": 32.36, "lng": -91.74, "mw": 2000, "status": "construction", "power": "Gas",
     "country": "USA", "region": "Richland Parish, Louisiana",
     "note": "Meta's multi-GW campus, targeted toward ~5 GW; new Entergy gas plants.",
     "tickers": ["META", "ETR"]},
    {"name": "Meta Prometheus", "operator": "Meta",
     "lat": 40.08, "lng": -82.81, "mw": 1000, "status": "construction", "power": "Gas",
     "country": "USA", "region": "New Albany, Ohio",
     "note": "Meta's first ~1 GW+ AI supercluster, online in phases.",
     "tickers": ["META"]},
    {"name": "Project Rainier", "operator": "Amazon (AWS) · Anthropic",
     "lat": 41.70, "lng": -86.50, "mw": 2200, "status": "construction", "power": "Grid",
     "country": "USA", "region": "New Carlisle, Indiana",
     "note": "AWS campus dedicated to Anthropic training; ~2.2 GW planned.",
     "tickers": ["AMZN"]},
    {"name": "xAI Colossus", "operator": "xAI",
     "lat": 35.06, "lng": -90.02, "mw": 1000, "status": "operational", "power": "Gas",
     "country": "USA", "region": "Memphis, Tennessee",
     "note": "Live and expanding fast toward ~1 GW; on-site gas turbines.",
     "tickers": ["NVDA", "DELL", "SMCI"]},
    {"name": "Microsoft Fairwater", "operator": "Microsoft",
     "lat": 42.70, "lng": -87.90, "mw": 900, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Mount Pleasant, Wisconsin",
     "note": "Purpose-built AI datacenter; multi-billion-dollar buildout.",
     "tickers": ["MSFT"]},
    {"name": "AWS Madison County", "operator": "Amazon (AWS)",
     "lat": 32.46, "lng": -90.12, "mw": 1000, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Mississippi",
     "note": "~$10B AWS investment; large multi-building campus.", "tickers": ["AMZN"]},
    {"name": "AWS Cumulus (Susquehanna)", "operator": "Amazon (AWS) · Talen Energy",
     "lat": 41.09, "lng": -76.15, "mw": 960, "status": "construction", "power": "Nuclear",
     "country": "USA", "region": "Salem Township, Pennsylvania",
     "note": "Co-located with the Susquehanna nuclear plant for firm power.",
     "tickers": ["AMZN", "TLN"]},
    {"name": "Crane Clean Energy (Three Mile Island)", "operator": "Constellation · Microsoft",
     "lat": 40.15, "lng": -76.72, "mw": 835, "status": "construction", "power": "Nuclear",
     "country": "USA", "region": "Londonderry Twp, Pennsylvania",
     "note": "TMI Unit-1 restart, output contracted to Microsoft for AI.",
     "tickers": ["MSFT", "CEG"]},
    {"name": "Vantage Frontier", "operator": "Vantage Data Centers",
     "lat": 32.74, "lng": -99.33, "mw": 1400, "status": "construction", "power": "Gas",
     "country": "USA", "region": "Shackelford County, Texas",
     "note": "One of the largest single campuses announced (~1.4 GW).", "tickers": []},
    {"name": "Switch Citadel", "operator": "Switch",
     "lat": 39.53, "lng": -119.45, "mw": 650, "status": "operational", "power": "Renewables",
     "country": "USA", "region": "Tahoe-Reno, Nevada",
     "note": "Massive solar-backed colocation campus; expanding.", "tickers": []},
    {"name": "Data Center Alley", "operator": "Digital Realty · Equinix · QTS · …",
     "lat": 39.01, "lng": -77.46, "mw": 4000, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Loudoun County, Virginia",
     "note": "World's densest data-center cluster — multi-GW aggregate.",
     "tickers": ["DLR", "EQIX", "AMT"]},
    {"name": "Meta El Paso", "operator": "Meta",
     "lat": 31.85, "lng": -106.43, "mw": 1000, "status": "planned", "power": "Gas",
     "country": "USA", "region": "El Paso, Texas",
     "note": "Planned ~1 GW Meta campus in West Texas.", "tickers": ["META"]},
    {"name": "QTS Mesa / Phoenix", "operator": "QTS · hyperscalers",
     "lat": 33.42, "lng": -111.74, "mw": 800, "status": "construction", "power": "Renewables",
     "country": "USA", "region": "Arizona",
     "note": "Fast-growing desert hyperscale cluster (solar-heavy grid).", "tickers": []},
    {"name": "CoreWeave Denton", "operator": "CoreWeave",
     "lat": 33.21, "lng": -97.13, "mw": 500, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Denton, Texas",
     "note": "GPU-cloud capacity for the neocloud buildout.", "tickers": ["CRWV"]},
    {"name": "Google Council Bluffs", "operator": "Alphabet (Google)",
     "lat": 41.22, "lng": -95.85, "mw": 600, "status": "operational", "power": "Renewables",
     "country": "USA", "region": "Iowa",
     "note": "Long-running large Google campus; wind-heavy grid.", "tickers": ["GOOGL"]},
    {"name": "Google Pryor", "operator": "Alphabet (Google)",
     "lat": 36.31, "lng": -95.27, "mw": 500, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Oklahoma",
     "note": "MidAmerica Industrial Park campus, repeatedly expanded.", "tickers": ["GOOGL"]},
    {"name": "Stargate Lordstown", "operator": "OpenAI · SoftBank",
     "lat": 41.13, "lng": -80.85, "mw": 500, "status": "planned", "power": "Grid",
     "country": "USA", "region": "Lordstown, Ohio",
     "note": "Announced additional Stargate site.", "tickers": ["ORCL"]},
    {"name": "AWS Boardman", "operator": "Amazon (AWS)",
     "lat": 45.84, "lng": -119.70, "mw": 500, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Oregon",
     "note": "Large established AWS US-West campus.", "tickers": ["AMZN"]},
    {"name": "Meta Prineville", "operator": "Meta",
     "lat": 44.30, "lng": -120.83, "mw": 500, "status": "operational", "power": "Renewables",
     "country": "USA", "region": "Oregon",
     "note": "One of Meta's oldest and largest campuses.", "tickers": ["META"]},
    {"name": "Meta Kuna", "operator": "Meta",
     "lat": 43.49, "lng": -116.42, "mw": 250, "status": "construction", "power": "Renewables",
     "country": "USA", "region": "Idaho",
     "note": "New Meta campus backed by new solar.", "tickers": ["META"]},
    {"name": "Microsoft Atlanta", "operator": "Microsoft",
     "lat": 33.75, "lng": -84.39, "mw": 324, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Georgia", "note": "Azure AI region buildout.",
     "tickers": ["MSFT"]},

    # ---- Europe ---------------------------------------------------------
    {"name": "Stargate Norway", "operator": "Nscale · Aker · OpenAI",
     "lat": 68.44, "lng": 17.43, "mw": 520, "status": "planned", "power": "Hydro",
     "country": "Norway", "region": "Narvik",
     "note": "Hydro-powered Stargate site for European capacity.", "tickers": []},
    {"name": "Meta Luleå", "operator": "Meta",
     "lat": 65.58, "lng": 22.15, "mw": 250, "status": "operational", "power": "Hydro",
     "country": "Sweden", "region": "Luleå",
     "note": "Meta's flagship Nordic campus on hydro power.", "tickers": ["META"]},
    {"name": "Google Hamina", "operator": "Alphabet (Google)",
     "lat": 60.57, "lng": 27.18, "mw": 400, "status": "operational", "power": "Renewables",
     "country": "Finland", "region": "Hamina",
     "note": "Seawater-cooled Google campus, wind-backed.", "tickers": ["GOOGL"]},
    {"name": "Dublin Cluster", "operator": "AWS · Microsoft · Google",
     "lat": 53.41, "lng": -6.27, "mw": 600, "status": "operational", "power": "Grid",
     "country": "Ireland", "region": "Dublin",
     "note": "Europe's largest hyperscale concentration (grid-constrained).",
     "tickers": ["AMZN", "MSFT", "GOOGL"]},
    {"name": "Microsoft Middenmeer", "operator": "Microsoft",
     "lat": 52.81, "lng": 4.99, "mw": 300, "status": "operational", "power": "Renewables",
     "country": "Netherlands", "region": "North Holland",
     "note": "Wind-backed Azure campus.", "tickers": ["MSFT"]},
    {"name": "AWS Aragón", "operator": "Amazon (AWS)",
     "lat": 41.60, "lng": -0.90, "mw": 300, "status": "construction", "power": "Renewables",
     "country": "Spain", "region": "Aragón",
     "note": "AWS Europe (Spain) region, solar/wind-backed.", "tickers": ["AMZN"]},
    {"name": "nScale Loughton", "operator": "nScale · Microsoft",
     "lat": 51.65, "lng": 0.05, "mw": 300, "status": "planned", "power": "Grid",
     "country": "UK", "region": "Essex",
     "note": "UK AI capacity tied to a Microsoft offtake.", "tickers": ["MSFT"]},
    {"name": "Mistral · Eclairion", "operator": "Mistral AI · Eclairion",
     "lat": 48.60, "lng": 2.20, "mw": 250, "status": "planned", "power": "Nuclear",
     "country": "France", "region": "Essonne",
     "note": "French sovereign-AI cluster on a nuclear-heavy grid.", "tickers": []},

    # ---- Middle East ----------------------------------------------------
    {"name": "Stargate UAE", "operator": "OpenAI · G42 · Oracle · NVIDIA",
     "lat": 24.45, "lng": 54.37, "mw": 5000, "status": "planned", "power": "Mixed",
     "country": "UAE", "region": "Abu Dhabi",
     "note": "Announced ~5 GW Stargate cluster; phase-1 ~1 GW (solar + gas + nuclear).",
     "tickers": ["ORCL", "NVDA"]},
    {"name": "HUMAIN", "operator": "HUMAIN · NVIDIA · AMD",
     "lat": 24.71, "lng": 46.68, "mw": 500, "status": "planned", "power": "Mixed",
     "country": "Saudi Arabia", "region": "Riyadh",
     "note": "Saudi sovereign-AI compute buildout with US chipmakers.",
     "tickers": ["NVDA", "AMD"]},

    # ---- Asia-Pacific ---------------------------------------------------
    {"name": "Reliance Jamnagar", "operator": "Reliance · NVIDIA",
     "lat": 22.47, "lng": 70.06, "mw": 1000, "status": "planned", "power": "Renewables",
     "country": "India", "region": "Gujarat",
     "note": "Reliance gigawatt-scale AI DC, solar-powered (planned multi-GW).",
     "tickers": ["NVDA"]},
    {"name": "Johor (Sedenak) Cluster", "operator": "YTL · AWS · Microsoft · ByteDance",
     "lat": 1.55, "lng": 103.66, "mw": 2000, "status": "construction", "power": "Grid",
     "country": "Malaysia", "region": "Johor",
     "note": "SE-Asia's fastest-growing hyperscale cluster (overflow from Singapore).",
     "tickers": ["AMZN", "MSFT"]},
    {"name": "Stargate Japan (Sharp Sakai)", "operator": "SoftBank · OpenAI",
     "lat": 34.57, "lng": 135.47, "mw": 300, "status": "construction", "power": "Grid",
     "country": "Japan", "region": "Sakai, Osaka",
     "note": "Stargate Japan; a converted Sharp LCD plant.", "tickers": []},
    {"name": "Stargate Korea", "operator": "OpenAI · SK · Samsung",
     "lat": 36.02, "lng": 129.34, "mw": 500, "status": "planned", "power": "Grid",
     "country": "South Korea", "region": "Pohang",
     "note": "Announced Korean Stargate site with SK/Samsung.", "tickers": ["ORCL"]},
    {"name": "GDS Ulanqab", "operator": "GDS Holdings",
     "lat": 41.0, "lng": 113.1, "mw": 500, "status": "operational", "power": "Grid",
     "country": "China", "region": "Inner Mongolia",
     "note": "Hyperscale campus serving Beijing-region demand.", "tickers": ["GDS"]},
    {"name": "VNET Hebei", "operator": "VNET Group",
     "lat": 39.5, "lng": 116.0, "mw": 500, "status": "operational", "power": "Grid",
     "country": "China", "region": "Hebei",
     "note": "Large wholesale IDC capacity near Beijing.", "tickers": ["VNET"]},
    {"name": "China Mobile Hohhot", "operator": "China Mobile",
     "lat": 40.84, "lng": 111.75, "mw": 500, "status": "operational", "power": "Renewables",
     "country": "China", "region": "Inner Mongolia",
     "note": "State-operator mega-campus on wind/solar-heavy grid.", "tickers": []},
    {"name": "Sydney Cluster", "operator": "AWS · Equinix · Microsoft",
     "lat": -33.87, "lng": 151.21, "mw": 300, "status": "operational", "power": "Grid",
     "country": "Australia", "region": "New South Wales",
     "note": "APAC hyperscale hub for AWS/Azure regions.", "tickers": ["AMZN", "EQIX"]},

    # ---- South America --------------------------------------------------
    {"name": "Scala São Paulo", "operator": "Scala Data Centers · AWS",
     "lat": -23.55, "lng": -46.63, "mw": 250, "status": "construction", "power": "Renewables",
     "country": "Brazil", "region": "São Paulo",
     "note": "Latin America's largest AI-ready campus, hydro/renewables-backed.",
     "tickers": ["AMZN"]},

    # ---- smaller campuses, neoclouds & colocation (100–500 MW) ----------
    {"name": "Applied Digital — Polaris Forge", "operator": "Applied Digital",
     "lat": 46.00, "lng": -98.53, "mw": 400, "status": "construction", "power": "Renewables",
     "country": "USA", "region": "Ellendale, North Dakota",
     "note": "Purpose-built HPC campus on stranded wind power; CoreWeave tenant.",
     "tickers": ["APLD", "CRWV"]},
    {"name": "Nebius Kansas City", "operator": "Nebius",
     "lat": 39.10, "lng": -94.58, "mw": 300, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Missouri",
     "note": "Neocloud GPU capacity buildout.", "tickers": ["NBIS"]},
    {"name": "TeraWulf — Lake Mariner", "operator": "TeraWulf",
     "lat": 43.29, "lng": -78.69, "mw": 250, "status": "operational", "power": "Hydro",
     "country": "USA", "region": "Barker, New York",
     "note": "Hydro-powered miner converting to AI/HPC hosting.", "tickers": ["WULF"]},
    {"name": "Cipher — Barber Lake", "operator": "Cipher Mining",
     "lat": 32.45, "lng": -101.48, "mw": 300, "status": "construction", "power": "Gas",
     "country": "USA", "region": "Texas",
     "note": "Bitcoin miner building HPC/AI hosting in West Texas.", "tickers": ["CIFR"]},
    {"name": "Bitdeer — Rockdale", "operator": "Bitdeer",
     "lat": 30.65, "lng": -97.00, "mw": 350, "status": "operational", "power": "Gas",
     "country": "USA", "region": "Texas",
     "note": "Large miner pivoting capacity toward AI.", "tickers": ["BTDR"]},
    {"name": "Google Lenoir", "operator": "Alphabet (Google)",
     "lat": 35.91, "lng": -81.54, "mw": 300, "status": "operational", "power": "Grid",
     "country": "USA", "region": "North Carolina",
     "note": "Established Google Southeast campus.", "tickers": ["GOOGL"]},
    {"name": "Meta DeKalb", "operator": "Meta",
     "lat": 41.93, "lng": -88.75, "mw": 300, "status": "construction", "power": "Renewables",
     "country": "USA", "region": "Illinois",
     "note": "Solar-backed Meta campus near Chicago.", "tickers": ["META"]},
    {"name": "Microsoft Quincy", "operator": "Microsoft",
     "lat": 47.23, "lng": -119.85, "mw": 300, "status": "operational", "power": "Hydro",
     "country": "USA", "region": "Washington",
     "note": "Columbia-River hydro-powered Azure campus.", "tickers": ["MSFT"]},
    {"name": "AWS Columbus", "operator": "Amazon (AWS)",
     "lat": 40.03, "lng": -83.13, "mw": 350, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Ohio",
     "note": "Central-Ohio AWS region cluster.", "tickers": ["AMZN"]},
    {"name": "Microsoft Cheyenne", "operator": "Microsoft",
     "lat": 41.14, "lng": -104.82, "mw": 250, "status": "operational", "power": "Renewables",
     "country": "USA", "region": "Wyoming",
     "note": "Wind-backed Azure campus.", "tickers": ["MSFT"]},
    {"name": "Crusoe Iceland", "operator": "Crusoe",
     "lat": 64.13, "lng": -21.90, "mw": 120, "status": "operational", "power": "Hydro",
     "country": "Iceland", "region": "Reykjavík",
     "note": "Geothermal/hydro-powered GPU capacity.", "tickers": []},
    {"name": "AirTrunk Tokyo", "operator": "AirTrunk",
     "lat": 35.68, "lng": 139.76, "mw": 300, "status": "operational", "power": "Grid",
     "country": "Japan", "region": "Tokyo",
     "note": "Hyperscale colocation for APAC cloud regions.", "tickers": []},
    {"name": "STT GDC Navi Mumbai", "operator": "STT GDC",
     "lat": 19.03, "lng": 73.02, "mw": 250, "status": "construction", "power": "Grid",
     "country": "India", "region": "Maharashtra",
     "note": "Major Indian hyperscale colocation campus.", "tickers": []},
    {"name": "Yotta Greater Noida", "operator": "Yotta (Hiranandani)",
     "lat": 28.47, "lng": 77.50, "mw": 200, "status": "construction", "power": "Grid",
     "country": "India", "region": "Uttar Pradesh",
     "note": "GPU-cloud campus (NVIDIA partnership).", "tickers": ["NVDA"]},
    {"name": "OVHcloud Gravelines", "operator": "OVHcloud",
     "lat": 51.00, "lng": 2.13, "mw": 200, "status": "operational", "power": "Nuclear",
     "country": "France", "region": "Hauts-de-France",
     "note": "Large European cloud campus on a nuclear-heavy grid.", "tickers": []},
    {"name": "EcoDataCenter Falun", "operator": "EcoDataCenter",
     "lat": 60.61, "lng": 15.63, "mw": 150, "status": "operational", "power": "Hydro",
     "country": "Sweden", "region": "Dalarna",
     "note": "Carbon-negative HPC site on hydro power.", "tickers": []},
    {"name": "Equinix Frankfurt", "operator": "Equinix",
     "lat": 50.11, "lng": 8.68, "mw": 200, "status": "operational", "power": "Grid",
     "country": "Germany", "region": "Frankfurt",
     "note": "Core European interconnection hub.", "tickers": ["EQIX"]},
    {"name": "Digital Realty Singapore", "operator": "Digital Realty",
     "lat": 1.35, "lng": 103.84, "mw": 150, "status": "operational", "power": "Grid",
     "country": "Singapore", "region": "Singapore",
     "note": "Premium colocation in a power-constrained market.", "tickers": ["DLR"]},

    # ---- emerging-market & edge campuses (50–250 MW) --------------------
    {"name": "Teraco JB1", "operator": "Teraco (Digital Realty)",
     "lat": -26.15, "lng": 28.06, "mw": 120, "status": "operational", "power": "Grid",
     "country": "South Africa", "region": "Johannesburg",
     "note": "Africa's largest interconnection hub.", "tickers": ["DLR"]},
    {"name": "Open Access DC", "operator": "Open Access Data Centres",
     "lat": 6.45, "lng": 3.40, "mw": 60, "status": "construction", "power": "Gas",
     "country": "Nigeria", "region": "Lagos",
     "note": "West-Africa carrier-neutral campus.", "tickers": []},
    {"name": "Africa Data Centres", "operator": "Africa Data Centres",
     "lat": -1.29, "lng": 36.82, "mw": 50, "status": "construction", "power": "Grid",
     "country": "Kenya", "region": "Nairobi",
     "note": "East-Africa cloud on-ramp.", "tickers": []},
    {"name": "Ascenty Campinas", "operator": "Ascenty (Digital Realty)",
     "lat": -22.90, "lng": -47.06, "mw": 100, "status": "operational", "power": "Renewables",
     "country": "Brazil", "region": "Campinas",
     "note": "Major Brazilian hyperscale campus.", "tickers": ["DLR"]},
    {"name": "KIO Querétaro", "operator": "KIO Networks",
     "lat": 20.59, "lng": -100.39, "mw": 150, "status": "construction", "power": "Renewables",
     "country": "Mexico", "region": "Querétaro",
     "note": "Mexico's fast-growing data-center corridor.", "tickers": []},
    {"name": "CtrlS Hyderabad", "operator": "CtrlS",
     "lat": 17.43, "lng": 78.40, "mw": 150, "status": "operational", "power": "Grid",
     "country": "India", "region": "Hyderabad",
     "note": "Large Indian hyperscale operator.", "tickers": []},
    {"name": "Princeton Digital Jakarta", "operator": "Princeton Digital Group",
     "lat": -6.20, "lng": 106.85, "mw": 100, "status": "construction", "power": "Grid",
     "country": "Indonesia", "region": "Jakarta",
     "note": "Indonesian hyperscale capacity.", "tickers": []},
    {"name": "Khazna Abu Dhabi", "operator": "Khazna (G42)",
     "lat": 24.47, "lng": 54.60, "mw": 200, "status": "operational", "power": "Mixed",
     "country": "UAE", "region": "Abu Dhabi",
     "note": "G42's wholesale colocation arm.", "tickers": []},
    {"name": "Stack Toronto", "operator": "Stack Infrastructure",
     "lat": 43.65, "lng": -79.38, "mw": 100, "status": "operational", "power": "Hydro",
     "country": "Canada", "region": "Ontario",
     "note": "Hydro-powered Canadian campus.", "tickers": []},
    {"name": "Green Mountain Stavanger", "operator": "Green Mountain",
     "lat": 58.97, "lng": 5.73, "mw": 100, "status": "operational", "power": "Hydro",
     "country": "Norway", "region": "Rogaland",
     "note": "100% hydro, fjord-cooled.", "tickers": []},
    {"name": "Vantage Berlin", "operator": "Vantage Data Centers",
     "lat": 52.52, "lng": 13.40, "mw": 150, "status": "construction", "power": "Renewables",
     "country": "Germany", "region": "Berlin",
     "note": "New German hyperscale campus.", "tickers": []},
    {"name": "NEXTDC Melbourne", "operator": "NEXTDC",
     "lat": -37.81, "lng": 144.96, "mw": 150, "status": "operational", "power": "Grid",
     "country": "Australia", "region": "Victoria",
     "note": "Australian hyperscale operator.", "tickers": []},
    {"name": "Meta Gallatin", "operator": "Meta",
     "lat": 36.39, "lng": -86.45, "mw": 200, "status": "construction", "power": "Grid",
     "country": "USA", "region": "Tennessee",
     "note": "New Meta Southeast campus.", "tickers": ["META"]},
    {"name": "Google Clarksville", "operator": "Alphabet (Google)",
     "lat": 36.53, "lng": -87.36, "mw": 150, "status": "operational", "power": "Renewables",
     "country": "USA", "region": "Tennessee",
     "note": "Solar-backed Google campus.", "tickers": ["GOOGL"]},
    {"name": "Microsoft Boydton", "operator": "Microsoft",
     "lat": 36.66, "lng": -78.38, "mw": 250, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Virginia",
     "note": "Long-running Azure East campus.", "tickers": ["MSFT"]},
    {"name": "Lambda San Francisco", "operator": "Lambda",
     "lat": 37.77, "lng": -122.42, "mw": 80, "status": "operational", "power": "Grid",
     "country": "USA", "region": "California",
     "note": "GPU-cloud capacity for AI developers.", "tickers": []},
    {"name": "CoreWeave Las Vegas", "operator": "CoreWeave",
     "lat": 36.17, "lng": -115.14, "mw": 100, "status": "operational", "power": "Grid",
     "country": "USA", "region": "Nevada",
     "note": "Neocloud GPU region.", "tickers": ["CRWV"]},
]


# ---------------------------------------------------------------------- #
# User-added sites — logged from the map UI as new campuses are announced.
# Stored separately so they never tangle with the hand-curated SITES list.
_USER_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "user_datacenters.json")


def load_user_datacenters():
    try:
        with open(_USER_PATH) as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except Exception:  # noqa: BLE001 — missing/corrupt file -> none
        return []


def _save_user_datacenters(items):
    with open(_USER_PATH, "w") as f:
        json.dump(items, f, indent=2)


def add_user_datacenter(item):
    """Persist a user-added site (de-duped by name); returns the stored item."""
    items = [x for x in load_user_datacenters() if x.get("name") != item.get("name")]
    item["user_added"] = True
    items.append(item)
    _save_user_datacenters(items)
    return item


def remove_user_datacenter(name):
    items = [x for x in load_user_datacenters() if x.get("name") != name]
    _save_user_datacenters(items)


def datacenter_sites(min_mw=0):
    """Curated + user-added sites at/above the threshold, biggest first."""
    merged = SITES + load_user_datacenters()
    out = [s for s in merged if (s.get("mw") or 0) >= min_mw]
    out.sort(key=lambda s: s.get("mw") or 0, reverse=True)
    return out
