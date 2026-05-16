import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface BoardScrollbarsProps {
  viewport: Viewport;
  svgViewportSize: { width: number; height: number };
  contentBounds: Bounds | null;
  onViewportChange: (updater: (current: Viewport) => Viewport) => void;
  onInteractionStart?: () => void;
}

const MIN_THUMB_PX = 28;
const WORLD_PADDING = 600;

interface AxisMetrics {
  trackPx: number;
  thumbStartPx: number;
  thumbSizePx: number;
  scrollMin: number;
  scrollMax: number;
  visibleStart: number;
  visibleSize: number;
}

function computeAxisMetrics(
  visibleStart: number,
  visibleSize: number,
  contentStart: number,
  contentSize: number,
  trackPx: number,
): AxisMetrics {
  const paddedContentStart = contentStart - WORLD_PADDING;
  const paddedContentEnd = contentStart + contentSize + WORLD_PADDING;
  const scrollMin = Math.min(paddedContentStart, visibleStart);
  const scrollMax = Math.max(paddedContentEnd, visibleStart + visibleSize);
  const scrollSize = Math.max(scrollMax - scrollMin, 1);
  const ratioVisible = Math.min(1, Math.max(0, visibleSize / scrollSize));
  const rawThumb = ratioVisible * trackPx;
  const thumbSizePx = Math.max(MIN_THUMB_PX, Math.min(trackPx, rawThumb));
  const offset = visibleStart - scrollMin;
  const ratioOffset = Math.min(1, Math.max(0, offset / scrollSize));
  const maxThumbStart = Math.max(0, trackPx - thumbSizePx);
  const thumbStartPx = Math.min(maxThumbStart, ratioOffset * trackPx);
  return {
    trackPx,
    thumbStartPx,
    thumbSizePx,
    scrollMin,
    scrollMax,
    visibleStart,
    visibleSize,
  };
}

