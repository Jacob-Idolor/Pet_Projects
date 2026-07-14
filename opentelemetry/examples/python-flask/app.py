import os
from flask import Flask, jsonify

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify(message="OpenTelemetry Flask sample — try /api/items")


@app.route("/api/items")
def items():
    # Business logic span would be added manually in production
    return jsonify(items=["alpha", "beta", "gamma"])


@app.route("/health")
def health():
    return jsonify(status="ok")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8081"))
    app.run(host="0.0.0.0", port=port)
