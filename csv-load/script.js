// グローバル変数
let rawData = [];
let filteredData = [];
let currentPage = 1;
let itemsPerPage = 25;
let charts = {};

// CSVファイルの読み込み
document.getElementById("csvFile").addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseCSV(text);
  };
  reader.readAsText(file, "UTF-8");

  document.getElementById("uploadStatus").innerHTML =
    '<span style="color: #48bb78;">読み込み中...</span>';
});

// CSVパース関数
function parseCSV(text) {
  const lines = text.split("\n").filter((line) => line.trim());
  const headers = lines[0].split(",");

  rawData = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    if (values.length >= 7) {
      rawData.push({
        date: values[0].trim(),
        teamName: values[1].trim(),
        opponent: values[2].trim(),
        playerName: values[3].trim(),
        points: parseFloat(values[4]) || 0,
        rebounds: parseFloat(values[5]) || 0,
        assists: parseFloat(values[6]) || 0,
        rating: (parseFloat(values[4]) || 0) + (parseFloat(values[5]) || 0),
      });
    }
  }

  filteredData = [...rawData];

  if (rawData.length > 0) {
    document.getElementById(
      "uploadStatus"
    ).innerHTML = `<span style="color: #48bb78;">✓ ${rawData.length}件のスポーツデータを読み込みました</span>`;
    updateDashboard();
  } else {
    document.getElementById("uploadStatus").innerHTML =
      '<span style="color: #f56565;">データの読み込みに失敗しました</span>';
  }
}

// ダッシュボード更新
function updateDashboard() {
  // セクション表示
  document.getElementById("summarySection").classList.remove("hidden");
  document.getElementById("chartsSection").classList.remove("hidden");
  document.getElementById("distributionSection").classList.remove("hidden");
  document.getElementById("tableSection").classList.remove("hidden");

  // サマリーカード更新
  updateSummaryCards();

  // チャート更新
  updateCharts();

  // テーブル更新
  updateTable();
}

// サマリーカード更新
function updateSummaryCards() {
  // チーム数
  const teams = new Set(rawData.map((d) => d.teamName));
  document.getElementById("originalCount").textContent = teams.size;

  // 選手数
  const players = new Set(rawData.map((d) => d.playerName));
  document.getElementById("genericCount").textContent = players.size;

  // 合計得点
  const totalPoints = rawData.reduce((sum, d) => sum + d.points, 0);
  document.getElementById("totalQuantity").textContent =
    totalPoints.toLocaleString();

  // 平均得点
  const avgPoints =
    rawData.reduce((sum, d) => sum + d.points, 0) / rawData.length;
  document.getElementById(
    "avgPriceDiff"
  ).textContent = `${avgPoints.toFixed(1)}点`;
}

// チャート更新
function updateCharts() {
  updateTop10Chart();
  updatePriceComparisonChart();
  updateQuantityDistributionChart();
}

// 選手別得点トップ10
function updateTop10Chart() {
  const pointsByPlayer = {};
  rawData.forEach((d) => {
    if (!pointsByPlayer[d.playerName]) {
      pointsByPlayer[d.playerName] = 0;
    }
    pointsByPlayer[d.playerName] += d.points;
  });

  const sorted = Object.entries(pointsByPlayer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sorted.map((d) => d[0]);
  const data = sorted.map((d) => d[1]);

  if (charts.top10) charts.top10.destroy();

  const ctx = document.getElementById("top10Chart").getContext("2d");
  charts.top10 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "得点",
          data: data,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// チーム別得点比較
function updatePriceComparisonChart() {
  // 得点が高い順にソートして上位10件を取得
  const sortedByPoints = [...rawData]
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const labels = sortedByPoints.map((d) => d.teamName.substring(0, 15));
  const points = sortedByPoints.map((d) => d.points);
  const rebounds = sortedByPoints.map((d) => d.rebounds);

  if (charts.priceComparison) charts.priceComparison.destroy();

  const ctx = document.getElementById("priceComparisonChart").getContext("2d");
  charts.priceComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "得点",
          data: points,
          backgroundColor: "rgba(246, 173, 85, 0.8)",
          borderColor: "rgba(246, 173, 85, 1)",
          borderWidth: 1,
        },
        {
          label: "リバウンド",
          data: rebounds,
          backgroundColor: "rgba(102, 126, 234, 0.8)",
          borderColor: "rgba(102, 126, 234, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  });
}

// 選手別得点分布（折れ線グラフ、15項目）
function updateQuantityDistributionChart() {
  // 選手ごとに得点を集計
  const pointsByPlayer = {};
  rawData.forEach((d) => {
    if (!pointsByPlayer[d.playerName]) {
      pointsByPlayer[d.playerName] = 0;
    }
    pointsByPlayer[d.playerName] += d.points;
  });

  // 得点が多い順にソートして上位15件を取得
  const sorted = Object.entries(pointsByPlayer)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const labels = sorted.map((d) => d[0]);
  const data = sorted.map((d) => d[1]);

  if (charts.quantityDistribution) charts.quantityDistribution.destroy();

  const ctx = document
    .getElementById("quantityDistributionChart")
    .getContext("2d");
  charts.quantityDistribution = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "得点",
          data: data,
          borderColor: "rgba(102, 126, 234, 1)",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: "rgba(102, 126, 234, 1)",
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: {
            maxRotation: 45,
            minRotation: 45,
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
      },
      interaction: {
        mode: "nearest",
        axis: "x",
        intersect: false,
      },
    },
  });
}

// テーブル更新
function updateTable() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = filteredData.slice(start, end);

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  pageData.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${row.date}</td>
            <td>${row.teamName}</td>
            <td>${row.opponent}</td>
            <td>${row.playerName}</td>
            <td>${row.points.toFixed(1)}</td>
            <td>${row.rebounds.toLocaleString()}</td>
            <td>${row.assists.toLocaleString()}</td>
            <td>${row.rating.toFixed(1)}</td>
        `;
    tbody.appendChild(tr);
  });

  updatePagination();
}

// ページネーション更新
function updatePagination() {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  document.getElementById(
    "pageInfo"
  ).textContent = `${currentPage} / ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// 検索機能
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  filteredData = rawData.filter((row) => {
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchTerm)
    );
  });
  currentPage = 1;
  updateTable();
});

// ページあたりの表示件数変更
document
  .getElementById("itemsPerPage")
  .addEventListener("change", function (e) {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    updateTable();
  });

// ページネーションボタン
document.getElementById("prevPage").addEventListener("click", function () {
  if (currentPage > 1) {
    currentPage--;
    updateTable();
  }
});

document.getElementById("nextPage").addEventListener("click", function () {
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    updateTable();
  }
});
