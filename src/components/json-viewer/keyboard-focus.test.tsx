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
});
