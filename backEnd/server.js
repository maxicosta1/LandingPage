const http = require("http");
const fsSync = require("fs");
const fs = require("fs/promises");
const net = require("net");
const path = require("path");
const querystring = require("querystring");
const tls = require("tls");

const loadEnvFile = () => {
  const envPath = path.resolve(__dirname, "..", ".env");

  if (!fsSync.existsSync(envPath)) {
    return;
  }

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const ROOT_DIR = path.resolve(__dirname, "..");
const MAX_BODY_SIZE = 1024 * 1024;
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://scodedigital.com",
  "https://www.scodedigital.com"
];

const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sendJson = (response, statusCode, payload, origin = "") => {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }

  response.writeHead(statusCode, headers);
  response.end(JSON.stringify(payload));
};

const getCorsOrigin = (request) => {
  const origin = request.headers.origin;

  if (!origin) {
    return "";
  }

  return allowedOrigins.includes(origin) ? origin : null;
};

const handleOptions = (request, response) => {
  const corsOrigin = getCorsOrigin(request);

  if (corsOrigin === null) {
    sendJson(response, 403, {
      success: false,
      message: "Origen no permitido."
    });
    return;
  }

  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400"
  };

  if (corsOrigin) {
    headers["Access-Control-Allow-Origin"] = corsOrigin;
    headers["Vary"] = "Origin";
  }

  response.writeHead(204, headers);
  response.end();
};

const readRequestBody = async (request) => {
  let size = 0;
  const chunks = [];

  for await (const chunk of request) {
    size += chunk.length;

    if (size > MAX_BODY_SIZE) {
      throw Object.assign(new Error("La consulta es demasiado grande."), {
        statusCode: 413
      });
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString("utf8");
};

const parseBody = async (request) => {
  const rawBody = await readRequestBody(request);
  const contentType = request.headers["content-type"] || "";

  if (!rawBody.trim()) {
    return {};
  }

  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(rawBody);
    } catch (error) {
      throw Object.assign(new Error("El JSON enviado no es válido."), {
        statusCode: 400
      });
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return querystring.parse(rawBody);
  }

  throw Object.assign(new Error("Content-Type no soportado."), {
    statusCode: 415
  });
};

const sanitizeValue = (value) => String(value || "").replace(/\s+/g, " ").trim();

const validateContactPayload = (payload) => {
  const data = {
    nombre: sanitizeValue(payload.nombre),
    email: sanitizeValue(payload.email).toLowerCase(),
    telefono: sanitizeValue(payload.telefono),
    horario: sanitizeValue(payload.horario),
    mensaje: String(payload.mensaje || "").trim()
  };

  const errors = {};

  if (data.nombre.length < 2) {
    errors.nombre = "Ingresá un nombre válido.";
  }

  if (!emailPattern.test(data.email)) {
    errors.email = "Ingresá un email válido.";
  }

  if (data.telefono.length < 6) {
    errors.telefono = "Ingresá un teléfono válido.";
  }

  if (data.mensaje.length < 10) {
    errors.mensaje = "El mensaje debe tener al menos 10 caracteres.";
  }

  return {
    data,
    errors
  };
};

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw Object.assign(new Error(`Falta configurar ${name}.`), {
      statusCode: 500
    });
  }

  return value;
};

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#039;");

