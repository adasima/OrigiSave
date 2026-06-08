import { describe, it, expect } from "vitest";
import { formatFilename, MediaMetadata, PRESET_TEMPLATES } from "./naming";

describe("formatFilename", () => {
    // Month is 0-indexed in Date constructor
    const mockDate = new Date(2023, 4, 9, 14, 5, 0); // May 9, 2023, 14:05:00 local time
    const mockTimestamp = mockDate.getTime();

    const fullMetadata: MediaMetadata = {
        site: "twitter",
        id: "12345",
        author: "john_doe",
        username: "johndoe123",
        tweet_id: "987654321",
        original_name: "photo_abc",
        pic_no: 2,
        title: "my nice photo",
        ext: "jpg",
        url: "https://example.com/photo.jpg",
        timestamp: mockTimestamp,
    };

    it("should substitute all fields correctly for a complex template", () => {
        const template = "{site}-{year}-{month}-{day}-{date}-{hours}-{minutes}-{author}-{username}-{tweet_id}-{original_name}-{pic_no}-{title}-{id}.{ext}";
        const result = formatFilename(template, fullMetadata);

        expect(result).toBe("twitter-2023-05-09-20230509-14-05-john_doe-johndoe123-987654321-photo_abc-2-my nice photo-12345.jpg");
    });

    it("should fallback to defaults when fields are missing", () => {
        const missingMetadata: MediaMetadata = {
            site: "",
            id: "",
            ext: "",
            url: "https://example.com/photo.jpg",
            timestamp: mockTimestamp,
        };
        const template = "{site}-{id}-{author}-{tweet_id}-{pic_no}-{title}.{ext}";
        const result = formatFilename(template, missingMetadata);

        expect(result).toBe("unknown-media-unknown-0-0-untitled.bin");
    });

    it("should cascade username fallback to author then unknown", () => {
        const metaWithAuthor: MediaMetadata = {
            site: "twitter",
            id: "123",
            author: "john_doe",
            ext: "jpg",
            url: "https://example.com/photo.jpg",
            timestamp: mockTimestamp,
        };

        expect(formatFilename("{username}", metaWithAuthor)).toBe("john_doe");

        const metaWithoutAuthor: MediaMetadata = {
            site: "twitter",
            id: "123",
            ext: "jpg",
            url: "https://example.com/photo.jpg",
            timestamp: mockTimestamp,
        };
        expect(formatFilename("{username}", metaWithoutAuthor)).toBe("unknown");
    });

    it("should cascade original_name fallback to id then media", () => {
        const metaWithId: MediaMetadata = {
            site: "twitter",
            id: "12345",
            ext: "jpg",
            url: "https://example.com/photo.jpg",
            timestamp: mockTimestamp,
        };

        expect(formatFilename("{original_name}", metaWithId)).toBe("12345");

        const metaWithoutId: MediaMetadata = {
            site: "twitter",
            id: "",
            ext: "jpg",
            url: "https://example.com/photo.jpg",
            timestamp: mockTimestamp,
        };
        expect(formatFilename("{original_name}", metaWithoutId)).toBe("media");
    });

    it("should format dates with proper padding", () => {
        const date = new Date(2024, 0, 5, 4, 8, 0); // Jan 5, 2024, 04:08:00 local time
        const meta: MediaMetadata = {
            site: "test",
            id: "1",
            ext: "png",
            url: "https://example.com/photo.png",
            timestamp: date.getTime(),
        };

        const result = formatFilename("{year}-{month}-{day}-{hours}-{minutes}-{date}", meta);
        expect(result).toBe("2024-01-05-04-08-20240105");
    });

    it("should replace invalid path characters with underscores", () => {
        const meta: MediaMetadata = {
            site: "test",
            id: "1",
            title: 'a<b>c:d"e/f\\g|h?i*j',
            ext: "jpg",
            url: "https://example.com",
            timestamp: mockTimestamp,
        };

        const result = formatFilename("{title}", meta);
        // "a<b>c:d\"e/f\\g|h?i*j" -> "a_b_c_d_e_f_g_h_i_j"
        expect(result).toBe("a_b_c_d_e_f_g_h_i_j");
    });

    it("should replace multiple underscores with a single underscore (one pass)", () => {
        const meta: MediaMetadata = {
            site: "test",
            id: "1",
            title: "my_nice_title",
            ext: "jpg",
            url: "https://example.com",
            timestamp: mockTimestamp,
        };

        const result = formatFilename("my___{title}", meta);
        expect(result).toBe("my__my_nice_title");
    });
});
