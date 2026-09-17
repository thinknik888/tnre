#!/usr/bin/env python3
"""
Townhome communities for Dixie & Lakeshore -- one data file, every page.

    python3 scripts/build_town_pages.py

Writes a project page per community under buildings/, then regenerates the
townhome cards, the compare table and the counts on
neighbourhoods/dixie-lakeshore.html (and the homepage card) from the same data.

To add or update a community: edit its entry in PROJECTS (and ORDER), re-run.
Images come from scripts/import_renderings.py, which writes the responsive
AVIF/WebP ladder into buildings/images/towns/.
"""

import html
import os
from urllib.parse import quote

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "buildings")
IMG_DIR = os.path.join(OUT_DIR, "images", "towns")

HERO_W = [480, 800, 1280, 1920, 2560]
CARD_W = [480, 800, 1280]


# --------------------------------------------------------------------------
# data
# --------------------------------------------------------------------------

PROJECTS = {
    "pier-house-towns": {
        "name": "Pier House Towns",
        "builder": "Branthaven",
        "status": "Sold out",
        "tagline": "Live the lake. Love the city.",
        "address": "South of Lakeshore Rd E &amp; Dixie Rd, Mississauga",
        "area": "Lakeview Village",
        "hero": "pier-house-hero",
        "hero_alt": "Pier House Towns streetscape rendering",
        "meta": "Pier House Towns by Branthaven at Lakeview Village, Mississauga. "
                "164 three-storey townhomes from $819,900. Full price list, floor plan "
                "series, incentives and deposit structure.",
        "facts": [
            ("From", "$819,900"),
            ("Size", "1,255 &ndash; 2,195 sq ft"),
            ("Bedrooms", "2 &ndash; 5"),
            ("Storeys", "3"),
            ("Homes", "164"),
            ("Parking", "2 &ndash; 4 spaces"),
        ],
        "intro": [
            "Introducing Pier House, Branthaven&rsquo;s townhome enclave inside the "
            "visionary Lakeview Village master plan &mdash; a 177-acre waterfront "
            "revitalization that will reshape Mississauga&rsquo;s shoreline with new "
            "parks, trails, cultural amenities and conservation lands.",
            "Four contemporary collections of family-sized, three-storey homes, each "
            "with outdoor space, an above-grade private garage and a driveway. One "
            "minute&rsquo;s walk to the waterfront pier; a twenty-minute commute "
            "downtown via Long Branch GO, the TTC loop or the QEW.",
        ],
        "tables": [
            {
                "title": "Price list",
                "note": "Starting prices and square footage. Premiums vary by elevation "
                        "and lot. Purchase price includes HST. Builder list dated April 25, 2026.",
                "cols": ["Model", "Beds", "Condition", "Sq ft", "Outdoor space", "From"],
                "groups": [
                    ("21&prime; Back to Back Series", [
                        ["The Cumberland", "2", "Interior", "1,255", "2 balconies", "$819,900"],
                        ["The Elmvale", "3", "Interior", "1,380", "2 balconies", "$869,900"],
                        ["The Elmvale", "3", "End", "1,420", "2 balconies", "$929,900"],
                        ["The Link", "3", "Interior", "1,425", "2 balconies", "$889,900"],
                        ["The Link", "3", "End", "1,465", "2 balconies", "$934,900"],
                        ["The Link", "3", "Flankage", "1,515", "2 balconies", "$945,900"],
                        ["The Mews", "3", "Corner", "1,670", "2 balconies", "$969,900"],
                    ]),
                    ("16&prime; Rear Lane Series", [
                        ["The Drift", "2&ndash;4", "Interior", "1,740", "2 balconies", "$1,019,900"],
                        ["The Drift", "2&ndash;4", "End", "1,790", "2 balconies", "$1,070,900"],
                    ]),
                    ("18&prime; Garden Series", [
                        ["The Elmswood", "3&ndash;4", "Interior", "1,810",
                         "Backyard + 2nd-storey deck + 3rd-storey balcony", "$1,149,900"],
                        ["The Elmswood", "3&ndash;4", "End", "1,915",
                         "Backyard + 2nd-storey deck + 3rd-storey balcony", "$1,199,900"],
                    ]),
                    ("20&prime; Rear Lane Series", [
                        ["The Bluffs", "3&ndash;5", "Interior", "2,110",
                         "2 balconies &middot; double garage", "$1,264,900"],
                    ]),
                ],
            },
            {
                "title": "Optional floor plan upgrades",
                "note": "",
                "cols": ["Model", "Plan option", "Cost"],
                "groups": [("", [
                    ["16&prime; The Drift", "Ground floor guest suite", "$18,500"],
                    ["16&prime; The Drift", "Third floor luxury ensuite", "$7,000"],
                    ["16&prime; The Drift", "Third floor dual primary bedrooms", "$8,000"],
                    ["18&prime; The Elmswood", "Ground floor guest suite", "$20,000"],
                    ["18&prime; The Elmswood", "Third floor luxury ensuite", "$8,500"],
                    ["20&prime; The Bluffs", "Ground floor guest suite", "$19,000"],
                    ["20&prime; The Bluffs", "Third floor fourth bedroom", "$4,000"],
                ])],
            },
        ],
        "incentives": [
            "4-piece stainless steel kitchen appliance package with white washer &amp; dryer",
            "$8,000 d&eacute;cor dollars",
            "1 year free POTL fees",
            "Free assignment (admin &amp; legal fees apply)",
            "$0 capped development charges",
            "Quartz counters in kitchen and bathrooms",
            "Prefinished oak engineered hardwood on ground, second and third floor hallways",
            "9&prime; ceilings on the ground and second floor, smooth ceilings throughout",
            "Central air conditioning, professionally sized and installed",
            "Smart thermostat, USB charging receptacles, integrated LED nightlights",
        ],
        "deposit": {
            "title": "Deposit &mdash; 10% total",
            "rows": [
                ("At signing", "$5,000"),
                ("30 &ndash; 240 days", "$8,500 &times; 8 &nbsp;<span class=\"dim\">(21&prime; B2B)</span><br>"
                                        "$10,000 &times; 8 &nbsp;<span class=\"dim\">(all other series)</span>"),
                ("270 days", "Balance to 10%"),
            ],
            "foot": "Payable to Brattys LLP, In Trust. POTL fee $110/month covers landscaping "
                    "and maintenance of common areas and roadway snow clearing.",
        },
        "commute": [
            ("4 min", "Long Branch GO Station"),
            ("4 min", "TTC Long Branch Loop"),
            ("5 min", "QEW / 427"),
            ("6 min", "Sherway Gardens"),
            ("9 min", "Queensway Hospital"),
            ("15 min", "Pearson Airport"),
            ("20 min", "Downtown Toronto"),
        ],
        "gallery": [
            ("pier-house-street", "Pier House Towns streetscape"),
            ("pier-house-b2b-front", "21 foot back-to-back elevation"),
            ("pier-house-18-front", "18 foot garden series front elevation"),
            ("pier-house-20-front", "20 foot rear lane series front elevation"),
            ("pier-house-16-back", "16 foot rear lane series rear elevation"),
            ("pier-house-aerial", "Aerial view of Pier House Towns"),
            ("pier-house-kitchen", "Pier House Towns kitchen interior"),
            ("pier-house-living", "Pier House Towns living room interior"),
            ("pier-house-bedroom", "Pier House Towns bedroom interior"),
            ("pier-house-backyard", "Pier House Towns backyard"),
        ],
        "source": "Branthaven price list dated April 25, 2026 and Pier House quick facts.",
        "card": {
            "image": "pier-house-b2b-front",
            "image_alt": "Pier House Towns exterior rendering",
            "flag": ("Sold out", "sold"),
            "location": "Lakeview Village &middot; South of Lakeshore Rd E &amp; Dixie Rd",
            "specs": [("Size", "1,255 &ndash; 2,195 sq ft"), ("Bedrooms", "2 &ndash; 5"),
                      ("Storeys", "3"), ("Parking", "2 &ndash; 4 spaces")],
            "price": "$819,900",
        },
        "compare": {
            "short": "Pier House Towns", "builder": "Branthaven",
            "price": "$819,900", "ceiling": "$1,264,900",
            "size": "1,255 &ndash; 2,195 sq ft", "ppsf": "~$653",
            "beds": "2 &ndash; 5", "storeys": "3-storey traditional",
            "parking": "Private garage + driveway<br>2 &ndash; 4 spaces",
            "outdoor": "Balconies, decks, backyards",
            "deposit": "10% total<br>$5,000 at signing, to 270 days",
            "occupancy": "See sales office", "fees": "POTL $110/mo",
            "incentive": "$8,000 d&eacute;cor dollars &middot; appliances &middot; 1 yr free POTL "
                         "&middot; free assignment &middot; $0 capped DCs",
            "homes": "164 &ndash; 165",
            "dated": "April 25, 2026 (Pier House)",
        },
    },

    "aura-lakeview-towns": {
        "name": "Aura Lakeview Village Towns",
        "builder": "Caivan",
        "status": "Sold out",
        "tagline": "Exceptional lakeside townhomes.",
        "address": "Lakeshore Rd E between Cawthra Rd &amp; Dixie Rd, Mississauga",
        "area": "Lakeview Village",
        "hero": "aura-hero",
        "hero_alt": "Aura Lakeview Village Towns exterior rendering",
        "meta": "Aura Lakeview Village Towns by Caivan on Lakeshore Rd E, Mississauga. "
                "Two-storey urban towns 811&ndash;1,138 sq ft from $539,990, with "
                "first-time buyer pricing from $499,106. Price list and available lots.",
        "facts": [
            ("From", "$539,990"),
            ("FTHB from", "$499,106"),
            ("Size", "811 &ndash; 1,138 sq ft"),
            ("Bedrooms", "2 &ndash; 3"),
            ("Baths", "1.5 &ndash; 2"),
            ("Occupancy", "Summer 2027"),
        ],
        "intro": [
            "Aura sits a two-minute walk from the Lake Ontario waterfront inside "
            "Lakeview Village &mdash; Canada&rsquo;s most transformative waterfront "
            "community, designed for healthier, future-ready living.",
            "Two-storey urban towns in Main and Upper Residences, with underground "
            "parking, built-in retail and offices, and the lowest entry point in the "
            "GTA for new townhome living at the waterfront.",
        ],
        "tables": [
            {
                "title": "Price list &mdash; Block 1",
                "note": "Pre-launch offer is after tax. First-time buyer pricing is before tax "
                        "and guaranteed for eligible FTHB purchasers. Builder list dated February 24, 2026.",
                "cols": ["Model", "Type", "Sq ft", "List price", "Pre-launch offer", "FTHB tax-free"],
                "groups": [
                    ("Main Residences", [
                        ["The Echo", "2 bedrooms", "811", "$599,990", "$539,990", "$499,106"],
                        ["The Echo End", "2 bedrooms", "836", "$634,990", "$574,990", "$530,080"],
                        ["The Lux (Corner)", "3 bed (opt. 2)", "986", "$679,990", "$619,990", "$569,903"],
                        ["The Prism (End)", "3 bedrooms", "986", "$709,990", "$649,990", "$596,451"],
                    ]),
                    ("Upper Residences", [
                        ["The Halo", "2 bedrooms", "957", "$659,990", "$599,990", "$552,204"],
                        ["The Halo End", "2 bedrooms", "977", "$699,990", "$639,990", "$587,602"],
                        ["The Nova (Corner)", "3 bed (opt. 2)", "1,138", "$759,990", "$699,990", "$640,699"],
                    ]),
                ],
            },
            {
                "title": "Add-ons",
                "note": "",
                "cols": ["Item", "Cost"],
                "groups": [("", [
                    ["Electric vehicle charging station (supply &amp; installation)", "$10,600 + tax"],
                    ["Tandem parking stall with locker (by waitlist)", "$39,900 + tax"],
                ])],
            },
        ],
        "incentives": [
            "Exclusive tax rebate guarantee &mdash; GST + PST rebates for eligible first-time buyers",
            "Extended deposit structure &mdash; only $55,000 until occupancy",
            "6-piece appliance package",
            "1-car underground parking spot",
            "Condo fees waived for 12 months",
            "$0 development charge cap",
            "$5,000 total closing cost cap",
            "Right to lease",
            "Free assignments (legal fees apply)",
        ],
        "deposit": {
            "title": "Deposit &mdash; $65,000 total",
            "rows": [
                ("At signing", "$10,000"),
                ("30 / 60 / 90 days", "$7,500 each"),
                ("150 / 210 / 330 days", "$7,500 each"),
                ("At occupancy", "$10,000"),
            ],
            "foot": "Initial deposit by bank draft, payable to Bennett Jones LLP, In Trust. "
                    "Bring government photo ID for each purchaser and a mortgage pre-approval letter.",
        },
        "commute": [
            ("2 min walk", "Lake Ontario waterfront"),
            ("At your door", "Parks and nature trails"),
            ("Built-in", "Retail, offices and restaurants"),
            ("Quick access", "GO Transit, QEW and Highway 427"),
        ],
        "gallery": [
            ("aura-lakefront", "Aura Lakeview Village Towns at Ogden Park"),
            ("aura-streetscape", "Aura community streetscape along the waterway"),
            ("aura-kitchen", "Aura Lakeview Village Towns kitchen interior"),
            ("aura-living", "Aura Lakeview Village Towns living room interior"),
            ("aura-bedroom", "Aura Lakeview Village Towns main bedroom interior"),
        ],
        "source": "Caivan price list and available-lot list dated February 24, 2026.",
        "card": {
            "image": "aura-hero",
            "image_alt": "Aura Lakeview Village Towns exterior rendering",
            "flag": ("Sold out", "sold"),
            "location": "Lakeview Village &middot; Lakeshore Rd E between Cawthra &amp; Dixie",
            "specs": [("Size", "811 &ndash; 1,138 sq ft"), ("Bedrooms", "2 &ndash; 3"),
                      ("Storeys", "2 &middot; Urban town"), ("Parking", "1 underground")],
            "price": "$539,990",
        },
        "compare": {
            "short": "Aura Lakeview Village", "builder": "Caivan",
            "price": "$539,990", "ceiling": "$699,990",
            "size": "811 &ndash; 1,138 sq ft", "ppsf": "~$666",
            "beds": "2 &ndash; 3", "storeys": "2-storey urban town",
            "parking": "1 underground space<br>Tandem + locker $39,900",
            "outdoor": "Terrace / balcony",
            "deposit": "$65,000 total<br>$10,000 at signing",
            "occupancy": "Summer 2027", "fees": "Condo fees waived 12 months",
            "incentive": "FTHB pricing from $499,106 &middot; $0 DC cap &middot; $5,000 closing "
                         "cost cap &middot; free assignments &middot; right to lease",
            "homes": "Block 1 releasing",
            "dated": "February 24, 2026 (Aura)",
        },
    },

    "south-banks": {
        "name": "South Banks",
        "builder": "DECO Homes &amp; OPUS Homes",
        "status": "Coming soon &middot; price list Sept 22",
        "status_kind": "new",
        "tagline": "Coastal townhomes in Lakeview Village.",
        "address": "Jim Tovey Blvd &amp; Marina Vista &middot; Lakeview Village, Mississauga",
        "area": "Lakeview Village",
        "hero": "south-banks-hero",
        "hero_alt": "South Banks townhomes exterior rendering",
        # Portrait rendering: on desktop, show it whole beside the title instead
        # of stretching it full-bleed (which crops it to a strip of wall).
        "hero_layout": "split",
        "meta": "South Banks by DECO Homes and OPUS Homes &mdash; coastal townhomes in Lakeview "
                "Village, Mississauga. 2&ndash;4 bedrooms, rooftop terraces, from $549,990. "
                "Full price list and floor plans September 22, 2026.",
        "facts": [
            ("From", "$549,990*"),
            ("Bedrooms", "2 &ndash; 4"),
            ("Baths", "2 full, every plan"),
            ("Home types", "1 &amp; 2-storey towns"),
            ("Blocks", "17"),
            ("Price list", "Sept 22"),
        ],
        "intro": [
            "South Banks is a new collection of coastal townhomes by DECO Homes and OPUS Homes "
            "inside Lakeview Village &mdash; the 177-acre master-planned waterfront community "
            "taking shape on Mississauga&rsquo;s shoreline. Seventeen low-rise blocks sit between "
            "Aerodrome Avenue and Marina Vista, directly across from Waterway Common Park and a "
            "short walk from Lake Ontario.",
            "There are two home types: single-storey townhomes and two-storey upper townhomes, "
            "with private rooftop terraces on select upper homes. Every plan has two to four "
            "bedrooms and two full baths, every home sits above grade, and parking is "
            "underground &mdash; which leaves the ground level to landscaped walkways and a "
            "central amenity area.",
        ],
        "logos": [
            ("south-banks-logo.png", "South Banks", 26),
            ("south-banks-deco-logo.png", "DECO Homes", 30),
            ("south-banks-opus-logo.png", "OPUS Homes", 26),
        ],
        # Registration form (leads -> dashboard + Follow Up Boss via save-lead).
        "register": {
            "title": "Get the price list <em>the day it&rsquo;s released</em>",
            "text": "Floor plans and full pricing for South Banks come out September 22. "
                    "Leave your details and you&rsquo;ll get them first, straight from Nikhil.",
            "button": "Send me the price list",
            "hero_button": "Register for the price list",
        },
        "pricing_title": "Expected <em>pricing</em>",
        "tables": [
            {
                "title": "Launch price guidance",
                "compact": True,   # few columns: fit a phone instead of scrolling sideways
                "note": "*Net of HST rebate; conditions apply. Guidance shared ahead of launch "
                        "&mdash; the full price list and floor plans are released "
                        "September 22, 2026, and this page will be updated that day.",
                "cols": ["Home type", "Bedrooms", "Storeys", "Expected pricing"],
                "groups": [
                    ("Single-Storey Townhomes", [
                        ["Interior home", "2", "1", "From $549,990*"],
                        ["End home", "3", "1", "Approx. $639,990"],
                    ]),
                    ("Two-Storey Upper Townhomes", [
                        ["Upper townhome", "2 &ndash; 3", "2", "Mid to high $700s"],
                        ["Upper townhome with rooftop terrace", "3 &ndash; 4", "2", "From the $800s"],
                    ]),
                ],
            },
        ],
        "incentives_title": "What we know <em>so far</em>",
        "incentives": [
            "Launch pricing from $549,990, net of the HST rebate",
            "Two to four bedrooms, with two full baths on every plan",
            "Private rooftop terraces on select two-storey homes",
            "Every home above grade &mdash; no below-grade living space",
            "Underground parking and a central landscaped amenity area",
            "Extended deposits: $10,000 at signing, the balance spread over 11 to 17 months",
            "Floor plans and the full price list release September 22, 2026",
        ],
        "deposit": {
            "title": "Deposit structure",
            "rows": [
                ("At signing", "$10,000"),
                ("30, 60, 90, 150, 210 &amp; 270 days", "$7,500 each"),
                ("330 days", "$5,000 &nbsp;<span class=\"dim\">(single-storey)</span><br>"
                             "$7,500 &nbsp;<span class=\"dim\">(two-storey)</span>"),
                ("390, 450 &amp; 510 days", "$7,500 each &nbsp;<span class=\"dim\">(two-storey only)</span>"),
                ("On occupancy", "$10,000"),
                ("Total", "$70,000 &nbsp;<span class=\"dim\">(single-storey)</span><br>"
                          "$95,000 &nbsp;<span class=\"dim\">(two-storey)</span>"),
            ],
            "foot": "Cheques payable to Bratty&rsquo;s LLP, In Trust. All post-dated deposits "
                    "must be received at signing.",
        },
        # Worked example shown as a dated timeline. Day offsets come straight from
        # the builder's "Deposit Cheque Dates" sheet; change "signed" to re-date it.
        "deposit_example": {
            "signed": "2026-09-25",
            "schedules": [
                {"label": "Single-storey townhome",
                 "steps": [(0, 10000), (30, 7500), (60, 7500), (90, 7500), (150, 7500),
                           (210, 7500), (270, 7500), (330, 5000)],
                 "occupancy": 10000},
                {"label": "Two-storey townhome",
                 "steps": [(0, 10000), (30, 7500), (60, 7500), (90, 7500), (150, 7500),
                           (210, 7500), (270, 7500), (330, 7500), (390, 7500), (450, 7500),
                           (510, 7500)],
                 "occupancy": 10000},
            ],
        },
        "commute": [
            ("Across the street", "Waterway Common Park"),
            ("Short walk", "Lake Ontario &amp; the Waterfront Trail"),
            ("At the door", "Future MiWay stops on Jim Tovey Blvd &amp; Illumination Way"),
            ("Next door", "Lakeview Village Innovation District"),
            ("About 5 min", "Long Branch GO &middot; QEW / 427"),
            ("About 20 min", "Downtown Toronto"),
        ],
        "setting": {
            "image": "south-banks-boardwalk",
            "image_alt": "Boardwalk along the Lake Ontario shoreline at Lakeview Village",
            "eyebrow": "The setting",
            "title": "Mornings on <em>the water</em>",
            "text": [
                "Lakeview Village reopens a stretch of Mississauga shoreline that was off-limits "
                "for decades. South Banks sits one block from it: the pier, the marina, the "
                "Waterfront Trail and a sand-and-pebble beach are all a walk from the front "
                "door.",
                "Paddle before work, cycle the trail to Port Credit, or take Long Branch GO "
                "downtown &mdash; this is lakeside living with a twenty-minute commute.",
            ],
        },
        "site_plan": {
            "image": "south-banks-siteplan",
            "alt": "South Banks site plan showing 17 townhome blocks in Lakeview Village",
            "title": "Seventeen blocks, <em>one street from the park</em>",
            "rows": [
                ("North", "Aerodrome Avenue"),
                ("South", "Marina Vista &middot; Waterway Common Park &middot; Lake Ontario"),
                ("West", "Jim Tovey Boulevard"),
                ("East", "Illumination Way &middot; Innovation District"),
                ("Centre", "Landscaped amenity area &middot; underground parking entrance"),
                ("Also on site", "Visitor parking &middot; bike lanes on every bordering street"),
            ],
        },
        "gallery_title": "Renderings &amp; <em>setting</em>",
        "gallery": [
            ("south-banks-rooftop", "Private rooftop terrace overlooking Lake Ontario"),
            ("south-banks-detail", "South Banks exterior detail"),
            ("south-banks-waterfront", "The waterfront trail at Lakeview Village"),
            ("south-banks-lake", "Lake Ontario, a short walk from South Banks"),
            ("south-banks-park", "Lakefront parkland beside the community"),
            ("south-banks-sail", "Sailing off the Mississauga shoreline"),
        ],
        "cta_line": "Get the price list the day it&rsquo;s released.",
        "source": "DECO Homes and OPUS Homes launch materials, deposit schedule and pre-launch "
                  "price guidance, September 2026.",
        "card": {
            "image": "south-banks-hero",
            "image_alt": "South Banks townhomes exterior rendering",
            "flag": ("New &middot; price list Sept 22", "new"),
            "location": "Lakeview Village &middot; Jim Tovey Blvd &amp; Marina Vista",
            "specs": [("Bedrooms", "2 &ndash; 4"), ("Baths", "2 full, every plan"),
                      ("Storeys", "1 &amp; 2-storey towns"), ("Outdoor", "Rooftop terraces")],
            "price": "$549,990",
        },
        "compare": {
            "short": "South Banks", "builder": "DECO &amp; OPUS &middot; Coming soon",
            "price": "$549,990<span class=\"cmp-mini\">net of HST rebate</span>",
            "ceiling": "From the $800s<span class=\"cmp-mini\">3&ndash;4 bed with rooftop terrace</span>",
            "size": "Released Sept 22", "ppsf": "&mdash;",
            "beds": "2 &ndash; 4<span class=\"cmp-mini\">2 full baths on every plan</span>",
            "storeys": "Single-storey towns +<br>2-storey upper towns",
            "parking": "Underground<br>Visitor parking on site",
            "outdoor": "Rooftop terraces on select homes",
            "deposit": "$70,000 single-storey<br>$95,000 two-storey<br>$10,000 at signing",
            "occupancy": "To be announced", "fees": "To be announced",
            "incentive": "Launch pricing net of HST rebate &middot; deposits spread over "
                         "11 &ndash; 17 months",
            "homes": "17 blocks",
            "dated": "pre-launch guidance for South Banks (full price list due September 22, 2026)",
        },
    },

    "exhale-towns": {
        "name": "Exhale Townhome Collection",
        "builder": "Brixen Developments",
        "tagline": "Two-storey towns at the base of Exhale.",
        "address": "1381 Lakeshore Rd E, Mississauga",
        "area": "Lakeshore &amp; Dixie",
        "hero": "exhale-towns-hero",
        "hero_alt": "Exhale Townhome Collection exterior rendering",
        "meta": "Exhale Townhome Collection by Brixen Developments at 1381 Lakeshore Rd E, "
                "Mississauga. Eleven two-storey townhome plans, 945&ndash;1,710 sq ft, "
                "from $708,750 with 2026 occupancy.",
        "facts": [
            ("From", "$708,750"),
            ("Size", "945 &ndash; 1,710 sq ft"),
            ("Bedrooms", "2 &ndash; 3 + den"),
            ("Storeys", "2"),
            ("Plans", "11"),
            ("Occupancy", "2026"),
        ],
        "intro": [
            "The Townhome Collection sits at grade beneath Exhale on Lakeshore Road "
            "East at Dixie &mdash; directly across from Lakeshore Park, a short walk "
            "from the water, and three minutes from Dixie Outlet Mall.",
            "Eleven two-storey plans from 945 to 1,710 sq ft, with private patios and "
            "access to the full Exhale amenity floor. The earliest occupancy of the "
            "townhome communities in this neighbourhood.",
        ],
        "tables": [
            {
                "title": "Floor plans &amp; pricing",
                "note": "Promotional pricing shown against the original list price. "
                        "HST rebate value is the estimated net after rebate.",
                "cols": ["Plan", "Sq ft", "List price", "Promotional price", "After HST rebate"],
                "groups": [("", [
                    ["Townhome 4", "945", "$945,000", "$708,750", "$616,612"],
                    ["Townhome 3", "1,005", "$1,005,000", "$753,750", "$655,762"],
                    ["Townhome 2", "1,018", "$1,018,000", "$763,500", "$664,245"],
                    ["Townhome 8", "1,020", "$1,020,000", "$765,000", "$665,550"],
                    ["Townhome 10", "1,055", "$1,055,000", "$791,250", "$688,388"],
                    ["Townhome 11", "1,065", "$1,065,000", "$798,750", "$694,912"],
                    ["Townhome 1", "1,265", "$1,265,000", "$948,750", "$825,412"],
                    ["Townhome 9", "1,310", "$1,310,000", "$982,500", "$854,775"],
                    ["Townhome 6", "1,430", "$1,430,000", "$1,072,500", "$933,075"],
                    ["Townhome 5", "1,485", "$1,485,000", "$1,113,750", "$968,962"],
                    ["Townhome 7", "1,710", "$1,710,000", "$1,282,500", "$1,115,775"],
                ])],
            },
        ],
        "incentives": [
            "Promotional pricing on every remaining town plan",
            "HST rebate value reflected in the pricing above",
            "2026 occupancy &mdash; the earliest of the townhome communities here",
            "Full access to the Exhale amenity floor, gym and rooftop",
        ],
        "deposit": None,
        "commute": [
            ("Across the street", "Lakeshore Park"),
            ("3 min", "Dixie Outlet Mall"),
            ("Nearby", "Dixie GO Station"),
            ("Planned", "Lakeshore MiWay BRT and LRT"),
        ],
        "gallery": [
            ("exhale-towns-suite", "Exhale Townhome Collection interior"),
            ("exhale-aerial", "Aerial view of Exhale on Lakeshore"),
            ("exhale-siteplan", "Exhale Townhome Collection site plan"),
        ],
        "plans_link": ("../neighbourhoods/dixie-lakeshore.html#exhale-towns",
                       "View all 11 floor plans"),
        "source": "Current Exhale promotional pricing and the Exhale Townhome Collection plan set.",
        "card": {
            "image": "exhale-towns-hero",
            "image_alt": "Exhale Townhome Collection exterior rendering",
            "flag": ("2026 occupancy", ""),
            "location": "1381 Lakeshore Rd E &middot; Lakeshore &amp; Dixie",
            "specs": [("Size", "945 &ndash; 1,710 sq ft"), ("Bedrooms", "2 &ndash; 3 + den"),
                      ("Storeys", "2 &middot; At-grade"), ("Plans", "11 available")],
            "price": "$708,750",
        },
        "compare": {
            "short": "Exhale Town Collection", "builder": "Brixen",
            "price": "$708,750", "ceiling": "$1,282,500",
            "size": "945 &ndash; 1,710 sq ft", "ppsf": "~$750",
            "beds": "2 &ndash; 3 + den", "storeys": "2-storey at-grade",
            "parking": "See sales office", "outdoor": "Patio",
            "deposit": "See sales office",
            "occupancy": "<span class=\"hi\">2026 &mdash; earliest</span>",
            "fees": "See sales office",
            "incentive": "Promotional pricing &middot; HST rebate priced in",
            "homes": "11 town plans",
            "dated": "current Exhale promotional pricing",
        },
    },
}

