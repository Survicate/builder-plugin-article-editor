# @survicate/builder-plugin-article-editor

Long-form article editor for Survicate blog posts in the Builder.io dashboard.

The plugin registers a custom field type named `survicateArticle` and renders a
[TipTap](https://tiptap.dev) editor in place of the default rich text field. It is
built for the `content` field of the `blog-post` data model, which stores sanitized
article HTML including `div[data-article-embed]` placeholders for surveys and other
embeds.

Registering a new type rather than overriding the built-in `richText` type keeps every
other rich text field in the space untouched.

## Requirements

- Node 22 (see `.nvmrc`)
- Access to the Survicate Builder.io space to load the plugin

## Development

```bash
npm install
npm start          # serves dist/plugin.system.js on http://localhost:1268
```

Load the local build into Builder from Space Settings → Integrations → Plugins → Edit,
adding:

```
http://localhost:1268/plugin.system.js?pluginId=@survicate/builder-plugin-article-editor
```

The `pluginId` query parameter is required for Builder to match the plugin with its
settings. Plugins are loaded once per session, so reload the Builder tab to pick up
code changes.

Plugin settings are shared by everyone in the space. Loading a development build
replaces the editor for all users, so run dev sessions outside of editorial hours and
remove the local URL when finished.

## Scripts

| Script              | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `npm start`         | Dev server on port 1268                      |
| `npm run build`     | Production bundle in `dist/plugin.system.js` |
| `npm run lint`      | ESLint                                       |
| `npm run typecheck` | TypeScript, no emit                          |
| `npm test`          | Vitest in watch mode                         |
| `npm run test:run`  | Vitest once                                  |
| `npm run format`    | Prettier write                               |
| `npm run pre-pr`    | lint + typecheck + tests + build             |

## Publishing

The package is published publicly under the `@survicate` scope, owned by the
**Marketing** team. Builder loads plugins from npm by package name, which requires the
package to be publicly readable — only private plugins hosted on your own URL need an
Enterprise plan, which is why this route was chosen.

```bash
npm run pre-pr
npm version <patch|minor|major>
npm publish            # publishConfig.access is already set to public
git push --follow-tags
```

Grant the Marketing team write access once, after the first publish:

```bash
npm access grant read-write @survicate:marketing @survicate/builder-plugin-article-editor
```

Install in Builder by entering the package name in Space Settings → Integrations →
Plugins.

## Conventions

Mirrors the main `www` repository: ESLint flat config with the same rule set
(`padding-line-between-statements`, `sort-keys`, `func-style: expression`,
`simple-import-sort`, TypeScript strictness), Prettier with identical options, `@/`
import alias, Husky with lint-staged on commit, and Vitest for tests. Source files
carry no comments — names and tests describe behaviour.
