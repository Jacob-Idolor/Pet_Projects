# Dynatrace Problem Viewer

A FastAPI-based web application that displays recent problems from a Dynatrace environment using the Problems API v2. It allows filtering by impact level and management zone, with a clean HTML UI and server-side rendering using Jinja2.

---

## 🔧 Features

* **FastAPI-powered backend**: Built with the modern, fast web framework.
* **HTML templates rendered via Jinja2**: Provides a clean and dynamic user interface.
* **Data pulled directly from Dynatrace Problems API v2**: Ensures up-to-date problem information.
* **Filtering capabilities**:
    * **Impact Level**: Filter problems based on their severity.
    * **Management Zone**: Narrow down problems to specific management zones.
* **Epoch time conversion**: Automatically converts raw epoch timestamps to human-readable UTC.
* **Direct links to Dynatrace UI**: Quickly navigate to the problem detail pages within your Dynatrace environment.
* **Static file support**: Includes CSS for a visually appealing interface.
* **Audit log fetcher script**: `fetch_audit_logs.py` downloads the last 24 hours of audit logs and writes them to `audit_logs.csv`.

---

## 🧪 Requirements

* **Python 3.11+**
* **Dynatrace API token**: Must have `Read problems` and `Read configuration` scopes.
* `.env` file with your Dynatrace credentials.

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
## 📄 .env Format

Create a file named `.env` in the root of your project with the following content:
dynatrace_api_token=your_dynatrace_api_token
dynatrace_api_url=https://your-env.live.dynatrace.com

**Replace `your_dynatrace_api_token` with your actual Dynatrace API token and `https://your-env.live.dynatrace.com` with your Dynatrace environment URL.**

---

## 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone [https://github.com/yourusername/dynatrace-problem-viewer.git](https://github.com/yourusername/dynatrace-problem-viewer.git)
    cd dynatrace-problem-viewer
    ```
2.  **Set up a virtual environment** (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```
3.  **Install dependencies**:
    ```bash
    pip install -r requirements.txt
    ```
4.  **Add your `.env` file**: Ensure you've created the `.env` file in the project root with your Dynatrace credentials as described above.
5.  **Run the application**:
    ```bash
    uvicorn main:app --reload
    ```
6.  **Visit the application**: Open your web browser and go to `http://127.0.0.1:8000/problems`.
7.  **Run tests** (optional):
    ```bash
    pytest
    ```
