import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL = process.env.VITE_API;
const SITE_URL = "https://schoolbook.lol";

/* ---------------- STATIC ROUTES ---------------- */
const staticRoutes = [
    "/",
    "/contact",
    "/login",
    "/register",
    "/reset-password",
];

/* ---------------- DYNAMIC ROUTES ---------------- */
async function getDynamicRoutes() {
    try {
        const response = await axios.get(`${API_URL}/api/book`);

        if (!response.data?.success || !Array.isArray(response.data.data)) {
            return [];
        }

        return response.data.data.map((book) => `/products/${book._id}`);
    } catch (err) {
        console.error("❌ Book fetch failed:", err.message);
        return [];
    }
}

/* ---------------- BUILD SITEMAP ---------------- */
async function generateSitemap() {
    const dynamicRoutes = await getDynamicRoutes();
    const allRoutes = [...staticRoutes, ...dynamicRoutes];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes
    .map(
        (route) => `
  <url>
    <loc>${SITE_URL}${route}</loc>
    <changefreq>weekly</changefreq>
    <priority>${route === "/" ? "1.0" : "0.8"}</priority>
  </url>`
    )
    .join("")}
</urlset>`;

    fs.writeFileSync("./public/sitemap.xml", xml.trim());
    console.log("✅ Sitemap generated successfully");
}

generateSitemap();
