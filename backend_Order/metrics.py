from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Đếm tổng số HTTP request
http_requests_total = Counter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "endpoint", "status_code"]
)

# Đo thời gian xử lý HTTP request
http_request_duration_seconds = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "endpoint"]
)

# Custom metric nghiệp vụ: đếm số order được tạo
orders_total = Counter(
    "orders_total",
    "Total number of orders created",
    ["status"]
)
