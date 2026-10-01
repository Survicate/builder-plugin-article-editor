import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MetaTextEditor } from '@/MetaTextEditor';

let host: HTMLDivElement;

const mount = (element: React.ReactElement) => {
  act(() => {
    render(element, host);
  });
};

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
});

afterEach(() => {
  unmountComponentAtNode(host);
  host.remove();
});

describe('MetaTextEditor', () => {
  it('counts the characters and spells out the recommended range', () => {
    mount(
      <MetaTextEditor
        field={{ options: { recommendedMax: 60, recommendedMin: 30 } }}
        onChange={() => undefined}
        value="How to Write Better CSAT Questions"
      />,
    );

    const count = host.querySelector('.sv-meta-text__count');

    expect(count?.textContent).toBe('34 characters (aim for 30-60)');
    expect(count?.className).toContain('sv-meta-text__count--ok');
  });

  it('warns when the text falls outside the recommended range', () => {
    mount(
      <MetaTextEditor
        field={{ options: { recommendedMax: 60, recommendedMin: 30 } }}
        onChange={() => undefined}
        value="Too short"
      />,
    );

    expect(host.querySelector('.sv-meta-text__count')?.className).toContain(
      'sv-meta-text__count--warn',
    );
  });

  it('shows a plain count when the field sets no range', () => {
    mount(<MetaTextEditor onChange={() => undefined} value="Hello" />);

    expect(host.querySelector('.sv-meta-text__count')?.textContent).toBe('5 characters');
  });

  it('hands edits back to Builder', () => {
    const onChange = vi.fn();

    mount(<MetaTextEditor onChange={onChange} value="" />);

    const input = host.querySelector<HTMLTextAreaElement>('.sv-meta-text__input');

    if (!input) throw new Error('The editor did not render its textarea');

    act(() => {
      const valueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value',
      )?.set;

      valueSetter?.call(input, 'New title');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    expect(onChange).toHaveBeenCalledWith('New title');
  });
});
