export type NamingTemplate = string;

export const PRESET_TEMPLATES = {
    SIMPLE: "{site}_{id}.{ext}",
    TWITTER_ORIG: "{original_name}_orig.{ext}",
    TWITTER_STD: "twitter_{author}_{tweet_id}_{id}.{ext}",
    ARCHIVE: "{date}/{site}_{author}_{id}.{ext}",
    DETAILED: "{site}/{year}/{month}/{author}_{username}_{id}.{ext}",
};

export const DEFAULT_TEMPLATE = PRESET_TEMPLATES.TWITTER_ORIG;

export interface MediaMetadata {
    site: string;
    id: string;
    author?: string;
    username?: string;
    tweet_id?: string;
    original_name?: string;
    pic_no?: number;
    title?: string;
    ext: string;
    url: string;
    timestamp: number;
}



export function formatFilename(template: NamingTemplate, meta: MediaMetadata): string {
    const date = new Date(meta.timestamp);
    const pad = (n: number) => n.toString().padStart(2, "0");

    const placeholders: Record<string, string> = {
        "{site}": meta.site || "unknown",
        "{id}": meta.id || "media",
        "{author}": meta.author || "unknown",
        "{username}": meta.username || meta.author || "unknown",
        "{tweet_id}": meta.tweet_id || "0",
        "{original_name}": meta.original_name || meta.id || "media",
        "{pic_no}": meta.pic_no !== undefined ? meta.pic_no.toString() : "0",
        "{title}": meta.title || "untitled",
        "{ext}": meta.ext || "bin",
        "{year}": date.getFullYear().toString(),
        "{month}": pad(date.getMonth() + 1),
        "{day}": pad(date.getDate()),
        "{date}": `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`,
        "{hours}": pad(date.getHours()),
        "{minutes}": pad(date.getMinutes()),
    };


    let filename = template;
    for (const [key, value] of Object.entries(placeholders)) {
        filename = filename.replace(new RegExp(key, "g"), value);
    }

    // Remove invalid characters for filenames
    return filename.replace(/[<>:"/\\|?*]/g, "_").replace(/__/g, "_");
}
