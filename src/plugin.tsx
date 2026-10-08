import { Builder } from '@builder.io/react';
import { ArticleEditor } from './ArticleEditor';
import { EDITOR_ICON, EDITOR_TYPE_NAME, META_TEXT_TYPE_NAME } from './constants';
import { autoFillFirstPublished } from './firstPublishedAutoFill';
import { MetaTextEditor } from './MetaTextEditor';

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
