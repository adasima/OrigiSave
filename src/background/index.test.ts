import { describe, it, expect } from 'vitest';
import { generateFilename } from './index';
import type { MediaMetadata } from './index';

describe('generateFilename', () => {
    it('should sanitize invalid characters', () => {
        const meta: MediaMetadata = {
            site: 'unknown',
            id: '123',
            url: 'http://example.com/image.jpg',
            ext: 'jpg',
            original_name: 'file\\/:*?"<>|name',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('file_________name_orig.jpg');
    });

    it('should default to "unknown" if original_name is not provided', () => {
        const meta: MediaMetadata = {
            site: 'unknown',
            id: '123',
            url: 'http://example.com/image.jpg',
            ext: 'jpg',
            original_name: '',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('unknown_orig.jpg');
    });

    it('should keep original name for Discord', () => {
        const meta: MediaMetadata = {
            site: 'discord.com',
            id: '123',
            url: 'http://example.com/image.png',
            ext: 'png',
            original_name: 'discord_image',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('discord_image.png');
    });

    it('should append _orig for Twitter/X if not present', () => {
        const meta: MediaMetadata = {
            site: 'twitter',
            id: '123',
            url: 'http://example.com/image.jpg',
            ext: 'jpg',
            original_name: 'tweet_pic',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('tweet_pic_orig.jpg');
    });

    it('should not duplicate _orig for Twitter/X if already present', () => {
        const meta: MediaMetadata = {
            site: 'x',
            id: '123',
            url: 'http://example.com/image.jpg',
            ext: 'jpg',
            original_name: 'tweet_pic_orig',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('tweet_pic_orig.jpg');
    });

    it('should append _orig for default sites', () => {
        const meta: MediaMetadata = {
            site: 'some_other_site',
            id: '123',
            url: 'http://example.com/image.jpg',
            ext: 'jpg',
            original_name: 'pic',
            timestamp: Date.now()
        };
        const result = generateFilename(meta);
        expect(result).toBe('pic_orig.jpg');
    });
});
