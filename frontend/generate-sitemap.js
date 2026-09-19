import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/* ────────────────────────── CONFIG ────────────────────────── */
const API_URL =
    process.env.VITE_API || process.env.API_URL || "http://localhost:3000";

const SITE_URL = (
    process.env.SITE_URL || "https://www.schoolbook.lol"
).replace(/\/+$/, "");

const MAX_URLS_PER_SITEMAP = 5000;
const OUTPUT_DIR = path.resolve("./public");

/* ────────────────────────── XML HELPERS ────────────────────────── */
const xmlEscape = (s = "") =>
    String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const toDate = (v) => {
    if (!v) return new Date().toISOString().split("T")[0];
    const d = new Date(v);
    return isNaN(d.getTime())
        ? new Date().toISOString().split("T")[0]
        : d.toISOString().split("T")[0];
};

const toDateTimeISO = (v) => {
    if (!v) return new Date().toISOString();
    const d = new Date(v);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
};

const writeFile = (filename, content) => {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    fs.writeFileSync(path.join(OUTPUT_DIR, filename), content, "utf8");
    console.log(`   → ${filename} (${content.length} bytes)`);
};

/* ────────────────────────── FETCH HELPERS ────────────────────────── */
async function fetchPaginated(endpoint, extractList, { pageLimit = 100, maxPages = 100 } = {}) {
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
            console.error(`❌ Fetch failed: ${endpoint} (page ${page}):`, err.message);
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

/* ────────────────────────── PRODUCT ROUTES ────────────────────────── */
async function getProductRoutes() {
    const products = await fetchPaginated("/api/product", extractProducts);
    console.log(`📚 Products fetched: ${products.length}`);

    return products
        .map((p) => {
            const slug = p.handle || p._id;
            if (!slug) return null;

            const images = [];
            if (p.images?.[0]?.url) {
                images.push({
                    loc: p.images[0].url,
                    title: p.title || p.name || "",
                    caption: p.description || "",
                });
            }

            return {
                loc: `/products/${slug}`,
                lastmod: toDateTimeISO(p.updatedAt || p.createdAt),
                changefreq: "daily",
                priority: "0.8",
                images,
            };
        })
        .filter(Boolean);
}

/* ────────────────────────── CATEGORY (COLLECTION) ROUTES ────────────────────────── */
async function getCategoryRoutes() {
    const categories = await fetchPaginated("/api/categories", extractCategories);
    console.log(`🗂️  Categories fetched: ${categories.length}`);

    return categories
        .filter((c) => c.isActive !== false)
        .map((c) => ({
            loc: `/categories/${c.handle || c._id}`,
            lastmod: toDateTimeISO(c.updatedAt || c.createdAt),
            changefreq: "daily",
            priority: "0.8",
            images: [],
        }));
}

/* ────────────────────────── PAGE (STATIC) ROUTES ────────────────────────── */
const staticPages = [
    { loc: "/", changefreq: "daily", priority: "1.0" },
    { loc: "/categories", changefreq: "weekly", priority: "0.9" },
    { loc: "/reviews", changefreq: "weekly", priority: "0.8" },
    { loc: "/contact", changefreq: "monthly", priority: "0.5" },
    { loc: "/best-sellers", changefreq: "weekly", priority: "0.8" },
    { loc: "/new-arrivals", changefreq: "weekly", priority: "0.8" },
    { loc: "/offers", changefreq: "weekly", priority: "0.8" },
];

/* ────────────────────────── BLOG ROUTES (placeholder) ────────────────────────── */
async function getBlogRoutes() {
    // Replace this with a real API call if your backend exposes a blog endpoint,
    // e.g. `/api/blogs` or `/api/posts`
    const blogs = await fetchPaginated("/api/blogs", (data) => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.data)) return data.data;
        if (Array.isArray(data?.blogs)) return data.blogs;
        return [];
    }).catch(() => []);

    console.log(`📝 Blog posts fetched: ${blogs.length}`);

    return blogs.map((b) => ({
        loc: `/blogs/${b.handle || b._id}`,
        lastmod: toDateTimeISO(b.updatedAt || b.createdAt),
        changefreq: "weekly",
        priority: "0.6",
        images: b.featuredImage
            ? [{ loc: b.featuredImage, title: b.title || "", caption: b.excerpt || "" }]
            : [],
    }));
}

