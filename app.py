import os
import sqlite3
from datetime import datetime
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

# Allowed expense categories
VALID_CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Education",
    "Bills",
    "Entertainment",
    "Healthcare",
    "Other"
]

def get_db_path():
    """Retrieve database path from environment or default to local data folder."""
    db_path = os.environ.get("EXPENSE_DB_PATH")
    if not db_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        data_dir = os.path.join(base_dir, "data")
        os.makedirs(data_dir, exist_ok=True)
        db_path = os.path.join(data_dir, "expenses.db")
    else:
        parent_dir = os.path.dirname(os.path.abspath(db_path))
        if parent_dir:
            os.makedirs(parent_dir, exist_ok=True)
    return db_path

def get_db_connection(db_path=None):
    """Create and return a database connection with dictionary-like row access."""
    path = db_path or get_db_path()
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db(db_path=None):
    """Initialize SQLite database table and seed initial demo data if empty."""
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            description TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Check if empty, then seed demo data
    cursor.execute("SELECT COUNT(*) as count FROM expenses")
    count = cursor.fetchone()["count"]
    if count == 0:
        seed_sample_data(conn)
    conn.close()

def seed_sample_data(conn):
    """Seed sample realistic expenses for college presentation."""
    now = datetime.now()
    current_year_month = now.strftime("%Y-%m")
    
    samples = [
        ("College Textbooks & Study Materials", 1250.00, "Education", f"{current_year_month}-02", "Semester core reference books and notebooks"),
        ("Campus Canteen & Lunch", 180.50, "Food", f"{current_year_month}-04", "Lunch with project group members"),
        ("Monthly Metro Commute Pass", 600.00, "Travel", f"{current_year_month}-05", "Metro card monthly recharge"),
        ("Hostel Wi-Fi Internet Bill", 450.00, "Bills", f"{current_year_month}-07", "Monthly broadband connection bill"),
        ("Laptop Keyboard Replacement", 850.00, "Shopping", f"{current_year_month}-10", "Replacement mechanical keyboard"),
        ("Health Clinic Doctor Consultation", 300.00, "Healthcare", f"{current_year_month}-12", "Routine seasonal checkup & vitamins"),
        ("Weekend Movie & Snacks", 350.00, "Entertainment", f"{current_year_month}-14", "Movie ticket with college friends"),
        ("Cloud Server Hosting & Domain Fee", 520.00, "Other", f"{current_year_month}-15", "Student AWS test lab credits recharge")
    ]
    cursor = conn.cursor()
    cursor.executemany(
        "INSERT INTO expenses (title, amount, category, date, description) VALUES (?, ?, ?, ?, ?)",
        samples
    )
    conn.commit()

# Initialize DB on application startup
init_db()

@app.route("/")
def index():
    """Render main Expense Tracker Single-Page Dashboard."""
    return render_template("index.html")

@app.route("/health", methods=["GET"])
def health():
    """Application health probe for Kubernetes & Docker liveness/readiness checks."""
    try:
        conn = get_db_connection()
        conn.execute("SELECT 1")
        conn.close()
        return jsonify({
            "status": "healthy",
            "service": "expense-tracker",
            "database": "connected"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "database": str(e)
        }), 500

@app.route("/api/expenses", methods=["GET"])
def get_expenses():
    """List expenses with optional filtering by category, date range, or month."""
    category = request.args.get("category", "").strip()
    month = request.args.get("month", "").strip()
    start_date = request.args.get("start_date", "").strip()
    end_date = request.args.get("end_date", "").strip()
    search = request.args.get("search", "").strip()

    query = "SELECT * FROM expenses WHERE 1=1"
    params = []

    if category:
        query += " AND category = ?"
        params.append(category)

    if month:
        query += " AND strftime('%Y-%m', date) = ?"
        params.append(month)

    if start_date:
        query += " AND date >= ?"
        params.append(start_date)

    if end_date:
        query += " AND date <= ?"
        params.append(end_date)

    if search:
        query += " AND (title LIKE ? OR description LIKE ?)"
        wildcard = f"%{search}%"
        params.extend([wildcard, wildcard])

    query += " ORDER BY date DESC, id DESC"

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    expenses = [dict(row) for row in rows]
    return jsonify(expenses), 200

@app.route("/api/expenses", methods=["POST"])
def add_expense():
    """Create a new expense entry with strict validation."""
    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    amount = data.get("amount")
    category = str(data.get("category", "")).strip()
    date_val = str(data.get("date", "")).strip()
    description = str(data.get("description", "")).strip()

    errors = []
    if not title:
        errors.append("Title is required.")
    elif len(title) > 120:
        errors.append("Title must not exceed 120 characters.")

    try:
        amount_float = float(amount)
        if amount_float <= 0:
            errors.append("Amount must be greater than zero.")
        elif amount_float > 100000000:
            errors.append("Amount is unrealistically large.")
    except (ValueError, TypeError):
        errors.append("Amount must be a valid positive number.")

    if not category:
        errors.append("Category is required.")
    elif category not in VALID_CATEGORIES:
        errors.append(f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}.")

    if not date_val:
        errors.append("Date is required.")
    else:
        try:
            datetime.strptime(date_val, "%Y-%m-%d")
        except ValueError:
            errors.append("Date must be formatted as YYYY-MM-DD.")

    if errors:
        return jsonify({"error": "Validation failed", "details": errors}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO expenses (title, amount, category, date, description) VALUES (?, ?, ?, ?, ?)",
        (title, round(amount_float, 2), category, date_val, description)
    )
    conn.commit()
    new_id = cursor.lastrowid
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (new_id,))
    new_expense = dict(cursor.fetchone())
    conn.close()

    return jsonify(new_expense), 201

