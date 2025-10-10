import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";
import fs from "fs";

async function main() {
  const client = new CareeredClient({ logging: true, mode: 'auto' });
  const page = Number(process.env.PAGE || '1');
  console.log(`🔧 Diagnostic: fetching Careered list page ${page} in auto mode...`);
  try {
    const res = await client.getListPage({ page });
    console.log(`🔗 URL: ${res.url}`);
    console.log(`📄 HTML length: ${res.html.length}`);
    console.log(`🔎 jobLinks: ${res.jobLinks.length}`);

    const outPath = `/Users/tonsky/Desktop/projects/jspulse/backend/tmp/careered-list-${page}.html`;
    fs.writeFileSync(outPath, res.html, "utf8");
    console.log(`💾 Saved HTML to: ${outPath}`);

    if (res.jobLinks.length > 0) {
      console.log("First links:");
      console.log(res.jobLinks.slice(0, 5).join("\n"));
    }
  } catch (err) {
    console.error("❌ Diagnostic failed:", err);
  } finally {
    process.exit(0);
  }
}

main();
