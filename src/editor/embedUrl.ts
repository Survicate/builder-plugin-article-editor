export interface EmbedUrlVerdict {
  message?: string;
  normalized?: string;
  ok: boolean;
}

const YOUTUBE_ID_PATTERNS = [
  /youtube(?:-nocookie)?\.com\/embed\/([\w-]{6,})/,
  /youtu\.be\/([\w-]{6,})/,
  /youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{6,})/,
];

const rejected = (message: string): EmbedUrlVerdict => ({ message, ok: false });

const parsedHttps = (raw: string): URL | null => {
  try {
    const url = new URL(raw);

    return url.protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
};

export const checkEmbedUrl = (kind: string, raw: string): EmbedUrlVerdict => {
  const url = parsedHttps(raw.trim());

  if (!url) return rejected('The address must be a full link starting with https://');

  if (kind === 'survey') {
    if (url.hostname === 'panel.survicate.com') {
      return rejected(
        'This is the Survicate panel address. Paste the survey share link instead - ' +
          'it starts with https://respondent.survicate.com/',
      );
    }

    if (url.hostname !== 'respondent.survicate.com') {
      return rejected('Survey embeds need a https://respondent.survicate.com/ share link');
    }

    return { ok: true };
  }

  if (kind === 'youtube') {
    for (const pattern of YOUTUBE_ID_PATTERNS) {
      const id = raw.match(pattern)?.[1];

      if (id) return { normalized: `https://www.youtube-nocookie.com/embed/${id}`, ok: true };
    }

    return rejected(
      'Paste a YouTube video link - a watch page, youtu.be short link or embed address',
    );
  }

  if (kind === 'linkedin') {
    if (!url.hostname.endsWith('linkedin.com') || !url.pathname.startsWith('/embed/')) {
      return rejected(
        'Use the address from LinkedIn\'s "Embed this post" option - ' +
          'it starts with https://www.linkedin.com/embed/',
      );
    }

    return { ok: true };
  }

  return { ok: true };
};
