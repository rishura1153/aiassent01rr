import { useState, useEffect, useRef } from 'react';
import { AudioStreamer } from './AudioStreamer';

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export function useLiveSession() {
  const [state, setState] = useState<SessionState>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  
  useEffect(() => {
    // Polling to update state based on audio playback purely for visuals
    const interval = setInterval(() => {
       setState(prev => {
          if (prev === 'disconnected' || prev === 'connecting') return prev;
          if (!audioStreamerRef.current) return prev;
          
          const audioState = audioStreamerRef.current.getPlaybackState();
          return audioState === 'speaking' ? 'speaking' : 'listening';
       });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    setState('connecting');
    try {
      const isSecure = window.location.protocol === 'https:';
      const wsProtocol = isSecure ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const streamer = new AudioStreamer();
      audioStreamerRef.current = streamer;

      ws.onopen = async () => {
        await streamer.start(ws);
        setState('listening'); // Default state after connected
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
           streamer.playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
           streamer.stopPlayback();
        }
        if (msg.toolCall) {
           handleToolCall(ws, msg.toolCall);
        }
      };

      ws.onclose = () => {
        disconnect();
      };

      ws.onerror = () => {
        disconnect();
      };
    } catch (e) {
      console.error(e);
      disconnect();
    }
  };

  const handleToolCall = (ws: WebSocket, toolCall: { name: string, args: any, id: string }) => {
     if (toolCall.name === 'openWebsite') {
        const url = toolCall.args?.url;
        let response = { success: false, message: "No URL provided." };
        if (url) {
           console.log("Opening website: ", url);
           // We use window.open carefully here. Note: popups might be blocked if not directly in user gesture stack! 
           // In AI Studio iframe, this might be restricted, but we will try.
           try {
             window.open(url, "_blank");
             response = { success: true, message: `Successfully opened ${url}` };
           } catch(e) {
             response = { success: false, message: `Failed to open ${url}` };
           }
        }
        
        ws.send(JSON.stringify({
            toolResponse: {
                id: toolCall.id,
                name: toolCall.name,
                response: response
            }
        }));
     }
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (audioStreamerRef.current) {
      audioStreamerRef.current.stop();
      audioStreamerRef.current = null;
    }
    setState('disconnected');
  };

  const toggle = () => {
     if (state === 'disconnected') {
         connect();
     } else {
         disconnect();
     }
  };

  return { state, toggle };
}
