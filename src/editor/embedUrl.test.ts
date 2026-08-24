import { describe, expect, it } from 'vitest';
import { checkEmbedUrl } from '@/editor/embedUrl';

describe('checkEmbedUrl', () => {
  it('rejects addresses that are not https links', () => {
    expect(checkEmbedUrl('survey', 'respondent.survicate.com/abc').ok).toBe(false);
    expect(checkEmbedUrl('youtube', 'http://youtu.be/abc123').ok).toBe(false);
  });

  it('explains that panel addresses are not survey share links', () => {
    const verdict = checkEmbedUrl(
      'survey',
      'https://panel.survicate.com/o/1/w/2/surveys/720b1f4ab66e1909/editor/analyze/results',
    );

    expect(verdict.ok).toBe(false);
    expect(verdict.message).toContain('respondent.survicate.com');
  });

  it('accepts survey share links', () => {
    expect(checkEmbedUrl('survey', 'https://respondent.survicate.com/720b1f4ab66e1909').ok).toBe(
      true,
    );
  });

  it('normalizes youtube watch and short links to the nocookie embed', () => {
    const expected = 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ';

    expect(checkEmbedUrl('youtube', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ').normalized).toBe(
      expected,
    );
    expect(checkEmbedUrl('youtube', 'https://youtu.be/dQw4w9WgXcQ?si=xyz').normalized).toBe(
      expected,
    );
    expect(
      checkEmbedUrl('youtube', 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ').normalized,
    ).toBe(expected);
  });

  it('rejects youtube links without a recognizable video id', () => {
    expect(checkEmbedUrl('youtube', 'https://www.youtube.com/@survicate').ok).toBe(false);
  });

  it('requires the linkedin embed address, not the post page', () => {
    expect(checkEmbedUrl('linkedin', 'https://www.linkedin.com/posts/survicate_abc').ok).toBe(
      false,
    );
    expect(
      checkEmbedUrl('linkedin', 'https://www.linkedin.com/embed/feed/update/urn:li:share:1').ok,
    ).toBe(true);
  });

  it('accepts any https address for kinds without a dedicated rule', () => {
    expect(checkEmbedUrl('arcade', 'https://demo.arcade.software/abc/embed').ok).toBe(true);
    expect(checkEmbedUrl('iframe', 'https://example.com/widget').ok).toBe(true);
  });
});
