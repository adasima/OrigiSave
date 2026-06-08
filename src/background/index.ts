
import { optimizeMediaUrl } from "../common/optimization";
import type { MediaMetadata } from "../common/naming";

console.log("OrigiSave Background Service Worker Initialized (Stable - No YouTube)");

let lastRightClickUrl: string | null = null;

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "save-original-media",
        title: "オリジナルメディアを保存",
        contexts: ["image", "video", "audio", "link", "page"]
    });
});



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

// --- X (Twitter) Video Handling ---
async function fetchTweetVideo(tweetId: string, tabUrl?: string) {
    try {
        console.log("Fetching video info for tweet:", tweetId);
        const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=x`;

        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch tweet info");

        const data = await response.json();
        const mediaList = data.mediaDetails || [];

        const videoMedia = mediaList.find((m: any) => m.type === "video" || m.type === "animated_gif");

        if (!videoMedia || !videoMedia.video_info || !videoMedia.video_info.variants) {
            throw new Error("No video found in tweet");
        }

        const variants = videoMedia.video_info.variants;

        const mp4s = variants
            .filter((v: any) => v.content_type === "video/mp4")
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

        if (mp4s.length === 0) {
            throw new Error("No MP4 source found");
        }

        const bestVideoUrl = mp4s[0].url;
        const originalName = `twitter_${data.user?.screen_name || "user"}_${tweetId}`;

        await handleDownload(bestVideoUrl, tabUrl, {
            original_name: originalName,
            username: data.user?.screen_name,
            author: data.user?.screen_name,
            tweet_id: tweetId,
            site: "twitter",
            ext: "mp4"
        });

    } catch (e) {
        console.error("Error fetching tweet video:", e);
    }
}

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "DOWNLOAD_MEDIA" && message.url) {
        handleDownload(message.url, sender.tab?.url, message.meta);
    } else if (message.type === "SET_LAST_RIGHT_CLICK_TARGET") {
        lastRightClickUrl = message.url;
    } else if (message.type === "DOWNLOAD_X_VIDEO" && message.tweetId) {
        fetchTweetVideo(message.tweetId, sender.tab?.url);
    }
});
