#!/bin/sh


cat > /usr/share/nginx/html/config.js << EOF
window.API_BASE = "${VITE_API_BASE:-/api}";
EOF

exec nginx -g 'daemon off;'
