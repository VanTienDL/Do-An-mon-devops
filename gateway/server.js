// gateway/server.js

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

// Metrics
const {
  register,
  httpRequestDuration,
  httpRequestTotal,
  proxyErrorTotal,
} = require("./metrics");

const app = express();

// ================== MIDDLEWARE ==================

app.use(morgan("combined"));

app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5500",
      "http://localhost:5500",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ================== SERVICE MAP ==================

const serviceMap = require("./routes/routes.config");

// ================== PROMETHEUS METRICS ==================

app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on("finish", () => {
    const targetService =
      Object.keys(serviceMap).find((r) =>
        req.originalUrl.startsWith(r)
      ) || "unknown";

    const labels = {
      method: req.method,
      route: req.path,
      status_code: res.statusCode,
      target_service: targetService,
    };

    end(labels);
    httpRequestTotal.inc(labels);
  });

  next();
});

// ================== METRICS ENDPOINT ==================

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// ================== JWT MIDDLEWARE ==================

// app.use(async (req, res, next) => {
//   // ❌ Bỏ qua auth cho user service
//   if (req.originalUrl.startsWith("/api/user")) {
//     return next();
//   }

//   const token =
//     req.cookies?.token ||
//     req.headers["authorization"]?.replace("Bearer ", "");

//   if (!token) {
//     return res.status(401).json({
//       message: "Thiếu token xác thực",
//     });
//   }

//   try {
//     const decoded = jwt.verify(
//       token,
//       process.env.MyJWT_SECRET
//     );

//     req.user = decoded;

//     next();
//   } catch (err) {
//     console.error("❌ JWT Error:", err.message);

//     return res.status(403).json({
//       message: "Token không hợp lệ hoặc đã hết hạn",
//     });
//   }
// });

// ================== API GATEWAY PROXY ==================

app.use("/api", (req, res) => {
  // 1️⃣ Tìm service phù hợp
  let targetBase = null;

  for (const prefix in serviceMap) {
    if (req.originalUrl.startsWith(prefix)) {
      targetBase = serviceMap[prefix];
      break;
    }
  }

  if (!targetBase) {
    console.log(
      `[Gateway ❌] Không tìm thấy service cho ${req.originalUrl}`
    );

    return res.status(404).json({
      message: "Không tìm thấy service phù hợp",
    });
  }

  // 2️⃣ Tạo target URL
  const targetUrl = new URL(
    targetBase + req.originalUrl
  );

  console.log(
    `[Gateway 🚀] ${req.method} ${req.originalUrl} → ${targetUrl.href}`
  );

  // 3️⃣ Clone headers
  const headers = { ...req.headers };

  delete headers.host;

  // Forward user info nếu có JWT
  if (req.user) {
    headers["x-user-id"] =
      req.user.id || req.user._id;

    headers["x-user-email"] =
      req.user.email;
  }

  // 4️⃣ Proxy request options
  const options = {
    method: req.method,
    headers,
  };

  // 5️⃣ Gửi request tới internal service
  const proxyReq = http.request(
    targetUrl,
    options,
    (proxyRes) => {
      res.status(proxyRes.statusCode);

      for (const [key, value] of Object.entries(
        proxyRes.headers
      )) {
        res.setHeader(key, value);
      }

      proxyRes.pipe(res);
    }
  );

  // ================== PROXY ERROR METRICS ==================

  proxyReq.on("error", (err) => {
    console.error(
      `[Gateway ❌] ${req.method} ${targetUrl.href} → ${err.message}`
    );

    const serviceName =
      targetUrl.hostname || "unknown";

    proxyErrorTotal
      .labels({
        target_service: serviceName,
      })
      .inc();

    if (!res.headersSent) {
      res.status(502).json({
        message: "Lỗi kết nối tới service nội bộ",
      });
    }
  });

  // 6️⃣ Forward body stream
  req.pipe(proxyReq);
});

// ================== ROOT ==================

app.get("/", (req, res) => {
  res.send("🌐 API Gateway đang hoạt động! 🚀");
});

// ================== START SERVER ==================

const PORT =
  process.env.GATEWAY_PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚪 Gateway chạy ở http://localhost:${PORT}`
  );
});