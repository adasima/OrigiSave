import { describe, it, expect } from "vitest";
import { optimizeMediaUrl } from "./optimization";

describe("optimizeMediaUrl", () => {
    it("should handle X (Twitter) modern format parameter", () => {
        const result = optimizeMediaUrl("https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg?format=webp&name=medium");
        expect(result).toEqual({
            url: "https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg?format=webp&name=orig",
            originalName: "FwqX8H8akAABabc",
            ext: "webp"
        });
    });

    it("should handle X (Twitter) colon style", () => {
        const result = optimizeMediaUrl("https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg:large");
        expect(result).toEqual({
            url: "https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg:orig",
            originalName: "FwqX8H8akAABabc",
            ext: "jpg"
        });
    });

    it("should handle X (Twitter) standard URL", () => {
        const result = optimizeMediaUrl("https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg");
        expect(result).toEqual({
            url: "https://pbs.twimg.com/media/FwqX8H8akAABabc.jpg?name=orig",
            originalName: "FwqX8H8akAABabc",
            ext: "jpg"
        });
    });

    it("should handle Discord media URL", () => {
        const result = optimizeMediaUrl("https://media.discordapp.net/attachments/123/456/image.png?width=100&height=100&ex=123&is=456&hm=789");
        expect(result).toEqual({
            url: "https://cdn.discordapp.com/attachments/123/456/image.png?ex=123&is=456&hm=789",
            originalName: "image"
        });
    });

    it("should handle Discord cdn URL", () => {
        const result = optimizeMediaUrl("https://cdn.discordapp.com/attachments/123/456/image.png?width=100&height=100&ex=123&is=456&hm=789");
        expect(result).toEqual({
            url: "https://cdn.discordapp.com/attachments/123/456/image.png?ex=123&is=456&hm=789",
            originalName: "image"
        });
    });

    it("should handle other URLs without modification", () => {
        const result = optimizeMediaUrl("https://example.com/image.jpg");
        expect(result).toEqual({
            url: "https://example.com/image.jpg"
        });
    });

    it("should handle invalid URLs gracefully", () => {
        const invalidUrl = "not a valid url";
        const result = optimizeMediaUrl(invalidUrl);
        expect(result).toEqual({ url: invalidUrl });
    });
});
