import slugify from "slugify";

const generateHandle = (text) => {
    return slugify(text, {
        lower: true,
        strict: true,
        trim: true,
        replacement: '-'
    });
};

export {
    generateHandle
}