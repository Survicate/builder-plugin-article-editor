declare module '@builder.io/app-context' {
  interface EditingContentData {
    get(field: string): unknown;
    set(field: string, value: unknown): void;
  }

  interface EditingContentModel {
    data?: EditingContentData;
  }

  interface BuilderAppContext {
    designerState?: {
      editingContentModel?: EditingContentModel;
      editingModel?: { name?: string };
    };
    editingModel?: { name?: string };
  }

  const appState: BuilderAppContext;
  export default appState;
}
