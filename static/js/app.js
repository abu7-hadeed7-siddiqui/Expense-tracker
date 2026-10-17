// State Management
let expensesData = [];
let summaryData = null;
let categoryChartInstance = null;
let monthlyChartInstance = null;
let pendingDeleteId = null;

const CATEGORY_COLORS = {
    "Food": "#f59e0b",
    "Travel": "#0ea5e9",
    "Shopping": "#ec4899",
    "Education": "#6366f1",
    "Bills": "#ef4444",
    "Entertainment": "#8b5cf6",
    "Healthcare": "#10b981",
    "Other": "#64748b"
};

// DOM Content Loaded
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initModals();
    initFilters();
    checkHealth();
    loadDashboard();
});

// 1. Navigation & Section Switching
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = {
        "dashboard": document.getElementById("section-dashboard"),
        "expenses": document.getElementById("section-expenses"),
        "analytics": document.getElementById("section-analytics"),
        "devops": document.getElementById("section-devops")
    };
    const pageHeading = document.getElementById("page-heading");
    const menuToggle = document.getElementById("menu-toggle");
    const sidebar = document.querySelector(".sidebar");

    const sectionHeadings = {
        "dashboard": "Financial Overview",
        "expenses": "Transaction Management",
        "analytics": "Spending Analytics",
        "devops": "DevOps & Cloud Architecture"
    };

    function switchSection(targetKey) {
        navItems.forEach(item => {
            if (item.dataset.section === targetKey) {
                item.classList.add("active");
            } else {
                item.classList.remove("active");
            }
        });

        Object.keys(sections).forEach(key => {
            if (sections[key]) {
                if (key === targetKey) {
                    sections[key].classList.remove("hidden");
                } else {
                    sections[key].classList.add("hidden");
                }
            }
        });

        if (pageHeading && sectionHeadings[targetKey]) {
            pageHeading.textContent = sectionHeadings[targetKey];
        }

        // Close sidebar on mobile
        if (sidebar && window.innerWidth <= 900) {
            sidebar.classList.remove("open");
        }

        if (targetKey === "expenses") {
            loadExpenses();
        } else if (targetKey === "dashboard" || targetKey === "analytics") {
            loadDashboard();
        }
    }

    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            const sectionKey = item.dataset.section;
            switchSection(sectionKey);
        });
    });

    const btnViewAllRecent = document.getElementById("btn-view-all-recent");
    if (btnViewAllRecent) {
        btnViewAllRecent.addEventListener("click", () => switchSection("expenses"));
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // Reset Demo Data Button
    const btnSeed = document.getElementById("btn-seed-data");
    if (btnSeed) {
        btnSeed.addEventListener("click", resetDemoData);
    }
}

// 2. Health Check
async function checkHealth() {
    const healthDot = document.getElementById("health-dot");
    const healthStatus = document.getElementById("health-status");
    try {
        const res = await fetch("/health");
        if (res.ok) {
            const data = await res.json();
            if (healthDot) healthDot.className = "status-indicator online";
            if (healthStatus) healthStatus.textContent = "Online (Healthy)";
        } else {
            throw new Error("Unhealthy status");
        }
    } catch (e) {
        if (healthDot) healthDot.className = "status-indicator offline";
        if (healthStatus) healthStatus.textContent = "Offline / Error";
    }
}

// 3. Currency and Date Format Helpers
function formatCurrency(val) {
    const num = Number(val) || 0;
    return "$" + num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    if (!dateStr) return "-";
    try {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
        return dateStr;
    } catch {
        return dateStr;
    }
}

function getCategoryBadge(category) {
    const catClass = "cat-" + (category || "Other");
    return `<span class="badge-category ${catClass}">${escapeHtml(category || "Other")}</span>`;
}

