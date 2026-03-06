"""
BetBoard v9.0 — Personal Sports Betting Command Center
Live API Integration with The Odds API
Features: Real-time odds, bet tracker with P&L charts, value bets, arbitrage,
          player props, EV/Kelly calculators, Pick-of-the-Day newsletter
Date: March 2026
"""

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # optional: on Streamlit Cloud secrets come from st.secrets

import streamlit as st
import pandas as pd
import requests
from datetime import datetime, timedelta, date
import time
import hashlib
import re
from typing import Dict, List, Optional, Tuple
import plotly.graph_objects as go
import plotly.express as px
from collections import defaultdict
import json
import os

# ── Secret/key loading helper ────────────────────────────────────────────────
def _get_secret(key: str, fallback: str = "") -> str:
    """Load a secret: Streamlit secrets → env var → fallback (session input)"""
    try:
        return st.secrets.get(key, os.environ.get(key, fallback))
    except Exception:
        return os.environ.get(key, fallback)

# ── Pre-load keys from secrets/env so they appear as defaults in the sidebar ─
_DEFAULT_ODDS_KEY   = _get_secret("ODDS_API_KEY")
_DEFAULT_RESEND_KEY = _get_secret("RESEND_API_KEY")
_DEFAULT_BREVO_KEY  = _get_secret("BREVO_API_KEY")

# Newsletter module (in same directory)
try:
    from newsletter import (
        pick_of_the_day, build_email_html, build_email_text,
        ResendClient, save_subscriber, load_subscribers,
        subscriber_count, log_pick, load_picks_history,
        format_american_odds as fmt_odds_nl
    )
    NEWSLETTER_AVAILABLE = True
except ImportError:
    NEWSLETTER_AVAILABLE = False

# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

st.set_page_config(
    page_title="BetBoard",
    page_icon="\u2696",  # trophy
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for dark theme, mobile-responsive layout
st.markdown("""
<style>
    /* ── Dark Theme Base ─────────────────────────────────────────────── */
    .stApp {
        background-color: #0e1117;
        color: #fafafa;
    }
    [data-testid="stSidebar"] {
        background-color: #1a1d24;
    }
    [data-testid="stSidebar"] .stMarkdown {
        color: #fafafa;
    }
    h1, h2, h3, h4, h5, h6 {
        color: #fafafa !important;
    }
    .element-container {
        color: #fafafa;
    }

    /* ── Tabs ────────────────────────────────────────────────────────── */
    .stTabs [data-baseweb="tab-list"] {
        gap: 4px;
        background-color: #1a1d24;
        flex-wrap: wrap;           /* tabs wrap on small screens */
    }
    .stTabs [data-baseweb="tab"] {
        padding: 10px 16px;
        background-color: #262730;
        color: #fafafa;
        border-radius: 8px 8px 0 0;
        font-size: 0.9em;
        white-space: nowrap;
        min-height: 44px;          /* touch-friendly */
    }
    .stTabs [data-baseweb="tab"]:hover {
        background-color: #3d4046;
    }
    .stTabs [aria-selected="true"] {
        background-color: #0e1117 !important;
        border-bottom: 3px solid #ff4b4b;
    }

    /* ── Expanders ───────────────────────────────────────────────────── */
    .streamlit-expanderHeader {
        background-color: #1a1d24;
        color: #fafafa !important;
        font-size: 1.05em;
        font-weight: 600;
        border-radius: 8px;
        min-height: 44px;
    }
    .streamlit-expanderHeader:hover {
        background-color: #262730;
    }
    .streamlit-expanderContent {
        background-color: #0e1117;
        border: 1px solid #262730;
    }

    /* ── Metrics ─────────────────────────────────────────────────────── */
    [data-testid="stMetricValue"] {
        color: #fafafa;
        font-size: 1.2em;
    }
    [data-testid="stMetricLabel"] {
        color: #a0a0a0;
        font-size: 0.8em;
    }
    [data-testid="stMetricDelta"] {
        color: #09ab3b;
    }

    /* ── Dataframes ──────────────────────────────────────────────────── */
    .dataframe {
        background-color: #1a1d24;
        color: #fafafa;
        font-size: 0.9em;
    }
    .dataframe thead tr th {
        background-color: #262730 !important;
        color: #fafafa !important;
    }
    .dataframe tbody tr {
        background-color: #1a1d24;
    }
    .dataframe tbody tr:hover {
        background-color: #262730;
    }
    /* Scrollable on mobile */
    [data-testid="stDataFrame"] > div {
        overflow-x: auto !important;
        -webkit-overflow-scrolling: touch;
    }

    /* ── Buttons ─────────────────────────────────────────────────────── */
    .stButton > button {
        background-color: #ff4b4b;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        font-weight: 600;
        min-height: 44px;          /* touch-friendly */
        width: 100%;
    }
    .stButton > button:hover {
        background-color: #ff6b6b;
        border: none;
    }

    /* ── Ticket cards ────────────────────────────────────────────────── */
    .ticket-won {
        background: linear-gradient(135deg, #0d3d2d 0%, #1a1d24 100%);
        border-left: 5px solid #09ab3b;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 12px;
    }
    .ticket-lost {
        background: linear-gradient(135deg, #3d0d0d 0%, #1a1d24 100%);
        border-left: 5px solid #ff4b4b;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 12px;
    }
    .ticket-active {
        background: linear-gradient(135deg, #1a2a0d 0%, #1a1d24 100%);
        border-left: 5px solid #ffc107;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 12px;
    }
    .ticket-push {
        background: linear-gradient(135deg, #1a1d24 0%, #262730 100%);
        border-left: 5px solid #888;
        border-radius: 10px;
        padding: 14px 16px;
        margin-bottom: 12px;
    }
    .ticket-label {
        font-size: 0.7em;
        font-weight: 700;
        letter-spacing: 1.5px;
        text-transform: uppercase;
        color: #a0a0a0;
    }
    .ticket-title {
        font-size: 1.05em;
        font-weight: 700;
        color: #fafafa;
        margin-top: 2px;
    }
    .ticket-meta {
        font-size: 0.85em;
        color: #a0a0a0;
        margin-top: 4px;
    }
    .leg-item {
        background-color: #262730;
        border-radius: 6px;
        padding: 8px 12px;
        margin: 4px 0;
        font-size: 0.9em;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    .pnl-positive { color: #09ab3b; font-weight: 700; }
    .pnl-negative { color: #ff4b4b; font-weight: 700; }
    .pnl-neutral  { color: #ffc107; font-weight: 700; }

    /* ── March Madness Banner ────────────────────────────────────────── */
    .mm-banner {
        background: linear-gradient(135deg, #1a0a3d 0%, #2d0d5c 50%, #1a0a3d 100%);
        border: 2px solid #7c3aed;
        border-radius: 12px;
        padding: 16px 20px;
        margin-bottom: 16px;
        text-align: center;
    }
    .mm-banner h2 {
        color: #c084fc !important;
        font-size: 1.4em;
        margin: 0;
    }
    .mm-banner p {
        color: #a0a0a0;
        margin: 4px 0 0;
        font-size: 0.9em;
    }

    /* ── Inputs ──────────────────────────────────────────────────────── */
    .stTextInput > div > div > input {
        background-color: #262730;
        color: #fafafa;
        border: 1px solid #3d4046;
        min-height: 44px;
    }
    .stSelectbox > div > div > div {
        background-color: #262730;
        color: #fafafa;
    }
    .stNumberInput > div > div > input {
        background-color: #262730;
        color: #fafafa;
        border: 1px solid #3d4046;
    }
    textarea {
        background-color: #262730 !important;
        color: #fafafa !important;
        border: 1px solid #3d4046 !important;
    }

    /* ── Alert boxes ─────────────────────────────────────────────────── */
    .stAlert { background-color: #1a1d24; border-radius: 8px; }
    [data-baseweb="notification"] [data-testid="stNotificationContentSuccess"] {
        background-color: #0d3d2d;
        border-left: 4px solid #09ab3b;
    }
    [data-baseweb="notification"] [data-testid="stNotificationContentWarning"] {
        background-color: #3d2d0d;
        border-left: 4px solid #ff8c00;
    }
    [data-baseweb="notification"] [data-testid="stNotificationContentInfo"] {
        background-color: #0d2d3d;
        border-left: 4px solid #00a0ff;
    }
    [data-baseweb="notification"] [data-testid="stNotificationContentError"] {
        background-color: #3d0d0d;
        border-left: 4px solid #ff4b4b;
    }

    /* ── Layout ──────────────────────────────────────────────────────── */
    .main .block-container {
        padding-top: 1.5rem;
        padding-bottom: 2rem;
        padding-left: 1rem;
        padding-right: 1rem;
        max-width: 100%;
    }
    /* Prevent horizontal overflow on mobile/desktop */
    .stApp, .main, [data-testid="stAppViewContainer"] {
        overflow-x: hidden;
    }
    /* Long team names and labels wrap instead of overflow */
    .streamlit-expanderHeader label {
        word-break: break-word;
        white-space: normal;
        line-height: 1.3;
    }
    .stRadio > label { color: #fafafa; }
    .stCheckbox > label { color: #fafafa; }
    .stSlider > div > div > div { background-color: #262730; }

    /* ── Branding / chrome ───────────────────────────────────────────── */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    code {
        background-color: #262730;
        color: #ff6b6b;
        padding: 2px 6px;
        border-radius: 4px;
    }
    a { color: #4d9eff; }
    a:hover { color: #6db3ff; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #1a1d24; }
    ::-webkit-scrollbar-thumb { background: #3d4046; border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: #4d5158; }
    .stMarkdown { color: #fafafa; }
    hr { border-color: #3d4046; }

    /* ── Mobile breakpoints ──────────────────────────────────────────── */
    @media screen and (max-width: 768px) {
        /* Tighter padding on small screens */
        .main .block-container {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }
        /* Tabs: emoji-only labels shrink via font-size */
        .stTabs [data-baseweb="tab"] {
            padding: 8px 10px;
            font-size: 0.78em;
        }
        /* Headers scale down */
        h1 { font-size: 1.5em !important; }
        h2 { font-size: 1.25em !important; }
        h3 { font-size: 1.1em !important; }
        /* Metrics smaller on mobile */
        [data-testid="stMetricValue"] { font-size: 1em; }
        [data-testid="stMetricLabel"] { font-size: 0.72em; }
        /* Ensure tables scroll horizontally */
        [data-testid="stDataFrame"] { overflow-x: auto !important; }
        .dataframe { font-size: 0.78em; }
        /* Stack columns stacking hint — Streamlit handles it via JS,
           but force minimum touch-target size */
        .stButton > button {
            min-height: 48px;
            font-size: 0.95em;
            padding: 12px 12px;
        }
        .stTextInput > div > div > input,
        .stNumberInput > div > div > input,
        .stSelectbox > div > div > div {
            font-size: 16px !important; /* prevents iOS auto-zoom */
        }
        /* Ticket cards compact on mobile */
        .ticket-won, .ticket-lost, .ticket-active, .ticket-push {
            padding: 10px 12px;
        }
        .ticket-title { font-size: 0.95em; }
    }

    @media screen and (max-width: 480px) {
        .stTabs [data-baseweb="tab"] {
            padding: 7px 8px;
            font-size: 0.7em;
        }
        h1 { font-size: 1.25em !important; }
        [data-testid="stMetricValue"] { font-size: 0.9em; }
    }

    /* ── Header bar: responsive for mobile/desktop ────────────────────── */
    .betboard-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 8px;
    }
    .betboard-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        min-width: 0;
    }
    .betboard-header-right {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #a0a0a0;
        font-size: 0.82em;
    }
    @media screen and (max-width: 640px) {
        .betboard-header-row {
            flex-direction: column;
            align-items: flex-start;
        }
        .betboard-header-right {
            font-size: 0.75em;
        }
    }
    /* Safe area for notched phones */
    .stApp {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
    }
</style>
""", unsafe_allow_html=True)

# API Configuration
API_BASE_URL = "https://api.the-odds-api.com/v4"
DATA_REFRESH_INTERVAL = 600  # 10 minutes
RATE_LIMIT_REQUESTS = 100
RATE_LIMIT_WINDOW = 60

# Session state keys
API_KEY_STATE = "api_key"
RATE_LIMIT_KEY = "rate_limit_tracker"
ODDS_CACHE_KEY = "odds_cache"
LINE_MOVEMENT_KEY = "line_movement_history"

# Supported sports
SPORTS_CONFIG = {
    "basketball_nba": {"name": "NBA", "icon": "🏀"},
    "basketball_ncaab": {"name": "NCAA Basketball", "icon": "🎓"},
    "americanfootball_nfl": {"name": "NFL", "icon": "🏈"},
    "baseball_mlb": {"name": "MLB", "icon": "⚾"},
    "icehockey_nhl": {"name": "NHL", "icon": "🏒"},
}

# ============================================================================
# SECURITY & RATE LIMITING
# ============================================================================

# Spam / abuse keywords — block in feedback forms
_SPAM_KEYWORDS = [
    "casino", "crypto", "bitcoin", "earn money fast", "click here",
    "free money", "guaranteed profit", "winner", "prize", "loan",
    "viagra", "cialis", "enlargement", "http://", "https://t.me"
]

FEEDBACK_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "feedback.json")

def sanitize_text(text: str, max_len: int = 500) -> str:
    """Strip HTML tags, control characters, and truncate."""
    text = re.sub(r"<[^>]+>", "", text)           # strip HTML
    text = re.sub(r"[\x00-\x1f\x7f]", "", text)   # strip control chars
    return text.strip()[:max_len]

def is_valid_email(email: str) -> bool:
    """Basic RFC-style email validation."""
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email.strip())) and len(email) <= 254

def is_spam(text: str) -> bool:
    """Check if text contains known spam keywords."""
    lower = text.lower()
    return any(kw in lower for kw in _SPAM_KEYWORDS)

