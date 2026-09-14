/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vite-plus/test';
import JsonViewer from '../../index';
import PojoViewer from '../../pojo-viewer';
import { convertToFormat, formatLabels } from '../../utils/export-formats';
import { pathArrayToInternalKey } from '../../utils/jsonpath';
import { type ContextMenuOptions, NodeContextMenu } from './node-context-menu';

const data = { company: { name: 'Acme' } };
const nodePath = ['company', 'name'];

/**
 * Stubs the clipboard API (absent in jsdom) and returns the writeText spy.
 */
function stubClipboard() {
  const writeText = vi.fn();
  Object.assign(navigator, { clipboard: { writeText } });
  return writeText;
}

/**
 * Renders a NodeContextMenu around a simple node stub.
 */
function renderNodeMenu(options: ContextMenuOptions = {}, value: unknown = 'Acme') {
  return render(
    <NodeContextMenu path={nodePath} value={value} options={options}>
      <div data-testid="node">{typeof value === 'string' ? value : ''}</div>
    </NodeContextMenu>,
  );
}

async function openMenu() {
  fireEvent.contextMenu(screen.getByTestId('node'));
  return await screen.findByRole('menu');
}

function getMenuItem(name: string | RegExp) {
  return screen.getByRole('menuitem', { name });
}

/**
 * Expands collapsed tree levels by clicking their chevron triggers.
 * `index` refers to the nth chevron currently in the document.
 */
function clickChevron(index: number) {
  const chevrons = document.querySelectorAll('svg.lucide-chevron-right');
  fireEvent.click((chevrons[index] as SVGSVGElement).parentElement as HTMLElement);
}

