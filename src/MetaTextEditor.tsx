import React from 'react';
import '@/editor/editor-styles.css';

export interface MetaTextEditorProps {
  field?: {
    options?: {
      recommendedMax?: number;
      recommendedMin?: number;
    };
  };
  onChange: (value: string) => void;
  value?: string;
}

export const MetaTextEditor = ({ field, onChange, value }: MetaTextEditorProps) => {
  const text = value ?? '';
  const min = field?.options?.recommendedMin;
  const max = field?.options?.recommendedMax;
  const hasRange = min !== undefined && max !== undefined;
  const inRange = hasRange && text.length >= min && text.length <= max;
  const tone =
    !hasRange || !text.length
      ? ''
      : inRange
        ? ' sv-meta-text__count--ok'
        : ' sv-meta-text__count--warn';

  return (
    <div className="sv-meta-text">
      <textarea
        className="sv-meta-text__input"
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        value={text}
      />
      <span className={`sv-meta-text__count${tone}`}>
        {hasRange
          ? `${text.length} characters (aim for ${min}–${max})`
          : `${text.length} characters`}
      </span>
    </div>
  );
};
