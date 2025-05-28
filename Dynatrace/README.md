# Dynatrace Problem Viewer

A FastAPI-based web application that displays recent problems from a Dynatrace environment using the Problems API v2. It allows filtering by impact level and management zone, with a clean HTML UI and server-side rendering using Jinja2.

---

## 🔧 Features

- ✅ FastAPI-powered backend
- 🎨 HTML templates rendered via Jinja2
- 📡 Data pulled directly from Dynatrace Problems API v2
- 🔍 Filtering by:
  - Impact Level
  - Management Zone
- 🕒 Epoch time conversion to readable UTC
- 📎 Direct links to problem detail pages in the Dynatrace UI
- 📁 Static file support (CSS)

---

## 🧪 Requirements

- Python 3.11+
- Dynatrace API token (with `Read problems`, `Read configuration` scopes)
- `.env` file with credentials

---

## 📁 Project Structure

Dynatrace/
├── app/
│ ├── api/
│ │ └── problems.py
│ ├── core/
│ │ ├── config.py
│ │ └── dt_client.py
│ ├── static/
│ │ └── css/
│ │ └── problems.css
│ └── templates/
│ └── problems.html
├── main.py
└── .env

yaml
Copy
Edit

---

## 📄 .env Format

dynatrace_api_token=your_dynatrace_api_token
dynatrace_api_url=https://your-env.live.dynatrace.com

yaml
Copy
Edit

---

## 🚀 Getting Started

1. **Clone the repository**  
   ```bash
   git clone https://github.com/yourusername/dynatrace-problem-viewer.git
   cd dynatrace-problem-viewer
Set up virtual environment (optional but recommended)

bash
Copy
Edit
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
Install dependencies

bash
Copy
Edit
pip install -r requirements.txt
Add .env file with your Dynatrace credentials.

Run the app

bash
Copy
Edit
uvicorn main:app --reload
Visit http://127.0.0.1:8000/problems