'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { useEffect, useImperativeHandle } from 'react';

interface AutosizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
  value: string;
}

export const AutosizeTextarea = React.forwardRef<HTMLTextAreaElement, AutosizeTextareaProps>(
  (
    { minHeight = 52, maxHeight = Number.MAX_SAFE_INTEGER, value, onChange, className, ...props },
    ref,
  ) => {
    const textAreaRef = React.useRef<HTMLTextAreaElement | null>(null);
    const [trigger, setTrigger] = React.useState(value);

    // Merge forwarded ref
    useImperativeHandle(ref, () => textAreaRef.current!);

    useEffect(() => {
      setTrigger(value);
    }, [value]);

    useEffect(() => {
      const el = textAreaRef.current;
      if (!el) return;

      const offset = 6;
      el.style.minHeight = `${minHeight + offset}px`;
      el.style.maxHeight = `${maxHeight}px`;
      el.style.height = `${minHeight + offset}px`;
      const scrollHeight = el.scrollHeight;
      el.style.height = `${Math.min(scrollHeight + offset, maxHeight)}px`;
    }, [trigger, minHeight, maxHeight]);

    return (
      <textarea
        {...props}
        ref={textAreaRef}
        value={value}
        onChange={(e) => {
          setTrigger(e.target.value);
          onChange?.(e);
        }}
        className={cn(
          'border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring w-full resize-y overflow-x-hidden overflow-y-auto rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
      />
    );
  },
);

AutosizeTextarea.displayName = 'AutosizeTextarea';
