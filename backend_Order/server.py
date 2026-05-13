from flask import Flask, request, jsonify
from pymongo import MongoClient
import time
from flask import Response, request
from metrics import (
    http_requests_total,
    http_request_duration_seconds,
    orders_total,
    generate_latest,
    CONTENT_TYPE_LATEST
)
import uuid

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

# Kết nối Mongo
client = MongoClient(
    "mongodb+srv://23521581_db_user:atlas23521581@secondcluster.zdf5ent.mongodb.net/Purchase?retryWrites=true&w=majority"
)
print(client.list_database_names())
db = client["Purchase"]

orders_collection = db["orders"]
bills_collection = db["bills"]


# =========================
# POST /create-order
# =========================
@app.route("/api/purchase/create-order", methods=["POST"])
def create_order():
    data = request.json

    userID = data["userID"]
    productID = data["productID"]
    num = data["num"]
    price = data["price"]   # 👈 nhận từ Product service

    if num <= 0:
        return jsonify({"error": "Quantity must be positive"}), 400

    total = num * price

    order_id = str(uuid.uuid4())

    order = {
        "_id": order_id,
        "userID": userID,
        "productID": productID,
        "num": num,
        "price": price,   # 👈 lưu luôn price snapshot
        "total": total
    }

    orders_collection.insert_one(order)
    orders_total.labels(status="created").inc()
    
    return jsonify({
        "_id": order_id,
        "userID": userID,
        "productID": productID,
        "num": num,
        "price": price,
        "total": total
    }), 201


# =========================
# GET /orders?userID=abc
# =========================
@app.route("/api/purchase/order", methods=["GET"])
def get_orders_by_user():
    userID = request.args.get("userID")

    if not userID:
        return jsonify({"error": "userID is required"}), 400

    orders = list(orders_collection.find({"userID": userID}))

    # convert ObjectId nếu có
    for order in orders:
        order["_id"] = str(order["_id"])

    return jsonify(orders), 200

# =========================
# POST /create-bill
# =========================
@app.route("/api/purchase/create-bill", methods=["POST"])
def create_bill():
    data = request.json

    userID = data["userID"]
    orderIDs = data["orderIDs"]
    address = data["address"]
    phone = data["phone"]

    total_bill = 0

    # Tính tổng từ orders
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


# =========================
# GET /bills?userID=abc
# =========================
@app.route("/api/purchase/bill", methods=["GET"])
def get_bills_by_user():
    userID = request.args.get("userID")

    if not userID:
        return jsonify({"error": "userID is required"}), 400

    bills = list(bills_collection.find({"userID": userID}))

    for bill in bills:
        bill["_id"] = str(bill["_id"])

    return jsonify(bills), 200


# =========================
# DELETE /bill?userID=abc&billID=xxx
# =========================
@app.route("/api/purchase/bill", methods=["DELETE"])
def delete_bill():
    userID = request.args.get("userID")
    billID = request.args.get("billID")

    if not userID or not billID:
        return jsonify({"error": "userID and billID are required"}), 400

    bill = bills_collection.find_one({"_id": billID, "userID": userID})

    if not bill:
        return jsonify({"error": "Bill not found"}), 404

    # Xóa các order thuộc bill
    for oid in bill["orderIDs"]:
        orders_collection.delete_one({"_id": oid})

    # Xóa bill
    bills_collection.delete_one({"_id": billID})

    return jsonify({"message": "Bill and related orders deleted"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=3003)