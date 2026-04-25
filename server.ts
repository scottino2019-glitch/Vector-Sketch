import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Endpoint to get Firebase config (obfuscated from source code)
  app.get("/api/config", (req, res) => {
    const getVal = (key: string) => process.env[key] || process.env[`VITE_${key}`];

    const config = {
      projectId: getVal("FIREBASE_PROJECT_ID"),
      appId: getVal("FIREBASE_APP_ID"),
      apiKey: getVal("FIREBASE_API_KEY"),
      authDomain: getVal("FIREBASE_AUTH_DOMAIN"),
      firestoreDatabaseId: getVal("FIREBASE_FIRESTORE_DATABASE_ID"),
      storageBucket: getVal("FIREBASE_STORAGE_BUCKET"),
      messagingSenderId: getVal("FIREBASE_MESSAGING_SENDER_ID"),
    };

    console.log("Firebase Config Request:", {
      hasProjectId: !!config.projectId,
      hasAppId: !!config.appId,
      hasApiKey: !!config.apiKey,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("FIREBASE")),
    });
    
    res.json(config);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
