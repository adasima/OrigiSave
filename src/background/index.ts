
import { optimizeMediaUrl } from "../common/optimization";

console.log("OrigiSave Background Service Worker Initialized (Stable - No YouTube)");

let lastRightClickUrl: string | null = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-original-media",
        title: "オリジナルメディアを保存",
        contexts: ["image", "video", "audio", "link", "page"]
    });
});

interface MediaMetadata {
    site: string;
    id: string;
    url: string;
    ext: string;
    original_name: string;
    timestamp: number;
    username?: string;
    author?: string;
    tweet_id?: string;
    title?: string;
}

// FORMAT FILENAME: HARDCODED LOGIC (YouTube removed)
function generateFilename(meta: MediaMetadata): string {
    const cleanName = (meta.original_name || "unknown").replace(/[\\/:*?"<>|]/g, "_");

    // Discord -> Original Name
    if (meta.site.includes("discord")) {
        return `${cleanName}.${meta.ext}`;
    }

    // X (Twitter) -> Force _orig
    if (meta.site === "twitter" || meta.site === "x") {
        if (cleanName.endsWith("_orig")) {
            return `${cleanName}.${meta.ext}`;
        }
        return `${cleanName}_orig.${meta.ext}`;
    }

    // Default -> Force _orig
    return `${cleanName}_orig.${meta.ext}`;
}

async function handleDownload(url: string, tabUrl?: string, extraMeta: Partial<MediaMetadata> = {}) {
    const optimized = optimizeMediaUrl(url);
    const optimizedUrl = optimized.url;

    let ext = extraMeta.ext || optimized.ext;
    if (!ext) {
        ext = optimizedUrl.split(".").pop()?.split(/[?#]/)[0] || "bin";
    }

    const meta: MediaMetadata = {
        site: tabUrl ? new URL(tabUrl).hostname.replace("www.", "") : "unknown",
        id: Math.random().toString(36).substring(7),
        url: optimizedUrl,
        ext: ext,
        original_name: optimized.originalName || "download",
        timestamp: Date.now(),
        ...extraMeta,
    };

    if (extraMeta.site) {
        meta.site = extraMeta.site;
    }

    const filename = generateFilename(meta);
    console.log("OrigiSave: Preparing download:", filename, "from", optimizedUrl);

    // DIRECT DOWNLOAD (Standard API)
    chrome.downloads.download({
        url: optimizedUrl,
        filename: filename,
        conflictAction: "uniquify"
    });
}


chrome.contextMenus.onClicked.addListener(async (info: chrome.contextMenus.OnClickData, tab?: chrome.tabs.Tab) => {
    if (info.menuItemId === "save-original-media") {
        const urlToDownload = info.srcUrl || info.linkUrl || lastRightClickUrl;
        if (urlToDownload) {
            await handleDownload(urlToDownload, tab?.url);
        }
    }
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "DOWNLOAD_MEDIA" && message.url) {
        handleDownload(message.url, sender.tab?.url, message.meta);
    } else if (message.type === "SET_LAST_RIGHT_CLICK_TARGET") {
        lastRightClickUrl = message.url;
    }
});
