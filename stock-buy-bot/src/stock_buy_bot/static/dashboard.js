const state = {
  data: window.__DASHBOARD_DATA__ || null,
};

function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value) {
  return `${value.toFixed(2)}%`;
}

function renderMetrics(summary) {
  document.getElementById("metric-total-value").textContent = currency(summary.total_value);
  document.getElementById("metric-total-gain").textContent = currency(summary.total_gain);
  document.getElementById("metric-total-gain-pct").textContent = percent(summary.total_gain_pct);
  document.getElementById("metric-position-count").textContent = String(summary.position_count);

  const gainNode = document.getElementById("metric-total-gain");
  const pctNode = document.getElementById("metric-total-gain-pct");
  const gainClass = summary.total_gain >= 0 ? "gain" : "loss";
  gainNode.classList.remove("gain", "loss");
  pctNode.classList.remove("gain", "loss");
  gainNode.classList.add(gainClass);
  pctNode.classList.add(gainClass);
}

function renderGrowthChart(points) {
  const chart = document.getElementById("growth-chart");
  const labels = document.getElementById("growth-chart-labels");
  chart.innerHTML = "";
  labels.innerHTML = "";

  if (!points.length) {
    return;
  }

  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 640;
  const height = 260;
  const paddingX = 28;
  const paddingY = 24;
  const range = Math.max(max - min, 1);

  const polylinePoints = points
    .map((point, index) => {
      const x = paddingX + (index * (width - paddingX * 2)) / Math.max(points.length - 1, 1);
      const normalized = (point.value - min) / range;
      const y = height - paddingY - normalized * (height - paddingY * 2);
      return `${x},${y}`;
    })
    .join(" ");

  chart.innerHTML = `
    <line x1="${paddingX}" y1="${height - paddingY}" x2="${width - paddingX}" y2="${height - paddingY}" stroke="#b9b0a4" stroke-width="1.5"></line>
    <polyline points="${polylinePoints}" fill="none" stroke="#0f766e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"></polyline>
  `;

  labels.innerHTML = points
    .map((point) => `<span>${point.date}</span>`)
    .join("");
}

function renderAllocation(allocation) {
  const barsNode = document.getElementById("allocation-bars");
  const legendNode = document.getElementById("allocation-legend");

  barsNode.innerHTML = allocation.by_type
    .map(
      (item) => `
        <div class="allocation-row">
          <div class="allocation-label-row">
            <span>${item.label}</span>
            <span>${percent(item.share_pct)}</span>
          </div>
          <div class="allocation-track">
            <div class="allocation-fill" style="width: ${Math.max(item.share_pct, 2)}%"></div>
          </div>
        </div>
      `,
    )
    .join("");

  legendNode.innerHTML = allocation.by_asset
    .slice(0, 6)
    .map((item) => `<span>${item.label}: ${percent(item.share_pct)}</span>`)
    .join("");
}

function renderPositions(positions) {
  const tableBody = document.getElementById("holdings-table-body");
  tableBody.innerHTML = positions
    .map((position) => {
      const gainClass = position.gain_value >= 0 ? "gain" : "loss";
      return `
        <tr>
          <td><strong>${position.symbol}</strong></td>
          <td>${position.name}</td>
          <td><span class="asset-chip">${position.asset_type_label}</span></td>
          <td>${position.quantity}</td>
          <td>${currency(position.current_price)}</td>
          <td>${currency(Number(position.current_value))}</td>
          <td class="${gainClass}">${currency(position.gain_value)} (${percent(position.gain_pct)})</td>
        </tr>
      `;
    })
    .join("");
}

function renderBotActions(botActivity) {
  document.getElementById("activity-executed").textContent = `Executed: ${botActivity.counts.executed}`;
  document.getElementById("activity-failed").textContent = `Failed: ${botActivity.counts.failed}`;

  const listNode = document.getElementById("bot-actions-list");
  listNode.innerHTML = botActivity.recent_actions
    .map(
      (action) => `
        <li class="activity-item">
          <div class="activity-line">
            <strong>${action.event_type.replaceAll("_", " ")}</strong>
            <span class="${String(action.status).toLowerCase().includes("fail") ? "loss" : "gain"}">${action.status}</span>
          </div>
          <div class="activity-meta">
            ${action.side.toUpperCase()} ${action.symbol} · ${action.idempotency_key}
          </div>
          <div class="activity-meta">${action.timestamp}</div>
        </li>
      `,
    )
    .join("");
}

function renderDashboard(data) {
  document.getElementById("portfolio-name").textContent = data.portfolio_name;
  renderMetrics(data.summary);
  renderGrowthChart(data.growth_history);
  renderAllocation(data.allocation);
  renderPositions(data.positions);
  renderBotActions(data.bot_activity);
}

async function refreshDashboard() {
  try {
    const response = await fetch("/api/dashboard/summary", { headers: { Accept: "application/json" } });
    if (!response.ok) {
      throw new Error(`Dashboard refresh failed with ${response.status}`);
    }
    state.data = await response.json();
    renderDashboard(state.data);
    document.getElementById("refresh-status").textContent = `Updated at ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    document.getElementById("refresh-status").textContent = "Refresh paused: using last successful snapshot";
    console.error(error);
  }
}

if (state.data) {
  renderDashboard(state.data);
}

window.setInterval(refreshDashboard, 30000);
