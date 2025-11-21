// Main components
export type { JsonViewerProps } from './components/json-viewer';
export { default as JsonViewer } from './components/json-viewer';
export { default as PojoViewer } from './components/json-viewer/pojo-viewer';
export { default as DiffViewer } from './components/json-viewer/diff-viewer';
export type {
  DiffNode,
  DiffResult,
  DiffStats,
  DiffType,
  DiffViewerProps,
  DiffViewMode,
} from './components/json-viewer/diff-viewer';

// Renderers
export type {
  Renderer,
  RenderProps,
} from './components/json-viewer/renderer/renderer';
export type {
  InlineRenderer,
  InlineRenderProps,
} from './components/json-viewer/renderer/inline-renderer';
export {
  createInlineRouter,
  defaultArrayInlineRenderer,
  defaultObjectInlineRenderer,
  defaultStringInlineRenderer,
} from './components/json-viewer/renderer/inline-renderer';
export {
  createActionableRenderer,
  defaultValidationRenderer,
} from './components/json-viewer/renderer/advanced/validation';

// Features
export { ThemeProvider, ThemeToggle, useTheme } from './components/json-viewer/features/theme';
export type { ThemeProviderProps, ThemeToggleProps } from './components/json-viewer/features/theme';

export { ExportButton } from './components/json-viewer/features/export';
export type { ExportButtonProps } from './components/json-viewer/features/export';

export { BookmarkManager } from './components/json-viewer/features/bookmarks';
export type { BookmarkEntry, BookmarkManagerProps } from './components/json-viewer/features/bookmarks';

export { BreadcrumbNav } from './components/json-viewer/features/breadcrumbs';
export type { BreadcrumbNavProps } from './components/json-viewer/features/breadcrumbs';

export {
  useKeyboardNavigation,
  ShortcutsHelp,
  ShortcutsHelpButton,
  DEFAULT_SHORTCUTS,
} from './components/json-viewer/features/keyboard';
export type {
  KeyboardShortcut,
  CustomKeyboardShortcut,
  FocusState,
} from './components/json-viewer/features/keyboard';

export {
  ValueEditor,
  StringEditor,
  NumberEditor,
  BooleanEditor,
  NullEditor,
  useJsonEditor,
} from './components/json-viewer/features/editor';
export type { ValueEditorProps, EditorProps } from './components/json-viewer/features/editor';

// Schema
export {
  inferSchema,
  inferSchemaFromSamples,
  validate,
  matches,
  matchesType,
  getJsonType,
  validateWithJSONSchema,
  createJSONSchemaValidator,
  convertJSONSchemaToSchema,
  clearValidatorCache,
} from './components/json-viewer/schema';
export type {
  Schema,
  SchemaNode,
  ValidationResult,
  ValidationError,
  JSONSchemaObject,
} from './components/json-viewer/schema';

// Validation - actionable formats only
export type { ActionableFormat, FormatResult } from './components/json-viewer/validation';
export {
  detectFormat,
  validateEmail,
  validatePhone,
  validateUrl,
  validateDate,
  validateDateTime,
  validateIpv4,
  validateUuid,
  getPhoneMetadata,
} from './components/json-viewer/validation';

// Utilities
export { computeDiff, calculateDiffStats, filterUnchanged } from './components/json-viewer/utils/diff';
export { convertToFormat, exportData, downloadFile } from './components/json-viewer/utils/export-formats';
export type { ExportFormat } from './components/json-viewer/utils/export-formats';
export {
  applyTransformers,
  chainTransformers,
  createPathTransformer,
  createTypeTransformer,
  createCustomTransformer,
} from './components/json-viewer/utils/transforms';
export type { Transformer, TransformProps } from './components/json-viewer/utils/transforms';