const buildEmail = (data) => {
  const submittedAt = new Date().toLocaleString("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  });

  const subject = `Nueva consulta web de ${data.nombre}`;
  const text = [
    "Nueva consulta desde scodedigital.com",
    "",
    `Nombre: ${data.nombre}`,
    `Email: ${data.email}`,
    `Teléfono: ${data.telefono}`,
    `Disponibilidad: ${data.horario || "No indicada"}`,
    "",
    "Mensaje:",
    data.mensaje,
    "",
    `Recibido: ${submittedAt}`
  ].join("\n");

  const html = `
    <h2>Nueva consulta desde scodedigital.com</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(data.nombre)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(data.telefono)}</p>
    <p><strong>Disponibilidad:</strong> ${escapeHtml(data.horario || "No indicada")}</p>
    <p><strong>Mensaje:</strong></p>
    <p>${escapeHtml(data.mensaje).replace(/\n/g, "<br>")}</p>
    <hr>
    <p><small>Recibido: ${escapeHtml(submittedAt)}</small></p>
  `;

  return {
    subject,
    text,
    html
  };
};

const extractEmailAddress = (value) => {
  const match = String(value || "").match(/<([^>]+)>/);
  return (match ? match[1] : value || "").trim();
};

const encodeHeader = (value) => {
  const text = String(value || "");

  if (/^[\x00-\x7F]*$/.test(text)) {
    return text;
  }

  return `=?UTF-8?B?${Buffer.from(text, "utf8").toString("base64")}?=`;
};

const createSmtpClient = (socket) => {
  let buffer = "";
  const lines = [];
  const waiters = [];

  const flush = () => {
    while (lines.length > 0 && waiters.length > 0) {
      const waiter = waiters.shift();
      waiter(lines.shift());
    }
  };

  socket.on("data", chunk => {
    buffer += chunk.toString("utf8");

    let lineEnd = buffer.indexOf("\n");
    while (lineEnd !== -1) {
      const line = buffer.slice(0, lineEnd).replace(/\r$/, "");
      lines.push(line);
      buffer = buffer.slice(lineEnd + 1);
      lineEnd = buffer.indexOf("\n");
    }

    flush();
  });

  socket.on("error", error => {
    while (waiters.length > 0) {
      const waiter = waiters.shift();
      waiter(Promise.reject(error));
    }
  });

  const readLine = async () => {
    if (lines.length > 0) {
      return lines.shift();
    }

    return new Promise((resolve, reject) => {
      waiters.push(value => {
        if (value instanceof Promise) {
          value.catch(reject);
          return;
        }

        resolve(value);
      });
    });
  };

  const readResponse = async () => {
    const firstLine = await readLine();
    const code = firstLine.slice(0, 3);
    const responseLines = [firstLine];

    while (firstLine.startsWith(`${code}-`) || responseLines[responseLines.length - 1].startsWith(`${code}-`)) {
      const line = await readLine();
      responseLines.push(line);

      if (!line.startsWith(`${code}-`)) {
        break;
      }
    }

    return {
      code: Number(code),
      lines: responseLines,
      message: responseLines.join("\n")
    };
  };

  const write = (command) => {
    socket.write(`${command}\r\n`);
  };

  const expect = async (command, expectedCodes) => {
    if (command) {
      write(command);
    }

    const response = await readResponse();

    if (!expectedCodes.includes(response.code)) {
      throw new Error(`SMTP error after ${command || "connect"}: ${response.message}`);
    }

    return response;
  };

  return {
    socket,
    readResponse,
    expect,
    write
  };
};

const connectSmtpSocket = ({ host, port, secure }) => new Promise((resolve, reject) => {
  const connectOptions = {
    host,
    port,
    servername: host
  };

  const socket = secure
    ? tls.connect(connectOptions, () => resolve(socket))
    : net.connect(connectOptions, () => resolve(socket));

  socket.setTimeout(20000);
  socket.once("error", reject);
  socket.once("timeout", () => {
    socket.destroy();
    reject(new Error("Timeout al conectar con el servidor SMTP."));
  });
});

const upgradeToTls = (socket, host) => new Promise((resolve, reject) => {
  const secureSocket = tls.connect({
    socket,
    servername: host,
    rejectUnauthorized: String(process.env.SMTP_REJECT_UNAUTHORIZED || "true").toLowerCase() !== "false"
  }, () => resolve(secureSocket));

  secureSocket.once("error", reject);
});

const buildMimeMessage = ({ from, to, replyTo, subject, text, html }) => {
  const boundary = `scode-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return [
    `From: ${from}`,
    `To: ${to}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    "",
    `--${boundary}--`,
    ""
  ].join("\r\n");
};

const sendSmtpMail = async ({ from, to, replyTo, subject, text, html }) => {
  const host = getRequiredEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT || 587);
  const user = getRequiredEnv("SMTP_USER");
  const pass = getRequiredEnv("SMTP_PASS");
  const secure = String(process.env.SMTP_SECURE || "false").toLowerCase() === "true";
  const recipientList = to.split(",").map(extractEmailAddress).filter(Boolean);
  const envelopeFrom = extractEmailAddress(process.env.SMTP_ENVELOPE_FROM || from || user);
  let client;

  if (recipientList.length === 0) {
    throw new Error("Falta configurar MAIL_TO con al menos un destinatario.");
  }

  let socket = await connectSmtpSocket({
    host,
    port,
    secure
  });

  try {
    client = createSmtpClient(socket);
    await client.expect("", [220]);
    await client.expect(`EHLO ${process.env.SMTP_HELO || "scodedigital.com"}`, [250]);

    if (!secure && String(process.env.SMTP_STARTTLS || "true").toLowerCase() !== "false") {
      await client.expect("STARTTLS", [220]);
      socket = await upgradeToTls(socket, host);
      client = createSmtpClient(socket);
      await client.expect(`EHLO ${process.env.SMTP_HELO || "scodedigital.com"}`, [250]);
    }

    const authPayload = Buffer.from(`\u0000${user}\u0000${pass}`, "utf8").toString("base64");
    await client.expect(`AUTH PLAIN ${authPayload}`, [235]);
    await client.expect(`MAIL FROM:<${envelopeFrom}>`, [250]);

    for (const recipient of recipientList) {
      await client.expect(`RCPT TO:<${recipient}>`, [250, 251]);
    }

    await client.expect("DATA", [354]);

    const message = buildMimeMessage({
      from,
      to,
      replyTo,
      subject,
      text,
      html
    }).replace(/^\./gm, "..");

    client.write(`${message}\r\n.`);
    const dataResponse = await client.readResponse();

    if (![250].includes(dataResponse.code)) {
      throw new Error(`SMTP error after DATA: ${dataResponse.message}`);
    }

    client.write("QUIT");

    return {
      messageId: dataResponse.message,
      accepted: recipientList,
      rejected: []
    };
  } finally {
    if (socket) {
      socket.end();
    }
  }
};