function escapeHtml(text) {
    if (!text) return "";
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 4. Load Dashboard & KPI Summaries
async function loadDashboard() {
    try {
        const res = await fetch("/api/summary");
        if (!res.ok) throw new Error("Failed to load summary data");
        summaryData = await res.json();

        // Update KPIs
        const totalEl = document.getElementById("kpi-total");
        const monthEl = document.getElementById("kpi-month");
        const monthNameEl = document.getElementById("kpi-month-name");
        const transEl = document.getElementById("kpi-transactions");
        const topCatEl = document.getElementById("kpi-top-category");
        const topAmountEl = document.getElementById("kpi-top-amount");

        if (totalEl) totalEl.textContent = formatCurrency(summaryData.total_expenses);
        if (monthEl) monthEl.textContent = formatCurrency(summaryData.current_month_expenses);
        if (monthNameEl) monthNameEl.textContent = summaryData.current_month || "Current Month";
        if (transEl) transEl.textContent = summaryData.total_transactions;

        if (summaryData.highest_category) {
            if (topCatEl) topCatEl.textContent = summaryData.highest_category.category;
            if (topAmountEl) topAmountEl.textContent = formatCurrency(summaryData.highest_category.amount);
        } else {
            if (topCatEl) topCatEl.textContent = "None";
            if (topAmountEl) topAmountEl.textContent = "$0.00";
        }

        // Render Recent Transactions
        renderRecentTransactions(summaryData.recent_transactions || []);

        // Render Analytics Breakdown Table
        renderAnalyticsTable(summaryData.category_breakdown || []);

        // Render Charts
        renderCharts(summaryData);
    } catch (err) {
        showToast("Error loading financial overview: " + err.message, "danger");
    }
}

function renderRecentTransactions(items) {
    const tbody = document.getElementById("recent-expenses-body");
    if (!tbody) return;

    if (!items || items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding: 20px;">No recent transactions found.</td></tr>`;
        return;
    }

    tbody.innerHTML = items.map(item => `
        <tr>
            <td>${formatDate(item.date)}</td>
            <td><strong>${escapeHtml(item.title)}</strong></td>
            <td>${getCategoryBadge(item.category)}</td>
            <td><strong>${formatCurrency(item.amount)}</strong></td>
            <td class="text-secondary">${escapeHtml(item.description) || "-"}</td>
        </tr>
    `).join("");
}

function renderAnalyticsTable(categories) {
    const tbody = document.getElementById("analytics-table-body");
    if (!tbody) return;

    if (!categories || categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align:center; padding: 20px;">No category data available.</td></tr>`;
        return;
    }

    tbody.innerHTML = categories.map(cat => `
        <tr>
            <td>${getCategoryBadge(cat.category)}</td>
            <td>${cat.count} transactions</td>
            <td><strong>${formatCurrency(cat.total)}</strong></td>
            <td><strong>${cat.percentage}%</strong></td>
            <td style="width: 250px;">
                <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${cat.percentage}%; background-color: ${CATEGORY_COLORS[cat.category] || '#6366f1'};"></div>
                </div>
            </td>
        </tr>
    `).join("");
}

// 5. Chart.js Renderers
function renderCharts(summary) {
    const categoryData = summary.category_breakdown || [];
    const monthlyData = summary.monthly_breakdown || [];

    // Category Doughnut Chart
    const catCanvas = document.getElementById("categoryChart");
    const catEmpty = document.getElementById("categoryChartEmpty");
    if (catCanvas) {
        if (categoryChartInstance) {
            categoryChartInstance.destroy();
        }

        if (categoryData.length === 0) {
            catCanvas.classList.add("hidden");
            if (catEmpty) catEmpty.classList.remove("hidden");
        } else {
            catCanvas.classList.remove("hidden");
            if (catEmpty) catEmpty.classList.add("hidden");

            const labels = categoryData.map(c => c.category);
            const totals = categoryData.map(c => c.total);
            const bgColors = categoryData.map(c => CATEGORY_COLORS[c.category] || "#94a3b8");

            categoryChartInstance = new Chart(catCanvas, {
                type: "doughnut",
                data: {
                    labels: labels,
                    datasets: [{
                        data: totals,
                        backgroundColor: bgColors,
                        borderWidth: 2,
                        borderColor: "#ffffff"
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: "bottom",
                            labels: {
                                boxWidth: 12,
                                font: { family: "Inter", size: 11 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    const val = context.parsed || 0;
                                    return ` ${context.label}: $${val.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    cutout: "65%"
                }
            });
        }
    }

    // Monthly Bar Chart
    const monthCanvas = document.getElementById("monthlyChart");
    const monthEmpty = document.getElementById("monthlyChartEmpty");
    if (monthCanvas) {
        if (monthlyChartInstance) {
            monthlyChartInstance.destroy();
        }

        if (monthlyData.length === 0) {
            monthCanvas.classList.add("hidden");
            if (monthEmpty) monthEmpty.classList.remove("hidden");
        } else {
            monthCanvas.classList.remove("hidden");
            if (monthEmpty) monthEmpty.classList.add("hidden");

            const labels = monthlyData.map(m => m.month);
            const values = monthlyData.map(m => m.total);

            monthlyChartInstance = new Chart(monthCanvas, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        label: "Monthly Spending ($)",
                        data: values,
                        backgroundColor: "#6366f1",
                        borderRadius: 6,
                        maxBarThickness: 45
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: val => "$" + val,
                                font: { family: "Inter", size: 11 }
                            },
                            grid: {
                                color: "#f1f5f9"
                            }
                        },
                        x: {
                            grid: { display: false },
                            ticks: { font: { family: "Inter", size: 11 } }
                        }
                    },
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` Total: $${Number(context.parsed.y).toFixed(2)}`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
}

// 6. Expense List & Filters
async function loadExpenses() {
    const searchVal = document.getElementById("filter-search")?.value.trim() || "";
    const categoryVal = document.getElementById("filter-category")?.value || "";
    const monthVal = document.getElementById("filter-month")?.value || "";

    const params = new URLSearchParams();
    if (searchVal) params.append("search", searchVal);
    if (categoryVal) params.append("category", categoryVal);
    if (monthVal) params.append("month", monthVal);

    try {
        const res = await fetch("/api/expenses?" + params.toString());
        if (!res.ok) throw new Error("Failed to fetch expenses");
        expensesData = await res.json();
        renderExpensesTable(expensesData);
    } catch (err) {
        showToast("Error loading expenses: " + err.message, "danger");
    }
}

function renderExpensesTable(items) {
    const tbody = document.getElementById("expenses-table-body");
    const emptyState = document.getElementById("table-empty-state");
    const filteredCount = document.getElementById("filtered-count");
    const filteredTotalBadge = document.getElementById("filtered-total-badge");

    if (filteredCount) filteredCount.textContent = items.length;

    const total = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if (filteredTotalBadge) filteredTotalBadge.textContent = "Filtered Total: " + formatCurrency(total);

    if (!tbody) return;

    if (items.length === 0) {
        tbody.innerHTML = "";
        if (emptyState) emptyState.classList.remove("hidden");
        return;
    }

    if (emptyState) emptyState.classList.add("hidden");

    tbody.innerHTML = items.map(item => `
        <tr>
            <td class="text-secondary">#${item.id}</td>
            <td>${formatDate(item.date)}</td>
            <td><strong>${escapeHtml(item.title)}</strong></td>
            <td>${getCategoryBadge(item.category)}</td>
            <td><strong>${formatCurrency(item.amount)}</strong></td>
            <td class="text-secondary">${escapeHtml(item.description) || "-"}</td>
            <td class="text-right">
                <button class="btn-icon" onclick="openEditModal(${item.id})" title="Edit Expense">
                    <i class="fa-solid fa-pen-to-square"></i>
                </button>
                <button class="btn-icon delete" onclick="confirmDelete(${item.id})" title="Delete Expense">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

function initFilters() {
    const searchInput = document.getElementById("filter-search");
    const categorySelect = document.getElementById("filter-category");
    const monthInput = document.getElementById("filter-month");
    const btnClear = document.getElementById("btn-clear-filters");

    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => loadExpenses(), 300);
        });
    }

    if (categorySelect) {
        categorySelect.addEventListener("change", () => loadExpenses());
    }

    if (monthInput) {
        monthInput.addEventListener("change", () => loadExpenses());
    }

    if (btnClear) {
        btnClear.addEventListener("click", () => {
            if (searchInput) searchInput.value = "";
            if (categorySelect) categorySelect.value = "";
            if (monthInput) monthInput.value = "";
            loadExpenses();
        });
    }

    const btnEmptyAdd = document.getElementById("btn-empty-add");
    if (btnEmptyAdd) {
        btnEmptyAdd.addEventListener("click", () => openAddModal());
    }

    const btnAddTable = document.getElementById("btn-add-expense-table");
    if (btnAddTable) {
        btnAddTable.addEventListener("click", () => openAddModal());
    }
}

// 7. Modals: Add / Edit / Delete
function initModals() {
    const btnOpenAdd = document.getElementById("btn-open-add-modal");
    const modalClose = document.getElementById("modal-close-btn");
    const modalCancel = document.getElementById("modal-cancel-btn");
    const expenseForm = document.getElementById("expense-form");

    if (btnOpenAdd) btnOpenAdd.addEventListener("click", openAddModal);
    if (modalClose) modalClose.addEventListener("click", closeExpenseModal);
    if (modalCancel) modalCancel.addEventListener("click", closeExpenseModal);

    if (expenseForm) {
        expenseForm.addEventListener("submit", handleExpenseSubmit);
    }

    // Delete Modal Controls
    const deleteClose = document.getElementById("delete-close-btn");
    const deleteCancel = document.getElementById("delete-cancel-btn");
    const deleteConfirm = document.getElementById("delete-confirm-btn");

    if (deleteClose) deleteClose.addEventListener("click", closeDeleteModal);
    if (deleteCancel) deleteCancel.addEventListener("click", closeDeleteModal);
    if (deleteConfirm) deleteConfirm.addEventListener("click", executeDelete);
}

function openAddModal() {
    const modal = document.getElementById("expense-modal");
    const modalTitle = document.getElementById("modal-title");
    const form = document.getElementById("expense-form");
    const expenseIdField = document.getElementById("expense-id");
    const dateField = document.getElementById("expense-date");

    if (form) form.reset();
    clearValidationErrors();
    if (expenseIdField) expenseIdField.value = "";
    if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> Add New Expense`;

    // Default to today's date
    if (dateField) {
        const today = new Date().toISOString().split("T")[0];
        dateField.value = today;
    }

    if (modal) modal.classList.remove("hidden");
}

async function openEditModal(id) {
    const modal = document.getElementById("expense-modal");
    const modalTitle = document.getElementById("modal-title");
    const form = document.getElementById("expense-form");
    const expenseIdField = document.getElementById("expense-id");

    clearValidationErrors();

    try {
        const res = await fetch(`/api/expenses/${id}`);
        if (!res.ok) throw new Error("Could not find requested expense");
        const exp = await res.json();

        if (expenseIdField) expenseIdField.value = exp.id;
        document.getElementById("expense-title").value = exp.title;
        document.getElementById("expense-amount").value = exp.amount;
        document.getElementById("expense-category").value = exp.category;
        document.getElementById("expense-date").value = exp.date;
        document.getElementById("expense-desc").value = exp.description || "";

        if (modalTitle) modalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> Edit Expense #${exp.id}`;
        if (modal) modal.classList.remove("hidden");
    } catch (err) {
        showToast(err.message, "danger");
    }
}

function closeExpenseModal() {
    const modal = document.getElementById("expense-modal");
    if (modal) modal.classList.add("hidden");
}

function clearValidationErrors() {
    ["err-title", "err-amount", "err-category", "err-date"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = "";
    });
}

async function handleExpenseSubmit(e) {
    e.preventDefault();
    clearValidationErrors();

    const id = document.getElementById("expense-id").value;
    const title = document.getElementById("expense-title").value.trim();
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value;
    const date = document.getElementById("expense-date").value;
    const description = document.getElementById("expense-desc").value.trim();

    let hasErrors = false;
    if (!title) {
        document.getElementById("err-title").textContent = "Expense title is required.";
        hasErrors = true;
    }
    if (!amount || Number(amount) <= 0) {
        document.getElementById("err-amount").textContent = "Please enter a valid amount greater than $0.";
        hasErrors = true;
    }
    if (!category) {
        document.getElementById("err-category").textContent = "Please select a category.";
        hasErrors = true;
    }
    if (!date) {
        document.getElementById("err-date").textContent = "Date is required.";
        hasErrors = true;
    }

    if (hasErrors) return;

    const payload = { title, amount: parseFloat(amount), category, date, description };
    const isEdit = Boolean(id);
    const url = isEdit ? `/api/expenses/${id}` : "/api/expenses";
    const method = isEdit ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) {
            if (data.details && Array.isArray(data.details)) {
                showToast("Validation failed: " + data.details.join(", "), "danger");
            } else {
                showToast(data.error || "Failed to save expense", "danger");
            }
            return;
        }

        showToast(isEdit ? "Expense updated successfully!" : "Expense added successfully!", "success");
        closeExpenseModal();
        loadDashboard();
        loadExpenses();
    } catch (err) {
        showToast("Network error: " + err.message, "danger");
    }
}

// 8. Delete Confirmation
function confirmDelete(id) {
    const item = expensesData.find(e => e.id === id);
    pendingDeleteId = id;

    const preview = document.getElementById("delete-item-preview");
    if (preview && item) {
        preview.innerHTML = `<strong>${escapeHtml(item.title)}</strong> — ${formatCurrency(item.amount)} (${escapeHtml(item.category)} on ${formatDate(item.date)})`;
    }

    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.remove("hidden");
}

function closeDeleteModal() {
    pendingDeleteId = null;
    const modal = document.getElementById("delete-modal");
    if (modal) modal.classList.add("hidden");
}

async function executeDelete() {
    if (!pendingDeleteId) return;

    try {
        const res = await fetch(`/api/expenses/${pendingDeleteId}`, { method: "DELETE" });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || "Failed to delete expense");
        }

        showToast("Expense deleted successfully", "success");
        closeDeleteModal();
        loadDashboard();
        loadExpenses();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// 9. Reset Demo Data
async function resetDemoData() {
    if (!confirm("Reset database to initial college demonstration data?")) return;

    try {
        const res = await fetch("/api/seed", { method: "POST" });
        if (!res.ok) throw new Error("Could not reset sample data");
        showToast("Sample data restored successfully!", "success");
        loadDashboard();
        loadExpenses();
    } catch (err) {
        showToast(err.message, "danger");
    }
}

// 10. Toast Notification Helper
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "fa-circle-info";
    if (type === "success") icon = "fa-circle-check";
    if (type === "danger") icon = "fa-triangle-exclamation";

    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${escapeHtml(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateX(20px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Global scope attachment for inline handlers
window.openEditModal = openEditModal;
window.confirmDelete = confirmDelete;