export function BoardScrollbars({
  viewport,
  svgViewportSize,
  contentBounds,
  onViewportChange,
  onInteractionStart,
}: BoardScrollbarsProps) {
  const horizontalTrackRef = useRef<HTMLDivElement | null>(null);
  const verticalTrackRef = useRef<HTMLDivElement | null>(null);

  const [horizontalTrackPx, setHorizontalTrackPx] = useState(0);
  const [verticalTrackPx, setVerticalTrackPx] = useState(0);

  const [draggingAxis, setDraggingAxis] = useState<'x' | 'y' | null>(null);

  useLayoutEffect(() => {
    const horizontal = horizontalTrackRef.current;
    const vertical = verticalTrackRef.current;
    if (!horizontal || !vertical) return;

    const sync = () => {
      setHorizontalTrackPx(horizontal.clientWidth);
      setVerticalTrackPx(vertical.clientHeight);
    };

    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(horizontal);
    ro.observe(vertical);
    window.addEventListener('resize', sync);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, []);

  const visibleWorldWidth = svgViewportSize.width > 0 ? svgViewportSize.width / viewport.scale : 0;
  const visibleWorldHeight = svgViewportSize.height > 0 ? svgViewportSize.height / viewport.scale : 0;

  const horizontalMetrics = useMemo(() => {
    if (horizontalTrackPx <= 0 || visibleWorldWidth <= 0) return null;
    const cb = contentBounds ?? { x: viewport.x, y: viewport.y, width: visibleWorldWidth, height: visibleWorldHeight };
    return computeAxisMetrics(viewport.x, visibleWorldWidth, cb.x, cb.width, horizontalTrackPx);
  }, [contentBounds, horizontalTrackPx, viewport.x, viewport.y, visibleWorldHeight, visibleWorldWidth]);

  const verticalMetrics = useMemo(() => {
    if (verticalTrackPx <= 0 || visibleWorldHeight <= 0) return null;
    const cb = contentBounds ?? { x: viewport.x, y: viewport.y, width: visibleWorldWidth, height: visibleWorldHeight };
    return computeAxisMetrics(viewport.y, visibleWorldHeight, cb.y, cb.height, verticalTrackPx);
  }, [contentBounds, verticalTrackPx, viewport.x, viewport.y, visibleWorldHeight, visibleWorldWidth]);

  const handleThumbPointerDown = useCallback(
    (axis: 'x' | 'y') =>
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        const metrics = axis === 'x' ? horizontalMetrics : verticalMetrics;
        if (!metrics) return;
        const target = event.currentTarget;
        target.setPointerCapture(event.pointerId);
        onInteractionStart?.();
        setDraggingAxis(axis);

        const startPointer = axis === 'x' ? event.clientX : event.clientY;
        const startThumbPx = metrics.thumbStartPx;
        const trackPx = metrics.trackPx;
        const scrollSize = Math.max(metrics.scrollMax - metrics.scrollMin, 1);

        const handleMove = (moveEvent: PointerEvent) => {
          if (moveEvent.pointerId !== event.pointerId) return;
          const delta = (axis === 'x' ? moveEvent.clientX : moveEvent.clientY) - startPointer;
          const maxThumbStart = Math.max(0, trackPx - metrics.thumbSizePx);
          const nextThumbPx = Math.max(0, Math.min(maxThumbStart, startThumbPx + delta));
          const ratio = trackPx > 0 ? nextThumbPx / trackPx : 0;
          const nextStart = metrics.scrollMin + ratio * scrollSize;
          onViewportChange((current) => (axis === 'x' ? { ...current, x: nextStart } : { ...current, y: nextStart }));
        };

        const handleUp = (upEvent: PointerEvent) => {
          if (upEvent.pointerId !== event.pointerId) return;
          target.releasePointerCapture(event.pointerId);
          target.removeEventListener('pointermove', handleMove);
          target.removeEventListener('pointerup', handleUp);
          target.removeEventListener('pointercancel', handleUp);
          setDraggingAxis((current) => (current === axis ? null : current));
        };

        target.addEventListener('pointermove', handleMove);
        target.addEventListener('pointerup', handleUp);
        target.addEventListener('pointercancel', handleUp);
      },
    [horizontalMetrics, onInteractionStart, onViewportChange, verticalMetrics],
  );

  const handleTrackPointerDown = useCallback(
    (axis: 'x' | 'y') =>
      (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return;
        const metrics = axis === 'x' ? horizontalMetrics : verticalMetrics;
        if (!metrics) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const local = axis === 'x' ? event.clientX - rect.left : event.clientY - rect.top;
        if (local >= metrics.thumbStartPx && local <= metrics.thumbStartPx + metrics.thumbSizePx) {
          return;
        }
        event.preventDefault();
        onInteractionStart?.();
        const direction = local < metrics.thumbStartPx ? -1 : 1;
        const pageStep = metrics.visibleSize * 0.9 * direction;
        onViewportChange((current) =>
          axis === 'x' ? { ...current, x: current.x + pageStep } : { ...current, y: current.y + pageStep },
        );
      },
    [horizontalMetrics, onInteractionStart, onViewportChange, verticalMetrics],
  );

  return (
    <>
      <div
        ref={horizontalTrackRef}
        className={`board-scrollbar board-scrollbar--horizontal${draggingAxis === 'x' ? ' is-dragging' : ''}`}
        role="presentation"
        onPointerDown={handleTrackPointerDown('x')}
      >
        {horizontalMetrics ? (
          <div
            className="board-scrollbar__thumb"
            role="slider"
            aria-label="Vodorovný posuvník plátna"
            aria-orientation="horizontal"
            tabIndex={-1}
            style={{
              left: `${horizontalMetrics.thumbStartPx}px`,
              width: `${horizontalMetrics.thumbSizePx}px`,
            }}
            onPointerDown={handleThumbPointerDown('x')}
          />
        ) : null}
      </div>
      <div
        ref={verticalTrackRef}
        className={`board-scrollbar board-scrollbar--vertical${draggingAxis === 'y' ? ' is-dragging' : ''}`}
        role="presentation"
        onPointerDown={handleTrackPointerDown('y')}
      >
        {verticalMetrics ? (
          <div
            className="board-scrollbar__thumb"
            role="slider"
            aria-label="Svislý posuvník plátna"
            aria-orientation="vertical"
            tabIndex={-1}
            style={{
              top: `${verticalMetrics.thumbStartPx}px`,
              height: `${verticalMetrics.thumbSizePx}px`,
            }}
            onPointerDown={handleThumbPointerDown('y')}
          />
        ) : null}
      </div>
    </>
  );
}