/* ────────────────────────── XML BUILDERS ────────────────────────── */
function buildUrlTag({ loc, lastmod, changefreq, priority, images = [] }) {
    const imageTags = images
        .filter((img) => img.loc)
        .map(
            (img) => `
    <image:image>
      <image:loc>${xmlEscape(img.loc)}</image:loc>
      ${img.title ? `<image:title>${xmlEscape(img.title)}</image:title>` : ""}
      ${img.caption ? `<image:caption>${xmlEscape(img.caption)}</image:caption>` : ""}
    </image:image>`
        )
        .join("");

    return `  <url>
    <loc>${xmlEscape(SITE_URL + loc)}</loc>
    <lastmod>${toDateTimeISO(lastmod)}</lastmod>
    <changefreq>${changefreq || "weekly"}</changefreq>
    <priority>${priority || "0.5"}</priority>${imageTags}
  </url>`;
}

function buildChildSitemap(entries, { includeImages = false } = {}) {
    const urlsetOpen = includeImages
        ? `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`
        : `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    return `<?xml version="1.0" encoding="UTF-8"?>
${urlsetOpen}
${entries.map(buildUrlTag).join("\n")}
</urlset>`;
}

function buildSitemapIndex(children) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Parent sitemap linking to product, page, collection and blog sitemaps. -->
${children
            .map(
                (child) => `  <sitemap>
    <loc>${xmlEscape(child.loc)}</loc>
    <lastmod>${toDateTimeISO(child.lastmod)}</lastmod>
  </sitemap>`
            )
            .join("\n")}
</sitemapindex>`;
}

/* ────────────────────────── GENERATE ────────────────────────── */
async function generateSitemap() {
    console.log("🚀 Generating Shopify-style sitemaps…");

    const [productRoutes, categoryRoutes, blogRoutes] = await Promise.all([
        getProductRoutes(),
        getCategoryRoutes(),
        getBlogRoutes(),
    ]);

    /* ---- chunk helper ---- */
    const chunk = (arr, size) =>
        Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
            arr.slice(i * size, i * size + size)
        );

    /* ---- write child sitemaps ---- */
    const children = [];

    // Products (split into multiple files if > 5000)
    const productChunks = chunk(productRoutes, MAX_URLS_PER_SITEMAP);
    productChunks.forEach((chunkItems, idx) => {
        const filename = `sitemap_products_${idx + 1}.xml`;
        writeFile(filename, buildChildSitemap(chunkItems, { includeImages: true }));
        children.push({
            loc: `${SITE_URL}/${filename}`,
            lastmod: new Date().toISOString(),
        });
    });

    // Pages
    writeFile(
        "sitemap_pages_1.xml",
        buildChildSitemap(staticPages, { includeImages: false })
    );
    children.push({
        loc: `${SITE_URL}/sitemap_pages_1.xml`,
        lastmod: new Date().toISOString(),
    });

    // Collections / Categories
    const categoryChunks = chunk(categoryRoutes, MAX_URLS_PER_SITEMAP);
    categoryChunks.forEach((chunkItems, idx) => {
        const filename = `sitemap_collections_${idx + 1}.xml`;
        writeFile(filename, buildChildSitemap(chunkItems, { includeImages: false }));
        children.push({
            loc: `${SITE_URL}/${filename}`,
            lastmod: new Date().toISOString(),
        });
    });

    // Blogs
    const blogChunks = chunk(blogRoutes, MAX_URLS_PER_SITEMAP);
    blogChunks.forEach((chunkItems, idx) => {
        const filename = `sitemap_blogs_${idx + 1}.xml`;
        writeFile(filename, buildChildSitemap(chunkItems, { includeImages: true }));
        children.push({
            loc: `${SITE_URL}/${filename}`,
            lastmod: new Date().toISOString(),
        });
    });

    /* ---- write sitemap index ---- */
    writeFile("sitemap.xml", buildSitemapIndex(children));

    console.log("\n✅ Sitemap generation complete");
    console.log(`   Products: ${productRoutes.length}`);
    console.log(`   Categories: ${categoryRoutes.length}`);
    console.log(`   Pages: ${staticPages.length}`);
    console.log(`   Blogs: ${blogRoutes.length}`);
    console.log(`   Child sitemaps: ${children.length}`);
    console.log(`   Output: ${OUTPUT_DIR}`);
}

generateSitemap().catch((err) => {
    console.error("❌ Sitemap generation failed:", err);
    process.exit(1);
});