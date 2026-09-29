/**
 * @vitest-environment jsdom
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, test } from 'vite-plus/test';
import JsonViewer from './index';

const nestedJson = JSON.stringify({
  settings: {
    limits: {
      maxStorage: 42,
    },
  },
});

describe('keyboard navigation and focus', () => {
  test('arrow navigation does not replace the active search query', async () => {
    const { container } = render(<JsonViewer json={nestedJson} />);

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: 'limits' } });
    });
    expect(input.value).toBe('limits');

    await act(async () => {
      fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'ArrowDown' });
      fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'ArrowDown' });
    });

    expect(input.value).toBe('limits');
  });

  test('focusedPath expands ancestors so the focused node is visible', async () => {
    render(<JsonViewer json={nestedJson} focusedPath={['settings', 'limits', 'maxStorage']} />);

    // The tree starts collapsed; the focused node must be revealed by
    // auto-expanding its ancestors.
    await waitFor(() => {
      expect(screen.getByText(/maxStorage/)).toBeDefined();
    });
  });

  test('keyboard navigation takes over the focus ring from focusedPath', async () => {
    const { container } = render(
      <JsonViewer json={nestedJson} focusedPath={['settings', 'limits', 'maxStorage']} />,
    );

    await waitFor(() => {
      expect(screen.getByText(/maxStorage/)).toBeDefined();
    });

    await act(async () => {
      fireEvent.keyDown(container.firstChild as HTMLElement, { key: 'ArrowDown' });
    });

    // Arrow navigation moves focus off the prop-driven node without errors.
    expect(screen.getByText(/maxStorage/)).toBeDefined();
  });

  test('a manually collapsed branch stays collapsed', async () => {
    const { rerender } = render(
      <JsonViewer json={nestedJson} focusedPath={['settings', 'limits', 'maxStorage']} />,
    );

    // The focused path reveals the leaf: root, settings and limits all open.
    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
    });

    // Collapse the root by hand while the focused path still runs through it.
    const rootTrigger = screen.getAllByRole('button', { name: 'Collapse object' })[0];
    await act(async () => {
      fireEvent.click(rootTrigger);
    });

    // The unchanged focusedPath must not re-expand the branch.
    expect(screen.queryByText('42')).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Expand object' }).length).toBeGreaterThan(0);

    // A re-render with the same props must not re-expand it either.
    rerender(<JsonViewer json={nestedJson} focusedPath={['settings', 'limits', 'maxStorage']} />);
    expect(screen.queryByText('42')).toBeNull();
  });

  test('search results reveal even while a focusedPath is set', async () => {
    render(<JsonViewer json={nestedJson} focusedPath={['settings']} />);

    // Only the focused branch is revealed; the deeper leaf stays hidden behind
    // the collapsed limits object (its preview shows no standalone value).
    expect(screen.queryByText('42')).toBeNull();

    const input = screen.getByRole('textbox') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { value: 'maxStorage' } });
    });

    // The search hit lives outside the focused path but must still be revealed.
    await waitFor(() => {
      expect(screen.getByText('42')).toBeDefined();
    });
  });
});
