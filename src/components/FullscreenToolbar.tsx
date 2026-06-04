import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Home, RefreshCw, Minimize, Maximize, Search, Circle } from 'lucide-react';

interface FullscreenToolbarProps {
  active: boolean;
  isFullscreen?: boolean;
  onNavigate: (path: string) => void;
  onToggleFullscreen: () => void;
  onOpenSearch: () => void;
}

const BALL_SIZE = 48;
const EDGE_MARGIN = 12;
const PEEK_SIZE = 20; // visible portion when semi-hidden

export const FullscreenToolbar: React.FC<FullscreenToolbarProps> = ({
  active,
  isFullscreen = false,
  onNavigate,
  onToggleFullscreen,
  onOpenSearch,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [snapped, setSnapped] = useState<'left' | 'right'>('right');
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const ballRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  // Initialize position at bottom-right (semi-hidden)
  useEffect(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setPosition({
      x: vw - PEEK_SIZE,
      y: vh - BALL_SIZE - EDGE_MARGIN - 80,
    });
  }, []);

  // Close menu on escape key
  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [active]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startPosRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    hasMovedRef.current = false;
    setDragging(true);
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    const dx = Math.abs(e.clientX - startPosRef.current.x - position.x);
    const dy = Math.abs(e.clientY - startPosRef.current.y - position.y);
    if (dx > 3 || dy > 3) {
      hasMovedRef.current = true;
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const newX = Math.max(0, Math.min(vw - BALL_SIZE, e.clientX - startPosRef.current.x));
    const newY = Math.max(0, Math.min(vh - BALL_SIZE, e.clientY - startPosRef.current.y));
    setPosition({ x: newX, y: newY });
  }, [dragging, position]);

  const handlePointerUp = useCallback(() => {
    setDragging(false);
    if (!hasMovedRef.current) {
      // Tap: toggle menu
      setMenuOpen(prev => !prev);
    } else {
      // Drag end: snap to nearest edge (semi-hidden)
      const vw = window.innerWidth;
      const midX = vw / 2;
      const newSnapped = position.x + BALL_SIZE / 2 < midX ? 'left' : 'right';
      setSnapped(newSnapped);
      setPosition(prev => ({
        x: newSnapped === 'left' ? -(BALL_SIZE - PEEK_SIZE) : vw - PEEK_SIZE,
        y: prev.y,
      }));
    }
  }, [position]);

  const handleAction = useCallback((action: () => void) => {
    setMenuOpen(false);
    action();
  }, []);

  if (!active) return null;

  const isDark = document.documentElement.classList.contains('dark');
  const bgColor = isDark ? '#1E293B' : '#4A4A40';
  const textColor = isDark ? '#F8FAFC' : '#FFFFFF';
  const accentColor = '#D48166';

  const menuItems = [
    { icon: <Home className="w-[18px] h-[18px]" />, action: () => onNavigate('/explore') },
    { icon: <RefreshCw className="w-[18px] h-[18px]" />, action: () => window.location.reload() },
    { icon: <Search className="w-[18px] h-[18px]" />, action: onOpenSearch },
    { icon: isFullscreen ? <Minimize className="w-[18px] h-[18px]" /> : <Maximize className="w-[18px] h-[18px]" />, action: onToggleFullscreen },
  ];

  // Arc params: items fan out on the LEFT side of the ball
  const total = menuItems.length;
  // Angles in standard math coords: 120° (bottom-left) → 240° (top-left)
  const arcStart = (2 / 3) * Math.PI;   // 120° — bottom-most
  const arcEnd = (4 / 3) * Math.PI;     // 240° — top-most
  const arcStep = (arcEnd - arcStart) / (total - 1);
  const distance = 62;

  return (
    <>
      {/* Backdrop when menu is open */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-[200]"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Menu items — arc on the left side of the ball */}
      <div
        className="fixed z-[210] pointer-events-none"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          width: BALL_SIZE,
          height: BALL_SIZE,
        }}
      >
        {menuItems.map((item, i) => {
          // Item 0 = bottom (appears first on expand), Item N-1 = top (appears last)
          const angle = arcStart + arcStep * i;
          const tx = Math.cos(angle) * distance;  // negative → left of ball
          const ty = Math.sin(angle) * distance;  // positive=below, negative=above

          return (
            <button
              key={i}
              onClick={() => handleAction(item.action)}
              className="absolute pointer-events-auto transition-all duration-300 ease-out"
              style={{
                left: BALL_SIZE / 2,
                top: BALL_SIZE / 2,
                transform: menuOpen
                  ? `translate(${tx}px, ${ty}px) scale(1)`
                  : `translate(0px, 0px) scale(0.2)`,
                opacity: menuOpen ? 1 : 0,
                // Expand: bottom→top clockwise (item 0 first, item N-1 last)
                // Collapse: top→bottom counter-clockwise (item N-1 first, item 0 last)
                transitionDelay: menuOpen ? `${i * 50}ms` : `${(total - 1 - i) * 40}ms`,
              }}
            >
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg"
                style={{ backgroundColor: bgColor, color: textColor }}
              >
                {item.icon}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main ball */}
      <div
        ref={ballRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="fixed z-[210] rounded-full flex items-center justify-center shadow-lg select-none transition-all duration-300 ease-out"
        style={{
          width: BALL_SIZE,
          height: BALL_SIZE,
          left: `${position.x}px`,
          top: `${position.y}px`,
          // Shift ball down so arc items wrap around it from above
          transform: menuOpen
            ? `translate(${distance * 0.15}px, ${distance * 0.3}px)`
            : (snapped && !dragging && !hovered)
              ? undefined
              : `translateX(${snapped === 'left' ? PEEK_SIZE - EDGE_MARGIN : -(PEEK_SIZE - EDGE_MARGIN)}px)`,
          backgroundColor: bgColor,
          color: textColor,
          cursor: dragging ? 'grabbing' : 'grab',
          opacity: snapped && !menuOpen && !dragging && !hovered ? 0.55 : 1,
          touchAction: 'none',
        }}
      >
        <span
          className="transition-transform duration-300"
          style={{
            transform: menuOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <Circle
            className="w-6 h-6"
            style={{
              fill: menuOpen ? 'transparent' : accentColor,
              stroke: menuOpen ? accentColor : 'transparent',
              strokeWidth: 2,
            }}
          />
        </span>
      </div>
    </>
  );
};
