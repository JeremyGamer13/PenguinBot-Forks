// DISCLOSURE: ai written pretty much
const { JSDOM } = require('jsdom');
const htmlCharacterReferenceNames = require("../resources/html-character-reference-names.json");

const fixReferenceNames = (svgString) => {
    // Regex matches an ampersand followed by alphanumeric characters, 
    // ending with a semicolon.
    const entityRegex = /&([a-zA-Z0-9#]+);/g;

    // The whitelist of standard XML/HTML entities
    const whitelist = new Set(['amp', 'lt', 'gt', 'apos', 'quot']);

    return svgString.replace(entityRegex, (match, entityName) => {
        // If it's in the whitelist, keep the original match
        if (whitelist.has(entityName.toLowerCase())) {
            return match;
        }

        // Otherwise, treat it as a literal string (or remove it/log it)
        // Here we escape the & to prevent it from being parsed as an entity
        const object = htmlCharacterReferenceNames[`&${entityName.toLowerCase()}`];
        if (!object) return "";
        return object.characters || "";
    });
};

/**
 * A loose SVG repair that fixes through JSDOM
 * Intended to repair:
 * 
 * - cases where the svg starts with non-svg text (ie, "Here is your svg:")
 * - cases where the svg starts with non-svg text AND that text contains HTML/SVG tags (ie, "Here is your svg using `<image>` elements:")
 * - cases where the svg is encased in a code-block (ie, "```svg <svg>...")
 * - cases where the svg starts with non <svg> (ie, "```svg <rect>...")
 * - Malformed SVG in general
 * 
 * @param {string} text the svg to fix
 * @returns {string} the svg
 */
const repairSvg = (rawSvgString) => {
    let trimmed = `${rawSvgString}`.trim();
    // If a markdown comment was included, it likely marks the start of the SVG
    // We should still trim it out, but this helps prevent cases where the AI mentions tags before the svg actually starts
    const codeBlockStart = trimmed.search(/```\s*\w+?\s*/i);
    if (codeBlockStart !== -1) {
        trimmed = trimmed.slice(codeBlockStart);

        // Remove common Markdown code block prefixes like ```json or ````
        trimmed = trimmed.replace(/^```\s*\w+?\s*/i, "");
        trimmed = trimmed.trim();
        trimmed = trimmed.replace(/^```/i, "");
    }

    let clean = trimmed.replace(/[^\x00-\x7F]/g, "");
    // Find the first opening symbol that likely starts the SVG payload
    const svgStart = clean.search(/[<]/);
    if (svgStart !== -1) {
        clean = clean.slice(svgStart);
    }

    // NOTE: MAKE THE DOM WITH HTML BECAUSE LENIENT PARSER
    const dom = new JSDOM(clean, { contentType: "text/html" });
    const doc = dom.window.document;

    // Remove comments that are invalid -- Create a TreeWalker to find only Comment nodes
    const walker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_COMMENT, null);
    // Iterate through all found comments and update their content
    let currentNode;
    while (currentNode = walker.nextNode()) {
        currentNode.textContent = `${currentNode.textContent}`.replace(/[^a-z0-9_\s\.*]/gi, "");
    }

    // Remove invalid entities (anything that is not &amp;, &lt;, &gt;, &apos;, and &quot;)
    // Iterate through all text nodes using TreeWalker
    const walker2 = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT, null);
    while (currentNode = walker.nextNode()) {
        // If you need to ensure ALL named entities are converted to their 
        // literal characters, JSDOM's .textContent property is already your best friend.
        // It provides the "raw" character value.
        currentNode.textContent = currentNode.textContent.replace(/\u00A0/g, ' ');
        // Add other replacements here if your SVG library is sensitive to specific characters
    }

    // From here on, we setup a panic return incase we do something that causes an error (because these tasks may NOT be important)
    const panicReturn = () => {
        const svg = doc.querySelector('svg');
        if (svg) return fixReferenceNames(svg.outerHTML);
        const img = doc.querySelector('image');
        if (img) return fixReferenceNames(img.outerHTML);
        const root = doc.body.firstElementChild || doc.firstElementChild;
        return fixReferenceNames(root ? root.outerHTML : "");
    };

    try {
        let svgElement = doc.querySelector('svg');

        // 1. Wrap or Convert if not <svg>
        if (!svgElement) {
            const first = doc.body.firstElementChild;
            if (first) {
                // If it's already an SVG, just grab it, otherwise wrap in new SVG
                if (first.tagName.toLowerCase() === 'svg') {
                    svgElement = first;
                } else {
                    svgElement = doc.createElement('svg');
                    // Move existing content into the new SVG instead of double-nesting
                    while (doc.body.firstChild) {
                        svgElement.appendChild(doc.body.firstChild);
                    }
                    doc.body.appendChild(svgElement);
                }
            } else {
                return panicReturn();
            }
        }

        // 2. Ensure xmlns
        svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // 3. Ensure viewBox, as well as clamp width & height
        let width = Number((svgElement.getAttribute('width') || '100').replace(/px/gi, '')) || 100;
        let height = Number((svgElement.getAttribute('height') || '100').replace(/px/gi, '')) || 100;
        width = Math.min(Math.max(0, width), 8192);
        height = Math.min(Math.max(0, height), 8192);
        if (!svgElement.hasAttribute('viewBox')) {
            svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
        }

        // 4. ensure the viewbox isnt too huge
        const parts = svgElement.getAttribute("viewBox")
            .trim()
            .split(/[\s,]+/)
            .map(unit => Number(unit || "0"))
            .map(num => (isNaN(num) || !isFinite(num)) ? 0 : num);
        if (parts.length > 4) parts.splice(4, Infinity);
        while (parts.length < 2) parts.push(0);
        if (parts.length === 2) parts.push(width);
        if (parts.length === 3) parts.push(height);
        parts[2] = Math.min(Math.max(0, parts[2]), 8192);
        parts[3] = Math.min(Math.max(0, parts[3]), 8192);
        svgElement.setAttribute('viewBox', parts.join(' '));

        // 5. Add background rect if requested
        const bgColor = svgElement.style?.background || svgElement.style.backgroundColor;
        if (bgColor) {
            const rect = doc.createElement('rect');
            rect.setAttribute('width', '100%');
            rect.setAttribute('height', '100%');
            rect.setAttribute('fill', bgColor);
            // Insert as the first element so it renders behind everything else
            svgElement.insertBefore(rect, svgElement.firstChild);
        }

        return fixReferenceNames(svgElement.outerHTML);
    } catch (err) {
        return panicReturn();
    }
};

module.exports = repairSvg;
