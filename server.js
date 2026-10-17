/**
 * Local Node.js HTTP Server for UK Passive Tracker Indexes & Top 5 Outperforming Funds Explorer
 */
const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PORT = process.env.PORT || 8075;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const safeUrl = req.url.split("?")[0];
  const relPath = safeUrl === "/" ? "/index.html" : safeUrl;
  const filePath = path.join(ROOT, relPath);

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, "127.0.0.1", () => {
  const url = `http://127.0.0.1:${PORT}`;
  console.log("======================================================================");
  console.log("  UK Passive Tracker Indexes & Top 5 Outperforming Funds (20-Yr Data) ");
  console.log(`  Serving locally on: ${url}`);
  console.log("======================================================================\n");
  if (process.platform === "win32") {
    exec(`start "" "${url}"`);
  }
});
