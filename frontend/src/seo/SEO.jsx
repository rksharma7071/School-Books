import { useEffect } from "react";

const setMeta = (name, content) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
};

const setPropertyMeta = (property, content) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", property);
        document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
};

const setCanonical = (canonical) => {
    let link = document.querySelector("link[rel='canonical']");
    if (!link) {
        link = document.createElement("link");
        link.setAttribute("rel", "canonical");
        document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
};

const setJsonLd = (schema) => {
    const SCRIPT_ID = "json-ld-schema";

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
        script = document.createElement("script");
        script.type = "application/ld+json";
        script.id = SCRIPT_ID;
        document.head.appendChild(script);
    }

    script.textContent = JSON.stringify(schema);
};

export const useSEO = ({ title, description, canonical, ogTitle, jsonLd }) => {
    useEffect(() => {
        if (title) document.title = title;
        if (description) setMeta("description", description);
        if (ogTitle) setPropertyMeta("og:title", ogTitle);
        if (canonical) setCanonical(canonical);
        if (jsonLd) setJsonLd(jsonLd);
    }, [title, description, canonical, ogTitle, jsonLd]);
};
