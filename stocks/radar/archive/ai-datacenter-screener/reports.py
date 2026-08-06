"""
AI Analyst — research-report templates.

Each report is one of the ten analyst workflows. We build a system prompt (the
analyst persona + guardrails) plus a task-specific user prompt, and inject the
live data the app already has (price, valuation/quality/technical metrics, the
6-factor score, recent headlines, and peer companies). The result is sent to
Claude; if no API key is configured the app shows the assembled prompt instead.
"""

SYSTEM = """You are a senior equity research analyst writing for a thoughtful but non-expert retail investor.

Ground rules — follow all of them:
- Use the LIVE DATA block provided in the user message for current figures (price, multiples, margins, score, recent headlines). It is more up to date than your training data; prefer it for anything time-sensitive.
- Use your own knowledge for business model, history, products, and industry context.
- Clearly separate FACTS from ASSUMPTIONS / ESTIMATES. Explicitly label modeled or uncertain numbers (e.g. "assumption", "estimate", "as of ~Q1 2026").
- Cite approximate dates or quarters for time-sensitive claims, and say when something may be stale or you are not sure.
- Do NOT give buy / sell / hold recommendations or price targets as advice. Provide analysis, scenarios, and things to verify — not a verdict.
- Be concrete and quantitative. Avoid filler and hedging boilerplate.
- Format in clean GitHub-flavored Markdown: `##` headings, **bold**, bullet lists, and pipe tables where the task asks for a table. Lead with the most important points.
- TABLE FORMAT (strict): a header row, then a separator row of dashes like `| --- | --- | --- |`, then exactly ONE data row per line. Put each row on its own line; never merge the header and a data row onto one line; never pad cells with long runs of spaces.
- Keep it readable: a beginner should follow it, but it should be substantive.
- End with one italic line: *Research and education only — not investment advice.*"""

