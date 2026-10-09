import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { act } from 'react-dom/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PostPicker, type PostPickerProps } from '@/postPicker/PostPicker';

let host: HTMLDivElement;

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

const mount = async (props: Partial<PostPickerProps> = {}) => {
  await act(async () => {
    render(
      <PostPicker
        context={{ user: { apiKey: 'key' } }}
        object={new Map([['category', { id: 'cat-surveys' }]])}
        onChange={() => undefined}
        {...props}
      />,
      host,
    );
  });
  await flush();
};

const jsonResponse = (results: unknown[]): Response =>
  ({ json: async () => ({ results }), ok: true }) as unknown as Response;

const surveysPosts = [
  { data: { publishedAt: '2026-10-02', slug: 'iterate-alternatives', title: 'Iterate Alternatives' }, id: 'p1' },
  { data: { publishedAt: '2026-09-22', slug: 'alchemer-alternatives', title: 'Alchemer Alternatives' }, id: 'p2' },
];

const clickButton = async (label: string) => {
  const button = [...host.querySelectorAll('button')].find((entry) =>
    entry.textContent?.includes(label),
  );

  if (!button) throw new Error(`button not found: ${label}`);

  await act(async () => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
  await flush();
};

beforeEach(() => {
  host = document.createElement('div');
  document.body.append(host);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(surveysPosts)));
});

afterEach(() => {
  unmountComponentAtNode(host);
  host.remove();
  vi.unstubAllGlobals();
});

describe('PostPicker', () => {
  it('asks for a category before listing anything', async () => {
    await mount({ object: new Map() });

    expect(host.textContent).toContain("Pick the section's category first");
    expect(fetch).not.toHaveBeenCalled();
  });

  it('lists the posts of the section category once opened', async () => {
    await mount();
    await clickButton('Pick a post');

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;

    expect(calledUrl).toContain('query.data.category.id=cat-surveys');

    const items = [...host.querySelectorAll('.sv-post-picker__item-title')].map(
      (entry) => entry.textContent,
    );

    expect(items).toEqual(['Iterate Alternatives', 'Alchemer Alternatives']);
  });

  it('filters the list with the search box', async () => {
    await mount();
    await clickButton('Pick a post');

    const input = host.querySelector<HTMLInputElement>('.sv-post-picker__search');
    const setNativeValue = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value',
    )?.set;

    if (!input || !setNativeValue) throw new Error('search input not ready');

    await act(async () => {
      setNativeValue.call(input, 'alchemer');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const items = [...host.querySelectorAll('.sv-post-picker__item-title')].map(
      (entry) => entry.textContent,
    );

    expect(items).toEqual(['Alchemer Alternatives']);
  });

  it('writes a blog post reference when a post is chosen', async () => {
    const onChange = vi.fn();

    await mount({ onChange });
    await clickButton('Pick a post');
    await clickButton('Iterate Alternatives');

    expect(onChange).toHaveBeenCalledWith({
      '@type': '@builder.io/core:Reference',
      id: 'p1',
      model: 'blog-post',
    });
  });

  it('clears the pin', async () => {
    const onChange = vi.fn();

    await mount({ onChange, value: { id: 'p1' } });
    await clickButton('Clear');

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('warns when the pinned post sits outside the category', async () => {
    await mount({ value: { id: 'other-category-post' } });
    await clickButton('Change');
    await clickButton('Close');

    expect(host.textContent).toContain("outside the section's category");
  });
});
