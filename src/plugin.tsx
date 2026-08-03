import { Builder } from '@builder.io/react';
import { ArticleEditor } from './ArticleEditor';
import { EDITOR_ICON, EDITOR_TYPE_NAME } from './constants';

Builder.registerEditor({
  component: ArticleEditor,
  icon: EDITOR_ICON,
  name: EDITOR_TYPE_NAME,
});