# id, label, icon, whether peer companies are useful context, and the task prompt.
# {company}, {ticker}, {peers} are filled in from live context.
REPORTS = [
    {
        "id": "research", "label": "Full Research Report", "icon": "📊", "peers": True,
        "task": (
            "Write a beginner-friendly equity research report on {company} ({ticker}). "
            "Cover, with a `##` section each: business model, revenue streams, industry trends, "
            "key competitors, financial performance, valuation, growth drivers, risks, and "
            "bull / base / bear scenarios. Finish with a short 'Research summary' section. "
            "Use recent public information, cite approximate dates, and separate facts from assumptions."
        ),
    },
    {
        "id": "earnings", "label": "Earnings Call Breakdown", "icon": "📞", "peers": False,
        "task": (
            "Analyze the most recent earnings report/call for {company} ({ticker}). "
            "Give the 5 biggest takeaways, then cover revenue changes, margins, guidance, management tone, "
            "analyst concerns, positive surprises, and negative surprises, and 'what to watch next'. "
            "Include a Markdown table of key metrics with columns: Metric | Latest | Prior | Change | Why it matters. "
            "If you are unsure which quarter is most recent, say so and reason from the data provided."
        ),
    },
    {
        "id": "redflags", "label": "Red Flag Detector", "icon": "🚩", "peers": False,
        "task": (
            "Act as a skeptical forensic analyst reviewing {company} ({ticker}) for red flags across: "
            "revenue quality, margins, cash flow, debt, dilution, insider activity, customer concentration, "
            "accounting, legal/regulatory issues, and management language. "
            "Present a Markdown table: Area | Concern | Severity (1-5) | Evidence | Why it matters. "
            "Then give an overall Red Flag Score from 1 (clean) to 10 (severe) with a one-paragraph rationale. "
            "Distinguish confirmed issues from things merely worth checking."
        ),
    },
    {
        "id": "moat", "label": "Competitive Moat Analysis", "icon": "🏰", "peers": True,
        "task": (
            "Analyze the competitive moat of {company} ({ticker}). Score each of these 1-5 in a Markdown table "
            "(Source of moat | Score 1-5 | Reasoning): brand, network effects, switching costs, cost advantages, "
            "scale, intellectual property, distribution, regulation, data advantages, customer loyalty. "
            "Compare against peers ({peers}). Then explain the strongest advantages, the biggest threats, and "
            "conclude whether the moat looks like it is expanding, stable, or shrinking — with reasoning."
        ),
    },
    {
        "id": "valuation", "label": "Valuation vs Peers", "icon": "⚖️", "peers": True,
        "task": (
            "Compare {company} ({ticker}) with peers ({peers}) on: market cap, revenue growth, margins, P/E, "
            "forward P/E, EV/revenue, EV/EBITDA, and price/free-cash-flow. Build one Markdown comparison table "
            "(rows = companies, columns = metrics; use the live data, mark gaps as n/a). Then explain whether "
            "{ticker} looks cheap, fair, or expensive versus peers, what assumptions justify its multiple, and "
            "what could make the multiple expand or contract."
        ),
    },
    {
        "id": "dcf", "label": "DCF Assumption Builder", "icon": "🧮", "peers": False,
        "task": (
            "Help build realistic DCF assumptions for {company} ({ticker}). Provide a Markdown table with bear / "
            "base / bull columns for: revenue growth, operating/FCF margin, tax rate, capex (% of revenue), "
            "working capital, discount rate (WACC), and terminal growth. Explain the reasoning behind each "
            "assumption. Then show a small sensitivity table of how the implied valuation moves across a range of "
            "discount rates and terminal growth rates. Label everything as assumptions/estimates — this is a "
            "framework, not a precise target."
        ),
    },
    {
        "id": "catalysts", "label": "Catalyst Calendar", "icon": "📅", "peers": False,
        "task": (
            "Create a catalyst calendar for {company} ({ticker}) over the next 3, 6, and 12 months. Consider "
            "earnings dates, product launches, investor days, regulatory decisions, lawsuits, macro events, "
            "industry conferences, management changes, buybacks, dividends, and major contracts. Present a Markdown "
            "table: Catalyst | Window (3/6/12mo) | Likely timing | Potential impact | Upside risk | Downside risk | "
            "Confidence (low/med/high). Note which items are scheduled facts vs your estimates."
        ),
    },
    {
        "id": "management", "label": "Management Quality", "icon": "👔", "peers": False,
        "task": (
            "Evaluate the leadership of {company} ({ticker}). Score each 1-5 in a Markdown table (Area | Score | "
            "Reasoning): CEO track record, CFO credibility, guidance accuracy, transparency, capital allocation, "
            "acquisitions, buybacks, dilution discipline, insider ownership, executive compensation, board quality, "
            "and communication style. Conclude whether management appears to act like long-term owners, with caveats."
        ),
    },
    {
        "id": "debate", "label": "Bull vs Bear Debate", "icon": "🥊", "peers": False,
        "task": (
            "Simulate an investment-committee debate on {company} ({ticker}). Write a 'Bull analyst' case and a "
            "'Bear analyst' case (use `###` sub-headings) that each address growth, valuation, business quality, "
            "risks, financials, management, and upcoming catalysts — let them rebut each other. End with a neutral "
            "'Judge's summary' that says which side has stronger *evidence*, what is genuinely uncertain, and the "
            "specific data points the reader should verify next."
        ),
    },
    {
        "id": "beginner", "label": "Beginner Checklist", "icon": "🎓", "peers": False,
        "task": (
            "Act as a patient investing teacher explaining {company} ({ticker}) in plain language. Cover: what it "
            "does, how it makes money, why investors care, what could go right, what could go wrong, profitability, "
            "growth, debt, valuation, and the top risks. Then end with a 'Beginner checklist' as a Markdown table "
            "(Check | Pass/Fail/Unsure | One-line note) for: easy to understand, financially strong, growing, "
            "reasonably valued, risks understood, needs more research."
        ),
    },
]

REPORTS_BY_ID = {r["id"]: r for r in REPORTS}


def build_messages(report_id, context_text, company, ticker, peers):
    """Return (system, user_prompt) for a report, with the task and live data."""
    report = REPORTS_BY_ID[report_id]
    task = report["task"].format(company=company, ticker=ticker, peers=peers or "its closest peers")
    user = (
        f"{task}\n\n"
        f"--- LIVE DATA (use for current figures; may be partial) ---\n"
        f"{context_text}\n"
        f"--- END LIVE DATA ---"
    )
    return SYSTEM, user
