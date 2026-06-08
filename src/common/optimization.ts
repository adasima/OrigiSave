
export interface OptimizedMedia {
    url: string;
    originalName?: string;
    ext?: string;
}

export function optimizeMediaUrl(url: string): OptimizedMedia {
    try {
        const urlObj = new URL(url);
        let originalName: string | undefined = undefined;

        // X (Twitter) Optimization
        if (urlObj.hostname === "pbs.twimg.com") {
            const pathParts = urlObj.pathname.split("/");
            const filename = pathParts[pathParts.length - 1];
            originalName = filename.split(".")[0];

            // Handle format parameter (modern X style)
            if (urlObj.searchParams.has("format")) {
                const format = urlObj.searchParams.get("format");
                urlObj.searchParams.set("name", "orig");
                return {
                    url: urlObj.toString(),
                    originalName,
                    ext: format || undefined
                };
            }

            // Handle colon style (legacy/different X style)
            if (urlObj.pathname.includes(":")) {
                const [basePath] = urlObj.pathname.split(":");
                urlObj.pathname = `${basePath}:orig`;
                const ext = basePath.split(".").pop();
                return { url: urlObj.toString(), originalName, ext };
            }

            // Standard URL but maybe with search params
            urlObj.searchParams.set("name", "orig");
            const ext = filename.split(".").pop();
            return { url: urlObj.toString(), originalName, ext };
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
    } catch {
        return { url };
    }
}
