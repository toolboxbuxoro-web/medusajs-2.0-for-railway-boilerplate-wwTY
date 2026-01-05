import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Dimensions, InteractionManager } from 'react-native';

interface LazySectionProps {
  height: number;
  children: React.ReactNode;
  skeleton?: React.ReactNode;
  onImpression?: () => void;
}

const WINDOW_HEIGHT = Dimensions.get('window').height;

/**
 * LazySection component that defers rendering of its children until it enters the viewport.
 * Matches real layout dimensions with a fixed-height placeholder or skeleton initially.
 */
export function LazySection({ height, children, skeleton, onImpression }: LazySectionProps) {
  const [shouldRender, setShouldRender] = useState(false);
  const containerRef = useRef<View>(null);
  const impressionTracked = useRef(false);

  const checkVisibility = useCallback(() => {
    if (shouldRender && impressionTracked.current) return;

    // Use measureInWindow to get reliable absolute position on the screen
    containerRef.current?.measureInWindow((x, y, width, h) => {
      // If measurement fails (y === undefined), we fallback to rendering children immediately to prevent invisible content.
      // If the component's top position (y) is less than the window height + a small buffer (200px), it enters our "active area".
      if (y === undefined || y < WINDOW_HEIGHT + 200) {
        // Track impression once
        if (!impressionTracked.current) {
          impressionTracked.current = true;
          onImpression?.();
        }

        // Defer rendering until interactions are finished to keep animations smooth
        InteractionManager.runAfterInteractions(() => {
          setShouldRender(true);
        });
      }
    });
  }, [shouldRender, onImpression]);

  // Initial check on mount + fallback check
  useEffect(() => {
    if (shouldRender) return;

    // Schedule a visibility check
    const interaction = InteractionManager.runAfterInteractions(() => {
      checkVisibility();
    });

    return () => interaction.cancel();
  }, [checkVisibility, shouldRender]);

  if (shouldRender) {
    return <>{children}</>;
  }

  return (
    <View 
      ref={containerRef}
      onLayout={checkVisibility}
      style={{ height, overflow: 'hidden' }}
    >
      {skeleton || <View style={{ flex: 1, backgroundColor: '#F9FAFB' }} />}
    </View>
  );
}
