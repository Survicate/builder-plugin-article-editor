import { describe, expect, it } from 'vitest';
import { stopsInteractiveEvents } from '@/extensions/blockFields';

const eventTargeting = (target: EventTarget | null): Event => {
  const event = new Event('keydown');

  Object.defineProperty(event, 'target', { value: target });

  return event;
};

describe('stopsInteractiveEvents', () => {
  it.each(['input', 'textarea', 'button', 'select', 'label'])(
    'keeps %s events away from the editor',
    (tag) => {
      expect(stopsInteractiveEvents(eventTargeting(document.createElement(tag)))).toBe(true);
    },
  );

  it('keeps events from elements nested inside a control away from the editor', () => {
    const label = document.createElement('label');
    const text = document.createElement('span');

    label.append(text);

    expect(stopsInteractiveEvents(eventTargeting(text))).toBe(true);
  });

  it('lets the editor handle events on the block itself', () => {
    expect(stopsInteractiveEvents(eventTargeting(document.createElement('div')))).toBe(false);
    expect(stopsInteractiveEvents(eventTargeting(document.createElement('img')))).toBe(false);
  });

  it('lets the editor handle events without an element target', () => {
    expect(stopsInteractiveEvents(eventTargeting(null))).toBe(false);
  });
});
