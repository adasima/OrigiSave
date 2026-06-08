
// This script runs in the MAIN world, so it can access window.React, __reactFiber, etc.

console.log("OrigiSave X Main World Script Loaded");

// Helper to find the React internal instance key
const getReactFiber = (el: HTMLElement): any => {
    const key = Object.keys(el).find(k => k.startsWith("__reactFiber$"));
    return key ? (el as any)[key] : null;
};

// Traverse Fiber to find specific props (like 'tweet')
const findTweetDataInFiber = (fiber: any): any => {
    let curr = fiber;
    // Limit depth to avoid performance hit
    let depth = 0;
    while (curr && depth < 20) {
        const props = curr.memoizedProps;
        // Check for tweet data signature
        if (props && props.tweet) {
            return props.tweet;
        }
        curr = curr.return;
        depth++;
    }
    return null;
};

// Injection Strategy: Action Bar
const injectActionBarButton = (tweetNode: HTMLElement) => {
    // Robustly find the action bar by looking for known children like "like" or "reply"
    const likeBtn = tweetNode.querySelector("[data-testid='like']") || tweetNode.querySelector("[data-testid='unlike']");
    const replyBtn = tweetNode.querySelector("[data-testid='reply']");

    // The action bar is the parent of these buttons
    const actionBar = (likeBtn?.closest("[role='group']") || replyBtn?.closest("[role='group']")) as HTMLElement;

    if (!actionBar || actionBar.querySelector(".origisave-download-button")) return;

    // Use React Fiber to get the Tweet Data directly from this node
    // We start from the tweetNode (article)
    const fiber = getReactFiber(tweetNode);
    if (!fiber) {
        return;
    }

    const btn = document.createElement("div");
    btn.className = "origisave-download-button";
    btn.setAttribute("role", "button");
    btn.setAttribute("tabindex", "0");
    btn.innerHTML = `
        <div dir="ltr" class="css-1rynq56 r-bcqeeo r-qvutc0 r-37j5jr r-a2tzq0 r-qjnra3" style="color: rgb(113, 118, 123);">
            <div class="css-175oi2r r-xoduu5 r-1udh08x">
                <svg viewBox="0 0 24 24" aria-hidden="true" class="r-4qtqp9 r-yyyyoo r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1xvli5t r-1hdv0qi">
                    <path d="M12 16l-5-5h3V4h4v7h3l-5 5zm-7 2h14v2H5v-2z"/>
                </svg>
            </div>
        </div>
    `;
    btn.title = "Save Media (OrigiSave)";

    // Style to match Action Bar items (approximately)
    Object.assign(btn.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        marginLeft: "8px",
        transition: "background 0.2s",
        borderRadius: "9999px",
        width: "34.75px",
        height: "34.75px",
    });

    // Hover effect
    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "rgba(29, 155, 240, 0.1)";
        const icon = btn.querySelector("svg");
        if (icon) icon.style.color = "rgb(29, 155, 240)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "transparent";
        const icon = btn.querySelector("svg");
        if (icon) icon.style.color = ""; // inherit
    });

    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        // Re-fetch fiber on click to ensure we have the latest props
        const currentFiber = getReactFiber(tweetNode);
        const tweetData = findTweetDataInFiber(currentFiber);

        if (!tweetData) {
            alert("No tweet data found.");
            return;
        }

        // Extract Media (URL still comes from Fiber for highest quality)
        const mediaList =
            tweetData.legacy?.extended_entities?.media ||
            tweetData.extended_entities?.media ||
            tweetData.entities?.media ||
            tweetData.legacy?.entities?.media ||
            [];

        if (!mediaList || mediaList.length === 0) {
            if (tweetData.card) {
                alert("This media type is not fully supported yet (Card).");
                return;
            }
            alert("No media found.");
            return;
        }

        // STRICT Metadata Extraction (DOM ONLY)
        // User requested strict consistency with image saving logic.
        // We do NOT seek fallback from Fiber for ID/Username.
        const getStrictMetadata = () => {
            const statusLink = tweetNode.querySelector("a[href*='/status/']");
            if (statusLink) {
                const match = (statusLink as HTMLAnchorElement).href.match(/\/([^/]+)\/status\/(\d+)/);
                if (match) {
                    return { username: match[1], tweet_id: match[2] };
                }
            }
            return { username: "unknown", tweet_id: "unknown" };
        };

        const { username, tweet_id } = getStrictMetadata();
        const originalName = `twitter_${username}_${tweet_id}`;

        let downloaded = false;

        mediaList.forEach((media: any) => {
            if (media.type === "video" || media.type === "animated_gif") {
                const variants = media.video_info?.variants || [];
                const mp4s = variants
                    .filter((v: any) => v.content_type === "video/mp4")
                    .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

                if (mp4s.length > 0) {
                    const bestUrl = mp4s[0].url;
                    window.postMessage({
                        type: "ORIGISAVE_FW_DOWNLOAD",
                        url: bestUrl,
                        meta: {
                            original_name: originalName,
                            tweet_id: tweet_id,
                            username: username,
                            site: "twitter"
                        }
                    }, "*");
                    downloaded = true;
                }
            } else if (media.type === "photo") {
                let imgUrl = media.media_url_https;
                if (!imgUrl.includes("name=orig")) {
                    imgUrl = imgUrl + "?name=orig";
                }
                window.postMessage({
                    type: "ORIGISAVE_FW_DOWNLOAD",
                    url: imgUrl,
                    meta: {
                        tweet_id: tweet_id,
                        username: username,
                        site: "twitter"
                    }
                }, "*");
                downloaded = true;
            }
        });

        if (!downloaded) {
            alert("Compatible media not found.");
        }
    });

    // Append to action bar
    actionBar.appendChild(btn);
};

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (node instanceof HTMLElement) {
                // Check if it's a tweet article itself
                if (node.tagName === "ARTICLE" && node.getAttribute("data-testid") === "tweet") {
                    injectActionBarButton(node);
                }

                // Also check for nested tweet articles
                const articles = node.getElementsByTagName("article");
                for (let i = 0; i < articles.length; i++) {
                    if (articles[i].getAttribute("data-testid") === "tweet") {
                        injectActionBarButton(articles[i] as HTMLElement);
                    }
                }
            }
        }
    }
});

observer.observe(document.body, { childList: true, subtree: true });
