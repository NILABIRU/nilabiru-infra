import http from "node:http";

const TARGET_HOST = process.env.TARGET_HOST || "127.0.0.1";
const TARGET_PORT = Number(process.env.TARGET_PORT || 20128);
const LISTEN_PORT = Number(process.env.LISTEN_PORT || 20129);
const LISTEN_HOST = process.env.LISTEN_HOST || "127.0.0.1";
const SPLIT_USAGE = process.env.SPLIT_USAGE === "1";

function processEvent(rawEvent, state) {
  const dataLines = rawEvent
    .split(/\r?\n/)
    .filter((l) => l.startsWith("data:"))
    .map((l) => l.slice(5).trim());

  if (dataLines.length === 0) return [rawEvent];

  const data = dataLines.join("\n");

  if (data === "[DONE]") {
    state.sawDone = true;
    return [];
  }

  if (SPLIT_USAGE) {
    try {
      const obj = JSON.parse(data);
      const hasFinish =
        Array.isArray(obj.choices) &&
        obj.choices.some((c) => c && c.finish_reason);
      if (hasFinish && obj.usage) {
        const { usage, ...withoutUsage } = obj;
        const usageChunk = { ...obj, choices: [], usage };
        return [
          `data: ${JSON.stringify(withoutUsage)}`,
          `data: ${JSON.stringify(usageChunk)}`,
        ];
      }
    } catch {
      // empty
    }
  }

  return [rawEvent];
}

const server = http.createServer((clientReq, clientRes) => {
  const upstreamReq = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: clientReq.method,
      path: clientReq.url,
      headers: {
        ...clientReq.headers,
        host: `${TARGET_HOST}:${TARGET_PORT}`,
        "accept-encoding": "identity",
      },
    },
    (upstreamRes) => {
      const contentType = String(upstreamRes.headers["content-type"] || "");
      const isSSE = contentType.includes("text/event-stream");

      if (!isSSE) {
        clientRes.writeHead(upstreamRes.statusCode, upstreamRes.headers);
        upstreamRes.pipe(clientRes);
        return;
      }

      const headers = { ...upstreamRes.headers };
      delete headers["content-length"];
      clientRes.writeHead(upstreamRes.statusCode, headers);

      const state = { sawDone: false };
      let buffer = "";
      upstreamRes.setEncoding("utf8");

      upstreamRes.on("data", (chunk) => {
        buffer += chunk;
        const parts = buffer.split(/\r?\n\r?\n/);
        buffer = parts.pop();
        for (const part of parts) {
          if (!part.trim()) continue;
          for (const ev of processEvent(part, state)) {
            clientRes.write(ev + "\n\n");
          }
        }
      });

      upstreamRes.on("end", () => {
        if (buffer.trim()) {
          for (const ev of processEvent(buffer, state)) {
            clientRes.write(ev + "\n\n");
          }
        }

        if (
          upstreamRes.statusCode === 200 &&
          /\/chat\/completions/.test(clientReq.url)
        ) {
          clientRes.write("data: [DONE]\n\n");
        }
        clientRes.end();
      });

      upstreamRes.on("error", () => clientRes.end());
    },
  );

  upstreamReq.on("error", (err) => {
    clientRes.writeHead(502, { "content-type": "application/json" });
    clientRes.end(
      JSON.stringify({ error: { message: `Proxy error: ${err.message}` } }),
    );
  });

  clientRes.on("close", () => upstreamReq.destroy());

  clientReq.pipe(upstreamReq);
});

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(
    `Proxy aktif di http://${LISTEN_HOST}:${LISTEN_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}` +
      (SPLIT_USAGE ? " (SPLIT_USAGE aktif)" : ""),
  );
});
