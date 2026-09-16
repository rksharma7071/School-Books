import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const API_URL =
    process.env.VITE_API ||
    process.env.API_URL ||
    "http://localhost:5000";

const SITE_URL = (process.env.SITE_URL || "https://schoolbook.lol").replace(/\/+$/, "");

/* ---------------- STATIC ROUTES ---------------- */
// Only public, indexable pages. Exclude login, register, cart, checkout, profile.
const staticRoutes = [
    { path: "/", changefreq: "daily", priority: "1.0" },
    { path: "/categories", changefreq: "weekly", priority: "0.9" },
    { path: "/reviews", changefreq: "weekly", priority: "0.8" },
    { path: "/contact", changefreq: "monthly", priority: "0.5" },
    { path: "/best-sellers", changefreq: "weekly", priority: "0.8" },
    { path: "/new-arrivals", changefreq: "weekly", priority: "0.8" },
    { path: "/offers", changefreq: "weekly", priority: "0.8" },
];

const xmlEscape = (s = "") =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

/* ---------------- FETCH HELPERS ---------------- */
async function fetchPaginated(endpoint, extractList, { pageLimit = 100, maxPages = 50 } = {}) {
    const all = [];
    let page = 1;

    while (page <= maxPages) {
        try {
            const res = await axios.get(`${API_URL}${endpoint}`, {
                params: { page, limit: pageLimit },
                timeout: 15000,
            });

            const list = extractList(res.data);
            if (!Array.isArray(list) || list.length === 0) break;

            all.push(...list);

            const meta = res.data?.pagination ?? res.data?.meta ?? {};
            if (meta.hasNextPage === false) break;
            if (list.length < pageLimit) break;

            page++;
        } catch (err) {
            console.error(`❌ Fetch failed at ${endpoint} (page ${page}):`, err.message);
            break;
        }
    }

    return all;
}

const extractProducts = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.products)) return data.products;
    return [];
};

const extractCategories = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.categories)) return data.categories;
    return [];
};

/* ---------------- DYNAMIC ROUTES ---------------- */
async function getProductRoutes() {
    const products = await fetchPaginated("/api/product", extractProducts);
    console.log(`📚 Products fetched: ${products.length}`);

    return products
        .map((p) => {
            // Prefer handle — matches frontend routes
            const slug = p.handle || p._id;
            if (!slug) return null;
            return {
                path: `/products/${slug}`,
                lastmod: p.updatedAt || p.createdAt,
                changefreq: "weekly",
                priority: "0.7",
            };
        })
        .filter(Boolean);
}

async function getCategoryRoutes() {
    const categories = await fetchPaginated("/api/categories", extractCategories);
    console.log(`🗂️  Categories fetched: ${categories.length}`);

    return categories
        .filter((c) => c.isActive !== false)
        .map((c) => ({
            path: `/categories/${c.handle || c._id}`,
            lastmod: c.updatedAt || c.createdAt,
            changefreq: "weekly",
            priority: "0.8",
        }));
}

/* ---------------- BUILD SITEMAP ---------------- */
function renderUrl({ path: p, lastmod, changefreq = "weekly", priority = "0.7" }) {
    const loc = `${SITE_URL}${p}`;
    const lm = lastmod
        ? new Date(lastmod).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];

    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lm}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

async function generateSitemap() {
    const [productRoutes, categoryRoutes] = await Promise.all([
        getProductRoutes(),
        getCategoryRoutes(),
    ]);

    const allRoutes = [
        ...staticRoutes,
        ...categoryRoutes,
        ...productRoutes,
    ];

    const today = new Date().toISOString().split("T")[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allRoutes.map(renderUrl).join("\n")}
</urlset>
`;

    const outDir = path.resolve("./public");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outFile = path.join(outDir, "sitemap.xml");
    fs.writeFileSync(outFile, xml, "utf8");

    console.log(`✅ Sitemap written to ${outFile}`);
    console.log(`   Total URLs: ${allRoutes.length}`);
    console.log(`   Static: ${staticRoutes.length}`);
    console.log(`   Categories: ${categoryRoutes.length}`);
    console.log(`   Products: ${productRoutes.length}`);
    console.log(`   Generated: ${today}`);
}

generateSitemap().catch((err) => {
    console.error("❌ Sitemap generation failed:", err);
    process.exit(1);
});