describe('NodeContextMenu', () => {
  test('renders children normally without an open menu', () => {
    renderNodeMenu();

    expect(screen.getByTestId('node')).not.toBeNull();
    expect(screen.queryByRole('menu')).toBeNull();
  });

  test('opens a menu on right click with the expected items', async () => {
    renderNodeMenu({ onBookmark: vi.fn() });

    await openMenu();

    for (const name of [
      'Copy JSONPath',
      'Copy JSON Pointer',
      'Copy path',
      'Copy value',
      'Copy as',
      'Bookmark this node',
      'Export subtree',
    ]) {
      expect(screen.getByRole('menuitem', { name: new RegExp(name, 'i') })).not.toBeNull();
    }
  });

  test('hides the bookmark item when onBookmark is not provided', async () => {
    renderNodeMenu();

    await openMenu();

    expect(screen.queryByRole('menuitem', { name: /bookmark this node/i })).toBeNull();
  });

  test('Copy JSONPath writes the JSONPath string', async () => {
    const writeText = stubClipboard();
    renderNodeMenu();

    await openMenu();
    fireEvent.click(getMenuItem('Copy JSONPath'));

    expect(writeText).toHaveBeenCalledWith('$.company.name');
  });

  test('Copy JSON Pointer writes the RFC 6901 pointer', async () => {
    const writeText = stubClipboard();
    renderNodeMenu();

    await openMenu();
    fireEvent.click(getMenuItem('Copy JSON Pointer'));

    expect(writeText).toHaveBeenCalledWith('/company/name');
  });

  test('Copy path writes the dot path', async () => {
    const writeText = stubClipboard();
    renderNodeMenu();

    await openMenu();
    fireEvent.click(getMenuItem('Copy path'));

    expect(writeText).toHaveBeenCalledWith('company.name');
  });

  test('Copy value writes pretty JSON of the value', async () => {
    const writeText = stubClipboard();
    const value = { a: 1, nested: { b: 2 } };
    renderNodeMenu({}, value);

    await openMenu();
    fireEvent.click(getMenuItem('Copy value'));

    expect(writeText).toHaveBeenCalledWith(JSON.stringify(value, null, 2));
  });

  test.each(['json', 'json-minified', 'yaml', 'csv'] as const)(
    'Copy as %s writes the converted value',
    async (format) => {
      const writeText = stubClipboard();
      renderNodeMenu();

      await openMenu();
      fireEvent.click(getMenuItem(/copy as/i));
      fireEvent.click(await screen.findByRole('menuitem', { name: formatLabels[format] }));

      expect(writeText).toHaveBeenCalledWith(convertToFormat('Acme', format));
    },
  );

  test('onCopy replaces the default clipboard write', async () => {
    const writeText = stubClipboard();
    const onCopy = vi.fn();
    renderNodeMenu({ onCopy });

    await openMenu();
    fireEvent.click(getMenuItem('Copy JSONPath'));

    expect(onCopy).toHaveBeenCalledWith('jsonpath', nodePath, 'Acme');
    expect(writeText).not.toHaveBeenCalled();
  });

  test('clicking the bookmark item calls onBookmark with path and value', async () => {
    const onBookmark = vi.fn();
    renderNodeMenu({ onBookmark });

    await openMenu();
    fireEvent.click(getMenuItem('Bookmark this node'));

    expect(onBookmark).toHaveBeenCalledWith(nodePath, 'Acme');
  });

  test('onExport replaces the default file download', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });

    const onExport = vi.fn();
    renderNodeMenu({ onExport });

    await openMenu();
    fireEvent.click(getMenuItem(/export subtree/i));
    fireEvent.click(await screen.findByRole('menuitem', { name: formatLabels.yaml }));

    expect(onExport).toHaveBeenCalledWith('yaml', nodePath, 'Acme');
    expect(createObjectURL).not.toHaveBeenCalled();
  });

  test('export without onExport triggers a download anchor', async () => {
    const createObjectURL = vi.fn((_blob: Blob) => 'blob:mock');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    renderNodeMenu();

    await openMenu();
    fireEvent.click(getMenuItem(/export subtree/i));
    fireEvent.click(await screen.findByRole('menuitem', { name: formatLabels.yaml }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createObjectURL.mock.calls[0][0]).toBeInstanceOf(Blob);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    const anchor = clickSpy.mock.instances[0] as HTMLAnchorElement;
    expect(anchor.download).toBe('company-name.yaml');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

describe('PojoViewer context menu integration', () => {
  test('right-clicking a nested node opens the menu with that node path', async () => {
    const writeText = stubClipboard();
    render(<PojoViewer data={data} contextMenu={{}} />);

    // Expand root, then the nested `company` object.
    clickChevron(0);
    clickChevron(1);

    fireEvent.contextMenu(screen.getByText('Acme'));
    await screen.findByRole('menu');

    fireEvent.click(getMenuItem('Copy JSONPath'));
    expect(writeText).toHaveBeenCalledWith('$.company.name');
  });

  test('right-clicking the root node opens the menu with the root path', async () => {
    const writeText = stubClipboard();
    render(<PojoViewer data={data} contextMenu={{}} />);

    fireEvent.contextMenu(document.querySelector('svg.lucide-chevron-right') as Element);
    await screen.findByRole('menu');

    fireEvent.click(getMenuItem('Copy JSONPath'));
    expect(writeText).toHaveBeenCalledWith('$');
  });

  test('without contextMenu options no menu opens and markup is unchanged', () => {
    const { container } = render(<PojoViewer data={data} />);
    const markupBefore = container.innerHTML;

    fireEvent.contextMenu(container.firstChild as Element);

    expect(screen.queryByRole('menu')).toBeNull();
    expect(container.innerHTML).toBe(markupBefore);
  });

  test('bookmark star display is unaffected by the context menu wrapper', async () => {
    render(
      <PojoViewer
        data={data}
        contextMenu={{}}
        bookmarkedPaths={new Set([pathArrayToInternalKey(['company', 'name'])])}
      />,
    );

    clickChevron(0);
    clickChevron(1);

    expect(document.querySelector('svg.lucide-star')).not.toBeNull();
  });
});

describe('JsonViewer context menu integration', () => {
  test('forwards contextMenu options to nodes', async () => {
    const writeText = stubClipboard();
    render(<JsonViewer json={JSON.stringify(data)} keyboardShortcuts={false} contextMenu={{}} />);

    clickChevron(0);
    clickChevron(1);

    fireEvent.contextMenu(screen.getByText('Acme'));
    await screen.findByRole('menu');

    fireEvent.click(getMenuItem('Copy JSON Pointer'));
    expect(writeText).toHaveBeenCalledWith('/company/name');
  });
});
