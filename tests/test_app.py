import os
import tempfile
import pytest
import json
from datetime import datetime

# Configure isolated test database before importing app
test_db_fd, test_db_path = tempfile.mkstemp(suffix=".db")
os.close(test_db_fd)
os.environ["EXPENSE_DB_PATH"] = test_db_path

from app import app, init_db, get_db_connection

@pytest.fixture(scope="module", autouse=True)
def setup_test_database():
    """Set up and tear down a clean isolated database for test execution."""
    init_db(test_db_path)
    yield
    if os.path.exists(test_db_path):
        os.remove(test_db_path)

@pytest.fixture
def client():
    """Create Flask test client."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client

def test_health_endpoint(client):
    """Test /health endpoint returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.get_json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_add_expense_success(client):
    """Test adding a valid expense."""
    payload = {
        "title": "Semester Registration Fee",
        "amount": 2500.00,
        "category": "Education",
        "date": "2026-10-15",
        "description": "Exam and semester lab fee payment"
    }
    response = client.post("/api/expenses", json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["id"] is not None
    assert data["title"] == "Semester Registration Fee"
    assert data["amount"] == 2500.00
    assert data["category"] == "Education"
    assert data["date"] == "2026-10-15"

def test_list_expenses(client):
    """Test retrieving list of expenses."""
    response = client.get("/api/expenses")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_single_expense(client):
    """Test retrieving a single expense by ID."""
    # First create an expense
    create_res = client.post("/api/expenses", json={
        "title": "Coffee and Snack",
        "amount": 15.50,
        "category": "Food",
        "date": "2026-10-16"
    })
    created_id = create_res.get_json()["id"]

    response = client.get(f"/api/expenses/{created_id}")
    assert response.status_code == 200
    data = response.get_json()
    assert data["id"] == created_id
    assert data["title"] == "Coffee and Snack"

def test_get_nonexistent_expense(client):
    """Test retrieving a non-existent expense returns 404."""
    response = client.get("/api/expenses/999999")
    assert response.status_code == 404
    data = response.get_json()
    assert "error" in data

def test_update_expense(client):
    """Test updating an existing expense."""
    create_res = client.post("/api/expenses", json={
        "title": "Old Bus Ticket",
        "amount": 40.00,
        "category": "Travel",
        "date": "2026-10-10",
        "description": "Original note"
    })
    exp_id = create_res.get_json()["id"]

    update_payload = {
        "title": "Express Train Ticket",
        "amount": 85.00,
        "category": "Travel",
        "date": "2026-10-11",
        "description": "Upgraded to express train"
    }
    response = client.put(f"/api/expenses/{exp_id}", json=update_payload)
    assert response.status_code == 200
    updated = response.get_json()
    assert updated["id"] == exp_id
    assert updated["title"] == "Express Train Ticket"
    assert updated["amount"] == 85.00
    assert updated["date"] == "2026-10-11"

def test_delete_expense(client):
    """Test deleting an expense."""
    create_res = client.post("/api/expenses", json={
        "title": "To be deleted",
        "amount": 12.00,
        "category": "Other",
        "date": "2026-10-01"
    })
    exp_id = create_res.get_json()["id"]

    del_res = client.delete(f"/api/expenses/{exp_id}")
    assert del_res.status_code == 200

    # Ensure it no longer exists
    get_res = client.get(f"/api/expenses/{exp_id}")
    assert get_res.status_code == 404

def test_delete_nonexistent_expense(client):
    """Test deleting a non-existent expense returns 404."""
    response = client.delete("/api/expenses/999999")
    assert response.status_code == 404

def test_validation_invalid_amounts(client):
    """Test rejecting negative, zero, or non-numeric amounts."""
    # Negative amount
    res1 = client.post("/api/expenses", json={
        "title": "Invalid Negative",
        "amount": -50.00,
        "category": "Food",
        "date": "2026-10-12"
    })
    assert res1.status_code == 400

    # Zero amount
    res2 = client.post("/api/expenses", json={
        "title": "Zero Amount",
        "amount": 0,
        "category": "Food",
        "date": "2026-10-12"
    })
    assert res2.status_code == 400

    # String amount that is not a number
    res3 = client.post("/api/expenses", json={
        "title": "String Amount",
        "amount": "abc",
        "category": "Food",
        "date": "2026-10-12"
    })
    assert res3.status_code == 400

def test_validation_missing_fields(client):
    """Test rejecting requests with missing required fields."""
    # Missing title
    res1 = client.post("/api/expenses", json={
        "amount": 100.00,
        "category": "Food",
        "date": "2026-10-12"
    })
    assert res1.status_code == 400

    # Missing category
    res2 = client.post("/api/expenses", json={
        "title": "Lunch",
        "amount": 100.00,
        "date": "2026-10-12"
    })
    assert res2.status_code == 400

    # Invalid category
    res3 = client.post("/api/expenses", json={
        "title": "Lunch",
        "amount": 100.00,
        "category": "IllegalCategory",
        "date": "2026-10-12"
    })
    assert res3.status_code == 400

    # Invalid date format
    res4 = client.post("/api/expenses", json={
        "title": "Lunch",
        "amount": 100.00,
        "category": "Food",
        "date": "12-10-2026"  # wrong format
    })
    assert res4.status_code == 400

def test_filtering_by_category(client):
    """Test filtering expenses by category."""
    # Insert specific entries
    client.post("/api/expenses", json={"title": "Test Doctor", "amount": 120.00, "category": "Healthcare", "date": "2026-10-05"})
    client.post("/api/expenses", json={"title": "Test Medicine", "amount": 45.00, "category": "Healthcare", "date": "2026-10-06"})
    client.post("/api/expenses", json={"title": "Test Pizza", "amount": 25.00, "category": "Food", "date": "2026-10-07"})

    res = client.get("/api/expenses?category=Healthcare")
    assert res.status_code == 200
    data = res.get_json()
    assert all(item["category"] == "Healthcare" for item in data)
    assert len(data) >= 2

def test_filtering_by_date_and_month(client):
    """Test filtering expenses by month and date range."""
    client.post("/api/expenses", json={"title": "May Book", "amount": 60.00, "category": "Education", "date": "2026-05-15"})
    client.post("/api/expenses", json={"title": "October Book", "amount": 70.00, "category": "Education", "date": "2026-10-15"})

    # Filter by month 2026-05
    res_month = client.get("/api/expenses?month=2026-05")
    assert res_month.status_code == 200
    month_data = res_month.get_json()
    assert all(item["date"].startswith("2026-05") for item in month_data)

    # Filter by start_date and end_date
    res_range = client.get("/api/expenses?start_date=2026-05-01&end_date=2026-05-31")
    assert res_range.status_code == 200
    range_data = res_range.get_json()
    assert all("2026-05-01" <= item["date"] <= "2026-05-31" for item in range_data)

def test_summary_calculations(client):
    """Test spending summary analytics endpoint."""
    res = client.get("/api/summary")
    assert res.status_code == 200
    data = res.get_json()
    assert "total_expenses" in data
    assert "current_month_expenses" in data
    assert "total_transactions" in data
    assert "category_breakdown" in data
    assert "monthly_breakdown" in data
    assert "recent_transactions" in data
    assert data["total_expenses"] > 0
    assert data["total_transactions"] > 0
    assert isinstance(data["category_breakdown"], list)

def test_database_persistence():
    """Verify that records are genuinely committed and readable in the SQLite file."""
    conn = get_db_connection(test_db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM expenses")
    count = cursor.fetchone()["count"]
    conn.close()
    assert count > 0
