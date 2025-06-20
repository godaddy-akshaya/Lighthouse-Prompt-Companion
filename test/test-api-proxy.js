// test-endpoints.js ---------------------------------------------------------
import axios from "axios";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();

/* ----------------------------------------------------------------------- */
/* 1. CLI flags                                                             */
/* ----------------------------------------------------------------------- */
const envFlag = getFlag("--env", "dev"); // dev | prod
const useProxy = process.argv.includes("--proxy");
const rootHost =
  envFlag === "prod"
    ? "https://lighthouse.c3.int.gdcorp.tools"
    : "https://lighthouse.c3.int.dev-gdcorp.tools";
const proxyBase = "/api/aws/";

function getFlag(flag, defVal) {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : defVal;
}

/* ----------------------------------------------------------------------- */
/* 2. Auth                                                                  */
/* ----------------------------------------------------------------------- */
const JWT_TOKEN = process.env.JWT_TOKEN;
if (!JWT_TOKEN) {
  console.error("❌  JWT_TOKEN is not set in .env or environment variables");
  process.exit(1);
}

/* ----------------------------------------------------------------------- */
/* 3. Endpoint map (dev & prod) – POST calls include a minimal body         */
/* ----------------------------------------------------------------------- */
const ENDPOINTS = {
  dev: {
    "table-listing": {
      method: "GET",
      url: "https://4f4y1xez75.execute-api.us-west-2.amazonaws.com/dev",
    },
    "view-status": {
      method: "GET",
      url: "https://ys6kxhlx6f.execute-api.us-west-2.amazonaws.com/dev",
    },
    "table-filters": {
      method: "GET",
      url: "https://o3un8ndnb8.execute-api.us-west-2.amazonaws.com/dev",
      params: { table_name: "sample_table" },
    },
    "submit-job": {
      method: "POST",
      url: "https://eest1tmtp4.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleSubmitJob(),
    },
    "cancel-job": {
      method: "POST",
      url: "https://hhlm0qg1c9.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleCancelJob(),
    },
    "row-count": {
      method: "POST",
      url: "https://4qyj0h6rz2.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleRowCount(),
    },
    "view-results": {
      method: "GET",
      url: "https://9kj0a6h69a.execute-api.us-west-2.amazonaws.com/dev",
      params: { run_id: "demo" },
    },
    "view-summary": {
      method: "GET",
      url: "https://6n03hx5990.execute-api.us-west-2.amazonaws.com/dev",
      params: { run_id: "demo" },
    },
    "submit-summary-job": {
      method: "POST",
      url: "https://sfg8vqwjoj.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleSummaryJob(),
    },
    gdlh_get_interaction_ids: {
      method: "GET",
      url: "https://km6yahk783.execute-api.us-west-2.amazonaws.com/dev",
    },
    gdlh_save_interaction_ids: {
      method: "POST",
      url: "https://byq18tmxu0.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleInteractionSave(),
    },
    "validate-lexical-query": {
      method: "POST",
      url: "https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleLexicalValidate(),
    },
    "submit-lexical-query": {
      method: "POST",
      url: "https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleLexicalSubmit(),
    },
    "get-all-lexical-queries": {
      method: "POST",
      url: "https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev",
      body: { action: "get_all" },
    },
    "delete-lexical-query": {
      method: "POST",
      url: "https://vhaj1p1m78.execute-api.us-west-2.amazonaws.com/dev",
      body: sampleLexicalDelete(),
    },
  },
  prod: {
    "table-listing": {
      method: "GET",
      url: "https://lojoo506re.execute-api.us-west-2.amazonaws.com/gddeploy",
    },
    "view-status": {
      method: "GET",
      url: "https://x2x9swo6x5.execute-api.us-west-2.amazonaws.com/gddeploy",
    },
    "table-filters": {
      method: "GET",
      url: "https://xk89vym7gd.execute-api.us-west-2.amazonaws.com/gddeploy",
      params: { table_name: "sample_table" },
    },
    "row-count": {
      method: "POST",
      url: "https://0nc6ejrszd.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleRowCount(),
    },
    "submit-job": {
      method: "POST",
      url: "https://70bwwwm445.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleSubmitJob(),
    },
    "cancel-job": {
      method: "POST",
      url: "https://7y9v81tazb.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleCancelJob(),
    },
    "view-results": {
      method: "GET",
      url: "https://nk7y0uidib.execute-api.us-west-2.amazonaws.com/gddeploy",
      params: { run_id: "demo" },
    },
    "view-summary": {
      method: "GET",
      url: "https://jkb6iltdd7.execute-api.us-west-2.amazonaws.com/gddeploy",
      params: { run_id: "demo" },
    },
    "submit-summary-job": {
      method: "POST",
      url: "https://o4aj4d6r36.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleSummaryJob(),
    },
    gdlh_get_interaction_ids: {
      method: "GET",
      url: "https://nnb0qzh6nc.execute-api.us-west-2.amazonaws.com/gddeploy",
    },
    gdlh_save_interaction_ids: {
      method: "POST",
      url: "https://shmuxe5fik.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleInteractionSave(),
    },
    "validate-lexical-query": {
      method: "POST",
      url: "https://4qwaataj57.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleLexicalValidate(),
    },
    "submit-lexical-query": {
      method: "POST",
      url: "https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleLexicalSubmit(),
    },
    "get-all-lexical-queries": {
      method: "POST",
      url: "https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: { action: "get_all" },
    },
    "delete-lexical-query": {
      method: "POST",
      url: "https://ttgaka6m0f.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleLexicalDelete(),
    },
    "dynamic-model-list": {
      method: "GET",
      url: "https://r1edo1uwvc.execute-api.us-west-2.amazonaws.com/gddeploy",
    },
    "get-lexical-query-hits": {
      method: "POST",
      url: "https://fo4s1ll5eg.execute-api.us-west-2.amazonaws.com/gddeploy",
      body: sampleLexicalHits(),
    },
  },
};

