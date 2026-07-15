import { describe, expect, it } from 'vitest';
import { processUpload } from '@/server/lib/image/process-upload';

describe('processUpload', () => {
  it('passes SVG through unchanged', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>';
    const file = new File([svg], 'mark.svg', { type: 'image/svg+xml' });
    const out = await processUpload(file, 'library');
    expect(out.mime).toBe('image/svg+xml');
    expect(out.extension).toBe('svg');
    expect(out.width).toBeNull();
    expect(new TextDecoder().decode(out.bytes)).toContain('<svg');
  });

  it('rejects GIF with a clear message', async () => {
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0]);
    const file = new File([gif], 'a.gif', { type: 'image/gif' });
    await expect(processUpload(file, 'library')).rejects.toThrow(/GIF/i);
  });

  it('rejects HEIC with a clear message', async () => {
    const heic = new Uint8Array(12);
    heic[4] = 0x66;
    heic[5] = 0x74;
    heic[6] = 0x79;
    heic[7] = 0x70;
    heic[8] = 0x68;
    heic[9] = 0x65;
    heic[10] = 0x69;
    heic[11] = 0x63;
    const file = new File([heic], 'a.heic', { type: 'image/heic' });
    await expect(processUpload(file, 'library')).rejects.toThrow(/HEIC/i);
  });
});
