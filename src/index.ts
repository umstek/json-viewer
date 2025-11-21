// Main components
export type { JsonViewerProps } from './components/json-viewer';
export { default as JsonViewer } from './components/json-viewer';
export type {
  DiffNode,
  DiffResult,
  DiffStats,
  DiffType,
  DiffViewerProps,
  DiffViewMode,
} from './components/json-viewer/diff-viewer';
export { default as DiffViewer } from './components/json-viewer/diff-viewer';
export type {
  BookmarkEntry,
  BookmarkManagerProps,
} from './components/json-viewer/features/bookmarks';
export { BookmarkManager } from './components/json-viewer/features/bookmarks';
export type { BreadcrumbNavProps } from './components/json-viewer/features/breadcrumbs';
export { BreadcrumbNav } from './components/json-viewer/features/breadcrumbs';
export type {
  EditorProps,
  ValueEditorProps,
} from './components/json-viewer/features/editor';
export {
  BooleanEditor,
  NullEditor,
  NumberEditor,
  StringEditor,
  useJsonEditor,
  ValueEditor,
} from './components/json-viewer/features/editor';
export type { ExportButtonProps } from './components/json-viewer/features/export';
export { ExportButton } from './components/json-viewer/features/export';
export type {
  CustomKeyboardShortcut,
  FocusState,
  KeyboardShortcut,
} from './components/json-viewer/features/keyboard';
export {
  DEFAULT_SHORTCUTS,
  ShortcutsHelp,
  ShortcutsHelpButton,
  useKeyboardNavigation,
} from './components/json-viewer/features/keyboard';
export type {
  ThemeProviderProps,
  ThemeToggleProps,
} from './components/json-viewer/features/theme';
// Features
export {
  ThemeProvider,
  ThemeToggle,
  useTheme,
} from './components/json-viewer/features/theme';
export { default as PojoViewer } from './components/json-viewer/pojo-viewer';
export {
  createActionableRenderer,
  defaultValidationRenderer,
} from './components/json-viewer/renderer/advanced/validation';
export {
  arrayRenderer,
  booleanRenderer,
  dateRenderer,
  dateTimeRenderer,
  defaultTypeRenderers,
  emailRenderer,
  ipv4Renderer,
  nullRenderer,
  numberRenderer,
  objectRenderer,
  phoneRenderer,
  stringRenderer,
  urlRenderer,
  uuidRenderer,
} from './components/json-viewer/renderer/default-renderers';
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
// Renderer Registry - composable rendering system
export type {
  PathRenderer,
  RegistryConfig,
  RendererFn,
  RendererProps,
  TypeRenderer,
} from './components/json-viewer/renderer/registry';
export {
  createDefaultRegistry,
  createRegistry,
  RendererRegistry,
} from './components/json-viewer/renderer/registry';
// Renderers
export type {
  Renderer,
  RenderProps,
} from './components/json-viewer/renderer/renderer';
export type {
  JSONSchemaObject,
  Schema,
  SchemaNode,
  ValidationError,
  ValidationResult,
} from './components/json-viewer/schema';
// Schema
export {
  clearValidatorCache,
  convertJSONSchemaToSchema,
  createJSONSchemaValidator,
  getJsonType,
  inferSchema,
  inferSchemaFromSamples,
  matches,
  matchesType,
  validate,
  validateWithJSONSchema,
} from './components/json-viewer/schema';
// Utilities
export {
  calculateDiffStats,
  computeDiff,
  filterUnchanged,
} from './components/json-viewer/utils/diff';
export type { ExportFormat } from './components/json-viewer/utils/export-formats';
export {
  convertToFormat,
  downloadFile,
  exportData,
} from './components/json-viewer/utils/export-formats';
export { matchPath } from './components/json-viewer/utils/jsonpath';
export type {
  Transformer,
  TransformProps,
} from './components/json-viewer/utils/transforms';
export {
  applyTransformers,
  chainTransformers,
  createCustomTransformer,
  createPathTransformer,
  createTypeTransformer,
} from './components/json-viewer/utils/transforms';
// Validation - actionable formats only
export type {
  ActionableFormat,
  FormatResult,
} from './components/json-viewer/validation';
export {
  detectFormat,
  getPhoneMetadata,
  validateDate,
  validateDateTime,
  validateEmail,
  validateIpv4,
  validatePhone,
  validateUrl,
  validateUuid,
} from './components/json-viewer/validation';
