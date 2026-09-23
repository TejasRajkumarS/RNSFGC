const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const targets = [
    { name: "desktop", width: 1440, height: 900 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 390, height: 844 },
  ];
  const pages = process.argv[2] ? process.argv[2].split(",") : ["/", "/events", "/registration", "/event-calendar"];

  for (const t of targets) {
    for (const route of pages) {
      const page = await browser.newPage({ viewport: { width: t.width, height: t.height } });
      await page.goto(`http://localhost:3000${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1400); // let entrance animations settle
      const slug = route === "/" ? "home" : route.replace(/\//g, "");
      // above the fold
      await page.screenshot({ path: `${process.env.OUT_DIR || "."}/qa-${slug}-${t.name}-fold.png` });
      // full page
      await page.screenshot({ path: `${process.env.OUT_DIR || "."}/qa-${slug}-${t.name}-full.png`, fullPage: true });
      await page.close();
      console.log(`done ${slug} ${t.name}`);
    }
  }
  await browser.close();
})();
