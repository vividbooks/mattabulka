import { useEffect, useState, useRef } from 'react';
import { supabase } from '../utils/supabase/client';

// Simple throttle implementation
function simpleThrottle(func: Function, limit: number) {
  let inThrottle: boolean;
  return function(this: any, ...args: any[]) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  }
}

const COLORS = ['#DC2626', '#D97706', '#059669', '#2563EB', '#7C3AED', '#DB2777'];

export function useMultiplayer(userName: string) {
  const [myId] = useState(() => Math.random().toString(36).substr(2, 9));
  const [myColor] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [others, setOthers] = useState<Record<string, { x: number, y: number, color: string, name?: string, lastUpdated: number }>>({});
  
  const channelRef = useRef<any>(null);

  // Cleanup old cursors periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setOthers(prev => {
        const next = { ...prev };
        let changed = false;
        Object.entries(next).forEach(([key, val]) => {
          if (now - val.lastUpdated > 10000) { // Remove if inactive for 10s
            delete next[key];
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!userName) return;

    const channel = supabase.channel('room-1', {
      config: {
        broadcast: { self: false },
        presence: {
          key: myId,
        },
      },
    });

    channel
      .on('broadcast', { event: 'cursor-move' }, ({ payload }) => {
        setOthers((prev) => ({
          ...prev,
          [payload.userId]: { 
            x: payload.x, 
            y: payload.y, 
            color: payload.color, 
            name: payload.name,
            lastUpdated: Date.now() 
          }
        }));
      })
      .on('broadcast', { event: 'element-update' }, ({ payload }) => {
        window.dispatchEvent(new CustomEvent('element-update', { detail: payload }));
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        setOthers((prev) => {
          const next = { ...prev };
          leftPresences.forEach((p: any) => {
             if (p.userId) {
               delete next[p.userId];
             }
          });
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ userId: myId, color: myColor, name: userName });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, myColor, userName]);

  const updateMyPosition = simpleThrottle((x: number, y: number) => {
    if (channelRef.current && userName) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'cursor-move',
        payload: { x, y, userId: myId, color: myColor, name: userName },
      });
    }
  }, 30);

  const broadcastAction = (elementId: string, data: any) => {
    if (channelRef.current && userName) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'element-update',
        payload: { id: elementId, ...data, userId: myId },
      });
    }
  };

  return {
    others,
    updateMyPosition,
    broadcastAction,
    myId
  };
}
