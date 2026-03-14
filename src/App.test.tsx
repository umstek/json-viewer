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
});
