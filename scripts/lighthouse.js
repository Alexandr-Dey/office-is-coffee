#!/usr/bin/env node
// Lighthouse audit. Запуск: node scripts/lighthouse.js [URL]
// Дефолт: http://localhost:3000

const URL = process.argv[2] || "http://localhost:3000";

(async () => {
  const lighthouse = (await import("lighthouse")).default;
  const chromeLauncher = await import("chrome-launcher");

  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const options = {
    logLevel: "error",
    output: "html",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo", "pwa"],
    port: chrome.port,
  };

  console.log(`Running Lighthouse on ${URL}...`);
  const result = await lighthouse(URL, options);
  await chrome.kill();

  if (!result) {
    console.error("Lighthouse returned no result");
    process.exit(1);
  }

  const { lhr, report } = result;
  const fs = await import("fs");
  fs.writeFileSync("lighthouse-report.html", Array.isArray(report) ? report[0] : report);

  console.log("\n=== Lighthouse Scores ===");
  for (const [key, cat] of Object.entries(lhr.categories)) {
    const score = cat.score === null ? "n/a" : Math.round(cat.score * 100);
    console.log(`  ${cat.title.padEnd(20)} ${score}`);
  }
  console.log("\nFull report: lighthouse-report.html");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