def load_feedback() -> list:
    """Load all saved feedback entries."""
    if not os.path.exists(FEEDBACK_FILE):
        return []
    try:
        with open(FEEDBACK_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []

def save_feedback(entry: dict) -> bool:
    """Append a feedback entry to the JSON file."""
    try:
        entries = load_feedback()
        entries.append(entry)
        with open(FEEDBACK_FILE, "w", encoding="utf-8") as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return True
    except Exception:
        return False

class SecurityManager:
    """Session security management"""

    @staticmethod
    def init_session():
        if "session_id" not in st.session_state:
            st.session_state.session_id = hashlib.sha256(
                f"{datetime.now().timestamp()}".encode()
            ).hexdigest()

        if "session_start" not in st.session_state:
            st.session_state.session_start = datetime.now()

        if "csrf_token" not in st.session_state:
            st.session_state.csrf_token = hashlib.sha256(
                f"{st.session_state.session_id}{time.time()}".encode()
            ).hexdigest()

        # Rate-limit counters for forms
        if "sub_attempts" not in st.session_state:
            st.session_state.sub_attempts = 0
        if "feedback_attempts" not in st.session_state:
            st.session_state.feedback_attempts = 0

    @staticmethod
    def validate_session() -> bool:
        if "session_start" not in st.session_state:
            return False

        elapsed = datetime.now() - st.session_state.session_start
        if elapsed > timedelta(hours=8):   # bumped to 8h for real use
            st.session_state.clear()
            return False
        return True

    @staticmethod
    def check_form_rate_limit(counter_key: str, max_attempts: int = 5) -> bool:
        """Returns True if the action is allowed, False if blocked."""
        attempts = st.session_state.get(counter_key, 0)
        return attempts < max_attempts

class RateLimiter:
    """API rate limiting"""
    
    @staticmethod
    def init():
        if RATE_LIMIT_KEY not in st.session_state:
            st.session_state[RATE_LIMIT_KEY] = {
                "requests": [],
                "blocked_until": None
            }
    
    @staticmethod
    def can_make_request() -> Tuple[bool, Optional[str]]:
        tracker = st.session_state[RATE_LIMIT_KEY]
        now = time.time()
        
        if tracker["blocked_until"] and now < tracker["blocked_until"]:
            wait_time = int(tracker["blocked_until"] - now)
            return False, f"Rate limit exceeded. Wait {wait_time}s"
        
        tracker["requests"] = [
            req_time for req_time in tracker["requests"]
            if now - req_time < RATE_LIMIT_WINDOW
        ]
        
        if len(tracker["requests"]) >= RATE_LIMIT_REQUESTS:
            tracker["blocked_until"] = now + RATE_LIMIT_WINDOW
            return False, f"Rate limit: {RATE_LIMIT_REQUESTS} requests/{RATE_LIMIT_WINDOW}s"
        
        tracker["requests"].append(now)
        return True, None
    
    @staticmethod
    def get_remaining_requests() -> int:
        tracker = st.session_state.get(RATE_LIMIT_KEY, {"requests": []})
        now = time.time()
        recent = [r for r in tracker["requests"] if now - r < RATE_LIMIT_WINDOW]
        return max(0, RATE_LIMIT_REQUESTS - len(recent))

# ============================================================================
# MONETIZATION FEATURES
# ============================================================================

class MonetizationManager:
    """Handles affiliate marketing, ads, and email capture"""
    
    @staticmethod
    def show_affiliate_sportsbooks_inline():
        """Affiliate sportsbooks — call from inside a 'with st.sidebar' or expander block"""
        st.caption("Sign up bonuses — terms apply, 21+")

        sportsbooks = [
            {
                "name": "FanDuel",
                "emoji": "🔥",
                "bonus": "Bet $5, Get $200",
                "link": "https://fanduel.com/?utm_source=betboard&utm_medium=referral&utm_campaign=YOUR_ID",
                "color": "#1060D5"
            },
            {
                "name": "DraftKings",
                "emoji": "👑",
                "bonus": "Risk-Free $1,000",
                "link": "https://draftkings.com/?utm_source=betboard&utm_medium=referral&utm_campaign=YOUR_ID",
                "color": "#53D337"
            },
            {
                "name": "BetMGM",
                "emoji": "🎰",
                "bonus": "Up To $1,500 Back",
                "link": "https://betmgm.com/?utm_source=betboard&utm_medium=referral&utm_campaign=YOUR_ID",
                "color": "#B8860B"
            }
        ]

        for book in sportsbooks:
            st.markdown(f"""
            <div style='padding:8px 10px;border:1px solid {book['color']}44;border-radius:8px;
                        margin-bottom:8px;background:{book['color']}0d;'>
                <div style='font-weight:700;font-size:0.95em;'>{book['emoji']} {book['name']}</div>
                <div style='color:{book['color']};font-size:0.8em;font-weight:600;margin:2px 0 6px;'>{book['bonus']}</div>
                <a href='{book['link']}' target='_blank'
                   style='display:block;text-align:center;background:{book['color']};color:white;
                          padding:5px;border-radius:5px;text-decoration:none;font-size:0.8em;font-weight:700;'>
                    CLAIM BONUS →
                </a>
            </div>
            """, unsafe_allow_html=True)

    @staticmethod
    def show_affiliate_sportsbooks():
        """Display recommended sportsbooks with affiliate links (legacy sidebar call)"""
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 🎁 Recommended Sportsbooks")
        st.sidebar.caption("Sign up bonuses available!")

        # NOTE TO USER: Replace these with YOUR actual affiliate links
        sportsbooks = [
            {
                "name": "FanDuel",
                "emoji": "🔥",
                "bonus": "Bet $5, Get $200 Bonus",
                "link": "https://fanduel.com/?utm_source=betting_tool&utm_medium=referral&utm_campaign=YOUR_AFFILIATE_ID",
                "color": "#1060D5"
            },
            {
                "name": "DraftKings",
                "emoji": "👑",
                "bonus": "Risk-Free $1,000 Bet",
                "link": "https://draftkings.com/?utm_source=betting_tool&utm_medium=referral&utm_campaign=YOUR_AFFILIATE_ID",
                "color": "#53D337"
            },
            {
                "name": "BetMGM",
                "emoji": "🎰",
                "bonus": "Get Up To $1,500 Back",
                "link": "https://betmgm.com/?utm_source=betting_tool&utm_medium=referral&utm_campaign=YOUR_AFFILIATE_ID",
                "color": "#B8860B"
            }
        ]

        for book in sportsbooks:
            with st.sidebar.container():
                st.markdown(f"""
                <div style='padding: 10px; border: 2px solid {book['color']}; border-radius: 8px; margin-bottom: 10px; background: linear-gradient(135deg, {book['color']}15 0%, {book['color']}05 100%);'>
                    <div style='font-size: 1.2em; font-weight: bold; margin-bottom: 5px;'>
                        {book['emoji']} {book['name']}
                    </div>
                    <div style='color: {book['color']}; font-weight: bold; margin-bottom: 8px;'>
                        {book['bonus']}
                    </div>
                    <a href='{book['link']}' target='_blank' style='display: block; text-align: center; background-color: {book['color']}; color: white; padding: 8px; border-radius: 5px; text-decoration: none; font-weight: bold;'>
                        CLAIM BONUS →
                    </a>
                </div>
                """, unsafe_allow_html=True)

                if f"affiliate_clicks_{book['name']}" not in st.session_state:
                    st.session_state[f"affiliate_clicks_{book['name']}"] = 0

        st.sidebar.caption("⚠️ 21+ | Gamble Responsibly | Terms Apply")
    
    @staticmethod
    def show_email_capture():
        """Email list building — hardened with validation, sanitization, honeypot, rate limit"""
        st.sidebar.markdown("---")
        st.sidebar.markdown("### 📧 Get Daily Picks")
        st.sidebar.caption("Free betting insights in your inbox!")
        
        with st.sidebar.form("email_signup"):
            email = st.text_input("Email Address", placeholder="your@email.com")
            # Honeypot — hidden field to catch bots
            sidebar_honey = st.text_input("Leave blank", key="sidebar_honey_field",
                                          label_visibility="collapsed")
            subscribe = st.form_submit_button("🔔 Subscribe", width="stretch")
            
            if subscribe:
                # Bot check
                if sidebar_honey:
                    st.sidebar.error("Submission blocked.")
                # Rate limit check
                elif not SecurityManager.check_form_rate_limit("sidebar_sub_attempts", max_attempts=5):
                    st.sidebar.error("⛔ Too many attempts. Try again later.")
                else:
                    clean_email = sanitize_text(email, max_len=120).strip().lower()
                    if not clean_email or not is_valid_email(clean_email):
                        st.sidebar.error("❌ Please enter a valid email address")
                    else:
                        # Initialize email list in session state
                        if "email_list" not in st.session_state:
                            st.session_state.email_list = []
                        
                        existing = [e["email"] if isinstance(e, dict) else e
                                    for e in st.session_state.email_list]
                        if clean_email not in existing:
                            st.session_state.email_list.append({
                                "email": clean_email,
                                "timestamp": datetime.now().isoformat(),
                                "source": "dashboard_sidebar"
                            })
                            
                            st.sidebar.success("✅ Subscribed! Check your email.")
                            MonetizationManager._save_email_to_csv(clean_email)
                            st.session_state["sidebar_sub_attempts"] = \
                                st.session_state.get("sidebar_sub_attempts", 0) + 1
                        else:
                            st.sidebar.info("✅ Already subscribed!")
    
    @staticmethod
    def _save_email_to_csv(email: str):
        """Save email to CSV for later export"""
        import csv
        import os
        
        csv_file = "email_subscribers.csv"
        file_exists = os.path.isfile(csv_file)
        
        try:
            with open(csv_file, 'a', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(['Email', 'Timestamp', 'Source'])
                writer.writerow([email, datetime.now().isoformat(), 'dashboard_sidebar'])
        except Exception as e:
            st.sidebar.caption(f"Email saved to session (CSV error: {e})")
    
    @staticmethod
    def show_bet_tracker():
        """Full bet ticket tracker — straight bets, parlays, March Madness focus"""

        # ── Session state init ─────────────────────────────────────────────
        if "tickets" not in st.session_state:
            st.session_state.tickets = []
        if "next_ticket_id" not in st.session_state:
            st.session_state.next_ticket_id = 1

        tickets = st.session_state.tickets

        # ── Helper: calculate ticket odds & payout ─────────────────────────
        def american_to_decimal(odds: int) -> float:
            if odds >= 100:
                return 1 + odds / 100
            else:
                return 1 + 100 / abs(odds)

        def parlay_decimal(legs: list) -> float:
            d = 1.0
            for leg in legs:
                d *= american_to_decimal(leg.get("odds", -110))
            return d

        def ticket_payout(t: dict) -> float:
            stake = t.get("stake", 0)
            if t["bet_type"] == "Straight":
                dec = american_to_decimal(t.get("odds", -110))
                return round(stake * dec, 2)
            else:  # Parlay / Teaser
                legs = t.get("legs", [])
                if not legs:
                    return 0.0
                dec = parlay_decimal(legs)
                return round(stake * dec, 2)

        def ticket_profit(t: dict) -> float:
            status = t.get("status", "Active")
            stake = t.get("stake", 0)
            if status == "Won":
                return round(ticket_payout(t) - stake, 2)
            elif status == "Lost":
                return round(-stake, 2)
            elif status == "Push":
                return 0.0
            else:  # Active
                return 0.0

        # ── P&L DASHBOARD ─────────────────────────────────────────────────
        st.subheader("🎟️ My Bet Tickets")

        if tickets:
            total_staked   = sum(t.get("stake", 0) for t in tickets)
            active_tickets = [t for t in tickets if t.get("status") == "Active"]
            won_tickets    = [t for t in tickets if t.get("status") == "Won"]
            lost_tickets   = [t for t in tickets if t.get("status") == "Lost"]
            push_tickets   = [t for t in tickets if t.get("status") == "Push"]

            total_won    = sum(ticket_profit(t) for t in won_tickets)
            total_lost   = sum(ticket_profit(t) for t in lost_tickets)
            net_pnl      = total_won + total_lost
            at_risk      = sum(t.get("stake", 0) for t in active_tickets)
            roi          = (net_pnl / total_staked * 100) if total_staked > 0 else 0
            win_rate_pct = (len(won_tickets) / (len(won_tickets) + len(lost_tickets)) * 100) if (won_tickets or lost_tickets) else 0

            pnl_color = "#09ab3b" if net_pnl >= 0 else "#ff4b4b"
            pnl_sign  = "+" if net_pnl >= 0 else ""

            # Top P&L bar
            st.markdown(f"""
            <div style='background:#1a1d24;border-radius:12px;padding:16px 20px;margin-bottom:16px;
                        border:1px solid #262730;display:flex;flex-wrap:wrap;gap:12px;align-items:center;'>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>TOTAL STAKED</div>
                    <div style='color:#fafafa;font-size:1.4em;font-weight:700;'>${total_staked:.2f}</div>
                </div>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>AT RISK</div>
                    <div style='color:#ffc107;font-size:1.4em;font-weight:700;'>${at_risk:.2f}</div>
                </div>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>NET P&L</div>
                    <div style='color:{pnl_color};font-size:1.6em;font-weight:700;'>{pnl_sign}${net_pnl:.2f}</div>
                </div>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>ROI</div>
                    <div style='color:{pnl_color};font-size:1.4em;font-weight:700;'>{pnl_sign}{roi:.1f}%</div>
                </div>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>WIN RATE</div>
                    <div style='color:#fafafa;font-size:1.4em;font-weight:700;'>{win_rate_pct:.0f}%</div>
                </div>
                <div style='flex:1;min-width:100px;text-align:center;'>
                    <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:1px;'>RECORD</div>
                    <div style='color:#fafafa;font-size:1.4em;font-weight:700;'>
                        <span style='color:#09ab3b'>{len(won_tickets)}W</span>-<span style='color:#ff4b4b'>{len(lost_tickets)}L</span>-<span style='color:#888'>{len(push_tickets)}P</span>
                    </div>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # ── P&L CHARTS ────────────────────────────────────────────────
            settled = won_tickets + lost_tickets + push_tickets
            if len(settled) >= 2:
                chart_col1, chart_col2 = st.columns(2)

                # Pie chart — Win/Loss/Push breakdown
                with chart_col1:
                    pie_labels = ["Won", "Lost", "Push"]
                    pie_values = [len(won_tickets), len(lost_tickets), len(push_tickets)]
                    pie_colors = ["#09ab3b", "#ff4b4b", "#888888"]
                    # Remove zero slices
                    filtered = [(l, v, c) for l, v, c in zip(pie_labels, pie_values, pie_colors) if v > 0]
                    if filtered:
                        fl, fv, fc = zip(*filtered)
                        pie_fig = go.Figure(go.Pie(
                            labels=fl, values=fv,
                            marker=dict(colors=fc, line=dict(color="#0e1117", width=2)),
                            hole=0.5,
                            textinfo="label+percent",
                            textfont=dict(color="#fafafa", size=13),
                            hovertemplate="%{label}: %{value} tickets<extra></extra>"
                        ))
                        pie_fig.update_layout(
                            title=dict(text="🏅 Record Breakdown", font=dict(color="#fafafa", size=14)),
                            paper_bgcolor="#1a1d24", plot_bgcolor="#1a1d24",
                            font=dict(color="#fafafa"),
                            showlegend=False, margin=dict(t=40, b=20, l=20, r=20),
                            height=260
                        )
                        st.plotly_chart(pie_fig, width="stretch")

                # Running P&L line chart
                with chart_col2:
                    sorted_settled = sorted(settled, key=lambda x: x.get("created", ""))
                    running = 0.0
                    running_pnl = []
                    for t in sorted_settled:
                        running += ticket_profit(t)
                        running_pnl.append(running)
                    ticket_labels = [f"#{t.get('id','?')}" for t in sorted_settled]
                    colors_line = ["#09ab3b" if v >= 0 else "#ff4b4b" for v in running_pnl]
                    line_fig = go.Figure()
                    line_fig.add_trace(go.Scatter(
                        x=list(range(1, len(running_pnl) + 1)),
                        y=running_pnl,
                        mode="lines+markers",
                        line=dict(color="#09ab3b" if running_pnl[-1] >= 0 else "#ff4b4b", width=2),
                        marker=dict(color=colors_line, size=7),
                        hovertemplate=[f"Ticket {ticket_labels[i]}<br>Running P&L: ${running_pnl[i]:+.2f}<extra></extra>"
                                       for i in range(len(running_pnl))]
                    ))
                    line_fig.add_hline(y=0, line_dash="dash", line_color="#3d4046", line_width=1)
                    line_fig.update_layout(
                        title=dict(text="📈 Running P&L", font=dict(color="#fafafa", size=14)),
                        paper_bgcolor="#1a1d24", plot_bgcolor="#1a1d24",
                        font=dict(color="#fafafa"),
                        xaxis=dict(title="Ticket #", gridcolor="#262730", color="#a0a0a0"),
                        yaxis=dict(title="P&L ($)", gridcolor="#262730", color="#a0a0a0", tickprefix="$"),
                        margin=dict(t=40, b=40, l=50, r=20),
                        height=260
                    )
                    st.plotly_chart(line_fig, width="stretch")
        else:
            st.markdown("""
            <div style='background:#1a1d24;border-radius:12px;padding:20px;text-align:center;
                        border:1px solid #262730;margin-bottom:16px;'>
                <div style='font-size:2em;'>🎟️</div>
                <div style='color:#a0a0a0;margin-top:8px;'>No tickets yet — add your first bet below!</div>
            </div>""", unsafe_allow_html=True)

        st.markdown("---")

        # ── ADD NEW TICKET FORM ────────────────────────────────────────────
        with st.expander("➕ Add New Ticket", expanded=len(tickets) == 0):
            with st.form("new_ticket_form", clear_on_submit=True):
                r1c1, r1c2, r1c3 = st.columns([2, 2, 2])
                with r1c1:
                    bet_type = st.selectbox("Bet Type", ["Straight", "Parlay", "Teaser"])
                with r1c2:
                    sportsbook = st.selectbox("Sportsbook", [
                        "FanDuel", "DraftKings", "BetMGM", "Caesars",
                        "PointsBet", "BetRivers", "In-Person / Window", "Other"
                    ])
                with r1c3:
                    stake = st.number_input("Stake ($)", min_value=1.0, value=10.0, step=5.0)

                r2c1, r2c2 = st.columns([2, 2])
                with r2c1:
                    ticket_num = st.text_input("Ticket # (optional)", placeholder="e.g. TKT-001 or leave blank")
                with r2c2:
                    ticket_status = st.selectbox("Status", ["Active", "Won", "Lost", "Push"])

                # ── STRAIGHT BET fields
                if bet_type == "Straight":
                    sc1, sc2, sc3, sc4 = st.columns([3, 2, 2, 2])
                    with sc1:
                        s_game = st.text_input("Game", placeholder="Lakers vs Warriors")
                    with sc2:
                        s_market = st.selectbox("Market", ["Moneyline", "Spread", "Total Over", "Total Under", "Prop"])
                    with sc3:
                        s_pick = st.text_input("Your Pick", placeholder="Lakers -3.5")
                    with sc4:
                        s_odds = st.number_input("Odds", value=-110, step=5)
                    notes = st.text_area("Notes (optional)", placeholder="e.g. Home dog fade, March Madness round of 64", height=60)

                    submitted = st.form_submit_button("🎟️ Save Ticket", width="stretch")
                    if submitted:
                        auto_id = f"TKT-{st.session_state.next_ticket_id:03d}"
                        new_ticket = {
                            "id": ticket_num.strip() or auto_id,
                            "created": datetime.now().isoformat(),
                            "bet_type": "Straight",
                            "sportsbook": sportsbook,
                            "stake": stake,
                            "status": ticket_status,
                            "notes": notes,
                            "game": s_game,
                            "market": s_market,
                            "pick": s_pick,
                            "odds": s_odds,
                        }
                        st.session_state.tickets.append(new_ticket)
                        st.session_state.next_ticket_id += 1
                        st.success(f"✅ Ticket {new_ticket['id']} saved!")
                        st.rerun()

                else:  # Parlay / Teaser
                    num_legs = st.slider("Number of legs", 2, 12, 2)
                    legs = []
                    for i in range(num_legs):
                        st.markdown(f"**Leg {i+1}**")
                        lc1, lc2, lc3, lc4 = st.columns([3, 2, 2, 2])
                        with lc1:
                            lg = st.text_input(f"Game {i+1}", key=f"lg_{i}", placeholder="Team A vs Team B")
                        with lc2:
                            lm = st.selectbox(f"Market {i+1}", ["Moneyline", "Spread", "Total Over", "Total Under", "Prop"], key=f"lm_{i}")
                        with lc3:
                            lp = st.text_input(f"Pick {i+1}", key=f"lp_{i}", placeholder="Team A -3.5")
                        with lc4:
                            lo = st.number_input(f"Odds {i+1}", value=-110, step=5, key=f"lo_{i}")
                        ls = st.selectbox(f"Leg {i+1} Status", ["Active", "Won", "Lost", "Push", "N/A"], key=f"ls_{i}")
                        legs.append({"game": lg, "market": lm, "pick": lp, "odds": lo, "status": ls})

                    notes = st.text_area("Notes (optional)", placeholder="e.g. 4-leg MM parlay, round of 32", height=60)

                    # Show live parlay odds preview
                    if legs:
                        parlay_dec = parlay_decimal(legs)
                        parlay_am  = int((parlay_dec - 1) * 100) if parlay_dec >= 2 else int(-100 / (parlay_dec - 1))
                        pot_win    = round(stake * parlay_dec - stake, 2)
                        st.markdown(
                            f"**Parlay Odds Preview:** `{parlay_am:+d}` · "
                            f"Stake **${stake:.2f}** → Payout **${stake * parlay_dec:.2f}** (profit **${pot_win:.2f}**)"
                        )

                    submitted = st.form_submit_button("🎟️ Save Ticket", width="stretch")
                    if submitted:
                        auto_id = f"TKT-{st.session_state.next_ticket_id:03d}"
                        new_ticket = {
                            "id": ticket_num.strip() or auto_id,
                            "created": datetime.now().isoformat(),
                            "bet_type": bet_type,
                            "sportsbook": sportsbook,
                            "stake": stake,
                            "status": ticket_status,
                            "notes": notes,
                            "legs": legs,
                        }
                        st.session_state.tickets.append(new_ticket)
                        st.session_state.next_ticket_id += 1
                        st.success(f"✅ Ticket {new_ticket['id']} saved!")
                        st.rerun()

        # ── FILTERS ────────────────────────────────────────────────────────
        if tickets:
            fc1, fc2, fc3 = st.columns(3)
            with fc1:
                filter_status = st.multiselect("Filter by Status", ["Active", "Won", "Lost", "Push"],
                                                default=["Active", "Won", "Lost", "Push"])
            with fc2:
                filter_type = st.multiselect("Filter by Type", ["Straight", "Parlay", "Teaser"],
                                              default=["Straight", "Parlay", "Teaser"])
            with fc3:
                filter_book = st.multiselect("Filter by Sportsbook",
                                              sorted({t.get("sportsbook", "Other") for t in tickets}),
                                              default=sorted({t.get("sportsbook", "Other") for t in tickets}))

            filtered = [
                t for t in sorted(tickets, key=lambda x: x.get("created", ""), reverse=True)
                if t.get("status", "Active") in filter_status
                and t.get("bet_type", "Straight") in filter_type
                and t.get("sportsbook", "Other") in filter_book
            ]

            st.markdown(f"**{len(filtered)} ticket(s) shown**")

            # ── TICKET CARDS ───────────────────────────────────────────────
            for idx, t in enumerate(filtered):
                status   = t.get("status", "Active")
                css_cls  = {"Won": "ticket-won", "Lost": "ticket-lost",
                            "Push": "ticket-push"}.get(status, "ticket-active")
                status_emoji = {"Won": "✅", "Lost": "❌", "Push": "🔘", "Active": "🔥"}.get(status, "🔥")
                bet_type = t.get("bet_type", "Straight")
                sb       = t.get("sportsbook", "")
                stake    = t.get("stake", 0)
                payout   = ticket_payout(t)
                profit   = ticket_profit(t)
                profit_sign = "+" if profit >= 0 else ""
                pnl_color_cls = "pnl-positive" if profit > 0 else ("pnl-negative" if profit < 0 else "pnl-neutral")
                created  = t.get("created", "")[:10]
                tkt_id   = t.get("id", "")
                notes    = t.get("notes", "")

                # Build main title line
                if bet_type == "Straight":
                    title_line = f"{t.get('game','?')} — {t.get('market','?')} · <em>{t.get('pick','?')}</em> @ {t.get('odds', 0):+d}"
                else:
                    legs = t.get("legs", [])
                    title_line = f"{len(legs)}-leg {bet_type}"

                st.markdown(f"""
                <div class='{css_cls}'>
                    <div class='ticket-label'>{status_emoji} {status} · {bet_type} · {sb} · {created}</div>
                    <div class='ticket-title'>#{tkt_id} — {title_line}</div>
                    <div class='ticket-meta'>
                        Stake: <strong>${stake:.2f}</strong> &nbsp;|&nbsp;
                        Payout: <strong>${payout:.2f}</strong> &nbsp;|&nbsp;
                        P&L: <strong class='{pnl_color_cls}'>{profit_sign}${profit:.2f}</strong>
                        {f"&nbsp;|&nbsp; <em>{notes}</em>" if notes else ""}
                    </div>
                </div>""", unsafe_allow_html=True)

                # Show parlay legs inline
                if bet_type in ("Parlay", "Teaser") and t.get("legs"):
                    with st.expander(f"📋 View {len(t['legs'])} legs — #{tkt_id}", expanded=False):
                        leg_rows = []
                        for li, leg in enumerate(t["legs"], 1):
                            ls = leg.get("status", "Active")
                            ls_em = {"Won": "✅", "Lost": "❌", "Push": "🔘", "Active": "🔥", "N/A": "⬜"}.get(ls, "⬜")
                            leg_rows.append({
                                "Leg": li,
                                "Status": f"{ls_em} {ls}",
                                "Game": leg.get("game", ""),
                                "Market": leg.get("market", ""),
                                "Pick": leg.get("pick", ""),
                                "Odds": f"{leg.get('odds', 0):+d}",
                            })
                        st.dataframe(pd.DataFrame(leg_rows), width="stretch", hide_index=True)

                # Inline edit status
                ec1, ec2, ec3 = st.columns([3, 2, 1])
                with ec2:
                    new_status = st.selectbox(
                        "Update", ["Active", "Won", "Lost", "Push"],
                        index=["Active", "Won", "Lost", "Push"].index(status),
                        key=f"upd_{tkt_id}_{idx}"
                    )
                with ec3:
                    if st.button("💾 Save", key=f"save_{tkt_id}_{idx}"):
                        # Find and update the original ticket in session state
                        for orig in st.session_state.tickets:
                            if orig.get("id") == t.get("id") and orig.get("created") == t.get("created"):
                                orig["status"] = new_status
                                break
                        st.rerun()

                # Delete
                with ec1:
                    if st.button(f"🗑️ Delete #{tkt_id}", key=f"del_{tkt_id}_{idx}"):
                        st.session_state.tickets = [
                            x for x in st.session_state.tickets
                            if not (x.get("id") == t.get("id") and x.get("created") == t.get("created"))
                        ]
                        st.rerun()

                st.markdown("")  # spacer

            # ── CSV EXPORT ─────────────────────────────────────────────────
            st.markdown("---")
            if st.button("💾 Export All Tickets to CSV"):
                rows = []
                for t in tickets:
                    if t["bet_type"] == "Straight":
                        rows.append({
                            "ID": t.get("id"), "Date": t.get("created","")[:10],
                            "Type": t["bet_type"], "Sportsbook": t.get("sportsbook",""),
                            "Game": t.get("game",""), "Market": t.get("market",""),
                            "Pick": t.get("pick",""), "Odds": t.get("odds",""),
                            "Stake": t.get("stake",""), "Status": t.get("status",""),
                            "Profit": ticket_profit(t), "Notes": t.get("notes","")
                        })
                    else:
                        for li, leg in enumerate(t.get("legs",[]), 1):
                            rows.append({
                                "ID": t.get("id"), "Date": t.get("created","")[:10],
                                "Type": f"{t['bet_type']} Leg {li}", "Sportsbook": t.get("sportsbook",""),
                                "Game": leg.get("game",""), "Market": leg.get("market",""),
                                "Pick": leg.get("pick",""), "Odds": leg.get("odds",""),
                                "Stake": t.get("stake","") if li == 1 else "",
                                "Status": leg.get("status",""),
                                "Profit": ticket_profit(t) if li == 1 else "",
                                "Notes": t.get("notes","") if li == 1 else ""
                            })
                if rows:
                    csv_data = pd.DataFrame(rows).to_csv(index=False)
                    st.download_button(
                        "⬇️ Download my_tickets.csv",
                        csv_data,
                        "my_tickets.csv",
                        "text/csv",
                        width="stretch",
                    )
    
    @staticmethod
    def show_adsense_placeholder(tab_name: str):
        """Placeholder for Google AdSense ads — dark themed"""
        st.markdown(f"""
        <div style='text-align:center;padding:14px 20px;background:#1a1d24;border:1px dashed #3d4046;
                    border-radius:8px;margin-top:24px;'>
            <span style='color:#555;font-size:0.75em;letter-spacing:1px;text-transform:uppercase;'>
                Ad Space · {tab_name}
            </span>
            <p style='color:#3d4046;font-size:0.7em;margin:4px 0 0;'>
                Activate via Google AdSense — see MASTER_GUIDE.md
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    @staticmethod
    def track_analytics_event(event_name: str, properties: Dict = None):
        """Track events for Google Analytics (when GA4 is set up)"""
        if "analytics_events" not in st.session_state:
            st.session_state.analytics_events = []
        
        event = {
            "event": event_name,
            "timestamp": datetime.now().isoformat(),
            "properties": properties or {}
        }
        
        st.session_state.analytics_events.append(event)
        
        # TODO: In production, send to Google Analytics 4
        # Example using gtag.js:
        # st.components.v1.html(f"""
        # <script>
        #   gtag('event', '{event_name}', {json.dumps(properties)});
        # </script>
        # """, height=0)

# ============================================================================
# THE ODDS API CLIENT
# ============================================================================

class OddsAPIClient:
    """The Odds API integration"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or st.session_state.get(API_KEY_STATE)
        self.base_url = API_BASE_URL
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "BetBoard/9.0"
        })
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Optional[Dict]:
        if not self.api_key:
            return None
        
        can_request, error_msg = RateLimiter.can_make_request()
        if not can_request:
            st.warning(f"⚠️ {error_msg}")
            return None
        
        url = f"{self.base_url}/{endpoint}"
        params = params or {}
        params["apiKey"] = self.api_key
        
        # Retry logic for connection issues
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                response = self.session.get(url, params=params, timeout=15)
                
                remaining = response.headers.get("x-requests-remaining")
                used = response.headers.get("x-requests-used")
                
                if remaining:
                    st.session_state["api_requests_remaining"] = remaining
                if used:
                    st.session_state["api_requests_used"] = used
                
                response.raise_for_status()
                # Track session call count for cost display
                st.session_state["session_api_calls"] = st.session_state.get("session_api_calls", 0) + 1
                return response.json()
            
            except requests.exceptions.HTTPError as e:
                if e.response.status_code == 401:
                    st.error("❌ Invalid API Key")
                elif e.response.status_code == 429:
                    st.error("❌ API Rate limit exceeded")
                else:
                    st.error(f"❌ HTTP Error: {e}")
                return None
            
            except (requests.exceptions.ConnectionError, 
                    requests.exceptions.Timeout,
                    ConnectionResetError) as e:
                if attempt < max_retries - 1:
                    st.warning(f"⚠️ Connection issue (attempt {attempt + 1}/{max_retries}). Retrying in {retry_delay}s...")
                    time.sleep(retry_delay)
                    continue
                else:
                    st.error(f"❌ Connection failed after {max_retries} attempts. Please check your internet connection or try again later.")
                    return None
            
            except requests.exceptions.RequestException as e:
                st.error(f"❌ Request failed: {e}")
                st.info("💡 Tip: This can happen due to network issues. Try refreshing the page or checking your internet connection.")
                return None
        
        return None
    
    def test_api_key(self) -> Tuple[bool, str]:
        """Test if API key is valid. Also sets api_requests_remaining/used from response headers."""
        try:
            response = self.session.get(
                f"{self.base_url}/sports",
                params={"apiKey": self.api_key},
                timeout=10
            )
            remaining = response.headers.get("x-requests-remaining")
            used = response.headers.get("x-requests-used")
            if remaining is not None:
                st.session_state["api_requests_remaining"] = remaining
            if used is not None:
                st.session_state["api_requests_used"] = used

            if response.status_code == 200:
                return True, "✅ API Key valid"
            elif response.status_code == 401:
                return False, "❌ Invalid API Key - Check your key at the-odds-api.com"
            elif response.status_code == 429:
                return False, "⚠️ Rate limit exceeded - Wait before trying again"
            else:
                return False, f"❌ Error {response.status_code}: {response.text[:100]}"
        except Exception as e:
            return False, f"❌ Connection error: {str(e)}"
    
    @st.cache_data(ttl=DATA_REFRESH_INTERVAL)
    def get_sports(_self) -> List[Dict]:
        """Get all available sports"""
        data = _self._make_request("sports")
        return data if data else []
    
    @st.cache_data(ttl=DATA_REFRESH_INTERVAL)
    def get_odds(_self, sport: str, regions: str = "us", markets: str = "h2h,spreads,totals") -> List[Dict]:
        """Get current odds"""
        params = {
            "regions": regions,
            "markets": markets,
            "oddsFormat": "american",
            "dateFormat": "iso"
        }
        
        data = _self._make_request(f"sports/{sport}/odds", params)
        
        if data:
            if ODDS_CACHE_KEY not in st.session_state:
                st.session_state[ODDS_CACHE_KEY] = {}
            
            st.session_state[ODDS_CACHE_KEY][sport] = {
                "data": data,
                "timestamp": datetime.now(),
                "markets": markets
            }

        return data if data else []
    
    @st.cache_data(ttl=300)
    def get_event_odds(_self, sport: str, event_id: str, markets: str = "h2h,spreads,totals") -> Dict:
        """Get odds for specific event"""
        params = {
            "regions": "us",
            "markets": markets,
            "oddsFormat": "american",
            "dateFormat": "iso"
        }
        
        data = _self._make_request(f"sports/{sport}/events/{event_id}/odds", params)
        return data if data else {}
    
    @st.cache_data(ttl=DATA_REFRESH_INTERVAL)
    def get_player_props(_self, sport: str, event_id: str) -> Dict:
        """Get player props"""
        markets = "player_points,player_rebounds,player_assists,player_threes," \
                 "player_points_rebounds_assists,player_points_rebounds," \
                 "player_points_assists,player_rebounds_assists"
        
        params = {
            "regions": "us",
            "markets": markets,
            "oddsFormat": "american",
            "dateFormat": "iso"
        }
        
        data = _self._make_request(f"sports/{sport}/events/{event_id}/odds", params)
        return data if data else {}
    
    def get_scores(self, sport: str, days_from: int = 1) -> List[Dict]:
        """Get recent scores"""
        params = {
            "daysFrom": days_from,
            "dateFormat": "iso"
        }
        
        data = self._make_request(f"sports/{sport}/scores", params)
        return data if data else []

# ============================================================================
# LINE MOVEMENT TRACKER
# ============================================================================

class LineMovementTracker:
    """Track betting line movements"""
    
    @staticmethod
    def record_odds(event_id: str, odds_data: Dict):
        if LINE_MOVEMENT_KEY not in st.session_state:
            st.session_state[LINE_MOVEMENT_KEY] = {}
        
        if event_id not in st.session_state[LINE_MOVEMENT_KEY]:
            st.session_state[LINE_MOVEMENT_KEY][event_id] = []
        
        snapshot = {
            "timestamp": datetime.now().isoformat(),
            "data": odds_data
        }
        
        st.session_state[LINE_MOVEMENT_KEY][event_id].append(snapshot)
        
        if len(st.session_state[LINE_MOVEMENT_KEY][event_id]) > 100:
            st.session_state[LINE_MOVEMENT_KEY][event_id] = \
                st.session_state[LINE_MOVEMENT_KEY][event_id][-100:]
    
    @staticmethod
    def get_line_movement(event_id: str) -> List[Dict]:
        if LINE_MOVEMENT_KEY not in st.session_state:
            return []
        
        return st.session_state[LINE_MOVEMENT_KEY].get(event_id, [])

# ============================================================================
# ODDS ANALYSIS
# ============================================================================

class OddsAnalyzer:
    """Odds analysis and calculations"""
    
    @staticmethod
    def calculate_arbitrage(odds_data: Dict) -> Optional[Dict]:
        """Calculate arbitrage opportunities"""
        if not odds_data or "bookmakers" not in odds_data:
            return None
        
        best_home = -float('inf')
        best_away = -float('inf')
        home_book = None
        away_book = None
        
        for bookmaker in odds_data["bookmakers"]:
            for market in bookmaker.get("markets", []):
                if market["key"] != "h2h":
                    continue
                
                for outcome in market.get("outcomes", []):
                    odds = outcome.get("price")
                    if outcome["name"] == odds_data.get("home_team"):
                        if odds > best_home:
                            best_home = odds
                            home_book = bookmaker["key"]
                    else:
                        if odds > best_away:
                            best_away = odds
                            away_book = bookmaker["key"]
        
        if best_home == -float('inf') or best_away == -float('inf'):
            return None
        
        def american_to_decimal(odds):
            if odds > 0:
                return (odds / 100) + 1
            else:
                return (100 / abs(odds)) + 1
        
        home_decimal = american_to_decimal(best_home)
        away_decimal = american_to_decimal(best_away)
        
        home_prob = 1 / home_decimal
        away_prob = 1 / away_decimal
        total_prob = home_prob + away_prob
        
        if total_prob < 1:
            profit_margin = (1 / total_prob - 1) * 100
            return {
                "exists": True,
                "profit_margin": profit_margin,
                "home_bet": home_prob / total_prob * 100,
                "away_bet": away_prob / total_prob * 100,
                "home_bookmaker": home_book,
                "away_bookmaker": away_book,
                "home_odds": best_home,
                "away_odds": best_away
            }
        
        return {"exists": False}
    
    @staticmethod
    def find_value_bets(odds_data: List[Dict], edge_threshold: float = 5.0) -> List[Dict]:
        """Find value bets"""
        value_bets = []
        
        for game in odds_data:
            if "bookmakers" not in game or len(game["bookmakers"]) < 3:
                continue
            
            all_odds = defaultdict(list)
            
            for bookmaker in game["bookmakers"]:
                for market in bookmaker.get("markets", []):
                    for outcome in market.get("outcomes", []):
                        key = f"{market['key']}_{outcome['name']}"
                        all_odds[key].append(outcome.get("price"))
            
            for key, odds_list in all_odds.items():
                if len(odds_list) < 3:
                    continue
                
                avg_odds = sum(odds_list) / len(odds_list)
                max_odds = max(odds_list)
                
                if max_odds > avg_odds * (1 + edge_threshold/100):
                    value_bets.append({
                        "game": f"{game.get('away_team')} @ {game.get('home_team')}",
                        "market": key,
                        "best_odds": max_odds,
                        "avg_odds": avg_odds,
                        "edge": ((max_odds - avg_odds) / avg_odds) * 100
                    })
        
        return sorted(value_bets, key=lambda x: x["edge"], reverse=True)
    
    @staticmethod
    def calculate_expected_value(odds: int, win_probability: float) -> float:
        """Calculate EV"""
        if odds > 0:
            payout = odds / 100
        else:
            payout = 100 / abs(odds)
        
        ev = (win_probability * payout) - ((1 - win_probability) * 1)
        return ev * 100
    
    @staticmethod
    def implied_probability(american_odds: int) -> float:
        """Convert odds to probability"""
        if american_odds > 0:
            return 100 / (american_odds + 100)
        else:
            return abs(american_odds) / (abs(american_odds) + 100)

# ============================================================================
# VISUALIZATIONS
# ============================================================================

class BettingVisualizations:
    """Betting visualizations"""
    
    @staticmethod
    def plot_odds_comparison(odds_data: List[Dict], market_type: str = "h2h"):
        """Compare odds across bookmakers"""
        bookmaker_odds = defaultdict(dict)
        
        for game in odds_data[:1]:
            for bookmaker in game.get("bookmakers", []):
                for market in bookmaker.get("markets", []):
                    if market["key"] == market_type:
                        for outcome in market.get("outcomes", []):
                            team = outcome["name"]
                            bookmaker_odds[bookmaker["key"]][team] = outcome.get("price")
        
        if not bookmaker_odds:
            st.info("No odds data available")
            return
        
        teams = list(list(bookmaker_odds.values())[0].keys())
        bookmakers = list(bookmaker_odds.keys())
        
        fig = go.Figure()
        
        for team in teams:
            odds_values = [bookmaker_odds[book].get(team, 0) for book in bookmakers]
            fig.add_trace(go.Bar(
                name=team,
                x=bookmakers,
                y=odds_values,
                text=odds_values,
                textposition='auto',
            ))
        
        fig.update_layout(
            title="Odds Comparison Across Bookmakers",
            xaxis_title="Bookmaker",
            yaxis_title="American Odds",
            barmode='group',
            template="plotly_dark",
            height=500
        )
        
        st.plotly_chart(fig, width="stretch")

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def format_odds(price):
    """Format American odds with + sign"""
    if price is None:
        return "N/A"
    return f"{price:+d}"

def format_time(iso_str):
    """Format ISO time to readable"""
    try:
        dt = datetime.fromisoformat(iso_str.replace("Z", "+00:00"))
        # Convert UTC to local-ish display
        return dt.strftime("%a %b %d · %I:%M %p UTC")
    except:
        return iso_str or "TBD"

def get_best_odds(game, team, market="h2h"):
    """Get best available odds for a team across all bookmakers"""
    best = None
    best_book = ""
    for bm in game.get("bookmakers", []):
        for mkt in bm.get("markets", []):
            if mkt["key"] != market:
                continue
            for outcome in mkt.get("outcomes", []):
                if outcome.get("name") == team:
                    p = outcome.get("price")
                    if p is not None and (best is None or p > best):
                        best = p
                        best_book = bm.get("title", bm.get("key", ""))
    return best, best_book

def get_spread(game, team):
    """Get best spread for a team"""
    best_price = None
    best_point = None
    for bm in game.get("bookmakers", []):
        for mkt in bm.get("markets", []):
            if mkt["key"] != "spreads":
                continue
            for outcome in mkt.get("outcomes", []):
                if outcome.get("name") == team:
                    p = outcome.get("price")
                    pt = outcome.get("point")
                    if p is not None and (best_price is None or p > best_price):
                        best_price = p
                        best_point = pt
    return best_point, best_price

def get_total(game):
    """Get over/under total"""
    for bm in game.get("bookmakers", []):
        for mkt in bm.get("markets", []):
            if mkt["key"] != "totals":
                continue
            for outcome in mkt.get("outcomes", []):
                if outcome.get("name") == "Over":
                    return outcome.get("point"), outcome.get("price")
    return None, None

def pin_game(game_id, game_label):
    """Add game to watchlist"""
    if "watchlist" not in st.session_state:
        st.session_state.watchlist = {}
    st.session_state.watchlist[game_id] = {
        "label": game_label,
        "pinned_at": datetime.now().isoformat(),
        "sport": st.session_state.get("current_sport", "")
    }

def unpin_game(game_id):
    """Remove game from watchlist"""
    if "watchlist" in st.session_state and game_id in st.session_state.watchlist:
        del st.session_state.watchlist[game_id]

def render_game_card(game, sport_key, api_client, compact=False):
    """Render a single game card with odds comparison table"""
    game_id = game.get("id", "")
    away = game.get("away_team", "")
    home = game.get("home_team", "")
    commence = format_time(game.get("commence_time", ""))
    icon = SPORTS_CONFIG.get(sport_key, {}).get("icon", "🏆")
    sport_name = SPORTS_CONFIG.get(sport_key, {}).get("name", sport_key)

    # Best odds
    best_away_ml, best_away_book = get_best_odds(game, away, "h2h")
    best_home_ml, best_home_book = get_best_odds(game, home, "h2h")
    away_spread, away_spread_price = get_spread(game, away)
    home_spread, home_spread_price = get_spread(game, home)
    total_pt, total_price = get_total(game)

    # Watchlist state
    is_pinned = "watchlist" in st.session_state and game_id in st.session_state.watchlist

    # Card header row
    pin_col, title_col, time_col = st.columns([1, 6, 3])
    with pin_col:
        pin_label = "📌" if is_pinned else "📍"
        if st.button(pin_label, key=f"pin_{game_id}", help="Add/remove from Watchlist"):
            if is_pinned:
                unpin_game(game_id)
            else:
                pin_game(game_id, f"{away} @ {home}")
            st.rerun()
    with title_col:
        st.markdown(f"**{icon} {away}** `@` **{home}**")
    with time_col:
        st.caption(f"🕐 {commence}")

    if compact:
        # Compact: just the headline numbers in a tight row
        c1, c2, c3, c4, c5 = st.columns(5)
        with c1:
            st.metric("Away ML", format_odds(best_away_ml), help=f"Best at {best_away_book}")
        with c2:
            st.metric("Home ML", format_odds(best_home_ml), help=f"Best at {best_home_book}")
        with c3:
            sp = f"{away_spread:+g}" if away_spread is not None else "N/A"
            st.metric("Away Spread", sp)
        with c4:
            sp2 = f"{home_spread:+g}" if home_spread is not None else "N/A"
            st.metric("Home Spread", sp2)
        with c5:
            st.metric("Total", str(total_pt) if total_pt else "N/A")
        return

    # Detailed: full bookmaker comparison table
    c1, c2, c3, c4, c5, c6 = st.columns([3, 2, 2, 2, 2, 2])
    with c1:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>BOOKMAKER</span>", unsafe_allow_html=True)
    with c2:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>AWAY ML</span>", unsafe_allow_html=True)
    with c3:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>HOME ML</span>", unsafe_allow_html=True)
    with c4:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>AWAY SPRD</span>", unsafe_allow_html=True)
    with c5:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>HOME SPRD</span>", unsafe_allow_html=True)
    with c6:
        st.markdown(f"<span style='color:#a0a0a0;font-size:0.85em;'>TOTAL</span>", unsafe_allow_html=True)

    for bm in game.get("bookmakers", []):
        bm_name = bm.get("title", bm.get("key", ""))
        bm_away_ml = bm_home_ml = None
        bm_away_sprd = bm_home_sprd = bm_away_sprd_price = bm_home_sprd_price = None
        bm_total = bm_total_price = None

        for mkt in bm.get("markets", []):
            k = mkt["key"]
            for o in mkt.get("outcomes", []):
                nm = o.get("name", "")
                pr = o.get("price")
                pt = o.get("point")
                if k == "h2h":
                    if nm == away:
                        bm_away_ml = pr
                    elif nm == home:
                        bm_home_ml = pr
                elif k == "spreads":
                    if nm == away:
                        bm_away_sprd, bm_away_sprd_price = pt, pr
                    elif nm == home:
                        bm_home_sprd, bm_home_sprd_price = pt, pr
                elif k == "totals" and nm == "Over":
                    bm_total, bm_total_price = pt, pr

        r1, r2, r3, r4, r5, r6 = st.columns([3, 2, 2, 2, 2, 2])
        with r1:
            st.markdown(f"`{bm_name}`")
        with r2:
            val = format_odds(bm_away_ml)
            color = "#09ab3b" if bm_away_ml is not None and bm_away_ml == best_away_ml else "#fafafa"
            st.markdown(f"<span style='color:{color};font-weight:bold'>{val}</span>", unsafe_allow_html=True)
        with r3:
            val = format_odds(bm_home_ml)
            color = "#09ab3b" if bm_home_ml is not None and bm_home_ml == best_home_ml else "#fafafa"
            st.markdown(f"<span style='color:{color};font-weight:bold'>{val}</span>", unsafe_allow_html=True)
        with r4:
            if bm_away_sprd is not None:
                st.markdown(f"{bm_away_sprd:+g} `({format_odds(bm_away_sprd_price)})`")
            else:
                st.markdown("—")
        with r5:
            if bm_home_sprd is not None:
                st.markdown(f"{bm_home_sprd:+g} `({format_odds(bm_home_sprd_price)})`")
            else:
                st.markdown("—")
        with r6:
            if bm_total is not None:
                st.markdown(f"O{bm_total} `({format_odds(bm_total_price)})`")
            else:
                st.markdown("—")

    # Arbitrage check inline
    arb = OddsAnalyzer.calculate_arbitrage(game)
    if arb and arb.get("exists"):
        st.success(f"💰 **ARBITRAGE FOUND** — {arb['profit_margin']:.2f}% profit | "
                   f"Bet {arb['home_bet']:.1f}% on {home} @ {arb['home_bookmaker']} ({format_odds(arb['home_odds'])}) | "
                   f"Bet {arb['away_bet']:.1f}% on {away} @ {arb['away_bookmaker']} ({format_odds(arb['away_odds'])})")

    # Track line movement
    LineMovementTracker.record_odds(game_id, game)


# ============================================================================
# BREVO (SENDINBLUE) EMAIL CLIENT — free tier 9,000/mo, 300/day
# ============================================================================

def _test_brevo_connection(api_key: str) -> Tuple[bool, str]:
    """Quick ping to Brevo API to verify the key works."""
    try:
        r = requests.get(
            "https://api.brevo.com/v3/account",
            headers={"api-key": api_key, "Accept": "application/json"},
            timeout=8
        )
        if r.status_code == 200:
            plan = r.json().get("plan", [{}])
            credits = plan[0].get("credits", "?") if plan else "?"
            return True, f"OK · {credits} credits"
        return False, f"HTTP {r.status_code}"
    except Exception as e:
        return False, str(e)


def send_brevo_blast(api_key: str, to_emails: list, subject: str,
                     html_body: str, text_body: str,
                     sender_email: str = None) -> Dict:
    """
    Send a batch of emails via Brevo (one per recipient to respect 300/day limit).
    Chunks into groups of 50 with a short sleep between chunks.
    """
    # Configurable sender — falls back to secret, then default
    from_email = (sender_email
                  or _get_secret("BREVO_SENDER_EMAIL", "")
                  or "picks@betboard.app")
    headers = {
        "api-key": api_key,
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    sent, failed, errors = 0, 0, []
    chunks = [to_emails[i:i+50] for i in range(0, len(to_emails), 50)]

    for chunk in chunks:
        for email in chunk:
            payload = {
                "sender": {"name": "BetBoard Picks", "email": from_email},
                "to": [{"email": email}],
                "subject": subject,
                "htmlContent": html_body,
                "textContent": text_body,
            }
            try:
                r = requests.post(
                    "https://api.brevo.com/v3/smtp/email",
                    headers=headers,
                    json=payload,
                    timeout=12
                )
                if r.status_code in (200, 201):
                    sent += 1
                else:
                    failed += 1
                    errors.append(f"{email}: {r.status_code}")
            except Exception as e:
                failed += 1
                errors.append(f"{email}: {e}")
        if len(chunks) > 1:
            time.sleep(1)   # gentle throttle between chunks

    return {"sent": sent, "failed": failed, "errors": errors[:5]}


# ============================================================================
# MAIN APPLICATION
# ============================================================================

def main():
    """Main application"""

    SecurityManager.init_session()
    RateLimiter.init()

    if "watchlist" not in st.session_state:
        st.session_state.watchlist = {}
    if "last_refresh" not in st.session_state:
        st.session_state.last_refresh = datetime.now()
    if "auto_refresh" not in st.session_state:
        st.session_state.auto_refresh = False

    if not SecurityManager.validate_session():
        st.warning("⚠️ Session expired. Refresh page.")
        return

    # Use server-configured API key only (no user input for now)
    api_key = _DEFAULT_ODDS_KEY
    st.session_state[API_KEY_STATE] = api_key

    # ── HEADER (minimal: brand only, no LIVE/credits/updated) ─────────────────
    st.markdown("""
    <div class="betboard-header-row" style='background:linear-gradient(135deg,#1a1d24 0%,#0e1117 100%);
                border-bottom:2px solid #262730;padding:12px 8px 14px;margin-bottom:4px;'>
        <div class="betboard-header-left">
            <div style='font-size:1.8em;font-weight:900;color:#fafafa;letter-spacing:-0.5px;'>
                🏆 BetBoard
            </div>
            <span style='background:#262730;color:#a0a0a0;border-radius:6px;
                         padding:2px 8px;font-size:0.7em;font-weight:600;'>v9.0</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

    # Refresh button as a small inline row under header
    ref_col, _ = st.columns([1, 7])
    with ref_col:
        if st.button("🔄 Refresh", help="Clear cache and reload all odds"):
            st.cache_data.clear()
            st.session_state.last_refresh = datetime.now()
            st.rerun()
    
    # ── SIDEBAR ─────────────────────────────────────────────────────────────
    with st.sidebar:
        st.markdown("""
        <div style='text-align:center;padding:8px 0 4px;'>
            <span style='font-size:1.4em;font-weight:900;color:#fafafa;'>🏆 BetBoard</span>
            <span style='font-size:0.7em;color:#555;margin-left:6px;'>v9.0</span>
        </div>
        """, unsafe_allow_html=True)
        st.markdown("---")

        # ── Sports Filter (TOP — most used control) ──
        st.subheader("🏆 Sports")
        selected_sports = st.multiselect(
            "Active sports",
            options=list(SPORTS_CONFIG.keys()),
            format_func=lambda x: f"{SPORTS_CONFIG[x]['icon']} {SPORTS_CONFIG[x]['name']}",
            default=["basketball_nba", "basketball_ncaab"]
        )

        st.markdown("---")

        # ── Odds API status (server key only; no user input) ──────────────────
        _key = st.session_state.get(API_KEY_STATE, _DEFAULT_ODDS_KEY)
        if _key:
            _client = OddsAPIClient(_key)
            _valid, _msg = _client.test_api_key()
            if _valid:
                st.caption("✅ Odds data: Connected")
            else:
                st.caption("⚠️ Odds: Not configured")
        else:
            st.caption("⚠️ Odds: Not configured. Contact site owner.")

        st.markdown("---")

        # ── View Mode ──
        st.subheader("🖥️ Display")
        view_mode = st.radio("View Mode", ["Board", "Detailed", "Compact"], index=0,
                             help="Board = cards, Detailed = full odds table, Compact = numbers only")
        st.session_state["view_mode"] = view_mode

        auto_refresh = st.checkbox("Auto-refresh (5 min)", value=st.session_state.auto_refresh)
        st.session_state.auto_refresh = auto_refresh
        st.caption("💡 Collapse sidebar ← for max space")

        # ── Affiliate sportsbooks (collapsed by default) ──
        st.markdown("---")
        with st.expander("🎁 Sportsbook Bonuses", expanded=False):
            MonetizationManager.show_affiliate_sportsbooks_inline()
        MonetizationManager.show_email_capture()

    api_client = OddsAPIClient()
    view_mode = st.session_state.get("view_mode", "Board")

    # Auto refresh
    if st.session_state.auto_refresh:
        elapsed = (datetime.now() - st.session_state.last_refresh).total_seconds()
        if elapsed > 300:
            st.cache_data.clear()
            st.session_state.last_refresh = datetime.now()
            st.rerun()

    if not api_key:
        st.markdown("""
        <div style='max-width:680px;margin:40px auto 0;text-align:center;padding:0 16px;'>
            <div style='font-size:3.5em;margin-bottom:8px;'>🏆</div>
            <h1 style='font-size:2.2em;font-weight:900;color:#fafafa;margin:0 0 8px;'>BetBoard</h1>
            <p style='color:#a0a0a0;font-size:1.1em;margin:0 0 32px;'>
                Your personal sports betting command center — live odds, bet tracking, and daily picks.
            </p>
        </div>
        """, unsafe_allow_html=True)

        # Feature cards
        fc1, fc2, fc3 = st.columns(3)
        feature_cards = [
            ("📊", "Live Odds Board", "Side-by-side odds from 8+ sportsbooks. Best line highlighted in green."),
            ("🎟️", "Bet Tracker", "Log straight bets & parlays. Auto-calculates P&L, ROI, and win rate."),
            ("💎", "Value & Arbitrage", "Auto-detects edges and guaranteed-profit arb opportunities."),
            ("🎯", "Player Props", "Compare prop lines across all books. Best Over/Under surfaced instantly."),
            ("📧", "Pick of the Day", "Algorithm picks the sharpest play daily and emails your subscribers."),
            ("�", "EV & Kelly Calc", "Know exactly how much edge you have and the right bet size."),
        ]
        cols = [fc1, fc2, fc3]
        for i, (icon, title, desc) in enumerate(feature_cards):
            with cols[i % 3]:
                st.markdown(f"""
                <div style='background:#1a1d24;border:1px solid #262730;border-radius:10px;
                            padding:16px;margin-bottom:12px;height:130px;'>
                    <div style='font-size:1.6em;margin-bottom:6px;'>{icon}</div>
                    <div style='font-weight:700;color:#fafafa;margin-bottom:4px;'>{title}</div>
                    <div style='color:#a0a0a0;font-size:0.82em;line-height:1.4;'>{desc}</div>
                </div>
                """, unsafe_allow_html=True)

        st.markdown("<br>", unsafe_allow_html=True)
        st.markdown("""
        <div style='max-width:420px;margin:0 auto;background:linear-gradient(135deg,#1a2a0d 0%,#1a1d24 100%);
                    border:1px solid #09ab3b44;border-radius:12px;padding:20px 24px;text-align:center;'>
            <div style='font-size:1.1em;font-weight:700;color:#fafafa;margin-bottom:6px;'>
                👈 Enter your API key in the sidebar to get started
            </div>
            <div style='color:#a0a0a0;font-size:0.85em;margin-bottom:12px;'>
                Free key · 500 requests/month · Takes 30 seconds
            </div>
            <a href='https://the-odds-api.com' target='_blank'
               style='background:#09ab3b;color:white;padding:8px 20px;border-radius:8px;
                      text-decoration:none;font-weight:700;font-size:0.9em;'>
                Get Free API Key →
            </a>
        </div>
        """, unsafe_allow_html=True)
        return

    if not selected_sports:
        st.warning("Select at least one sport in the sidebar.")
        return
    
    # ── LOAD ALL ODDS DATA ONCE ──────────────────────────────────────────────
    all_games_by_sport = {}
    for sport in selected_sports:
        with st.spinner(f"Loading {SPORTS_CONFIG[sport]['name']} odds..."):
            data = api_client.get_odds(sport, markets="h2h,spreads,totals")
            all_games_by_sport[sport] = data or []
            st.session_state["current_sport"] = sport

    # ── TABS ─────────────────────────────────────────────────────────────────
    tabs = st.tabs([
        "📅 Today",
        "📌 Watchlist",
        "🔬 Analysis",
        "🎯 Props",
        "🏆 Scores",
        "📝 My Bets",
        "📧 Newsletter",
        "💬 Feedback"
    ])

    # ════════════════════════════════════════════════════════════════════════
    # TAB 0 — TODAY'S BOARD
    # ════════════════════════════════════════════════════════════════════════
    with tabs[0]:
        # March Madness banner when NCAAB is selected
        now = datetime.now()
        mm_start = datetime(now.year, 3, 18)
        mm_end   = datetime(now.year, 4, 8)
        if "basketball_ncaab" in selected_sports:
            if mm_start <= now <= mm_end:
                st.markdown("""
                <div class='mm-banner'>
                    <h2>🏀 MARCH MADNESS IS LIVE 🏀</h2>
                    <p>Tournament mode active — NCAA games highlighted below</p>
                </div>""", unsafe_allow_html=True)
            else:
                days_to_mm = (mm_start - now).days
                if 0 < days_to_mm <= 60:
                    st.markdown(f"""
                    <div class='mm-banner'>
                        <h2>🎓 March Madness Countdown</h2>
                        <p>Tournament tips off in <strong style='color:#c084fc'>{days_to_mm} days</strong> · NCAA Basketball tracking active</p>
                    </div>""", unsafe_allow_html=True)

        total_games = sum(len(v) for v in all_games_by_sport.values())
        total_books = max(
            (len(g.get("bookmakers", [])) for v in all_games_by_sport.values() for g in v),
            default=0
        )
        pinned_count = len(st.session_state.watchlist)

        # Summary bar (no API credits shown to users)
        s1, s2, s3 = st.columns(3)
        s1.metric("🎮 Games Today", total_games)
        s2.metric("📚 Bookmakers", total_books)
        s3.metric("📌 Watching", pinned_count)

        st.markdown("---")

        for sport in selected_sports:
            games = all_games_by_sport.get(sport, [])
            icon = SPORTS_CONFIG[sport]["icon"]
            name = SPORTS_CONFIG[sport]["name"]

            st.subheader(f"{icon} {name} — {len(games)} game(s)")

            if not games:
                st.info("No games listed right now.")
                continue

            for game in games:
                game_id = game.get("id", "")
                away = game.get("away_team", "")
                home = game.get("home_team", "")
                is_pinned = game_id in st.session_state.watchlist

                # Expandable game card
                card_label = (
                    f"{'📌 ' if is_pinned else ''}"
                    f"{away} @ {home}  ·  {format_time(game.get('commence_time',''))}"
                )
                with st.expander(card_label, expanded=is_pinned):
                    render_game_card(
                        game, sport, api_client,
                        compact=(view_mode == "Compact")
                    )

            st.markdown("---")

        MonetizationManager.show_adsense_placeholder("Today's Board")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 1 — WATCHLIST
    # ════════════════════════════════════════════════════════════════════════
    with tabs[1]:
        st.header("📌 Watchlist — Pinned Games")
        st.caption("Pin any game from Today's Board using the 📍 button. Pinned games show full live odds here.")

        if not st.session_state.watchlist:
            st.info("No games pinned yet. Go to Today's Board and click 📍 on any game.")
        else:
            # Build lookup for pinned games
            all_games_flat = {g.get("id"): (g, sport)
                              for sport, games in all_games_by_sport.items()
                              for g in games}

            for game_id, watch_info in list(st.session_state.watchlist.items()):
                if game_id in all_games_flat:
                    game, sport = all_games_flat[game_id]
                    away = game.get("away_team", "")
                    home = game.get("home_team", "")

                    st.subheader(f"📌 {away} @ {home}")
                    pinned_at = watch_info.get("pinned_at", "")
                    try:
                        pt = datetime.fromisoformat(pinned_at)
                        st.caption(f"Pinned at {pt.strftime('%I:%M %p')} · {format_time(game.get('commence_time',''))}")
                    except:
                        pass

                    render_game_card(game, sport, api_client, compact=False)

                    # Refresh this specific game
                    col_ref, col_unpin = st.columns(2)
                    with col_unpin:
                        if st.button(f"❌ Unpin", key=f"unpin_w_{game_id}"):
                            unpin_game(game_id)
                            st.rerun()

                    st.markdown("---")
                else:
                    st.warning(f"Game {watch_info.get('label','unknown')} not in current data (may have started).")
                    if st.button(f"Remove", key=f"rm_{game_id}"):
                        unpin_game(game_id)
                        st.rerun()

        MonetizationManager.show_adsense_placeholder("Watchlist")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 2 — ANALYSIS (Value Bets + Arbitrage + EV + Kelly + Chart)
    # ════════════════════════════════════════════════════════════════════════
    with tabs[2]:
        ana_tab1, ana_tab2, ana_tab3, ana_tab4, ana_tab5 = st.tabs([
            "💎 Value Bets", "⚖️ Arbitrage", "🧮 EV Calc", "📐 Kelly", "📈 Odds Chart"
        ])

        # ── VALUE BETS ────────────────────────────────────────────────────
        with ana_tab1:
            st.subheader("💎 Value Bet Finder")
            st.caption("Finds lines where one book is paying significantly more than the market average — your edge.")

            col_e, col_b = st.columns([2, 2])
            with col_e:
                edge_threshold = st.slider("Min Edge %", 0.0, 20.0, 3.0, 0.5,
                                           help="Lower = more results, Higher = stronger edges only")
            with col_b:
                st.markdown("&nbsp;")
                st.caption("Edge = (Best odds − Avg odds) / Avg odds × 100")

            all_value_bets = []
            for sport, games in all_games_by_sport.items():
                if games:
                    vb = OddsAnalyzer.find_value_bets(games, edge_threshold)
                    for v in vb:
                        v["sport"] = SPORTS_CONFIG[sport]["name"]
                    all_value_bets.extend(vb)

            if all_value_bets:
                st.success(f"✅ Found **{len(all_value_bets)}** value bets with edge ≥ {edge_threshold}%")
                df_vb = pd.DataFrame(all_value_bets)
                df_vb = df_vb.sort_values("edge", ascending=False)
                df_vb["best_odds"] = df_vb["best_odds"].apply(format_odds)
                df_vb["avg_odds"] = df_vb["avg_odds"].apply(lambda x: format_odds(int(x)) if x else "N/A")
                df_vb["edge"] = df_vb["edge"].apply(lambda x: f"{x:.2f}%")
                st.dataframe(
                    df_vb[["sport", "game", "market", "best_odds", "avg_odds", "edge"]],
                    width="stretch", height=400
                )

                top = all_value_bets[0]
                st.markdown("---")
                st.subheader("🧮 Quick EV Check — Top Value Bet")
                st.markdown(f"**{top['game']}** | Market: `{top['market']}` | Best Odds: `{format_odds(int(top['best_odds']) if isinstance(top['best_odds'], (int,float)) else -110)}`")
                try:
                    top_odds = int(top["best_odds"]) if isinstance(top["best_odds"], (int, float)) else -110
                except:
                    top_odds = -110
                imp_prob = OddsAnalyzer.implied_probability(top_odds) * 100
                ev_col1, ev_col2 = st.columns(2)
                with ev_col1:
                    st.metric("Implied Prob", f"{imp_prob:.1f}%")
                    st.metric("Best Odds", format_odds(top_odds))
                with ev_col2:
                    user_prob = st.slider("Your estimated win %", 0.0, 100.0, float(imp_prob) + 3.0, 0.5,
                                          key="vb_prob_slider")
                    ev_result = OddsAnalyzer.calculate_expected_value(top_odds, user_prob / 100)
                    if ev_result > 0:
                        st.success(f"✅ EV: **{ev_result:+.2f}%** (Positive!)")
                    else:
                        st.error(f"❌ EV: {ev_result:+.2f}%")
            else:
                st.info(f"No value bets found with edge ≥ {edge_threshold}%. Try lowering the threshold.")

        # ── ARBITRAGE ─────────────────────────────────────────────────────
        with ana_tab2:
            st.subheader("⚖️ Arbitrage Scanner")
            st.caption("True arbitrage = guaranteed profit by betting all sides across different books. Rare but real.")

            arb_opportunities = []
            for sport, games in all_games_by_sport.items():
                for game in games:
                    arb = OddsAnalyzer.calculate_arbitrage(game)
                    if arb and arb.get("exists"):
                        arb["game"] = f"{game.get('away_team')} @ {game.get('home_team')}"
                        arb["sport"] = SPORTS_CONFIG[sport]["name"]
                        arb["commence"] = format_time(game.get("commence_time", ""))
                        arb_opportunities.append(arb)

            if arb_opportunities:
                st.success(f"💰 **{len(arb_opportunities)} arbitrage opportunity(ies) found!**")
                for i, arb in enumerate(sorted(arb_opportunities, key=lambda x: x["profit_margin"], reverse=True), 1):
                    with st.expander(f"#{i} — {arb['game']}  ·  {arb['profit_margin']:.2f}% profit  ·  {arb['commence']}",
                                     expanded=(i == 1)):
                        a1, a2, a3 = st.columns(3)
                        with a1:
                            st.metric("Profit Margin", f"{arb['profit_margin']:.2f}%")
                        with a2:
                            st.metric(f"Bet Home ({arb['home_bookmaker']})",
                                      f"{arb['home_bet']:.1f}%  @  {format_odds(arb['home_odds'])}")
                        with a3:
                            st.metric(f"Bet Away ({arb['away_bookmaker']})",
                                      f"{arb['away_bet']:.1f}%  @  {format_odds(arb['away_odds'])}")
                        stake = st.number_input("Total Stake ($)", value=100, step=10, key=f"arb_stake_{i}")
                        home_stake = stake * arb["home_bet"] / 100
                        away_stake = stake * arb["away_bet"] / 100
                        profit = stake * arb["profit_margin"] / 100
                        sc1, sc2, sc3 = st.columns(3)
                        sc1.metric("Stake on Home", f"${home_stake:.2f}")
                        sc2.metric("Stake on Away", f"${away_stake:.2f}")
                        sc3.metric("Guaranteed Profit", f"${profit:.2f}", delta="locked in")
            else:
                st.info("No true arbitrage right now. The market is efficient — check back as lines move.")
                st.caption("Arbitrage appears when books disagree enough that the combined implied probabilities drop below 100%.")

        # ── EV CALCULATOR ─────────────────────────────────────────────────
        with ana_tab3:
            st.subheader("🧮 Expected Value Calculator")
            st.caption("EV tells you if a bet is mathematically profitable long-term.")

            prefill_odds = -110
            game_choices = {"Manual input": None}
            for sport, games in all_games_by_sport.items():
                for g in games:
                    label = f"{g.get('away_team')} @ {g.get('home_team')}"
                    game_choices[label] = (g, sport)

            picked = st.selectbox("Pre-fill from live game (optional)", list(game_choices.keys()))
            if picked != "Manual input" and game_choices[picked]:
                g_data, g_sport = game_choices[picked]
                away = g_data.get("away_team", "")
                home = g_data.get("home_team", "")
                side = st.radio("Side", [away, home], horizontal=True)
                best_price, best_book = get_best_odds(g_data, side, "h2h")
                if best_price:
                    prefill_odds = best_price
                    st.caption(f"Best odds for {side}: {format_odds(best_price)} @ {best_book}")

            col1, col2 = st.columns(2)
            with col1:
                calc_odds = st.number_input("American Odds", value=prefill_odds, step=5)
            with col2:
                imp = OddsAnalyzer.implied_probability(calc_odds) * 100
                calc_prob = st.slider("Your win probability %", 0.0, 100.0,
                                      round(min(imp + 2, 99.0), 1), 0.1)

            ev = OddsAnalyzer.calculate_expected_value(calc_odds, calc_prob / 100)
            implied_prob = OddsAnalyzer.implied_probability(calc_odds) * 100
            edge = calc_prob - implied_prob

            m1, m2, m3 = st.columns(3)
            m1.metric("Expected Value", f"{ev:+.2f}%")
            m2.metric("Implied Prob (book)", f"{implied_prob:.2f}%")
            m3.metric("Your Edge", f"{edge:+.2f}%")

            if ev > 0:
                st.success(f"✅ Positive EV! You profit **{ev:.2f}%** per dollar wagered long-term.")
            elif ev > -3:
                st.warning(f"⚠️ Slightly negative EV ({ev:.2f}%). Proceed with caution.")
            else:
                st.error(f"❌ Negative EV ({ev:.2f}%). The book has the edge here.")

        # ── KELLY CRITERION ───────────────────────────────────────────────
        with ana_tab4:
            st.subheader("📐 Kelly Criterion — Optimal Bet Sizing")
            st.caption("Kelly tells you what % of your bankroll to bet for maximum long-term growth.")

            col1, col2, col3 = st.columns(3)
            with col1:
                kelly_odds = st.number_input("American Odds", value=-110, step=5, key="kelly_odds")
            with col2:
                kelly_prob = st.slider("Win Probability %", 0.0, 100.0, 55.0, 0.5, key="kelly_prob")
            with col3:
                bankroll = st.number_input("Bankroll ($)", value=1000, step=100)

            prob = kelly_prob / 100
            dec = (kelly_odds / 100 + 1) if kelly_odds > 0 else (100 / abs(kelly_odds) + 1)
            b = dec - 1
            q = 1 - prob
            kf = max(0, (b * prob - q) / b) if b > 0 else 0
            hk, qk = kf * 0.5, kf * 0.25

            k1, k2, k3 = st.columns(3)
            k1.metric("Full Kelly", f"{kf*100:.2f}%", delta=f"${bankroll*kf:.2f}")
            k2.metric("Half Kelly ✅ (recommended)", f"{hk*100:.2f}%", delta=f"${bankroll*hk:.2f}")
            k3.metric("Quarter Kelly", f"{qk*100:.2f}%", delta=f"${bankroll*qk:.2f}")

            if kf > 0:
                st.success(f"Bet **${bankroll*hk:.2f}** (Half Kelly) — balances growth vs risk.")
                if kf > 0.25:
                    st.warning("⚠️ Full Kelly is very aggressive (>25% of bankroll). Half Kelly is safer.")
            else:
                st.error("No edge detected. Kelly says bet $0.")

        with ana_tab3:
            st.subheader("Moneyline Odds Chart")
            all_odds_data = [g for games in all_games_by_sport.values() for g in games]
            if all_odds_data:
                BettingVisualizations.plot_odds_comparison(all_odds_data, "h2h")
            else:
                st.info("No odds data loaded.")

        MonetizationManager.show_adsense_placeholder("Analysis")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 3 — PLAYER PROPS
    # ════════════════════════════════════════════════════════════════════════
    with tabs[3]:
        st.header("🎯 Player Props")
        st.caption("Compare player prop lines across all available bookmakers. Best Over/Under highlighted.")

        # Sport picker
        props_sport = st.selectbox(
            "Sport",
            selected_sports,
            format_func=lambda x: f"{SPORTS_CONFIG[x]['icon']} {SPORTS_CONFIG[x]['name']}"
        )

        sport_games = all_games_by_sport.get(props_sport, [])
        if not sport_games:
            st.info("No games available for this sport.")
        else:
            game_map = {f"{g.get('away_team')} @ {g.get('home_team')}": g for g in sport_games}
            selected_game_label = st.selectbox("Select Game", list(game_map.keys()))
            selected_game_obj = game_map[selected_game_label]

            with st.spinner("Loading player props..."):
                props_data = api_client.get_player_props(props_sport, selected_game_obj.get("id"))

            if props_data and props_data.get("bookmakers"):
                player_props = defaultdict(lambda: defaultdict(list))

                for bm in props_data.get("bookmakers", []):
                    for mkt in bm.get("markets", []):
                        for outcome in mkt.get("outcomes", []):
                            pname = outcome.get("description", "Unknown")
                            player_props[pname][mkt["key"]].append({
                                "Book": bm.get("title", bm.get("key")),
                                "Line": outcome.get("point"),
                                "Odds": outcome.get("price"),
                                "O/U": outcome.get("name")
                            })

                if not player_props:
                    st.info("No player prop markets available for this game yet.")
                else:
                    for player, stats in sorted(player_props.items()):
                        with st.expander(f"\U0001f3c3 {player}", expanded=False):
                            for stat, rows in stats.items():
                                st.markdown(f"**{stat.replace('_',' ').title()}**")
                                df_p = pd.DataFrame(rows)

                                # Split Over / Under for easy comparison
                                overs = df_p[df_p["O/U"] == "Over"].sort_values("Odds", ascending=False)
                                unders = df_p[df_p["O/U"] == "Under"].sort_values("Odds", ascending=False)

                                pc1, pc2 = st.columns(2)
                                with pc1:
                                    if not overs.empty:
                                        st.markdown("🔼 **OVER**")
                                        st.dataframe(overs[["Book", "Line", "Odds"]],
                                                     width="stretch", hide_index=True)
                                        best_o = overs.iloc[0]
                                        st.success(f"Best Over: {best_o['Line']} @ {format_odds(int(best_o['Odds']))} ({best_o['Book']})")
                                with pc2:
                                    if not unders.empty:
                                        st.markdown("🔽 **UNDER**")
                                        st.dataframe(unders[["Book", "Line", "Odds"]],
                                                     width="stretch", hide_index=True)
                                        best_u = unders.iloc[0]
                                        st.success(f"Best Under: {best_u['Line']} @ {format_odds(int(best_u['Odds']))} ({best_u['Book']})")
                                st.markdown("---")
            else:
                st.info("No props available for this game yet. Props typically open closer to game time.")

        MonetizationManager.show_adsense_placeholder("Player Props")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 4 — SCORES
    # ════════════════════════════════════════════════════════════════════════
    with tabs[4]:
        st.header("🏆 Scores & Results")

        days_back = st.slider("How many days back?", 1, 3, 1,
                              help="Note: each call costs 2 API credits")

        for sport in selected_sports:
            icon = SPORTS_CONFIG[sport]["icon"]
            name = SPORTS_CONFIG[sport]["name"]
            st.subheader(f"{icon} {name}")

            with st.spinner(f"Loading {name} scores..."):
                scores = api_client.get_scores(sport, days_from=days_back)

            if not scores:
                st.info("No games in this window.")
                continue

            live_games = [g for g in scores if not g.get("completed") and g.get("scores")]
            final_games = [g for g in scores if g.get("completed")]
            upcoming = [g for g in scores if not g.get("completed") and not g.get("scores")]

            if live_games:
                st.markdown("#### 🔴 LIVE")
                for game in live_games:
                    away, home = game.get("away_team",""), game.get("home_team","")
                    sc = game.get("scores") or []
                    away_s = next((s.get("score","") for s in sc if s.get("name")==away), "—")
                    home_s = next((s.get("score","") for s in sc if s.get("name")==home), "—")
                    lc1, lc2, lc3 = st.columns([3, 1, 1])
                    lc1.markdown(f"**{away}** @ **{home}**")
                    lc2.metric(away, away_s)
                    lc3.metric(home, home_s)

            if final_games:
                st.markdown("#### ✅ FINAL")
                rows = []
                for game in final_games:
                    away, home = game.get("away_team",""), game.get("home_team","")
                    sc = game.get("scores") or []
                    away_s = next((s.get("score","") for s in sc if s.get("name")==away), "—")
                    home_s = next((s.get("score","") for s in sc if s.get("name")==home), "—")
                    winner = "—"
                    try:
                        if int(away_s) > int(home_s):
                            winner = away
                        elif int(home_s) > int(away_s):
                            winner = home
                        else:
                            winner = "TIE"
                    except:
                        pass
                    rows.append({"Away": away, "Away Score": away_s,
                                 "Home": home, "Home Score": home_s, "Winner": winner,
                                 "Time": format_time(game.get("commence_time",""))})

                df_scores = pd.DataFrame(rows)
                st.dataframe(df_scores, width="stretch", hide_index=True)

            if upcoming:
                st.markdown(f"#### \U0001f4c5 Upcoming ({len(upcoming)} games)")
                for game in upcoming:
                    st.caption(f"{game.get('away_team')} @ {game.get('home_team')} — {format_time(game.get('commence_time',''))}")

            st.markdown("---")

        MonetizationManager.show_adsense_placeholder("Scores")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 5 — MY BETS
    # ════════════════════════════════════════════════════════════════════════
    with tabs[5]:
        MonetizationManager.show_bet_tracker()
        MonetizationManager.show_adsense_placeholder("Bet Tracker")

    # ════════════════════════════════════════════════════════════════════════
    # TAB 6 — NEWSLETTER
    # ════════════════════════════════════════════════════════════════════════
    with tabs[6]:
        st.header("📧 Pick of the Day Newsletter")
        st.caption("Algorithmically generated daily pick · Powered by Resend or Brevo (both free tiers)")

        if not NEWSLETTER_AVAILABLE:
            st.error("newsletter.py not found in the same folder as this dashboard.")
            st.stop()

        # ── Email provider config ─────────────────────────────────────────
        resend_key = st.session_state.get("resend_api_key", _DEFAULT_RESEND_KEY)
        brevo_key  = st.session_state.get("brevo_api_key",  _DEFAULT_BREVO_KEY)

        with st.sidebar:
            st.markdown("---")
            st.subheader("📧 Newsletter Keys")

            email_provider = st.radio(
                "Email Provider",
                ["Resend", "Brevo"],
                index=0,
                help="Resend: 3k/mo free · Brevo: 9k/mo free (300/day)"
            )
            st.session_state["email_provider"] = email_provider

            if email_provider == "Resend":
                resend_input = st.text_input(
                    "Resend API Key",
                    type="password",
                    value=resend_key,
                    help="resend.com → free tier: 3,000 emails/month",
                    placeholder="re_xxxxxxxxxxxx"
                )
                if resend_input:
                    st.session_state["resend_api_key"] = resend_input
                    resend_key = resend_input
                st.caption("[Get Resend key →](https://resend.com)")
            else:
                brevo_input = st.text_input(
                    "Brevo API Key",
                    type="password",
                    value=brevo_key,
                    help="brevo.com → free tier: 9,000 emails/month (300/day)",
                    placeholder="xkeysib-xxxxxxxxxxxx"
                )
                if brevo_input:
                    st.session_state["brevo_api_key"] = brevo_input
                    brevo_key = brevo_input
                st.caption("[Get Brevo key →](https://brevo.com)")

        # ── TODAY'S PICK PREVIEW ──────────────────────────────────────────
        st.subheader("🏆 Today's Pick (Auto-Generated)")

        all_games_flat = {k: v for k, v in all_games_by_sport.items()}
        today_pick = pick_of_the_day(all_games_flat)

        if today_pick:
            odds_display = fmt_odds_nl(today_pick["odds"])
            sport_icons_map = {
                "basketball_nba": "🏀", "basketball_ncaab": "🎓",
                "icehockey_nhl": "🏒", "baseball_mlb": "⚾", "americanfootball_nfl": "🏈"
            }
            sport_icon = sport_icons_map.get(today_pick["sport"], "🏆")

            # Pick display card
            st.markdown(f"""
            <div style='background:linear-gradient(135deg,#0d3d2d 0%,#1a1d24 100%);
                        border-left:6px solid #09ab3b;border-radius:12px;
                        padding:20px 24px;margin-bottom:16px;'>
                <div style='color:#a0a0a0;font-size:0.75em;letter-spacing:2px;font-weight:700;'>
                    {sport_icon} TODAY'S TOP PICK
                </div>
                <div style='font-size:1.6em;font-weight:800;color:#fafafa;margin:8px 0 4px;'>
                    {today_pick['pick']}
                </div>
                <div style='font-size:1.1em;color:#a0a0a0;'>
                    {today_pick['game']}
                </div>
                <div style='margin-top:12px;display:flex;gap:24px;flex-wrap:wrap;'>
                    <span>💰 <strong style='color:#09ab3b;font-size:1.3em;'>{odds_display}</strong>
                          <span style='color:#a0a0a0;font-size:0.85em;'> @ {today_pick['book']}</span></span>
                    <span>📊 Edge: <strong style='color:#09ab3b;'>+{today_pick['edge']:.1f}%</strong></span>
                    <span>🎯 Implied: <strong>{today_pick['implied_prob']}%</strong></span>
                    <span>📚 Books: <strong>{today_pick['book_count']}</strong></span>
                </div>
            </div>
            """, unsafe_allow_html=True)

            # Show top-5 bonus picks
            with st.expander("📋 See bonus picks (top 5 by edge)", expanded=False):
                all_candidates = []
                sport_priority = {"basketball_ncaab": 3, "basketball_nba": 2,
                                  "icehockey_nhl": 1, "baseball_mlb": 0}
                for sport_key, games in all_games_flat.items():
                    for g in games:
                        bks = g.get("bookmakers", [])
                        if len(bks) < 2:
                            continue
                        away, home = g.get("away_team", ""), g.get("home_team", "")
                        for team, role in [(away, "Away"), (home, "Home")]:
                            odds_list = []
                            for bm in bks:
                                for mkt in bm.get("markets", []):
                                    if mkt["key"] == "h2h":
                                        for o in mkt.get("outcomes", []):
                                            if o.get("name") == team:
                                                odds_list.append(o["price"])
                            if not odds_list:
                                continue
                            best = max(odds_list)
                            from newsletter import calculate_edge, implied_probability
                            edge = calculate_edge(best, len(bks), odds_list)
                            all_candidates.append({
                                "Game": f"{away} @ {home}",
                                "Pick": team,
                                "Odds": fmt_odds_nl(best),
                                "Edge": f"+{edge:.1f}%",
                                "Implied": f"{implied_probability(best)*100:.1f}%",
                                "Sport": sport_icons_map.get(sport_key, "🏆"),
                            })
                all_candidates.sort(
                    key=lambda x: float(x["Edge"].replace("%","").replace("+","")),
                    reverse=True
                )
                if all_candidates:
                    st.dataframe(pd.DataFrame(all_candidates[:10]),
                                 width="stretch", hide_index=True)

        else:
            st.warning("No games loaded yet — enter your API key and load data from the sidebar.")

        st.markdown("---")

        # ── EMAIL PREVIEW ─────────────────────────────────────────────────
        if today_pick:
            with st.expander("👁️ Preview Email HTML", expanded=False):
                html_preview = build_email_html(today_pick)
                st.components.v1.html(html_preview, height=700, scrolling=True)

                text_preview = build_email_text(today_pick)
                st.text_area("Plain text version", text_preview, height=200)

        st.markdown("---")

        # ── SUBSCRIBER MANAGEMENT ─────────────────────────────────────────
        col_sub, col_stats = st.columns([3, 2])

        with col_sub:
            st.subheader("👥 Subscriber List")

            with st.form("subscribe_form"):
                sub_email = st.text_input("Email address", placeholder="friend@example.com")
                sub_name  = st.text_input("Name (optional)", placeholder="John")
                # Honeypot: hidden field — bots fill it, humans don't
                sub_honey = st.text_input("Leave blank", value="", label_visibility="collapsed")
                sub_btn   = st.form_submit_button("➕ Add Subscriber", width="stretch")
                if sub_btn and sub_email:
                    # Bot check
                    if sub_honey:
                        st.warning("⚠️ Submission rejected.")
                    elif not SecurityManager.check_form_rate_limit("sub_attempts", 10):
                        st.error("Too many attempts this session.")
                    elif not is_valid_email(sub_email):
                        st.error("❌ Invalid email address format.")
                    else:
                        clean_email = sanitize_text(sub_email, 254).lower().strip()
                        clean_name  = sanitize_text(sub_name, 60)
                        st.session_state["sub_attempts"] = st.session_state.get("sub_attempts", 0) + 1
                        ok, msg = save_subscriber(clean_email, clean_name)
                        if ok:
                            st.success(msg)
                        else:
                            st.warning(msg)

            subs = load_subscribers()
            if subs:
                df_subs = pd.DataFrame(subs)[["email", "name", "subscribed_at"]]
                df_subs.columns = ["Email", "Name", "Subscribed"]
                df_subs["Subscribed"] = df_subs["Subscribed"].str[:10]
                st.dataframe(df_subs, width="stretch", hide_index=True)

                csv_subs = pd.DataFrame(subs).to_csv(index=False)
                st.download_button("💾 Export Subscribers CSV", csv_subs,
                                   "subscribers.csv", "text/csv",
                                   width="stretch")
            else:
                st.info("No subscribers yet. Add one above or share the sign-up link!")

        with col_stats:
            st.subheader("📊 Stats")
            count = subscriber_count()
            st.metric("Total Subscribers", count)

            history = load_picks_history()
            st.metric("Picks Sent (all time)", len(history))

            if history:
                last = history[-1]
                st.metric("Last Send", last.get("date", "—"),
                          delta=f"{last.get('sent_to', 0)} recipients")

            st.markdown("---")
            # Email provider connection status
            _provider = st.session_state.get("email_provider", "Resend")
            _active_key = resend_key if _provider == "Resend" else brevo_key
            if _active_key:
                if _provider == "Resend":
                    client = ResendClient(_active_key)
                    ok, msg = client.test_connection()
                    label = "Resend"
                else:
                    ok, msg = _test_brevo_connection(_active_key)
                    label = "Brevo"
                if ok:
                    st.success(f"✅ {label}: connected")
                else:
                    st.error(f"❌ {label}: {msg}")
            else:
                st.warning("Set Resend or Brevo API key in the sidebar (or in server secrets).")

        st.markdown("---")

        # ── SEND BLAST ────────────────────────────────────────────────────
        st.subheader("🚀 Send Today's Pick")
        _provider = st.session_state.get("email_provider", "Resend")
        _active_key = resend_key if _provider == "Resend" else brevo_key

        if not _active_key:
            st.info(f"Add your {_provider} API key in the sidebar to send emails.")
        elif not today_pick:
            st.info("No pick available — load live odds data first.")
        else:
            subs = load_subscribers()
            if not subs:
                st.warning("No subscribers yet! Add subscribers above first.")
            else:
                st.markdown(f"""
                <div style='background:#1a2a0d;border:1px solid #09ab3b44;border-radius:8px;
                            padding:10px 16px;margin-bottom:12px;'>
                    <strong style='color:#fafafa;'>Ready to send to {len(subs)} subscriber(s)</strong>
                    &nbsp;·&nbsp;
                    <span style='color:#a0a0a0;font-size:0.85em;'>via <strong>{_provider}</strong></span>
                </div>
                """, unsafe_allow_html=True)

                send_col1, send_col2 = st.columns([2, 1])
                with send_col1:
                    custom_subject = st.text_input(
                        "Email subject",
                        value=f"🏀 Pick of the Day — {date.today().strftime('%B %d, %Y')}"
                    )
                with send_col2:
                    test_email_raw = st.text_input("Send test to (optional)", placeholder="you@email.com")
                    test_email = sanitize_text(test_email_raw, 254).strip()

                # Send test
                if test_email:
                    if not is_valid_email(test_email):
                        st.error("❌ Invalid test email address.")
                    elif st.button(f"📤 Send Test to {test_email}", width="stretch"):
                        html_body = build_email_html(today_pick)
                        text_body = build_email_text(today_pick)
                        if _provider == "Resend":
                            client = ResendClient(_active_key)
                            ok, result = client.send_single(test_email, f"[TEST] {custom_subject}",
                                                             html_body, text_body)
                        else:
                            result_d = send_brevo_blast(_active_key, [test_email],
                                                         f"[TEST] {custom_subject}", html_body, text_body)
                            ok = result_d["sent"] > 0
                            result = "Sent!" if ok else result_d["errors"]
                        if ok:
                            st.success(f"✅ Test email sent!")
                        else:
                            st.error(f"❌ Failed: {result}")

                st.markdown("---")

                # Full blast with confirmation gate
                if "confirm_blast" not in st.session_state:
                    st.session_state.confirm_blast = False

                if not st.session_state.confirm_blast:
                    if st.button(f"📬 Send to ALL {len(subs)} Subscribers",
                                 width="stretch"):
                        st.session_state.confirm_blast = True
                        st.rerun()
                else:
                    st.warning(f"⚠️ This will send **{len(subs)} emails** via **{_provider}**. Are you sure?")
                    c1, c2 = st.columns(2)
                    with c1:
                        if st.button("✅ YES — Send it!", width="stretch"):
                            html_body = build_email_html(today_pick)
                            text_body = build_email_text(today_pick)
                            emails = [s["email"] for s in subs]

                            with st.spinner(f"Sending to {len(emails)} subscribers via {_provider}..."):
                                if _provider == "Resend":
                                    client = ResendClient(_active_key)
                                    results = client.send_blast(emails, custom_subject,
                                                                 html_body, text_body)
                                else:
                                    results = send_brevo_blast(_active_key, emails,
                                                                custom_subject, html_body, text_body)

                            if results["sent"] > 0:
                                st.success(f"✅ Sent to {results['sent']} subscribers!")
                                log_pick(today_pick, sent_count=results["sent"])
                            if results["failed"] > 0:
                                st.error(f"❌ {results['failed']} failed: {results['errors'][:2]}")

                            st.session_state.confirm_blast = False
                    with c2:
                        if st.button("❌ Cancel", width="stretch"):
                            st.session_state.confirm_blast = False
                            st.rerun()

        st.markdown("---")

        # ── PICKS HISTORY ─────────────────────────────────────────────────
        history = load_picks_history()
        if history:
            st.subheader("📅 Past Picks")
            rows = []
            for h in reversed(history[-30:]):  # last 30
                p = h.get("pick", {})
                rows.append({
                    "Date": h.get("date", ""),
                    "Game": p.get("game", ""),
                    "Pick": p.get("pick", ""),
                    "Odds": fmt_odds_nl(p.get("odds", 0)) if p.get("odds") else "—",
                    "Edge": f"+{p.get('edge', 0):.1f}%",
                    "Sent To": h.get("sent_to", 0),
                })
            st.dataframe(pd.DataFrame(rows), width="stretch", hide_index=True)

        # ── SETUP GUIDE ───────────────────────────────────────────────────
        with st.expander("📖 Setup Guide — How to deploy & monetize", expanded=False):
            st.markdown("""
### 🚀 Get the Newsletter Running (Free)

#### Step 1 — Get a Resend API Key (2 min)
1. Go to **[resend.com](https://resend.com)** → Sign up free
2. Dashboard → **API Keys** → Create key
3. Copy it and paste into the **Resend API Key** field in the sidebar

**Free tier:** 3,000 emails/month, 100/day — plenty to start

---

#### Step 2 — Add a Sending Domain (optional but recommended)
- In Resend → **Domains** → Add your domain (e.g. `picks.yourdomain.com`)
- Add the DNS records shown (3 TXT records, takes ~5 min)
- Without a domain, emails send from `onboarding@resend.dev` (fine for testing)

---

#### Step 3 — Deploy to Streamlit Community Cloud (public URL)
1. Push this project to a **GitHub repo** (public for free tier)
2. Go to **[share.streamlit.io](https://share.streamlit.io)** → Deploy
3. Select your repo → main file: `sports_analysis_dashboard.py`
4. Add **Secrets** in the Streamlit Cloud settings:
   ```toml
   ODDS_API_KEY   = "YOUR_ODDS_API_KEY_HERE"
   RESEND_API_KEY = "re_your_key_here"
   NEWSLETTER_FROM = "picks@yourdomain.com"
   ```
5. Your app gets a public URL like `https://yourname-betboard.streamlit.app`

---

#### Step 4 — Automate Daily Sends with GitHub Actions
Use the workflow in `.github/workflows/daily_pick.yml` (runs at 9 AM ET). Set GitHub Secrets: `ODDS_API_KEY`, `RESEND_API_KEY`. Main file: `send_daily_pick.py` at repo root.

---

#### Step 5 — Monetize the List
Once you have 100+ subscribers, options include:
- **Paid tier** ($5-15/month via Stripe) — premium picks, more stats
- **Affiliate links** — FanDuel, DraftKings, BetMGM pay $50-200 per referred signup
- **Sponsored picks** — sports betting services pay for newsletter placements
- **Tip jar** — Buy Me a Coffee / Ko-fi link in every email

**Key rule:** Always include the gambling disclaimer + unsubscribe link (Resend auto-handles both).
            """)

    # ════════════════════════════════════════════════════════════════════════
    # TAB 7 — FEEDBACK & REQUESTS
    # ════════════════════════════════════════════════════════════════════════
    with tabs[7]:
        st.header("💬 Feedback & Feature Requests")
        st.caption("Help shape BetBoard — your ideas are saved locally and never shared.")

        # ── SUBMIT FORM ──────────────────────────────────────────────────────
        fb_type = st.radio(
            "What kind of feedback?",
            ["🚀 Feature Request", "🐛 Bug Report", "💬 General Feedback"],
            horizontal=True,
            key="fb_type_radio"
        )

        with st.form("feedback_form", clear_on_submit=True):
            col_a, col_b = st.columns(2)
            with col_a:
                fb_name  = st.text_input("Your name (optional)", placeholder="e.g. Alex")
            with col_b:
                fb_email = st.text_input("Email for follow-up (optional)", placeholder="you@example.com")

            # Hidden honeypot — bots fill it, humans leave it blank
            fb_honey = st.text_input("Do not fill this in", key="fb_honey",
                                     label_visibility="collapsed")

            fb_subject = st.text_input(
                "Subject / Title ✱",
                placeholder="e.g. Add NFL player props filter",
                max_chars=120
            )
            fb_detail = st.text_area(
                "Details ✱",
                height=130,
                placeholder="Describe the feature, bug, or idea in as much detail as you like…",
                max_chars=2000
            )

            fb_submit = st.form_submit_button("📨 Submit Feedback", width="stretch")

            if fb_submit:
                # ── Bot / spam checks ───────────────────────────────────────
                if fb_honey:
                    st.error("Submission blocked.")
                elif not SecurityManager.check_form_rate_limit("feedback_attempts", max_attempts=8):
                    st.error("⛔ Too many submissions this session. Please try again later.")
                elif not fb_subject.strip():
                    st.warning("Please fill in a subject / title.")
                elif not fb_detail.strip():
                    st.warning("Please add some details.")
                elif is_spam(fb_subject + " " + fb_detail):
                    st.error("Your submission was flagged as spam. Please revise and resubmit.")
                else:
                    # Validate optional email
                    clean_email = sanitize_text(fb_email, max_len=100).strip()
                    if clean_email and not is_valid_email(clean_email):
                        st.warning("That email address doesn't look right — leave it blank or fix it.")
                    else:
                        entry = {
                            "type":    fb_type,
                            "name":    sanitize_text(fb_name, max_len=80),
                            "email":   clean_email,
                            "subject": sanitize_text(fb_subject, max_len=120),
                            "detail":  sanitize_text(fb_detail, max_len=2000),
                            "ts":      datetime.now().isoformat(timespec="seconds"),
                            "status":  "new"
                        }
                        if save_feedback(entry):
                            st.success("✅ Thanks! Your feedback has been saved.")
                            st.balloons()
                            st.session_state["feedback_attempts"] = \
                                st.session_state.get("feedback_attempts", 0) + 1
                        else:
                            st.error("❌ Couldn't save feedback — check file permissions.")

        # ── STATS STRIP ──────────────────────────────────────────────────────
        st.markdown("---")
        all_fb = load_feedback()
        total_fb = len(all_fb)
        requests_n  = sum(1 for x in all_fb if "Feature" in x.get("type",""))
        bugs_n      = sum(1 for x in all_fb if "Bug"     in x.get("type",""))
        general_n   = sum(1 for x in all_fb if "General" in x.get("type",""))

        c1, c2, c3, c4 = st.columns(4)
        c1.metric("Total Entries",      total_fb)
        c2.metric("🚀 Feature Requests", requests_n)
        c3.metric("🐛 Bug Reports",      bugs_n)
        c4.metric("💬 General",          general_n)

        # ── ADMIN VIEW ───────────────────────────────────────────────────────
        if total_fb:
            with st.expander(f"📋 View All Feedback ({total_fb} entries)", expanded=False):
                df_fb = pd.DataFrame(all_fb)
                # reorder columns for readability
                cols_order = ["ts", "type", "status", "subject", "detail", "name", "email"]
                df_fb = df_fb.reindex(columns=[c for c in cols_order if c in df_fb.columns])
                df_fb.columns = [c.capitalize() for c in df_fb.columns]
                st.dataframe(df_fb, width="stretch", height=350)

                # Download as CSV
                csv_bytes = df_fb.to_csv(index=False).encode("utf-8")
                st.download_button(
                    "⬇️ Download feedback.csv",
                    data=csv_bytes,
                    file_name="betboard_feedback.csv",
                    mime="text/csv",
                    width="stretch",
                )
        else:
            st.info("No feedback yet — be the first! 👆")

    # ── FOOTER ───────────────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown(
        f"<div style='text-align:center;color:#555;font-size:0.8em;'>"
        f"BetBoard v9.0 \u00b7 Powered by The Odds API \u00b7 "
        f"Updated {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} \u00b7 "
        f"\u26a0\ufe0f 21+ | Gamble Responsibly</div>",
        unsafe_allow_html=True
    )

if __name__ == "__main__":
    main()

