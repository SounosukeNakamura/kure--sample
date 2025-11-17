// グローバル変数
let rawData = [];
let filteredData = [];
let aggregatedData = {}; // 登録団名別に集計したデータ
let currentPage = 1;
let itemsPerPage = 25;
let charts = {};

// データモデル：登録団名別の団員統計
class RegistrationGroupStats {
  constructor(registrationName) {
    this.registrationName = registrationName; // 登録団名
    this.dantaiList = []; // 属する少年団のリスト
    this.boys_elementary = 0; // 小学男子
    this.girls_elementary = 0; // 小学女子
    this.boys_middle = 0; // 中学男子
    this.girls_middle = 0; // 中学女子
    this.total = 0; // 総団員数
  }

  // 団員数を集計
  addMembers(boys_elem, girls_elem, boys_mid, girls_mid) {
    this.boys_elementary += boys_elem;
    this.girls_elementary += girls_elem;
    this.boys_middle += boys_mid;
    this.girls_middle += girls_mid;
    this.total += boys_elem + girls_elem + boys_mid + girls_mid;
  }

  // 性別内訳を取得
  getGenderBreakdown() {
    return {
      male: this.boys_elementary + this.boys_middle,
      female: this.girls_elementary + this.girls_middle,
    };
  }

  // 世代別内訳を取得
  getGenerationBreakdown() {
    return {
      elementary: this.boys_elementary + this.girls_elementary,
      middle: this.boys_middle + this.girls_middle,
    };
  }

