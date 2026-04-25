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
    const keys = [
      "FIREBASE_PROJECT_ID",
      "FIREBASE_APP_ID",
      "FIREBASE_API_KEY",
      "FIREBASE_AUTH_DOMAIN",
      "FIREBASE_FIRESTORE_DATABASE_ID",
      "FIREBASE_STORAGE_BUCKET",
      "FIREBASE_MESSAGING_SENDER_ID"
    ];

    const config: any = {};
    keys.forEach(key => {
      config[key.replace("FIREBASE_", "").toLowerCase().replace(/_([a-z])/g, (g) => g[1].toUpperCase())] = 
        process.env[key] || process.env[`VITE_${key}`];
    });

    // Special mapping for field names if they don't match exactly
    const mappedConfig = {
      projectId: config.projectId || process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
      appId: config.appId || process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
      apiKey: config.apiKey || process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
      authDomain: config.authDomain || process.env.FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN,
      firestoreDatabaseId: config.firestoreDatabaseId || process.env.FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
      storageBucket: config.storageBucket || process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: config.messagingSenderId || process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    };

    console.log("Firebase Config Request Debug:", {
      providedKeys: Object.keys(mappedConfig).filter(k => (mappedConfig as any)[k]),
      allEnvKeys: Object.keys(process.env).filter(k => k.includes("FIREBASE")),
    });
    
    res.json(mappedConfig);
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
