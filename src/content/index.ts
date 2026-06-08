
import { optimizeMediaUrl } from "../common/optimization";
import "./selection.css";

console.log("OrigiSave Content Script Loaded");

// --- SELECTION MODE STATE (OMITTED) ---

// --- DISCORD NATIVE MENU STATE ---
let lastRightClickUrl: string | null = null;

// --- UTILS ---
function getMediaUrlFromElement(element: HTMLElement | null): string | null {
    if (!element) return null;

    // Direct Image/Video
    if (element.tagName === "IMG") return (element as HTMLImageElement).src;
    if (element.tagName === "VIDEO") return (element as HTMLVideoElement).src;
    if (element.tagName === "SOURCE") return (element as HTMLSourceElement).src;

    // Discord specfic: a[href] (often wraps images in chat)
    if (element.tagName === "A") {
        const href = (element as HTMLAnchorElement).href;
        if (href.match(/\.(png|jpg|jpeg|webp|gif|mp4|mov|webm)(\?|$)/i)) {
            return href;
        }
    }

    // CSS BackgroundImage (Discord often uses this for specialized image views)
    const bg = window.getComputedStyle(element).backgroundImage;
    if (bg && bg.startsWith("url(")) {
        return bg.slice(5, -2); // Remove url("...")
    }

    return null;
}

// Traverse up to find a link if the click was on an inner element (like an img inside an a)
function findLinkAncestor(element: HTMLElement | null): HTMLAnchorElement | null {
    let current = element;
    while (current && current !== document.body) {
        if (current.tagName === "A") return current as HTMLAnchorElement;
        current = current.parentElement;
    }
    return null;
}

