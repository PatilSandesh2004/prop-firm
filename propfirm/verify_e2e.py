import httpx
import sys

def test_full_flow():
    client = httpx.Client(base_url="http://localhost:8001")
    
    print("1. Testing Backend OpenAPI docs...")
    r = client.get("/docs")
    assert r.status_code == 200, f"Docs failed: {r.status_code}"
    print("   [OK] Docs reachable")

    print("2. Testing Demo Trader Login...")
    r = client.post("/api/v1/auth/login", json={"email": "demo@propfirm.in", "password": "Demo@123"})
    assert r.status_code == 200, f"Login failed: {r.text}"
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("   [OK] Logged in successfully. Token acquired.")

    print("3. Testing Accounts list and details...")
    r = client.get("/api/v1/accounts", headers=headers)
    assert r.status_code == 200, f"Get accounts failed: {r.text}"
    accounts = r.json()
    assert len(accounts) > 0, "No accounts found for demo user"
    acc = accounts[0]
    account_id = acc["id"]
    print(f"   [OK] Account ID: {account_id}, Type: {acc['account_type']}, Status: {acc['status']}, Balance: INR {acc['current_balance']}, Equity: INR {acc['equity']}")

    print("4. Testing Instruments list & Option contracts...")
    r = client.get("/api/v1/instruments", headers=headers)
    assert r.status_code == 200, f"Instruments failed: {r.text}"
    instruments = r.json()
    print(f"   [OK] Retrieved {len(instruments)} instruments")
    
    option_instruments = [i for i in instruments if i.get("instrument_type") == "OPTION"]
    print(f"   [OK] {len(option_instruments)} option contracts available")

    print("5. Testing Order Placement (BUY 1 lot)...")
    target_inst = option_instruments[0]
    order_data = {
        "instrument_id": target_inst["id"],
        "side": "BUY",
        "order_type": "MARKET",
        "quantity": target_inst["lot_size"],
    }
    r = client.post(f"/api/v1/accounts/{account_id}/orders", json=order_data, headers=headers)
    assert r.status_code in (200, 201), f"Order placement failed: {r.text}"
    order = r.json()
    print(f"   [OK] Order placed: {order.get('side')} {order.get('quantity')} units of {target_inst.get('trading_symbol')}, Status: {order.get('status')}")

    print("6. Testing Positions for account...")
    r = client.get(f"/api/v1/accounts/{account_id}/positions", headers=headers)
    assert r.status_code == 200, f"Positions failed: {r.text}"
    positions = r.json()
    print(f"   [OK] Open positions count: {len(positions)}")
    for pos in positions:
        print(f"        - Symbol: {pos.get('trading_symbol')}, Net Qty: {pos.get('net_quantity')}, Avg Price: {pos.get('average_entry_price')}, Unrealized PnL: INR {pos.get('unrealized_pnl')}")

    print("7. Testing Account Summary & Live Metrics...")
    r = client.get(f"/api/v1/accounts/{account_id}/summary", headers=headers)
    assert r.status_code == 200, f"Account summary failed: {r.text}"
    summary = r.json()
    print(f"   [OK] Current Equity: INR {summary.get('equity')}, Floating PnL: INR {summary.get('floating_pnl')}, High Water Mark: INR {summary.get('high_water_mark')}")

    print("8. Testing Frontend Server...")
    fe_client = httpx.Client()
    r = fe_client.get("http://localhost:5173")
    assert r.status_code == 200, f"Frontend check failed: {r.status_code}"
    print(f"   [OK] Frontend is serving at http://localhost:5173 (Status {r.status_code})")

    print("\n==========================================")
    print("ALL END-TO-END CHECKS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    test_full_flow()
