import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

// ✅ Load .env
dotenv.config();

// ✅ Use env variable
const API_URL = process.env.VITE_API;
const SITE_URL = "https://schoolbook.lol";

console.log("API_URL: ", API_URL);

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
        const response = await axios.get(`http://localhost:3000/api/book`);

        // ✅ Validate response
        if (!response.data?.success || !Array.isArray(response.data.data)) {
            console.error("Invalid API response structure");
            return [];
        }

        const books = response.data.data;

        return books.map((book) => `/products/${book._id}`);
    } catch (error) {
        console.error("❌ Failed to fetch books for sitemap:", error.message);
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

    fs.writeFileSync("./public/sitemap.xml", xml);
    console.log("✅ Sitemap generated successfully");
}

generateSitemap();