@app.route("/api/expenses/<int:expense_id>", methods=["GET"])
def get_expense(expense_id):
    """Retrieve a single expense by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    row = cursor.fetchone()
    conn.close()

    if not row:
        return jsonify({"error": "Expense not found"}), 404

    return jsonify(dict(row)), 200

@app.route("/api/expenses/<int:expense_id>", methods=["PUT"])
def update_expense(expense_id):
    """Update an existing expense entry."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    data = request.get_json(silent=True) or {}
    title = str(data.get("title", "")).strip()
    amount = data.get("amount")
    category = str(data.get("category", "")).strip()
    date_val = str(data.get("date", "")).strip()
    description = str(data.get("description", "")).strip()

    errors = []
    if not title:
        errors.append("Title is required.")
    elif len(title) > 120:
        errors.append("Title must not exceed 120 characters.")

    try:
        amount_float = float(amount)
        if amount_float <= 0:
            errors.append("Amount must be greater than zero.")
        elif amount_float > 100000000:
            errors.append("Amount is unrealistically large.")
    except (ValueError, TypeError):
        errors.append("Amount must be a valid positive number.")

    if not category:
        errors.append("Category is required.")
    elif category not in VALID_CATEGORIES:
        errors.append(f"Invalid category. Must be one of: {', '.join(VALID_CATEGORIES)}.")

    if not date_val:
        errors.append("Date is required.")
    else:
        try:
            datetime.strptime(date_val, "%Y-%m-%d")
        except ValueError:
            errors.append("Date must be formatted as YYYY-MM-DD.")

    if errors:
        conn.close()
        return jsonify({"error": "Validation failed", "details": errors}), 400

    cursor.execute(
        """
        UPDATE expenses
        SET title = ?, amount = ?, category = ?, date = ?, description = ?
        WHERE id = ?
        """,
        (title, round(amount_float, 2), category, date_val, description, expense_id)
    )
    conn.commit()

    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    updated_expense = dict(cursor.fetchone())
    conn.close()

    return jsonify(updated_expense), 200

@app.route("/api/expenses/<int:expense_id>", methods=["DELETE"])
def delete_expense(expense_id):
    """Delete an expense by ID."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses WHERE id = ?", (expense_id,))
    existing = cursor.fetchone()
    if not existing:
        conn.close()
        return jsonify({"error": "Expense not found"}), 404

    cursor.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Expense deleted successfully", "id": expense_id}), 200

@app.route("/api/summary", methods=["GET"])
def get_summary():
    """Calculate and return spending analytics, category totals, and monthly trends."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Total expenses and count
    cursor.execute("SELECT COUNT(*) as total_count, COALESCE(SUM(amount), 0) as total_amount FROM expenses")
    totals = cursor.fetchone()
    total_count = totals["total_count"]
    total_amount = round(totals["total_amount"], 2)

    # Current month expenses
    current_month = datetime.now().strftime("%Y-%m")
    cursor.execute(
        "SELECT COALESCE(SUM(amount), 0) as month_amount FROM expenses WHERE strftime('%Y-%m', date) = ?",
        (current_month,)
    )
    current_month_amount = round(cursor.fetchone()["month_amount"], 2)

    # Category breakdown
    cursor.execute("""
        SELECT category, COALESCE(SUM(amount), 0) as category_total, COUNT(*) as count
        FROM expenses
        GROUP BY category
        ORDER BY category_total DESC
    """)
    category_rows = cursor.fetchall()
    category_breakdown = []
    highest_category = None

    for idx, row in enumerate(category_rows):
        cat_total = round(row["category_total"], 2)
        pct = round((cat_total / total_amount * 100), 1) if total_amount > 0 else 0
        cat_data = {
            "category": row["category"],
            "total": cat_total,
            "percentage": pct,
            "count": row["count"]
        }
        category_breakdown.append(cat_data)
        if idx == 0 and cat_total > 0:
            highest_category = {
                "category": row["category"],
                "amount": cat_total
            }

    # Monthly breakdown (sorted by month ascending for timeline bar chart)
    cursor.execute("""
        SELECT strftime('%Y-%m', date) as month, COALESCE(SUM(amount), 0) as monthly_total, COUNT(*) as count
        FROM expenses
        GROUP BY strftime('%Y-%m', date)
        ORDER BY month ASC
    """)
    monthly_rows = cursor.fetchall()
    monthly_breakdown = [
        {
            "month": row["month"],
            "total": round(row["monthly_total"], 2),
            "count": row["count"]
        }
        for row in monthly_rows if row["month"]
    ]

    # Recent transactions (last 5)
    cursor.execute("SELECT * FROM expenses ORDER BY date DESC, id DESC LIMIT 5")
    recent_transactions = [dict(row) for row in cursor.fetchall()]

    conn.close()

    return jsonify({
        "total_expenses": total_amount,
        "current_month_expenses": current_month_amount,
        "current_month": current_month,
        "total_transactions": total_count,
        "highest_category": highest_category,
        "category_breakdown": category_breakdown,
        "monthly_breakdown": monthly_breakdown,
        "recent_transactions": recent_transactions
    }), 200

@app.route("/api/seed", methods=["POST"])
def reset_seed():
    """Reset database and seed demo data for classroom demonstrations."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM expenses")
    conn.commit()
    seed_sample_data(conn)
    conn.close()
    return jsonify({"message": "Sample demonstration data reset successfully"}), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"Starting Expense Tracker server on http://{host}:{port}")
    app.run(host=host, port=port, debug=True)
