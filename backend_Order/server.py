# backend_Order/server.py
from flask import Flask, request, jsonify, Response
import time
import uuid
from pymongo import MongoClient
from metrics import (
    http_requests_total,
    http_request_duration_seconds,
    orders_total,
    generate_latest,
    CONTENT_TYPE_LATEST
)

app = Flask(__name__)

@app.before_request
def start_timer():
    request._start_time = time.time()


@app.after_request
def record_request_metrics(response):
    duration = time.time() - request._start_time
    endpoint = request.endpoint or request.path

    http_requests_total.labels(
        method=request.method,
        endpoint=endpoint,
        status_code=response.status_code
    ).inc()

    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=endpoint
    ).observe(duration)

    return response


@app.route("/metrics")
def metrics():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

# ================== MONGODB ==================
client = MongoClient(
    "mongodb+srv://23521581_db_user:atlas23521581@secondcluster.zdf5ent.mongodb.net/Purchase?retryWrites=true&w=majority"
)
db = client["Purchase"]
orders_collection = db["orders"]
bills_collection = db["bills"]

# ================== PROMETHEUS MIDDLEWARE ==================
# Đặt TRƯỚC các routes

@app.before_request
def start_timer():
    request._start_time = time.time()

@app.after_request
def record_request_metrics(response):
    duration = time.time() - request._start_time
    endpoint = request.endpoint or request.path
    http_requests_total.labels(
        method=request.method,
        endpoint=endpoint,
        status_code=response.status_code
    ).inc()
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=endpoint
    ).observe(duration)
    return response

# ================== METRICS ENDPOINT ==================

@app.route('/metrics')
def metrics_endpoint():
    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)

# ================== ROUTES ==================

@app.route("/api/purchase/create-order", methods=["POST"])
def create_order():
    data = request.json
    userID = data["userID"]
    productID = data["productID"]
    num = data["num"]
    price = data["price"]

    if num <= 0:
        return jsonify({"error": "Quantity must be positive"}), 400

    total = num * price
    order_id = str(uuid.uuid4())
    order = {
        "_id": order_id,
        "userID": userID,
        "productID": productID,
        "num": num,
        "price": price,
        "total": total
    }
    orders_collection.insert_one(order)

    # Ghi metric sau khi insert thành công
    orders_total.labels(status='created').inc()

    return jsonify({
        "_id": order_id,
        "userID": userID,
        "productID": productID,
        "num": num,
        "price": price,
        "total": total
    }), 201

@app.route("/api/purchase/order", methods=["GET"])
def get_orders_by_user():
    userID = request.args.get("userID")
    if not userID:
        return jsonify({"error": "userID is required"}), 400
    orders = list(orders_collection.find({"userID": userID}))
    for order in orders:
        order["_id"] = str(order["_id"])
    return jsonify(orders), 200

@app.route("/api/purchase/create-bill", methods=["POST"])
def create_bill():
    data = request.json
    userID = data["userID"]
    orderIDs = data["orderIDs"]
    address = data["address"]
    phone = data["phone"]
    total_bill = 0
    for oid in orderIDs:
        order = orders_collection.find_one({"_id": oid})
        if not order:
            return jsonify({"error": f"Order not found: {oid}"}), 404
        total_bill += order["total"]
    bill_id = str(uuid.uuid4())
    bill = {
        "_id": bill_id,
        "userID": userID,
        "orderIDs": orderIDs,
        "total": total_bill,
        "address": address,
        "phone": phone
    }
    bills_collection.insert_one(bill)
    return jsonify(bill), 201

@app.route("/api/purchase/bill", methods=["GET"])
def get_bills_by_user():
    userID = request.args.get("userID")
    if not userID:
        return jsonify({"error": "userID is required"}), 400
    bills = list(bills_collection.find({"userID": userID}))
    for bill in bills:
        bill["_id"] = str(bill["_id"])
    return jsonify(bills), 200

@app.route("/api/purchase/bill", methods=["DELETE"])
def delete_bill():
    userID = request.args.get("userID")
    billID = request.args.get("billID")
    if not userID or not billID:
        return jsonify({"error": "userID and billID are required"}), 400
    bill = bills_collection.find_one({"_id": billID, "userID": userID})
    if not bill:
        return jsonify({"error": "Bill not found"}), 404
    for oid in bill["orderIDs"]:
        orders_collection.delete_one({"_id": oid})
    bills_collection.delete_one({"_id": billID})
    return jsonify({"message": "Bill and related orders deleted"}), 200

# ================== START SERVER ==================

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=3003, debug=True)