  // 分布データを取得（グラフ用）
  getDistributionData() {
    return {
      registrationName: this.registrationName,
      boys_elementary: this.boys_elementary,
      girls_elementary: this.girls_elementary,
      boys_middle: this.boys_middle,
      girls_middle: this.girls_middle,
      total: this.total,
      genderBreakdown: this.getGenderBreakdown(),
      generationBreakdown: this.getGenerationBreakdown(),
    };
  }
}

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
  aggregatedData = {};

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",");
    // 登録団名が追加された形式：登録団名,少年団名,スポーツ種目,活動頻度,活動施設,小学男子,小学女子,中学男子,中学女子
    if (values.length >= 9) {
      const registrationName = values[0].trim();
      const dantaiName = values[1].trim();
      const sportType = values[2].trim();
      const frequency = values[3].trim();
      const facility = values[4].trim();
      const boys_elem = parseFloat(values[5]) || 0;
      const girls_elem = parseFloat(values[6]) || 0;
      const boys_mid = parseFloat(values[7]) || 0;
      const girls_mid = parseFloat(values[8]) || 0;
      const total = boys_elem + girls_elem + boys_mid + girls_mid;

      // rawDataに保存
      rawData.push({
        registrationName: registrationName,
        dantaiName: dantaiName,
        sportType: sportType,
        frequency: frequency,
        facility: facility,
        boys_elementary: boys_elem,
        girls_elementary: girls_elem,
        boys_middle: boys_mid,
        girls_middle: girls_mid,
        total: total,
      });

      // 登録団名別に集計
      if (!aggregatedData[registrationName]) {
        aggregatedData[registrationName] = new RegistrationGroupStats(registrationName);
      }
      aggregatedData[registrationName].addMembers(boys_elem, girls_elem, boys_mid, girls_mid);
      aggregatedData[registrationName].dantaiList.push(dantaiName);
    }
  }

  filteredData = [...rawData];

  if (rawData.length > 0) {
    document.getElementById(
      "uploadStatus"
    ).innerHTML = `<span style="color: #48bb78;">✓ ${rawData.length}件のスポーツ少年団登録データを読み込みました（登録団数: ${Object.keys(aggregatedData).length}）</span>`;
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
  const registrationCount = Object.keys(aggregatedData).length;
  document.getElementById("originalCount").textContent = registrationCount;

  // 総団員数
  const totalMembers = Object.values(aggregatedData).reduce((sum, group) => sum + group.total, 0);
  document.getElementById("genericCount").textContent = totalMembers;

  // スポーツ種目数
  const sportTypes = new Set(rawData.map((d) => d.sportType));
  document.getElementById("totalQuantity").textContent = sportTypes.size;

  // 平均団員数（登録団名別）
  const avgMembers = registrationCount > 0 ? totalMembers / registrationCount : 0;
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

// 登録団名別団員数トップ10
function updateTop10Chart() {
  // aggregatedDataを団員数でソート
  const sortedRegistrations = Object.values(aggregatedData)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  const labels = sortedRegistrations.map((g) => g.registrationName);
  const data = sortedRegistrations.map((g) => g.total);

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
  // スポーツ種目ごとに団員数を集計（登録団名別）
  const membersBySport = {};
  Object.values(aggregatedData).forEach((group) => {
    rawData.forEach((d) => {
      if (d.registrationName === group.registrationName) {
        if (!membersBySport[d.sportType]) {
          membersBySport[d.sportType] = { total: 0, count: 0 };
        }
        membersBySport[d.sportType].total += group.total;
        membersBySport[d.sportType].count += 1;
      }
    });
  });

  const sorted = Object.entries(membersBySport)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10);

  const labels = sorted.map((d) => d[0]);
  const totalMembers = sorted.map((d) => d[1].total);
  const registrationCount = sorted.map((d) => d[1].count);

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
          label: "登録団数",
          data: registrationCount,
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

// 登録団名別団員分布（折れ線グラフ、15項目）
function updateQuantityDistributionChart() {
  // 登録団名別に団員数でソートして上位15件を取得
  const sortedRegistrations = Object.values(aggregatedData)
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const labels = sortedRegistrations.map((g) => g.registrationName);
  const data = sortedRegistrations.map((g) => g.total);

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

// テーブル更新（登録団名別の集計データを表示）
function updateTable() {
  // aggregatedDataを配列に変換してページング処理
  const registrationArray = Object.values(aggregatedData);
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = registrationArray.slice(start, end);

  const tbody = document.getElementById("tableBody");
  tbody.innerHTML = "";

  pageData.forEach((group) => {
    const tr = document.createElement("tr");
    const genderBreakdown = group.getGenderBreakdown();
    const generationBreakdown = group.getGenerationBreakdown();
    tr.innerHTML = `
            <td>${group.registrationName}</td>
            <td>${group.dantaiList.join("、")}</td>
            <td>${group.boys_elementary}</td>
            <td>${group.girls_elementary}</td>
            <td>${group.boys_middle}</td>
            <td>${group.girls_middle}</td>
            <td>${generationBreakdown.elementary}</td>
            <td>${generationBreakdown.middle}</td>
            <td>${group.total}</td>
        `;
    tbody.appendChild(tr);
  });

  updatePagination(registrationArray.length);
}

// ページネーション更新
function updatePagination(totalItems) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  document.getElementById(
    "pageInfo"
  ).textContent = `${currentPage} / ${totalPages}`;
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// 検索機能（登録団名別）
document.getElementById("searchInput").addEventListener("input", function (e) {
  const searchTerm = e.target.value.toLowerCase();
  const registrationArray = Object.values(aggregatedData);
  
  // 登録団名またはその所属少年団名で検索
  const filteredRegistrations = registrationArray.filter((group) => {
    return (
      group.registrationName.toLowerCase().includes(searchTerm) ||
      group.dantaiList.some((name) => name.toLowerCase().includes(searchTerm))
    );
  });
  
  // フィルタ結果をaggregatedDataとして保持
  const tempAggregatedData = {};
  filteredRegistrations.forEach((group) => {
    tempAggregatedData[group.registrationName] = group;
  });
  
  // 検索中の状態を保持するため、一時的にaggregatedDataを上書き
  const originalData = aggregatedData;
  aggregatedData = tempAggregatedData;
  
  currentPage = 1;
  updateTable();
  
  // 元のデータを復元（オプション：必要に応じて調整）
  // aggregatedData = originalData;
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
