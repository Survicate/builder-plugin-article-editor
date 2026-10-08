import { Builder } from '@builder.io/react';
import pkg from '../package.json';
import { ArticleEditor } from './ArticleEditor';
import { EDITOR_ICON, EDITOR_TYPE_NAME, META_TEXT_TYPE_NAME } from './constants';
import { autoFillFirstPublished } from './firstPublishedAutoFill';
import { MetaTextEditor } from './MetaTextEditor';

// eslint-disable-next-line no-console -- version banner to verify which bundle the dashboard cached
console.info(`[${pkg.name}] ${pkg.version}`);

Builder.register('editor.onLoad', autoFillFirstPublished);

Builder.registerEditor({
  component: ArticleEditor,
  icon: EDITOR_ICON,
  name: EDITOR_TYPE_NAME,
});

Builder.registerEditor({
  component: MetaTextEditor,
  icon: EDITOR_ICON,
  name: META_TEXT_TYPE_NAME,
});
