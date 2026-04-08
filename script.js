let allRows = [];
let barChartInstance = null;
let pieChartInstance = null;
let lineChartInstance = null;

fetch("supermarket_sales.csv")
  .then(response => response.text())
  .then(data => {
    const rows = data.trim().split("\n");
    allRows = rows.slice(1).map(row => row.split(","));

    populateCityFilter();
    populateBranchFilter();
    setupDarkMode();
    setupEvents();
    updateDashboard();

setTimeout(() => {
  document.getElementById("loader").style.display = "none";
}, 1500);
  
  

function populateCityFilter() {
  const cityFilter = document.getElementById("cityFilter");
  const cities = new Set();

  allRows.forEach(cols => {
    const city = cols[2]?.trim();
    if (city) cities.add(city);
  });

  [...cities].sort().forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    cityFilter.appendChild(option);
  });
}

function populateBranchFilter(selectedCity = "All") {
  const branchFilter = document.getElementById("branchFilter");
  branchFilter.innerHTML = '<option value="All">All Branches</option>';

  const branches = new Set();

  allRows.forEach(cols => {
    const city = cols[2]?.trim();
    const branch = cols[1]?.trim();

    if (selectedCity === "All" || city === selectedCity) {
      if (branch) branches.add(branch);
    }
  });

  [...branches].sort().forEach(branch => {
    const option = document.createElement("option");
    option.value = branch;
    option.textContent = branch;
    branchFilter.appendChild(option);
  });
}

function setupEvents() {
  document.getElementById("cityFilter").addEventListener("change", function () {
    populateBranchFilter(this.value);
    updateDashboard();
  });

  document.getElementById("branchFilter").addEventListener("change", updateDashboard);
  document.getElementById("searchInput").addEventListener("input", updateDashboard);

  document.getElementById("darkModeBtn").addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark"));
  });
}

function setupDarkMode() {
  const savedMode = localStorage.getItem("darkMode");
  if (savedMode === "true") {
    document.body.classList.add("dark");
  }
}

function updateDashboard() {
  const selectedCity = document.getElementById("cityFilter").value;
  const selectedBranch = document.getElementById("branchFilter").value;
  const searchText = document.getElementById("searchInput").value.toLowerCase().trim();

  let filteredRows = allRows.filter(cols => {
    const city = cols[2]?.trim();
    const branch = cols[1]?.trim();
    const product = cols[5]?.trim().toLowerCase();

    const cityMatch = selectedCity === "All" || city === selectedCity;
    const branchMatch = selectedBranch === "All" || branch === selectedBranch;
    const searchMatch = searchText === "" || product.includes(searchText);

    return cityMatch && branchMatch && searchMatch;
  });

  let totalRevenue = 0;
  let totalOrders = filteredRows.length;
  let productSales = {};
  let citySales = {};
  let dateSales = {};

  filteredRows.forEach(cols => {
    const city = cols[2]?.trim();
    const product = cols[5]?.trim();
    const total = parseFloat(cols[9]);
    const date = cols[10]?.trim();

    if (!isNaN(total)) {
      totalRevenue += total;

      if (product) {
        if (!productSales[product]) {
          productSales[product] = 0;
        }
        productSales[product] += total;
      }

      if (city) {
        if (!citySales[city]) {
          citySales[city] = 0;
        }
        citySales[city] += total;
      }

      if (date) {
        if (!dateSales[date]) {
          dateSales[date] = 0;
        }
        dateSales[date] += total;
      }
    }
  });

  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  document.getElementById("revenue").innerText = totalRevenue.toFixed(2);
  document.getElementById("orders").innerText = totalOrders;

  const avgOrderElement = document.getElementById("avgOrder");
  if (avgOrderElement) {
    avgOrderElement.innerText = avgOrderValue.toFixed(2);
  }

  const labels = Object.keys(productSales);
  const values = Object.values(productSales);

  let topProduct = "-";
  let maxSales = -1;

  for (let product in productSales) {
    if (productSales[product] > maxSales) {
      maxSales = productSales[product];
      topProduct = product;
    }
  }

  document.getElementById("topProduct").innerText = topProduct;

  let bestCity = "-";
  let maxCitySales = -1;

  for (let city in citySales) {
    if (citySales[city] > maxCitySales) {
      maxCitySales = citySales[city];
      bestCity = city;
    }
  }

  const bestCityElement = document.getElementById("bestCity");
  if (bestCityElement) {
    bestCityElement.innerText = bestCity;
  }

  const noDataMessage = document.getElementById("noDataMessage");
  const insightElement = document.getElementById("insight");

  if (filteredRows.length === 0) {
    if (noDataMessage) {
      noDataMessage.style.display = "block";
    }

    if (insightElement) {
      insightElement.innerText = "No data available for the selected filters.";
    }

    renderBarChart([], []);
    renderPieChart([], []);
    renderLineChart([], []);
    return;
  } else {
    if (noDataMessage) {
      noDataMessage.style.display = "none";
    }
  }

  if (insightElement) {
    insightElement.innerText =
      `The top product line is ${topProduct}, and the city with the highest revenue is ${bestCity}.`;
  }

  const sortedDates = Object.keys(dateSales).sort((a, b) => new Date(a) - new Date(b));
  const sortedDateValues = sortedDates.map(date => dateSales[date]);

  renderBarChart(labels, values);
  renderPieChart(labels, values);
  renderLineChart(sortedDates, sortedDateValues);
}

function renderBarChart(labels, values) {
  const ctx = document.getElementById("barChart");

  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const maxValue = values.length > 0 ? Math.max(...values) : 0;

  const colors = values.map(v =>
    v === maxValue ? "#ff4d4d" : "#4dabf7"
  );

  barChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Revenue",
        data: values,
        backgroundColor: colors,
        borderWidth: 1
      }]
    },
    options: {
  animation: {
    duration: 1200
  },
      responsive: true,
      plugins: {
        legend: {
          display: true
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return "Revenue: $" + context.raw.toFixed(2);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function renderPieChart(labels, values) {
  const ctx = document.getElementById("pieChart");

  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  pieChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderLineChart(labels, values) {
  const ctx = document.getElementById("lineChart");

  if (!ctx) return;

  if (lineChartInstance) {
    lineChartInstance.destroy();
  }

  lineChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Sales Over Time",
        data: values,
        fill: false,
        tension: 0.3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}})