/* ----------------------------------------------------------------------- */
/* 4. Run tests                                                            */
/* ----------------------------------------------------------------------- */
(async () => {
  console.log(
    `\n🔎  Testing Lighthouse endpoints (env=${envFlag}, proxy=${useProxy})\n`
  );

  const tests = ENDPOINTS[envFlag];
  const results = [];

  for (const [id, cfg] of Object.entries(tests)) {
    const target = useProxy ? `${rootHost}${proxyBase}${id}` : cfg.url;
    const start = Date.now();

    try {
      const res = await axios.request({
        method: cfg.m,
        url: target,
        headers: {
          Authorization: `sso-jwt ${JWT_TOKEN}`,
          "Content-Type": "application/json",
        },
        ...(cfg.params ? { params: cfg.params } : {}),
        ...(cfg.body ? { data: cfg.body } : {}),
        timeout: 30_000,
      });

      const ms = Date.now() - start;
      console.log(
        `${id.padEnd(25)} ${String(res.status).padEnd(4)} ✅  ${ms} ms`
      );
      results.push({
        id,
        target,
        status: res.status,
        ok: true,
        timeMs: ms,
        snippet: JSON.stringify(res.data).slice(0, 500),
      });
    } catch (err) {
      const ms = Date.now() - start;
      const status = err.response?.status || 0;
      console.log(`${id.padEnd(25)} ${String(status).padEnd(4)} ❌  ${ms} ms`);
      results.push({
        id,
        target,
        status,
        ok: false,
        timeMs: ms,
        error: err.response?.data || err.message,
      });
    }
  }

  const outfile = "results.json";
  fs.writeFileSync(
    outfile,
    JSON.stringify(
      {
        env: envFlag,
        proxy: useProxy,
        runAt: new Date().toISOString(),
        results,
      },
      null,
      2
    )
  );
  console.log(`\n📝  Saved results to ${outfile}\n`);
  // non-zero exit if any test failed
  if (results.some((r) => !r.ok)) process.exit(1);
})();

/* ----------------------------------------------------------------------- */
/* 5. Sample payload helpers                                               */
/* ----------------------------------------------------------------------- */
function sampleRowCount() {
  return { table_name: "sample_table", filterOptions: [] };
}
function sampleSubmitJob() {
  return {
    table_name: "sample_table",
    user_id: "tester",
    run_id: "abc123",
    model: "gpt-3.5",
    provider: "openai",
    prompt: "hello",
    count: 1,
    evaluation: false,
    filterOptions: [],
  };
}
function sampleCancelJob() {
  return { run_id: "abc123", user_id: "tester" };
}
function sampleSummaryJob() {
  return {
    user_id: "tester",
    prompt: "summarize",
    model: "gpt-3.5",
    provider: "openai",
    table_name: "sample_table",
    filterOptions: [],
  };
}
function sampleInteractionSave() {
  return { user_id: "tester", interaction_ids: ["foo", "bar"] };
}
function sampleLexicalValidate() {
  return {
    action: "validate",
    query: "select *",
    query_name: "",
    description: "",
  };
}
function sampleLexicalSubmit() {
  return {
    action: "insert_query",
    query: "select *",
    query_name: "myQuery",
    description: "demo",
  };
}
function sampleLexicalDelete() {
  return { action: "delete_query", query_name: "myQuery", query: {} };
}
function sampleLexicalHits() {
  return { query: "select *" };
}
