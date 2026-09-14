/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import App from './App';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe('Demo App', () => {
  describe('Data source toggle', () => {
    test('starts with sample data displayed', () => {
      render(<App />);

      expect(screen.getByRole('heading', { name: 'JSON Viewer Demo' })).not.toBeNull();
      expect(screen.getByText('Load GitHub Repos')).not.toBeNull();
    });

    test('toggles button text when data source changes', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ name: 'test-repo' }]),
      });

      render(<App />);

      const toggleButton = screen.getByRole('button', {
        name: 'Load GitHub Repos',
      });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Show Sample Data' })).not.toBeNull();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Show Sample Data' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Load GitHub Repos' })).not.toBeNull();
      });
    });

    test('restores sample data when toggling back from real data', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([{ id: 1, name: 'fetched-repo' }]),
      });

      render(<App />);

      const toggleButton = screen.getByRole('button', {
        name: 'Load GitHub Repos',
      });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Show Sample Data' })).not.toBeNull();
      });
      expect(global.fetch).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole('button', { name: 'Show Sample Data' }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Load GitHub Repos' })).not.toBeNull();
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('shows loading state during fetch', async () => {
      let resolveFetch: (value: unknown) => void = () => {};
      const fetchPromise = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(
        fetchPromise.then(() => ({
          ok: true,
          json: () => Promise.resolve([]),
        })),
      );

      render(<App />);

      const toggleButton = screen.getByRole('button', {
        name: 'Load GitHub Repos',
      });
      fireEvent.click(toggleButton);

      expect(screen.getByRole('button', { name: 'Loading...' })).not.toBeNull();
      expect(toggleButton.hasAttribute('disabled')).toBe(true);

      resolveFetch!(undefined);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Show Sample Data' })).not.toBeNull();
      });
    });

    test('displays error message on fetch failure', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      render(<App />);

      const toggleButton = screen.getByRole('button', {
        name: 'Load GitHub Repos',
      });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load data/)).not.toBeNull();
      });
    });

    test('clears error when toggling back to sample data', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      render(<App />);

      const toggleButton = screen.getByRole('button', {
        name: 'Load GitHub Repos',
      });
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load data/)).not.toBeNull();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Show Sample Data' }));

      await waitFor(() => {
        expect(screen.queryByText(/Failed to load data/)).toBeNull();
      });
    });
  });

  describe('View switching', () => {
    test('switches between viewer and diff views', () => {
      render(<App />);

      expect(screen.getByRole('button', { name: 'JSON Viewer' })).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Diff Viewer' })).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'Diff Viewer' }));

      expect(screen.getByText('Compare two JSON structures to see what changed')).not.toBeNull();

      fireEvent.click(screen.getByRole('button', { name: 'JSON Viewer' }));

      expect(screen.getByRole('button', { name: 'Load GitHub Repos' })).not.toBeNull();
    });
  });

  describe('Editor Playground', () => {
    /**
     * Clicks the nth chevron trigger to expand a tree level.
     */
    function clickChevron(index: number) {
      const chevrons = document.querySelectorAll('svg.lucide-chevron-right');
      fireEvent.click((chevrons[index] as SVGSVGElement).parentElement as HTMLElement);
    }

    /**
     * The BookmarkManager trigger button (icon-only, so located via its icon).
     */
    function getBookmarkTrigger() {
      return document.querySelector('.lucide-bookmark')?.closest('button') ?? null;
    }

    function openPlayground() {
      fireEvent.click(screen.getByRole('button', { name: 'Editor Playground' }));
    }

    test('renders undo/redo controls, bookmark trigger, and the viewer', () => {
      render(<App />);

      openPlayground();

      expect(screen.getByRole('button', { name: 'Undo' }).hasAttribute('disabled')).toBe(true);
      expect(screen.getByRole('button', { name: 'Redo' }).hasAttribute('disabled')).toBe(true);
      expect(getBookmarkTrigger()).not.toBeNull();
      expect(document.querySelector('svg.lucide-chevron-right')).not.toBeNull();
    });

    test('edits a value and reverts it with the undo button', () => {
      render(<App />);

      openPlayground();

      clickChevron(0); // root object
      clickChevron(1); // company object

      fireEvent.click(screen.getAllByRole('button', { name: 'Edit value' })[0]);
      const input = screen.getByDisplayValue('TechCorp International');
      fireEvent.change(input, { target: { value: 'Renamed Corp' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(screen.getByText('Renamed Corp')).not.toBeNull();
      expect(screen.getByRole('button', { name: 'Undo' }).hasAttribute('disabled')).toBe(false);

      fireEvent.click(screen.getByRole('button', { name: 'Undo' }));

      expect(screen.getByText('TechCorp International')).not.toBeNull();
      expect(screen.queryByText('Renamed Corp')).toBeNull();
    });

    test('bookmarks a node from the context menu and shows the star', async () => {
      render(<App />);

      openPlayground();

      clickChevron(0); // root object
      clickChevron(1); // company object

      fireEvent.contextMenu(screen.getByText('TechCorp International'));
      fireEvent.click(await screen.findByRole('menuitem', { name: 'Bookmark this node' }));

      expect(document.querySelector('svg.lucide-star.fill-yellow-400')).not.toBeNull();
    });
  });
});