const handleContactRequest = async (request, response) => {
  const corsOrigin = getCorsOrigin(request);

  if (corsOrigin === null) {
    sendJson(response, 403, {
      success: false,
      message: "Origen no permitido."
    });
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, {
      success: false,
      message: "Método no permitido."
    }, corsOrigin);
    return;
  }

  try {
    const payload = await parseBody(request);
    const { data, errors } = validateContactPayload(payload);

    if (Object.keys(errors).length > 0) {
      console.warn("[contact] Validation failed:", errors);
      sendJson(response, 400, {
        success: false,
        message: "Revisá los datos enviados.",
        errors
      }, corsOrigin);
      return;
    }

    const mailTo = process.env.MAIL_TO || "contact@scodedigital.com";
    const mailFrom = process.env.MAIL_FROM || process.env.SMTP_USER;
    const email = buildEmail(data);

    console.info("[contact] Sending email:", {
      from: mailFrom,
      to: mailTo,
      replyTo: data.email,
      email: data.email,
      nombre: data.nombre
    });

    const info = await sendSmtpMail({
      from: mailFrom,
      to: mailTo,
      replyTo: data.email,
      subject: email.subject,
      text: email.text,
      html: email.html
    });

    console.info("[contact] Email sent:", {
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    });

    sendJson(response, 200, {
      success: true,
      message: "Consulta enviada correctamente. Te vamos a responder a la brevedad."
    }, corsOrigin);
  } catch (error) {
    const statusCode = error.statusCode || 500;

    console.error("[contact] Request failed:", {
      statusCode,
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });

    sendJson(response, statusCode, {
      success: false,
      message: statusCode >= 500
        ? "No pudimos enviar la consulta en este momento."
        : error.message
    }, corsOrigin || "");
  }
};

const getStaticFilePath = (urlPath) => {
  const cleanPath = decodeURIComponent(urlPath.split("?")[0]);

  if (cleanPath === "/" || cleanPath === "") {
    return path.join(ROOT_DIR, "index.html");
  }

  if (cleanPath === "/contacto/" || cleanPath === "/contacto") {
    return path.join(ROOT_DIR, "contacto", "index.html");
  }

  if (cleanPath === "/faq/" || cleanPath === "/faq") {
    return path.join(ROOT_DIR, "faq", "index.html");
  }

  const normalized = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, "");
  return path.join(ROOT_DIR, normalized);
};

const serveStaticFile = async (request, response) => {
  const urlPath = request.url.split("?")[0];

  if (urlPath.endsWith("/index.html")) {
    response.writeHead(301, {
      Location: urlPath.replace(/index\.html$/, "")
    });
    response.end();
    return;
  }

  if (urlPath === "/contacto.html") {
    response.writeHead(301, {
      Location: "/contacto/"
    });
    response.end();
    return;
  }

  if (urlPath === "/faq.html") {
    response.writeHead(301, {
      Location: "/faq/"
    });
    response.end();
    return;
  }

  const filePath = getStaticFilePath(request.url);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(ROOT_DIR)) {
    response.writeHead(403, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Forbidden");
    return;
  }

  try {
    const content = await fs.readFile(resolvedPath);
    const ext = path.extname(resolvedPath).toLowerCase();

    response.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });
    response.end(content);
  } catch (error) {
    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8"
    });
    response.end("Not found");
  }
};

const server = http.createServer(async (request, response) => {
  if (request.url.startsWith("/api/contact")) {
    if (request.method === "OPTIONS") {
      handleOptions(request, response);
      return;
    }

    await handleContactRequest(request, response);
    return;
  }

  await serveStaticFile(request, response);
});

server.listen(PORT, () => {
  console.info(`[server] sCode landing page listening on http://localhost:${PORT}`);
});
