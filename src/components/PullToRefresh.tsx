import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  active: boolean;
  onRefresh: () => void;
}

const THRESHOLD = 80;
const MAX_PULL = 140;

export const PullToRefresh: React.FC<PullToRefreshProps> = ({ active, onRefresh }) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(0);
  const pullingRef = useRef(false);
  const pullDistanceRef = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!active || isRefreshing) return;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    if (scrollTop > 0) return;
    startYRef.current = e.touches[0].clientY;
    pullingRef.current = true;
  }, [active, isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pullingRef.current) return;
    const currentY = e.touches[0].clientY;
    const delta = currentY - startYRef.current;
    if (delta > 0) {
      const damped = Math.min(delta * 0.5, MAX_PULL);
      pullDistanceRef.current = damped;
      setPullDistance(damped);
      if (delta > 10) {
        e.preventDefault();
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!pullingRef.current) return;
    pullingRef.current = false;

    if (pullDistanceRef.current >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(THRESHOLD);
      setTimeout(() => {
        onRefresh();
        setPullDistance(0);
        pullDistanceRef.current = 0;
        setIsRefreshing(false);
      }, 500);
    } else {
      setPullDistance(0);
      pullDistanceRef.current = 0;
    }
  }, [onRefresh]);

  useEffect(() => {
    if (!active) {
      setPullDistance(0);
      pullDistanceRef.current = 0;
      setIsRefreshing(false);
      pullingRef.current = false;
      return;
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [active, handleTouchStart, handleTouchMove, handleTouchEnd]);

  const progress = Math.min(pullDistance / THRESHOLD, 1);
  const shouldShow = pullDistance > 0 || isRefreshing;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center pointer-events-none transition-transform duration-200"
      style={{
        transform: `translateY(${Math.min(pullDistance, THRESHOLD) - 48}px)`,
      }}
    >
      <div
        className={`transition-transform duration-300 ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          opacity: shouldShow ? 1 : 0,
          transform: isRefreshing ? 'scale(1)' : `rotate(${progress * 360}deg) scale(${0.8 + progress * 0.2})`,
        }}
      >
        <RefreshCw
          className="w-6 h-6 transition-colors duration-200"
          style={{ color: `rgb(${80 + progress * 132}, ${65 + progress * 64}, ${64 + progress * 38})` }}
        />
      </div>
    </div>
  );
};
