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
    if (values.length >= 8) {
      const total = (parseFloat(values[4]) || 0) + (parseFloat(values[5]) || 0) +
                    (parseFloat(values[6]) || 0) + (parseFloat(values[7]) || 0);
      rawData.push({
        dantaiName: values[0].trim(),
        sportType: values[1].trim(),
        frequency: values[2].trim(),
        facility: values[3].trim(),
        boys_elementary: parseFloat(values[4]) || 0,
        girls_elementary: parseFloat(values[5]) || 0,
        boys_middle: parseFloat(values[6]) || 0,
        girls_middle: parseFloat(values[7]) || 0,
        total: total,
      });
    }
  }

  filteredData = [...rawData];

  if (rawData.length > 0) {
    document.getElementById(
      "uploadStatus"
    ).innerHTML = `<span style="color: #48bb78;">✓ ${rawData.length}件のスポーツ少年団登録データを読み込みました</span>`;
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
  // 登録団数
  const dantaiCount = rawData.length;
  document.getElementById("originalCount").textContent = dantaiCount;

  // 総団員数
  const totalMembers = rawData.reduce((sum, d) => sum + d.total, 0);
  document.getElementById("genericCount").textContent = totalMembers;

  // スポーツ種目数
  const sportTypes = new Set(rawData.map((d) => d.sportType));
  document.getElementById("totalQuantity").textContent = sportTypes.size;

  // 平均団員数
  const avgMembers = dantaiCount > 0 ? totalMembers / dantaiCount : 0;
  document.getElementById(
    "avgPriceDiff"
  ).textContent = `${avgMembers.toFixed(1)}人`;
}

// チャート更新
function updateCharts() {
  updateTop10Chart();
  updatePriceComparisonChart();
  updateQuantityDistributionChart();
}

// 少年団別団員数トップ10
function updateTop10Chart() {
  // 団員数でソートして上位10件を取得
  const sorted = [...rawData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const labels = sorted.map((d) => d.dantaiName);
  const data = sorted.map((d) => d.total);

  if (charts.top10) charts.top10.destroy();

  const ctx = document.getElementById("top10Chart").getContext("2d");
  charts.top10 = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "団員数",
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

// スポーツ種目別団員数
function updatePriceComparisonChart() {
  // スポーツ種目ごとに団員数を集計
  const membersBySport = {};
  rawData.forEach((d) => {
    if (!membersBySport[d.sportType]) {
      membersBySport[d.sportType] = { total: 0, count: 0 };
    }
    membersBySport[d.sportType].total += d.total;
    membersBySport[d.sportType].count += 1;
  });

  const sorted = Object.entries(membersBySport)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const labels = sorted.map((d) => d[0]);
  const totalMembers = sorted.map((d) => d[1].total);
  const dantaiCount = sorted.map((d) => d[1].count);

  if (charts.priceComparison) charts.priceComparison.destroy();

  const ctx = document.getElementById("priceComparisonChart").getContext("2d");
  charts.priceComparison = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "総団員数",
          data: totalMembers,
          backgroundColor: "rgba(246, 173, 85, 0.8)",
          borderColor: "rgba(246, 173, 85, 1)",
          borderWidth: 1,
        },
        {
          label: "団数",
          data: dantaiCount,
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

// 少年団別団員分布（折れ線グラフ、15項目）
function updateQuantityDistributionChart() {
  // 団員数でソートして上位15件を取得
  const sorted = [...rawData]
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const labels = sorted.map((d) => d.dantaiName);
  const data = sorted.map((d) => d.total);

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
          label: "団員数",
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
            <td>${row.dantaiName}</td>
            <td>${row.sportType}</td>
            <td>${row.frequency}</td>
            <td>${row.facility}</td>
            <td>${row.boys_elementary}</td>
            <td>${row.girls_elementary}</td>
            <td>${row.boys_middle}</td>
            <td>${row.girls_middle}</td>
            <td>${row.total}</td>
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
