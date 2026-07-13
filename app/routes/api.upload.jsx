import { authenticate } from "../shopify.server";
import { uploadImageToShopify } from "../shopify.server.helpers";
import path from "path";
import fs from "fs";

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);

  if (!admin) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string") {
      return new Response(JSON.stringify({ error: "No file uploaded" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filename = file.name;
    const type = file.type;
    const size = file.size;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Try uploading to Shopify Files first
    try {
      const cdnUrl = await uploadImageToShopify(admin, filename, size, type, buffer);
      if (cdnUrl) {
        return new Response(JSON.stringify({ url: cdnUrl }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (shopifyError) {
      console.warn("Shopify CDN upload failed, falling back to local storage:", shopifyError);
    }

    // Fallback: Save locally to public/uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const ext = path.extname(filename);
    const cleanName = path.basename(filename, ext).replace(/[^a-zA-Z0-9]/g, "_");
    const uniqueFilename = `${Date.now()}_${cleanName}${ext}`;
    const filePath = path.join(uploadDir, uniqueFilename);
    
    fs.writeFileSync(filePath, buffer);

    const appUrl = (process.env.SHOPIFY_APP_URL || "").replace(/\/$/, "");
    const localUrl = `${appUrl}/uploads/${uniqueFilename}`;
    return new Response(JSON.stringify({ url: localUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unified upload endpoint error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
