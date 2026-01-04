import React from 'react';
import { Text, TextProps } from 'react-native';

interface HighlightedTextProps extends TextProps {
  text: string;
  highlight: string;
  highlightStyle?: string; // Tailwind class
}

export function HighlightedText({ text, highlight, highlightStyle = "font-black text-primary", ...props }: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <Text {...props}>{text}</Text>;
  }

  const parts = text.split(new RegExp(`(${highlight})`, 'gi'));

  return (
    <Text {...props}>
      {parts.map((part, i) => (
        part.toLowerCase() === highlight.toLowerCase() ? (
          <Text key={i} className={highlightStyle}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      ))}
    </Text>
  );
}
