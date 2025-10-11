import { CareeredClient } from "../utils/http/adapters/CareeredClient.js";

async function run() {
  const page = Number(process.env.PAGE || '1');
  const limit = Number(process.env.LIMIT || '5');
  const mode = (process.env.CAREERED_MODE as any) || 'playwright';

  const client = new CareeredClient({ logging: true, mode });
  console.log(`🔎 Diagnose Careered: page=${page} limit=${limit} mode=${mode}`);

  try {
    const list = await client.getListPage({ page });
    console.log(`📄 HTML length: ${list.html.length}`);
    console.log(`🔗 Links found: ${list.jobLinks.length}`);

    const sample = list.jobLinks.slice(0, limit);
    for (const url of sample) {
      console.log(`\n——— Parsing detail: ${url}`);
      const res = await client.getVacancyPage(url);
      const d = res.jobDetail;
      if (!d) {
        console.log(`❌ No jobDetail extracted`);
        continue;
      }
      const missing: string[] = [];
      if (!d.title) missing.push('title');
      if (!d.company) missing.push('company');
      if (!d.location) missing.push('location');
      if (!d.description || d.description.length < 30) missing.push('description');
      if (!d.fullDescription || d.fullDescription.length < 100) missing.push('fullDescription');

      console.log(`✅ title: ${d.title}`);
      console.log(`🏢 company: ${d.company}`);
      console.log(`📍 location: ${d.location}`);
      console.log(`📝 desc.len: ${d.description?.length || 0}, full.len: ${d.fullDescription?.length || 0}`);
      if (missing.length) {
        console.log(`⚠️ Missing/weak fields: ${missing.join(', ')}`);
      }
    }
  } catch (e) {
    console.error('❌ Diagnose failed:', e);
  } finally {
    process.exit(0);
  }
}

run();