// --- DISCORD NATIVE MENU INJECTION (Rewritten from scratch) ---
function injectTwidisButton(menu: HTMLElement) {
    console.log("[OrigiSave] injectTwidisButton called, lastRightClickUrl:", lastRightClickUrl);

    // Already injected check
    if (menu.querySelector("#twidis-discord-btn")) {
        console.log("[Twidis] Button already exists, skipping");
        return;
    }

    // No media URL check
    if (!lastRightClickUrl) {
        console.log("[OrigiSave] No media URL detected, skipping");
        return;
    }

    // Find the menu scroller/container
    const scroller = menu.querySelector('[class*="scroller"]') as HTMLElement;
    const container = scroller || menu;
    console.log("[Twidis] Container found:", container.className);

    // Get all menu items
    const menuItems = Array.from(container.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    console.log("[Twidis] Found menu items:", menuItems.length);

    if (menuItems.length === 0) {
        console.log("[Twidis] No menu items found, skipping");
        return;
    }

    // Find anchor: "Copy Message Link" (appears on ALL messages)
    // Fallback: any menuitem that's not dangerous
    let anchorItem: HTMLElement | null = null;
    let referenceItem: HTMLElement | null = null;

    for (const item of menuItems) {
        const text = item.textContent || "";
        const isDanger = item.className.includes("colorDanger") ||
            text.includes("通報") || text.includes("Report") ||
            text.includes("削除") || text.includes("Delete");

        // Find anchor (Copy Message Link)
        if (text.includes("メッセージリンクをコピー") || text.includes("Copy Message Link")) {
            anchorItem = item;
            console.log("[Twidis] Found anchor: Copy Message Link");
        }

        // Find a safe reference item for styling
        if (!referenceItem && !isDanger) {
            referenceItem = item;
        }
    }

    // If no anchor, try "Copy Text" or "Copy Link"
    if (!anchorItem) {
        for (const item of menuItems) {
            const text = item.textContent || "";
            if (text.includes("テキストをコピー") || text.includes("Copy Text") ||
                text.includes("リンクをコピー") || text.includes("Copy Link")) {
                anchorItem = item;
                console.log("[Twidis] Found fallback anchor:", text.trim());
                break;
            }
        }
    }

    // If still no anchor, use first safe item
    if (!anchorItem && referenceItem) {
        anchorItem = referenceItem;
        console.log("[OrigiSave] Using first safe item as anchor");
    }

    if (!anchorItem) {
        console.log("[Twidis] No anchor found, cannot inject");
        return;
    }

    // --- CREATE THE BUTTON BY CLONING ---
    const menuItem = anchorItem.cloneNode(true) as HTMLElement;
    menuItem.id = "twidis-discord-btn";

    // Remove any existing event listeners by re-creating inner content
    const isVideo = lastRightClickUrl.match(/\.(mp4|mov|webm|avi)/i);
    const labelText = isVideo ? "動画を保存 (OrigiSave)" : "画像を保存 (OrigiSave)";

    // Find and update the label
    const labelEl = menuItem.querySelector('[class*="label"]') as HTMLElement;
    if (labelEl) {
        labelEl.textContent = labelText;
    } else {
        // Fallback: just set text content of first text-containing child
        const textNodes = menuItem.querySelectorAll('div');
        for (const node of textNodes) {
            if (node.children.length === 0 && node.textContent?.trim()) {
                node.textContent = labelText;
                break;
            }
        }
    }

    // Update/replace the icon with download icon
    const iconContainer = menuItem.querySelector('[class*="iconContainer"], [class*="icon"]') as HTMLElement;
    if (iconContainer) {
        iconContainer.textContent = ''; // clear any existing content
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "18");
        svg.setAttribute("height", "18");
        svg.setAttribute("viewBox", "0 0 24 24");
        svg.setAttribute("fill", "currentColor");

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("fill-rule", "evenodd");
        path.setAttribute("d", "M12 2.25a.75.75 0 0 1 .75.75v11.69l3.22-3.22a.75.75 0 1 1 1.06 1.06l-4.5 4.5a.75.75 0 0 1-1.06 0l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.22 3.22V3a.75.75 0 0 1 .75-.75Zm-9 13.5a.75.75 0 0 1 .75.75v2.25a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5V16.5a.75.75 0 0 1 1.5 0v2.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V16.5a.75.75 0 0 1 .75-.75Z");
        path.setAttribute("clip-rule", "evenodd");

        svg.appendChild(path);
        iconContainer.appendChild(svg);
    }

    // Remove danger styling if any
    menuItem.classList.remove("colorDanger");

    // Click handler
    menuItem.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("[Twidis] Download clicked:", lastRightClickUrl);

        if (lastRightClickUrl) {
            const optimized = optimizeMediaUrl(lastRightClickUrl);
            chrome.runtime.sendMessage({
                type: "DOWNLOAD_MEDIA",
                url: optimized.url,
                meta: {
                    site: "discord",
                    original_name: optimized.originalName || "discord_file"
                }
            });
        }
        // Close the menu
        document.body.click();
    };

    // Insert after the anchor
    anchorItem.insertAdjacentElement('afterend', menuItem);
    console.log("[OrigiSave] Button injected successfully after:", anchorItem.textContent?.trim());
}

// --- LISTENERS ---

// 1. Track Right Click Target
document.addEventListener("contextmenu", (e) => {
    const target = e.target as HTMLElement;
    let url = getMediaUrlFromElement(target);
    if (!url) {
        const link = findLinkAncestor(target);
        if (link) url = getMediaUrlFromElement(link);
    }
    lastRightClickUrl = url;
    if (url) {
        chrome.runtime.sendMessage({ type: "SET_LAST_RIGHT_CLICK_TARGET", url });
    }
}, true);

// 2. Observe for Menu Creation (Specific to Discord)
if (window.location.hostname.includes("discord")) {
    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length) {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        const menu = node.getAttribute("role") === "menu" ? node : node.querySelector('[role="menu"]');
                        if (menu) {
                            if (lastRightClickUrl) {
                                injectTwidisButton(menu as HTMLElement);
                            }
                        }
                    }
                });
            }
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}

// 3. Listen for Messages from MAIN world (x-main.ts)
window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    if (event.origin !== window.location.origin) return;
    if (event.data?.type === "ORIGISAVE_FW_DOWNLOAD") {
        console.log("[OrigiSave] Forwarding download from X Button:", event.data.url);
        chrome.runtime.sendMessage({
            type: "DOWNLOAD_MEDIA",
            url: event.data.url,
            meta: event.data.meta
        });
    }
});