# Display order everywhere: newest launch first, sold-out communities last.
ORDER = ["south-banks", "exhale-towns", "aura-lakeview-towns", "pier-house-towns"]

SIBLINGS = {slug: PROJECTS[slug]["name"] for slug in ORDER}

# Meta Pixel -- identical to the snippet on every other page of the site, so
# visits to the townhome pages are counted (and can be retargeted) like the rest.
META_PIXEL_ID = "1688055534733639"
META_PIXEL = """<!-- Meta Pixel Code -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '%s');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=%s&ev=PageView&noscript=1"
/></noscript>
<!-- End Meta Pixel Code -->""" % (META_PIXEL_ID, META_PIXEL_ID)

NUMBER_WORDS = {2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight"}

# Compare-table rows, in display order: (key in each project's "compare", label).
COMPARE_ROWS = [
    ("price", "Starting price"), ("ceiling", "Price ceiling"), ("size", "Size range"),
    ("ppsf", "$ / sq ft (from)"), ("beds", "Bedrooms"), ("storeys", "Storeys"),
    ("parking", "Parking"), ("outdoor", "Outdoor space"), ("deposit", "Deposit"),
    ("occupancy", "Occupancy"), ("fees", "Monthly fees"),
    ("incentive", "Headline incentive"), ("homes", "Total homes"),
]


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def have(name, w, ext):
    return os.path.exists(os.path.join(IMG_DIR, "%s-%d.%s" % (name, w, ext)))


def picture(name, alt, sizes, widths, cls="", eager=False, prefix="images/towns/"):
    """<picture> with AVIF + WebP sources and a JPEG fallback in <img src>."""
    avif = ", ".join("%s%s-%d.avif %dw" % (prefix, name, w, w)
                     for w in widths if have(name, w, "avif"))
    webp = ", ".join("%s%s-%d.webp %dw" % (prefix, name, w, w)
                     for w in widths if have(name, w, "webp"))
    loading = 'loading="eager" fetchpriority="high"' if eager else 'loading="lazy"'
    src = "%s%s.jpg" % (prefix, name)
    out = ["<picture>"]
    if avif:
        out.append('  <source type="image/avif" sizes="%s" srcset="%s">' % (sizes, avif))
    if webp:
        out.append('  <source type="image/webp" sizes="%s" srcset="%s">' % (sizes, webp))
    out.append('  <img src="%s" alt="%s" %s decoding="async"%s>'
               % (src, html.escape(alt, quote=True), loading,
                  ' class="%s"' % cls if cls else ""))
    out.append("</picture>")
    return "\n      ".join(out)


def table_html(t):
    ncol = len(t["cols"])
    rows = []
    for gname, grows in t["groups"]:
        if gname:
            rows.append('        <tr class="grp"><td colspan="%d">%s</td></tr>' % (ncol, gname))
        for r in grows:
            cells = "".join("<td%s>%s</td>" % (' class="num"' if i == len(r) - 1 else "", c)
                            for i, c in enumerate(r))
            rows.append("        <tr>%s</tr>" % cells)
    note = '\n    <p class="tbl-note">%s</p>' % t["note"] if t["note"] else ""
    return """  <div class="tbl-block">
    <h3 class="tbl-title">%s</h3>
    <div class="tbl-scroll">
      <table class="dt%s">
        <thead><tr>%s</tr></thead>
        <tbody>
%s
        </tbody>
      </table>
    </div>%s
  </div>""" % (
        t["title"],
        " compact" if t.get("compact") else "",
        "".join("<th>%s</th>" % c for c in t["cols"]),
        "\n".join(rows),
        note,
    )


def _money(n):
    return "${:,}".format(n)


def deposit_example_html(ex):
    """A dated, worked example of the deposit schedule, drawn as a timeline."""
    from datetime import date, timedelta
    signed = date.fromisoformat(ex["signed"])
    short = lambda d: "%s %d, %d" % (d.strftime("%b"), d.day, d.year)
    long_ = "%s %d, %d" % (signed.strftime("%B"), signed.day, signed.year)

    cards = []
    for sch in ex["schedules"]:
        total = sum(a for _, a in sch["steps"]) + sch["occupancy"]
        paid, rows = 0, []
        for days, amount in sch["steps"]:
            paid += amount
            when = signed + timedelta(days=days)
            rows.append("""        <li class="dx-step">
          <div class="dx-date">%s<span>%s</span></div>
          <div class="dx-amt">%s<span>%s paid to date</span></div>
          <div class="dx-bar"><i style="width:%.1f%%"></i></div>
        </li>""" % (short(when), "At signing" if days == 0 else "%d days" % days,
                    _money(amount), _money(paid), paid * 100.0 / total))
        last = signed + timedelta(days=sch["steps"][-1][0])
        rows.append("""        <li class="dx-step is-occ">
          <div class="dx-date">On occupancy<span>Date to be announced</span></div>
          <div class="dx-amt">%s<span>%s paid in full</span></div>
          <div class="dx-bar"><i style="width:100%%"></i></div>
        </li>""" % (_money(sch["occupancy"]), _money(total)))
        cards.append("""    <div class="dx-card">
      <div class="dx-head">
        <div><div class="dx-name">%s</div><div class="dx-sub">%d cheques, the last on %s &middot; then %s on occupancy</div></div>
        <div class="dx-total">%s<span>total deposit</span></div>
      </div>
      <ol class="dx-list">
%s
      </ol>
    </div>""" % (sch["label"], len(sch["steps"]), short(last), _money(sch["occupancy"]),
                 _money(total), "\n".join(rows)))

    return """<section>
  <div class="sec-eyebrow">Deposit example</div>
  <h2 class="sec-title">If you sign on <em>%s</em></h2>
  <p class="dx-intro">Real calendar dates, so you can see exactly when each deposit would fall due and how much you would have paid in at every step.</p>
  <div class="dx-grid">
%s
  </div>
  <p class="tbl-note">Illustration only, counted in calendar days from a %s signing. Your actual deposit dates are set out in your Agreement of Purchase and Sale; all post-dated cheques are provided at signing, payable to Bratty&rsquo;s LLP, In Trust.</p>
</section>
""" % (long_, "\n".join(cards), long_)


def build(slug, p):
    facts = "\n".join(
        '      <div class="fact"><div class="fact-lbl">%s</div><div class="fact-val">%s</div></div>'
        % (k, v) for k, v in p["facts"])

    intro = "\n".join("      <p>%s</p>" % t for t in p["intro"])

    tables = "\n".join(table_html(t) for t in p["tables"])

    plans_link = ""
    if p.get("plans_link"):
        href, label = p["plans_link"]
        plans_link = ('\n  <p class="plans-link"><a href="%s">%s &rarr;</a></p>' % (href, label))

    incentives = "\n".join("        <li>%s</li>" % i for i in p["incentives"])

    if p["deposit"]:
        drows = "\n".join(
            '          <div class="dep-row"><span class="dep-when">%s</span>'
            '<span class="dep-amt">%s</span></div>' % (w, a)
            for w, a in p["deposit"]["rows"])
        deposit = """      <div class="dep-card">
        <h3 class="side-title">%s</h3>
%s
        <p class="dep-foot">%s</p>
      </div>""" % (p["deposit"]["title"], drows, p["deposit"]["foot"])
    else:
        deposit = ""

    commute = "\n".join(
        '        <div class="cm-row"><span class="cm-time">%s</span>'
        '<span class="cm-place">%s</span></div>' % (t, pl) for t, pl in p["commute"])

    gallery = "\n".join(
        '      <figure class="gal-item">%s<figcaption>%s</figcaption></figure>'
        % (picture(n, a, "(max-width: 700px) 100vw, 50vw", CARD_W), a)
        for n, a in p["gallery"])

    others = "\n".join(
        '      <a class="sib" href="%s.html"><span class="sib-lbl">Also in Dixie &amp; Lakeshore%s</span>'
        '<span class="sib-name">%s &rarr;</span></a>'
        % (s, " &middot; sold out" if PROJECTS[s].get("status") == "Sold out"
           else " &middot; coming soon" if PROJECTS[s].get("status_kind") == "new" else "",
           SIBLINGS[s])
        for s in ORDER if s != slug)

    status_badge = ""
    if p.get("status"):
        kind = p.get("status_kind", "")
        status_badge = ('<div class="hero-status%s">%s</div>\n    '
                        % (" " + kind if kind else "", p["status"]))

    logos = ""
    if p.get("logos"):
        logos = '      <div class="logo-row">%s</div>\n' % "".join(
            '<img src="images/towns/%s" alt="%s" height="%d" loading="lazy" decoding="async">'
            % (f, html.escape(alt, quote=True), h) for f, alt, h in p["logos"])

    register_section = hero_cta = ""
    if p.get("register"):
        rg = p["register"]
        hero_cta = '\n    <a class="hero-cta" href="#register">%s &rarr;</a>' % rg["hero_button"]
        register_section = REGISTER_HTML % {
            "title": rg["title"], "text": rg["text"], "button": rg["button"],
            "building": html.escape(p["name"].replace("&amp;", "&"), quote=True),
        }

    extra = []
    if p.get("deposit_example"):
        extra.append(deposit_example_html(p["deposit_example"]))
    if p.get("setting"):
        v = p["setting"]
        extra.append("""<section>
  <div class="setting">
    <div class="setting-media">%s</div>
    <div>
      <div class="sec-eyebrow">%s</div>
      <h2 class="sec-title">%s</h2>
%s
    </div>
  </div>
</section>
""" % (picture(v["image"], v["image_alt"], "(max-width: 1000px) 80vw, 320px", CARD_W),
       v["eyebrow"], v["title"],
       "\n".join("      <p>%s</p>" % t for t in v["text"])))
    if p.get("site_plan"):
        sp = p["site_plan"]
        extra.append("""<section>
  <div class="sec-eyebrow">Site plan</div>
  <h2 class="sec-title">%s</h2>
  <div class="siteplan">
    <figure>%s</figure>
    <div>
      <h3 class="side-title">What surrounds it</h3>
%s
    </div>
  </div>
</section>
""" % (sp["title"],
       picture(sp["image"], sp["alt"], "(max-width: 1000px) 100vw, 56vw", [480, 800, 1280, 1920]),
       "\n".join('      <div class="cm-row"><span class="cm-time">%s</span>'
                 '<span class="cm-place">%s</span></div>' % r for r in sp["rows"])))
    extra_sections = "\n".join(extra)
    split = p.get("hero_layout") == "split"
    hero_sizes = "(min-width: 1000px) 45vw, 100vw" if split else "100vw"
    hero_pic = picture(p["hero"], p["hero_alt"], hero_sizes, HERO_W, cls="hero-img", eager=True)
    hero_preload = ""
    if have(p["hero"], 1280, "avif"):
        hero_preload = (
            '\n  <link rel="preload" as="image" type="image/avif" '
            'imagesizes="%s" imagesrcset="%s">'
            % (hero_sizes, ", ".join("images/towns/%s-%d.avif %dw" % (p["hero"], w, w)
                                     for w in HERO_W if have(p["hero"], w, "avif"))))

    return TEMPLATE.format(
        name=p["name"], builder=p["builder"], tagline=p["tagline"],
        address=p["address"], area=p["area"], meta=p["meta"],
        hero_pic=hero_pic, hero_preload=hero_preload,
        facts=facts, intro=intro, tables=tables, plans_link=plans_link,
        incentives=incentives, deposit=deposit, commute=commute,
        gallery=gallery, others=others, source=p["source"], status_badge=status_badge,
        register_section=register_section, hero_cta=hero_cta,
        logos=logos, extra_sections=extra_sections, pixel=META_PIXEL, hero_class=" split" if split else "",
        pricing_title=p.get("pricing_title", "Models &amp; <em>prices</em>"),
        incentives_title=p.get("incentives_title", "Current <em>incentives</em>"),
        gallery_title=p.get("gallery_title", "Renderings"),
        cta_line=p.get("cta_line", "Sold out &mdash; ask what&rsquo;s coming next nearby."
                       if p.get("status") == "Sold out" else "Let&rsquo;s talk floor plans."),
        price_from=dict(p["facts"])["From"],
        name_url=quote(p["name"].replace("&amp;", "&")),
    )


REGISTER_HTML = """
<section class="reg" id="register">
  <div class="reg-inner">
    <div class="reg-copy">
      <div class="sec-eyebrow">Register</div>
      <h2 class="sec-title">%(title)s</h2>
      <p>%(text)s</p>
    </div>
    <form class="reg-form" id="reg-form" novalidate>
      <label>Full name<input type="text" name="name" autocomplete="name" required></label>
      <label>Phone<input type="tel" name="phone" autocomplete="tel" inputmode="tel" required></label>
      <label>Email <span>(optional)</span><input type="email" name="email" autocomplete="email"></label>
      <input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="reg-hp">
      <button type="submit">%(button)s</button>
      <p class="reg-msg" id="reg-msg" role="status"></p>
      <p class="reg-fine">No spam. Your details go only to Nikhil Oberoi, the broker behind CondosAround.</p>
    </form>
    <div class="reg-done" id="reg-done" hidden>
      <div class="reg-done-mark">&#10003;</div>
      <h3>You&rsquo;re on the list.</h3>
      <p>You&rsquo;ll get the price list and floor plans as soon as they&rsquo;re released. Questions before then? Call or text <a href="tel:6479240848">647-924-0848</a>.</p>
    </div>
  </div>
</section>
<script>
(function () {
  var form = document.getElementById('reg-form');
  if (!form) return;
  var msg = document.getElementById('reg-msg');
  var qs = new URLSearchParams(location.search);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = form.name.value.trim(), phone = form.phone.value.trim(), email = form.email.value.trim();
    if (name.length < 2) { msg.textContent = 'Please enter your name.'; form.name.focus(); return; }
    if (phone.replace(/\\D/g, '').length < 10) { msg.textContent = 'Please enter a 10-digit phone number.'; form.phone.focus(); return; }
    var btn = form.querySelector('button'); btn.disabled = true; msg.textContent = 'Sending\u2026';
    fetch('/.netlify/functions/save-lead', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, phone: phone, email: email, building: '%(building)s',
        date: new Date().toISOString(), website: form.website.value,
        utm_source: qs.get('utm_source') || '', utm_campaign: qs.get('utm_campaign') || '' })
    }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      try { localStorage.setItem('ca_registered', 'true'); } catch (err) {}
      if (window.fbq) fbq('track', 'Lead', { content_name: '%(building)s' });
      form.hidden = true; document.getElementById('reg-done').hidden = false;
    }).catch(function () {
      btn.disabled = false;
      msg.textContent = 'That did not go through. Please try again, or text 647-924-0848.';
    });
  });
})();
</script>
"""


TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{name} &mdash; {builder} &middot; Dixie &amp; Lakeshore | CondosAround.com</title>
  <meta name="description" content="{meta}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />{hero_preload}
  <style>
    :root {{ --navy: #002244; --navy-deep: #001a35; --gold: #c9a84c; --gold-soft: #e2c684;
             --white: #fff; --off-white: #faf8f4; --cream: #f3ede2; --text: #1a1a18;
             --text-mid: #4a4a46; --text-muted: #8a8a84; --border: rgba(0,34,68,0.13); }}
    * {{ margin: 0; padding: 0; box-sizing: border-box; }}
    html {{ scroll-behavior: smooth; }}
    html, body {{ overflow-x: hidden; max-width: 100%; }}
    body {{ font-family: 'Outfit', sans-serif; background: var(--off-white); color: var(--text); }}
    img {{ max-width: 100%; display: block; }}

    nav {{ display: flex; align-items: center; justify-content: space-between; gap: 1rem;
           padding: 1.15rem 3rem; background: rgba(250,248,244,0.95); backdrop-filter: blur(12px);
           border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 100; }}
    .nav-logo {{ font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; color: var(--text); text-decoration: none; }}
    .nav-logo em {{ font-style: italic; color: var(--navy); }}
    .nav-back {{ font-size: 0.7rem; letter-spacing: 0.1em; text-transform: uppercase;
                 color: var(--text-muted); text-decoration: none; }}
    .nav-back:hover {{ color: var(--navy); }}
    .nav-cta {{ background: var(--navy); color: #fff; padding: 0.6rem 1.4rem; border-radius: 2px;
                text-decoration: none; font-size: 0.82rem; white-space: nowrap; }}
    nav > a {{ white-space: nowrap; }}
    .nav-back .nb-short {{ display: none; }}

    .hero {{ position: relative; min-height: 66vh; display: flex; align-items: flex-end; background: var(--navy-deep); }}
    .hero picture, .hero .hero-img {{ position: absolute; inset: 0; width: 100%; height: 100%; }}
    .hero .hero-img {{ object-fit: cover; object-position: center 55%; }}
    .hero::after {{ content: ''; position: absolute; inset: 0; z-index: 1;
      background: linear-gradient(180deg, rgba(0,18,38,0.25) 0%, rgba(0,18,38,0.55) 45%, rgba(0,18,38,0.93) 100%); }}
    .hero-inner {{ position: relative; z-index: 2; padding: 5rem 3rem 2.5rem; width: 100%; }}
    .hero-builder {{ font-size: 0.66rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.9rem; }}
    .hero-status {{ display: inline-block; background: rgba(122,38,38,0.95); color: #fff; font-size: 0.66rem;
                    font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; padding: 0.42rem 0.9rem;
                    border-radius: 2px; margin-bottom: 1rem; }}
    .hero-status.new {{ background: rgba(201,168,76,0.96); color: #17130a; }}
    .hero-title {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(2.4rem, 5.5vw, 4.4rem);
                   font-weight: 300; line-height: 1.02; color: #fff; margin-bottom: 0.7rem; }}
    .hero-tag {{ font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.35rem; color: var(--gold-soft); margin-bottom: 0.9rem; }}
    .hero-addr {{ font-size: 0.88rem; color: rgba(255,255,255,0.62); }}
    .hero-credit {{ position: absolute; right: 1rem; bottom: 0.45rem; z-index: 2; font-size: 0.56rem; color: rgba(255,255,255,0.32); }}

    /* split hero (desktop only): for portrait renderings that a full-bleed band would butcher */
    @media (min-width: 1000px) {{
      .hero.split {{ display: grid; grid-template-columns: 1.25fr 1fr; align-items: stretch; min-height: 72vh;
                     background: linear-gradient(155deg, #001429 0%, #002244 100%); }}
      .hero.split::after {{ display: none; }}
      .hero.split picture {{ position: relative; inset: auto; order: 2; width: auto; height: auto; min-height: 72vh; }}
      .hero.split .hero-img {{ object-position: 62% 88%; }}
      .hero.split .hero-inner {{ order: 1; display: flex; flex-direction: column; justify-content: center;
                                 padding: 4rem 4rem 4rem 3rem; }}
      .hero.split .hero-title {{ font-size: clamp(3.2rem, 5vw, 5.4rem); margin-bottom: 1rem; }}
      .hero.split .hero-tag {{ font-size: 1.6rem; margin-bottom: 1.4rem; }}
      .hero.split .hero-addr {{ font-size: 0.95rem; padding-top: 1.4rem; border-top: 1px solid rgba(255,255,255,0.14); max-width: 460px; }}
      .hero.split .hero-status {{ align-self: flex-start; }}
    }}

    .hero-cta {{ display: inline-block; margin-top: 1.6rem; background: var(--gold); color: #17130a; text-decoration: none;
                 font-size: 0.74rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;
                 padding: 0.95rem 1.7rem; border-radius: 2px; align-self: flex-start; transition: background 0.2s; }}
    .hero-cta:hover {{ background: #d6b85e; }}

    section.reg {{ background: var(--cream); padding-top: 3.5rem; padding-bottom: 3.5rem; scroll-margin-top: 70px; }}
    .reg-inner {{ display: grid; grid-template-columns: 1fr 1.05fr; gap: 4rem; align-items: center; max-width: 1180px; }}
    .reg-copy .sec-title {{ margin-bottom: 1rem; }}
    .reg-copy p {{ font-size: 1rem; line-height: 1.8; color: var(--text-mid); font-weight: 300; max-width: 460px; }}
    .reg-form, .reg-done {{ background: #fff; border: 1px solid #e3dccb; border-radius: 12px; padding: 1.75rem; }}
    .reg-form label {{ display: block; font-size: 0.66rem; letter-spacing: 0.11em; text-transform: uppercase;
                       color: var(--text-muted); margin-bottom: 1rem; }}
    .reg-form label span {{ text-transform: none; letter-spacing: 0; }}
    .reg-form input[type=text], .reg-form input[type=tel], .reg-form input[type=email] {{
      display: block; width: 100%; margin-top: 0.4rem; padding: 0.85rem 0.9rem; font: inherit; font-size: 16px;
      letter-spacing: 0; text-transform: none; color: var(--text); background: var(--off-white);
      border: 1px solid #ddd6c6; border-radius: 4px; }}
    .reg-form input:focus {{ outline: 2px solid var(--gold); outline-offset: 1px; border-color: var(--gold); }}
    .reg-hp {{ position: absolute !important; left: -9999px; width: 1px; height: 1px; opacity: 0; }}
    .reg-form button {{ width: 100%; margin-top: 0.35rem; padding: 1rem; border: none; border-radius: 3px; cursor: pointer;
                        background: var(--navy); color: #fff; font: inherit; font-size: 0.78rem; font-weight: 500;
                        letter-spacing: 0.1em; text-transform: uppercase; transition: background 0.2s; }}
    .reg-form button:hover {{ background: #0b3358; }}
    .reg-form button:disabled {{ opacity: 0.6; cursor: default; }}
    .reg-msg {{ min-height: 1.2em; margin-top: 0.7rem; font-size: 0.8rem; color: #7a2626; }}
    .reg-fine {{ font-size: 0.7rem; color: var(--text-muted); line-height: 1.6; margin-top: 0.35rem; }}
    .reg-done {{ text-align: center; padding: 2.5rem 1.75rem; }}
    .reg-done[hidden], .reg-form[hidden] {{ display: none; }}
    .reg-done-mark {{ width: 46px; height: 46px; line-height: 46px; border-radius: 50%; background: var(--navy); color: var(--gold-soft);
                      font-size: 1.3rem; margin: 0 auto 1rem; }}
    .reg-done h3 {{ font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; font-weight: 400; margin-bottom: 0.6rem; }}
    .reg-done p {{ font-size: 0.92rem; line-height: 1.7; color: var(--text-mid); }}
    .reg-done a {{ color: var(--navy); font-weight: 600; }}

    .facts {{ display: grid; grid-template-columns: repeat(6, 1fr); background: var(--navy); }}
    .fact {{ padding: 1.5rem 1.25rem; border-right: 1px solid rgba(255,255,255,0.09); }}
    .fact:last-child {{ border-right: none; }}
    .fact-lbl {{ font-size: 0.58rem; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.42); margin-bottom: 0.4rem; }}
    .fact-val {{ font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; color: var(--gold-soft); line-height: 1.15; }}

    section {{ padding: 4.5rem 3rem; border-bottom: 1px solid var(--border); }}
    .sec-eyebrow {{ font-size: 0.63rem; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 0.7rem; }}
    .sec-title {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(1.9rem, 3vw, 2.7rem); font-weight: 300; line-height: 1.12; margin-bottom: 1.75rem; }}
    .sec-title em {{ font-style: italic; color: var(--navy); }}

    .overview {{ display: grid; grid-template-columns: 1.35fr 1fr; gap: 4rem; align-items: start; }}
    .overview p {{ font-size: 1rem; line-height: 1.85; color: var(--text-mid); font-weight: 300; margin-bottom: 1.15rem; }}
    .side-title {{ font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 400; margin-bottom: 1.1rem; }}
    .cm-row {{ display: flex; gap: 1rem; padding: 0.72rem 0; border-bottom: 1px solid var(--border); font-size: 0.86rem; }}
    .cm-row:last-child {{ border-bottom: none; }}
    .cm-time {{ color: var(--navy); font-weight: 600; min-width: 6.5rem; }}
    .cm-place {{ color: var(--text-mid); }}

    .tbl-block {{ margin-bottom: 3rem; }}
    .tbl-block:last-child {{ margin-bottom: 0; }}
    .tbl-title {{ font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 400; margin-bottom: 1rem; }}
    .tbl-scroll {{ overflow-x: auto; border: 1px solid #e8e4dc; border-radius: 10px; background: #fff; }}
    table.dt {{ width: 100%; border-collapse: collapse; min-width: 660px; font-size: 0.85rem; }}
    table.dt th, table.dt td {{ text-align: left; padding: 0.85rem 1.15rem; border-bottom: 1px solid #efebe2; }}
    table.dt thead th {{ background: var(--navy); color: #fff; font-weight: 500; font-size: 0.74rem;
                         letter-spacing: 0.07em; text-transform: uppercase; border-bottom: none; }}
    table.dt tbody tr:last-child td {{ border-bottom: none; }}
    table.dt tr.grp td {{ background: var(--cream); font-size: 0.66rem; letter-spacing: 0.14em;
                          text-transform: uppercase; color: var(--navy); font-weight: 600; }}
    table.dt td.num {{ color: var(--navy); font-weight: 600; white-space: nowrap; }}
    table.dt.compact {{ min-width: 0; }}
    @media (max-width: 700px) {{
      table.dt.compact th, table.dt.compact td {{ padding: 0.75rem 0.6rem; font-size: 0.8rem; }}
      table.dt.compact thead th {{ font-size: 0.6rem; letter-spacing: 0.04em; }}
      table.dt.compact td.num {{ white-space: normal; }}
      table.dt.compact tr.grp td {{ font-size: 0.6rem; }}
    }}
    .tbl-note {{ font-size: 0.72rem; color: var(--text-muted); font-style: italic; line-height: 1.65; margin-top: 0.85rem; }}
    .plans-link {{ margin-top: 1.5rem; }}
    .plans-link a {{ font-size: 0.72rem; letter-spacing: 0.11em; text-transform: uppercase;
                     color: var(--navy); text-decoration: none; border-bottom: 1px solid var(--gold); padding-bottom: 3px; }}

    .two-col {{ display: grid; grid-template-columns: 1.2fr 1fr; gap: 3.5rem; align-items: start; }}
    .inc-list {{ list-style: none; }}
    .inc-list li {{ position: relative; padding-left: 1.5rem; margin-bottom: 0.85rem; font-size: 0.92rem;
                    line-height: 1.7; color: var(--text-mid); }}
    .inc-list li::before {{ content: ''; position: absolute; left: 0; top: 0.62rem; width: 5px; height: 5px;
                            border-radius: 50%; background: var(--gold); }}
    .dep-card {{ background: #fff; border: 1px solid #e8e4dc; border-radius: 10px; padding: 1.75rem; }}
    .dep-row {{ display: flex; justify-content: space-between; gap: 1rem; padding: 0.7rem 0;
                border-bottom: 1px solid var(--border); font-size: 0.85rem; }}
    .dep-row:last-of-type {{ border-bottom: none; }}
    .dep-when {{ color: var(--text-muted); }}
    .dep-amt {{ color: var(--navy); font-weight: 600; text-align: right; }}
    .dep-amt .dim {{ color: var(--text-muted); font-weight: 300; font-size: 0.78rem; }}
    .dep-foot {{ font-size: 0.72rem; color: var(--text-muted); font-style: italic; line-height: 1.65;
                 margin-top: 1.1rem; padding-top: 1.1rem; border-top: 1px solid var(--border); }}

    .dx-intro {{ font-size: 1rem; line-height: 1.8; color: var(--text-mid); font-weight: 300; max-width: 640px; margin: -0.5rem 0 2.25rem; }}
    .dx-grid {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.75rem; align-items: start; }}
    .dx-card {{ background: #fff; border: 1px solid #e8e4dc; border-radius: 10px; overflow: hidden; }}
    .dx-head {{ display: flex; justify-content: space-between; align-items: flex-end; gap: 1rem; padding: 1.4rem 1.6rem; background: var(--navy); color: #fff; }}
    .dx-name {{ font-family: 'Cormorant Garamond', serif; font-size: 1.45rem; line-height: 1.15; }}
    .dx-sub {{ font-size: 0.7rem; color: rgba(255,255,255,0.55); margin-top: 0.35rem; line-height: 1.5; }}
    .dx-total {{ font-family: 'Cormorant Garamond', serif; font-size: 1.7rem; color: var(--gold-soft); text-align: right; white-space: nowrap; line-height: 1; }}
    .dx-total span {{ display: block; font-family: 'Outfit', sans-serif; font-size: 0.56rem; letter-spacing: 0.13em; text-transform: uppercase; color: rgba(255,255,255,0.45); margin-top: 0.4rem; }}
    .dx-list {{ list-style: none; position: relative; padding: 0.5rem 1.6rem 0.75rem 3.1rem; }}
    .dx-list::before {{ content: ''; position: absolute; left: 1.95rem; top: 1.6rem; bottom: 2.4rem; width: 1px; background: #d9d3c5; }}
    .dx-step {{ position: relative; display: grid; grid-template-columns: 1fr auto; gap: 0.55rem 1rem; padding: 0.95rem 0; border-bottom: 1px solid var(--border); }}
    .dx-step:last-child {{ border-bottom: none; }}
    .dx-step::before {{ content: ''; position: absolute; left: -1.5rem; top: 1.25rem; width: 11px; height: 11px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 0 3px #fff; }}
    .dx-step.is-occ::before {{ background: var(--navy); }}
    .dx-date {{ font-size: 0.95rem; font-weight: 500; color: var(--text); }}
    .dx-date span, .dx-amt span {{ display: block; font-size: 0.7rem; font-weight: 300; color: var(--text-muted); margin-top: 0.15rem; }}
    .dx-amt {{ font-size: 0.95rem; font-weight: 600; color: var(--navy); text-align: right; }}
    .dx-bar {{ grid-column: 1 / -1; height: 3px; border-radius: 2px; background: var(--cream); overflow: hidden; }}
    .dx-bar i {{ display: block; height: 100%; background: var(--navy); border-radius: 2px; }}
    .dx-step.is-occ .dx-bar i {{ background: var(--gold); }}

    .gal {{ display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }}
    .gal-item {{ margin: 0; border-radius: 10px; overflow: hidden; background: var(--cream); }}
    .gal-item img {{ width: 100%; aspect-ratio: 16/10; object-fit: cover; transition: transform 0.5s; }}
    .gal-item:hover img {{ transform: scale(1.03); }}
    .gal-item figcaption {{ font-size: 0.7rem; color: var(--text-muted); padding: 0.7rem 0.15rem 0; }}

    .sibs {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1.25rem; }}

    .logo-row {{ display: flex; align-items: center; gap: 2.25rem; flex-wrap: wrap; margin-top: 2.25rem;
                 padding-top: 1.75rem; border-top: 1px solid var(--border); }}
    .logo-row img {{ width: auto; opacity: 0.78; }}

    .setting {{ display: grid; grid-template-columns: minmax(220px, 320px) 1fr; gap: 4.5rem; align-items: center; }}
    .setting p {{ font-size: 1rem; line-height: 1.85; color: var(--text-mid); font-weight: 300;
                  margin-bottom: 1.15rem; max-width: 560px; }}
    .setting-media img {{ width: 100%; aspect-ratio: 4/5; object-fit: cover; border-radius: 12px; }}

    .siteplan {{ display: grid; grid-template-columns: 1.3fr 1fr; gap: 3.5rem; align-items: start; }}
    .siteplan figure {{ margin: 0; border-radius: 10px; overflow: hidden; border: 1px solid #e8e4dc; background: var(--cream); }}
    .siteplan img {{ width: 100%; height: auto; aspect-ratio: 1/1; }}
    .sib {{ display: block; background: #fff; border: 1px solid #e8e4dc; border-radius: 10px;
            padding: 1.5rem 1.75rem; text-decoration: none; transition: border-color 0.2s, transform 0.2s; }}
    .sib:hover {{ border-color: var(--gold); transform: translateY(-2px); }}
    .sib-lbl {{ display: block; font-size: 0.6rem; letter-spacing: 0.14em; text-transform: uppercase;
                color: var(--text-muted); margin-bottom: 0.4rem; }}
    .sib-name {{ display: block; font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; color: var(--navy); }}

    .cta {{ background: var(--text); padding: 4rem 3rem; display: flex; align-items: center;
            justify-content: space-between; gap: 2rem; flex-wrap: wrap; border: none; }}
    .cta-h {{ font-family: 'Cormorant Garamond', serif; font-size: clamp(1.6rem, 2.5vw, 2.3rem); font-weight: 300; color: #fff; }}
    .cta-h em {{ font-style: italic; color: var(--gold); }}
    .cta-actions {{ display: flex; gap: 1rem; flex-wrap: wrap; }}
    .btn-w {{ background: #fff; color: var(--text); padding: 0.85rem 2rem; border-radius: 2px; text-decoration: none;
              font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 500; }}
    .btn-o {{ color: var(--gold); border: 1px solid var(--gold); padding: 0.85rem 2rem; border-radius: 2px;
              text-decoration: none; font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; }}

    .disclaimer {{ padding: 2.25rem 3rem; background: var(--cream); font-size: 0.7rem; line-height: 1.75;
                   color: var(--text-muted); font-style: italic; border: none; }}
    footer {{ background: var(--text); padding: 2rem 3rem; display: flex; justify-content: space-between;
              align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.72rem; color: rgba(255,255,255,0.3); }}
    .footer-logo {{ font-family: 'Cormorant Garamond', serif; font-size: 1rem; color: rgba(255,255,255,0.5); }}
    .footer-logo em {{ font-style: italic; color: var(--gold); opacity: 0.75; }}

    @media (max-width: 1000px) {{
      .facts {{ grid-template-columns: repeat(3, 1fr); }}
      .fact:nth-child(3n) {{ border-right: none; }}
      .fact:nth-child(-n+3) {{ border-bottom: 1px solid rgba(255,255,255,0.09); }}
      .overview, .two-col, .siteplan {{ grid-template-columns: 1fr; gap: 2.5rem; }}
      .reg-inner {{ grid-template-columns: 1fr; gap: 1.75rem; }}
      .dx-grid {{ grid-template-columns: 1fr; }}
      .setting {{ grid-template-columns: 1fr; gap: 2.5rem; }}
      .setting-media {{ max-width: 340px; }}
    }}
    @media (max-width: 700px) {{
      nav {{ padding: 0.8rem 1rem; gap: 0.5rem; }}
      .nav-logo {{ display: none; }}
      .nav-compare {{ display: none; }}
      .nav-back .nb-long {{ display: none; }}
      .nav-back .nb-short {{ display: inline; }}
      .nav-cta {{ padding: 0.6rem 0.95rem; font-size: 0.8rem; }}
      .hero {{ min-height: 50vh; }}
      .hero .hero-img {{ object-position: center 62%; }}
      .hero-inner {{ padding: 3.5rem 1.25rem 2rem; }}
      section, .cta, .disclaimer, footer {{ padding-left: 1.25rem; padding-right: 1.25rem; }}
      section {{ padding-top: 3rem; padding-bottom: 3rem; }}
      .facts {{ grid-template-columns: repeat(2, 1fr); }}
      .fact:nth-child(3n) {{ border-right: 1px solid rgba(255,255,255,0.09); }}
      .fact:nth-child(2n) {{ border-right: none; }}
      .gal, .sibs {{ grid-template-columns: 1fr; }}
      .logo-row {{ gap: 1.5rem; }}
      .dx-head {{ padding: 1.2rem 1.1rem; }}
      .dx-name {{ font-size: 1.25rem; }}
      .dx-total {{ font-size: 1.45rem; }}
      .dx-list {{ padding: 0.35rem 1.1rem 0.6rem 2.6rem; }}
      .dx-list::before {{ left: 1.45rem; }}
      .logo-row img {{ max-height: 22px; }}
    }}
  </style>
{pixel}
</head>
<body>

<nav>
  <a href="../index.html" class="nav-logo">Condos<em>Around</em></a>
  <a href="../neighbourhoods/dixie-lakeshore.html#townhomes" class="nav-back">&larr; <span class="nb-long">Dixie &amp; Lakeshore</span><span class="nb-short">Back</span></a>
  <a href="../neighbourhoods/dixie-lakeshore.html#compare" class="nav-back nav-compare">Compare townhomes</a>
  <a href="tel:6479240848" class="nav-cta">647-924-0848</a>
</nav>

<header class="hero{hero_class}">
  {hero_pic}
  <div class="hero-inner">
    {status_badge}<div class="hero-builder">{builder} &middot; {area}</div>
    <h1 class="hero-title">{name}</h1>
    <div class="hero-tag">{tagline}</div>
    <div class="hero-addr">{address}</div>{hero_cta}
  </div>
  <div class="hero-credit">Artist&rsquo;s concept</div>
</header>

<div class="facts">
{facts}
</div>
{register_section}
<section>
  <div class="overview">
    <div>
      <div class="sec-eyebrow">Overview</div>
      <h2 class="sec-title">About <em>{name}</em></h2>
{intro}
{logos}    </div>
    <div>
      <h3 class="side-title">Getting around</h3>
{commute}
    </div>
  </div>
</section>

<section>
  <div class="sec-eyebrow">Pricing</div>
  <h2 class="sec-title">{pricing_title}</h2>
{tables}{plans_link}
</section>

<section>
  <div class="two-col">
    <div>
      <div class="sec-eyebrow">What&rsquo;s included</div>
      <h2 class="sec-title">{incentives_title}</h2>
      <ul class="inc-list">
{incentives}
      </ul>
    </div>
    <div>
{deposit}
    </div>
  </div>
</section>

{extra_sections}
<section>
  <div class="sec-eyebrow">Gallery</div>
  <h2 class="sec-title">{gallery_title}</h2>
  <div class="gal">
{gallery}
  </div>
</section>

<section>
  <div class="sec-eyebrow">Nearby</div>
  <h2 class="sec-title">More townhomes in <em>Dixie &amp; Lakeshore</em></h2>
  <div class="sibs">
{others}
  </div>
</section>

<div class="cta">
  <div class="cta-h">Interested in {name}?<br><em>{cta_line}</em></div>
  <div class="cta-actions">
    <a href="tel:6479240848" class="btn-w">Call 647-924-0848</a>
    <a href="sms:6479240848?body=Hi%2C%20I%27d%20like%20information%20on%20{name_url}." class="btn-o">Text for details</a>
  </div>
</div>

<div class="disclaimer">
  Source: {source} Renderings are artist&rsquo;s concept. Prices, sizes, incentives,
  specifications and availability are subject to change without notice and may not reflect
  the current release. Any GST/HST rebate reference depends on purchaser eligibility and on
  legislation being enacted as anticipated. Confirm all figures with the sales office before
  relying on them. Brokers protected. E.&amp;O.E.
</div>

<footer>
  <div class="footer-logo">Condos<em>Around</em></div>
  <div>CondosAround.com &middot; &copy; 2025</div>
</footer>

<script src="../js/save.js"></script>
<script src="../js/sofia.js"></script>
<script src="../js/protect.js"></script>
</body>
</html>
"""


# --------------------------------------------------------------------------
# neighbourhood page: townhome cards + compare table
# --------------------------------------------------------------------------

NB_PAGE = os.path.join(ROOT, "neighbourhoods", "dixie-lakeshore.html")
NB_PREFIX = "../buildings/images/towns/"
NB_CARD_SIZES = "(max-width: 700px) 100vw, (max-width: 1399px) 50vw, 25vw"

NB_CSS_START = "    /* towns:generated-css:start (scripts/build_town_pages.py) */"
NB_CSS_END = "    /* towns:generated-css:end */"
NB_CSS = NB_CSS_START + """
    .proj-flag.new { background: rgba(255,255,255,0.96); color: #002244; font-weight: 600; }
    .proj-card.is-new { border-color: #d8cfb8; }
    .proj-grid.n4 { grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
    .proj-grid.n4 .proj-name { font-size: 1.45rem; }
    .proj-grid.n4 .proj-body { padding: 1.25rem 1.25rem 1.35rem; }
    @media (max-width: 1399px) {
      .proj-grid.n4 { grid-template-columns: repeat(2, 1fr); gap: 1.75rem; }
      .proj-grid.n4 .proj-name { font-size: 1.6rem; }
      .proj-grid.n4 .proj-body { padding: 1.4rem 1.5rem 1.5rem; }
    }
    @media (max-width: 700px) { .proj-grid.n4 { grid-template-columns: 1fr; } }
    table.cmp.n4 { min-width: 1020px; }
    table.cmp .cmp-mini { display: block; font-weight: 400; color: var(--text-muted); font-size: 0.74rem; margin-top: 0.15rem; }
    table.cmp th.is-new { background: #0b3358; }
    /* phones: keep the row labels pinned while the communities scroll sideways */
    @media (max-width: 700px) {
      table.cmp th, table.cmp td { padding: 0.8rem 0.85rem; }
      table.cmp td:first-child, table.cmp th:first-child {
        position: sticky; left: 0; z-index: 2; white-space: normal;
        width: 86px; min-width: 86px; max-width: 86px;
        font-size: 0.56rem; letter-spacing: 0.08em; box-shadow: 1px 0 0 #e6e1d6; }
      table.cmp thead th:first-child { z-index: 3; }
      table.cmp tbody td:first-child { background: #fff; }
      table.cmp tbody tr:nth-child(even) td:first-child { background: #fbf9f5; }
      table.cmp.n4 { min-width: 880px; }
      .cmp-scroll { scroll-snap-type: x proximity; scroll-padding-left: 86px; }
      table.cmp thead th:not(:first-child) { scroll-snap-align: start; }
    }
""" + NB_CSS_END


def _price_number(text):
    digits = "".join(ch for ch in text.split("<")[0] if ch.isdigit())
    return int(digits) if digits else None


def townhomes_section():
    """The whole <section id="townhomes"> block: cards, then the compare table."""
    n = len(ORDER)
    word = NUMBER_WORDS.get(n, str(n))
    sold = [s for s in ORDER if PROJECTS[s].get("status") == "Sold out"]
    upcoming = [s for s in ORDER if PROJECTS[s].get("status_kind") == "new"]
    selling = n - len(sold) - len(upcoming)
    tally = "%d selling now" % selling
    if upcoming:
        tally += " &middot; %d launching" % len(upcoming)
    if sold:
        tally += " &middot; %d sold out" % len(sold)

    cards = []
    for slug in ORDER:
        p, c = PROJECTS[slug], PROJECTS[slug]["card"]
        flag_text, flag_kind = c["flag"]
        is_sold = p.get("status") == "Sold out"
        classes = "proj-card" + (" is-sold" if is_sold else "") + (" is-new" if flag_kind == "new" else "")
        specs = "\n".join(
            '          <div><div class="proj-spec-lbl">%s</div><div class="proj-spec-val">%s</div></div>'
            % kv for kv in c["specs"])
        cards.append("""    <a class="%s" href="../buildings/%s.html">
      <div class="proj-img">
        %s
        <span class="proj-flag%s">%s</span>
      </div>
      <div class="proj-body">
        <div class="proj-builder">%s</div>
        <div class="proj-name">%s</div>
        <div class="proj-loc">%s</div>
        <div class="proj-specs">
%s
        </div>
        <div class="proj-foot">
          <div><div class="proj-price-lbl">Starting from</div><div class="proj-price">%s</div></div>
          <span class="proj-go">View &rarr;</span>
        </div>
      </div>
    </a>""" % (classes, slug,
               picture(c["image"], c["image_alt"], NB_CARD_SIZES, CARD_W,
                       prefix=NB_PREFIX).replace("\n      ", ""),
               " " + flag_kind if flag_kind else "", flag_text,
               p["builder"], p["name"], c["location"], specs, c["price"]))

    # lowest starting price among communities you can still buy in
    live = {s: _price_number(PROJECTS[s]["compare"]["price"]) for s in ORDER if s not in sold}
    lowest = min((v, s) for s, v in live.items() if v)[1] if any(live.values()) else None

    head = "".join(
        '\n            <th%s>%s<small>%s%s</small></th>'
        % (' class="is-new"' if PROJECTS[s].get("status_kind") == "new" else "",
           PROJECTS[s]["compare"]["short"], PROJECTS[s]["compare"]["builder"],
           " &middot; Sold out" if s in sold else "")
        for s in ORDER)

    rows = []
    for key, label in COMPARE_ROWS:
        cells = []
        for s in ORDER:
            val = PROJECTS[s]["compare"][key]
            if key == "price":
                if s in sold:
                    cells.append('<td class="hi" style="color:#7a2626;">Sold out'
                                 '<span class="cmp-mini">was %s</span></td>' % val)
                else:
                    cells.append('<td class="hi%s">%s</td>'
                                 % (" cmp-best" if s == lowest else "", val))
            else:
                cells.append("<td>%s</td>" % val)
        rows.append("          <tr>\n            <td>%s</td>\n            %s\n          </tr>"
                    % (label, "\n            ".join(cells)))

    dated = [PROJECTS[s]["compare"]["dated"] for s in ORDER]
    note = ("Figures from builder price lists dated " + ", ".join(dated[:-1]) + " and " + dated[-1]
            + ". $/sq ft is calculated from the starting price and smallest plan. Prices, "
              "incentives and availability change without notice &mdash; confirm with the sales "
              "office before relying on any figure. E.&amp;O.E.")

    return """<section class="cat-band" id="townhomes">
  <div class="cat-head">
    <div>
      <div class="cat-eyebrow">In this neighbourhood</div>
      <h2 class="cat-title">Town<em>homes</em></h2>
      <p class="cat-sub">Ground-related living on the Mississauga waterfront &mdash; rooftop terraces, private garages and outdoor space, minutes from the lake.</p>
    </div>
    <div class="cat-count"><b>%d</b>Communities &middot; %s</div>
  </div>

  <div class="proj-grid n%d">

%s

  </div>

  <!-- ============ COMPARE ============ -->
  <div class="cmp-wrap" id="compare">
    <div class="cmp-title">Compare all <em>%s</em></div>
    <div class="cmp-sub">Side by side, from the current builder price lists.</div>
    <div class="cmp-scroll">
      <table class="cmp n%d">
        <thead>
          <tr>
            <th></th>%s
          </tr>
        </thead>
        <tbody>
%s
        </tbody>
      </table>
    </div>
    <p class="cmp-note">%s</p>
  </div>
</section>""" % (n, tally, n, "\n\n".join(cards), word, n, head, "\n".join(rows), note)


def update_neighbourhood():
    """Regenerate the townhome section of the Dixie & Lakeshore page in place."""
    import re
    src = open(NB_PAGE, encoding="utf-8").read()
    start = src.find('<section class="cat-band" id="townhomes">')
    end = src.find("</section>", start)
    if start == -1 or end == -1:
        raise SystemExit("dixie-lakeshore.html: townhomes section not found "
                         "(run scripts/build_dixie_lakeshore.py first)")
    src = src[:start] + townhomes_section() + src[end + len("</section>"):]

    # generated CSS block: replace if present, otherwise append to the page <style>
    if NB_CSS_START in src:
        a = src.find(NB_CSS_START)
        b = src.find(NB_CSS_END, a) + len(NB_CSS_END)
        src = src[:a] + NB_CSS + src[b:]
    else:
        src = src.replace("</style>", NB_CSS + "\n</style>", 1)

    # The page hero is static markup: drop any srcset candidate whose file is gone
    # (e.g. the 2560px hero variants, removed because a full-bleed hero under a dark
    # overlay never needs them and retina screens would always pick the biggest).
    def _prune(match):
        kept = [c for c in match.group(2).split(", ")
                if os.path.exists(os.path.normpath(os.path.join(
                    os.path.dirname(NB_PAGE), c.strip().split(" ")[0])))]
        return match.group(1) + ", ".join(kept) + match.group(3)
    src = re.sub(r'((?:imagesrcset|srcset)=")((?:\.\./buildings/images/towns/[^"]+))(")', _prune, src)

    n = len(ORDER)
    word = NUMBER_WORDS.get(n, str(n)).capitalize()
    src = re.sub(r'(<div class="hero-nb-stat-val">)\d+(</div><div class="hero-nb-stat-lbl">Communities)',
                 r"\g<1>%d\2" % (n + 1), src)          # townhome communities + the Exhale condo tower
    src = re.sub(r'(<div class="hero-nb-stat-val">)\d+(</div><div class="hero-nb-stat-lbl">Townhome projects)',
                 r"\g<1>%d\2" % n, src)
    src = re.sub(r'(Townhomes<span class="sec-nav-count">)\d+(</span>)', r"\g<1>%d\2" % n, src)
    src = re.sub(r"\b(Two|Three|Four|Five|Six|Seven|Eight) new townhome communities",
                 "%s new townhome communities" % word, src)
    open(NB_PAGE, "w", encoding="utf-8").write(src)
    print("  updated neighbourhoods/dixie-lakeshore.html  (%d townhome communities)" % n)

    # homepage card
    index = os.path.join(ROOT, "index.html")
    html_src = open(index, encoding="utf-8").read()
    new_src = re.sub(r"\d+ town communities", "%d town communities" % n, html_src)
    if new_src != html_src:
        open(index, "w", encoding="utf-8").write(new_src)
        print("  updated index.html")


def main():
    for slug in ORDER:
        path = os.path.join(OUT_DIR, slug + ".html")
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(build(slug, PROJECTS[slug]))
        print("  wrote buildings/%s.html  (%.1f KB)" % (slug, os.path.getsize(path) / 1024))
    update_neighbourhood()


if __name__ == "__main__":
    main()
