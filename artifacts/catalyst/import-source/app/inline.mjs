import fs from "fs";
const d = "dist-single";
let html = fs.readFileSync(`${d}/index.html`, "utf8");
const js = fs.readFileSync(`${d}/app.js`, "utf8").replace(/<\/script/gi, "<\/script");
const css = fs.readFileSync(`${d}/app.css`, "utf8");
html = html.replace(/<script[^>]*src="[^"]*app\.js"[^>]*><\/script>/, "").replace(/<link[^>]*href="[^"]*app\.css"[^>]*>/, "");
html = html.replace("</head>", `<style>${css}</style></head>`).replace("</body>", () => `<script>${js}</script></body>`);
fs.writeFileSync("catalyst.html", html);
console.log((html.length / 1e6).toFixed(2) + " MB");
