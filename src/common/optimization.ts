
export interface OptimizedMedia {
    url: string;
    originalName?: string;
}

export function optimizeMediaUrl(url: string): OptimizedMedia {
    try {
        const urlObj = new URL(url);
        let originalName: string | undefined = undefined;

        // X (Twitter) Optimization
        if (urlObj.hostname === "pbs.twimg.com") {
            const pathParts = urlObj.pathname.split("/");
            originalName = pathParts[pathParts.length - 1].split(".")[0];

            if (urlObj.searchParams.has("format")) {
                urlObj.searchParams.set("name", "orig");
                return { url: urlObj.toString(), originalName };
            }
            if (url.includes(":")) {
                const base = url.split(":")[0];
                originalName = base.split("/").pop()?.split(".")[0] || originalName;
                return { url: `${base}:orig`, originalName };
            }
        }

        // Discord Optimization
        if (urlObj.hostname === "media.discordapp.net" || urlObj.hostname === "cdn.discordapp.com") {
            const pathParts = urlObj.pathname.split("/");
            originalName = pathParts[pathParts.length - 1].split(".")[0];

            urlObj.hostname = "cdn.discordapp.com";
            // Strip resizing params but KEEP authentication params (ex, is, hm)
            urlObj.searchParams.delete("width");
            urlObj.searchParams.delete("height");
            urlObj.searchParams.delete("format");
            urlObj.searchParams.delete("quality");

            return { url: urlObj.toString(), originalName };
        }


        return { url };
    } catch (e) {
        return { url };
    }
}
