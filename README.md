# @survicate/builder-plugin-article-editor

A long-form article editor for the [Builder.io](https://www.builder.io) dashboard, built on
[TipTap](https://tiptap.dev). Designed for blog-length content: fast on large documents,
strict about the HTML it produces, and friendly to marketers pasting from Google Docs,
Word or Webflow.

**Live demo (no Builder account needed):**
<https://builder-plugin-article-editor.vercel.app/harness/>

Developed and used in production by [Survicate](https://survicate.com) for its blog on
Builder.io. MIT licensed.

## What it registers

The plugin registers two custom field types via the standard Builder plugin API
(`Builder.registerEditor`). Registering new types rather than overriding the built-in
`richText` type keeps every other rich text field in the space untouched.

### `survicateArticle`

A full article editor rendered in place of the field input:

- **Text** — paragraphs, headings H2–H5, bold and italic, ordered and unordered lists,
  blockquotes, horizontal rules, links with target and nofollow control.
- **Tables** — insert, add/remove rows and columns, header rows, captions.
- **Images** — drag-and-drop or paste upload straight to the Builder CDN with automatic
  WebP re-encoding and downscaling, alt text prompt, alignment (left/right with text
  wrapping, centered, full width), optional link with new-tab toggle, width/height
  attributes for layout stability.
- **Embeds** — styled cards for YouTube, social posts and custom iframes, stored as
  `div[data-article-embed]` placeholders with a documented `data-*` attribute contract
  (aspect ratio, caption, CTA, poster) so the host site controls rendering and lazy
  loading.
- **HTML source view** — a toolbar toggle opens the raw HTML for power users and
  AI-assisted editing; applied source is normalized and sanitized on the way back in.
- **Paste cleanup** — content pasted from Google Docs, Word, Webflow or arbitrary web
  pages is reduced to the whitelisted tag set; images referenced from foreign hosts are
  fetched and re-uploaded to the Builder CDN.
- **Slash menu and templates** — quick insertion of common article structures.
- **Fullscreen mode** for distraction-free writing.

### `survicateMetaText`

A single-line plain text editor with a live character counter, intended for SEO meta
title and description fields.

## Installation

1. In Builder, open **Space Settings → Integrations → Plugins → Edit**.
2. Add the package name:

   ```
   @survicate/builder-plugin-article-editor
   ```

3. Save and reload the dashboard.
4. In any model, add a field and pick **survicateArticle** (or **survicateMetaText**) as
   its type.

The field value is a plain HTML string, so switching an existing `richText` field to
`survicateArticle` (and back) is non-destructive.

## Output format and security

- The editor emits sanitized, semantic HTML — no editor-specific markup, classes or
  inline styles. What you store is what your site renders.
- Link and image URLs are restricted to safe schemes; `javascript:`, `data:` and
  obfuscated variants are dropped at input time.
- Paste-fetching of images refuses private-network hosts (localhost, RFC 1918 ranges,
  link-local, `.local`/`.internal`) and enforces a size cap.
- Upload requests carry Builder credentials only to `builder.io` endpoints; the plugin
  talks to no other backend.
- Embeds are stored as inert placeholder `div`s — the plugin never injects third-party
  scripts into your content.

The plugin ships as a single self-contained SystemJS bundle with `react` and
`@builder.io/react` as externals provided by the Builder dashboard.

## Development

Requires Node 22 (see `.nvmrc`).

```bash
npm install
npm start          # serves dist/plugin.system.js on http://localhost:1268
```

Load the local build into Builder from **Space Settings → Integrations → Plugins →
Edit**, adding:

```
http://localhost:1268/plugin.system.js?pluginId=@survicate/builder-plugin-article-editor
```

The `pluginId` query parameter is required for Builder to match the plugin with its
settings. Plugins are loaded once per session, so reload the Builder tab to pick up code
changes.

Plugin settings are shared by everyone in the space. Loading a development build
replaces the editor for all users, so run dev sessions outside of editorial hours and
remove the local URL when finished.

A standalone harness (the same one behind the live demo link above) runs the editor
without Builder:

```bash
npm run dev:harness    # http://localhost:1269
```

## Scripts

| Script                  | Purpose                                      |
| ----------------------- | -------------------------------------------- |
| `npm start`             | Dev server on port 1268                      |
| `npm run dev:harness`   | Standalone editor harness on port 1269       |
| `npm run build`         | Production bundle in `dist/plugin.system.js` |
| `npm run lint`          | ESLint                                       |
| `npm run typecheck`     | TypeScript, no emit                          |
| `npm test`              | Vitest in watch mode                         |
| `npm run test:run`      | Vitest once (120+ tests)                     |
| `npm run verify:corpus` | Round-trip gate over a real content corpus   |
| `npm run format`        | Prettier write                               |
| `npm run pre-pr`        | lint + typecheck + tests + build             |

## Corpus gate

Before the editor goes anywhere near real content, every migrated post has to survive a
round-trip. Point `CORPUS_PATH` at a JSON array of posts and run:

```bash
CORPUS_PATH=path/to/posts.json npm run verify:corpus
```

The gate loads each post into the editor, serializes it back and fails if any link,
embed source or image URL disappears, if a single character of article text changes, or
if the number of tables, header cells, figures, captions, images, quotes, headings or
embeds shifts. Survicate's production corpus (443 posts migrated from Webflow) passes at
100%.

## Publishing

The package is published publicly under the `@survicate` scope. Builder loads listed
plugins from npm by package name, which requires the package to be publicly readable.

```bash
npm run pre-pr
npm version <patch|minor|major>
npm publish            # publishConfig.access is already set to public
git push --follow-tags
```

## Conventions

Mirrors the main Survicate `www` repository: ESLint flat config with the same rule set
(`padding-line-between-statements`, `sort-keys`, `func-style: expression`,
`simple-import-sort`, TypeScript strictness), Prettier with identical options, `@/`
import alias, Husky with lint-staged on commit, and Vitest for tests. Source files carry
no comments — names and tests describe behaviour.

## License

[MIT](LICENSE)
