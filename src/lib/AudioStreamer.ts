export class AudioStreamer {
  private inputAudioCtx: AudioContext | null = null;
  private outputAudioCtx: AudioContext | null = null;
  private ms: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dummyNode: GainNode | null = null;
  private wssWs: WebSocket | null = null;

  private nextStartTime = 0;

  public isRecording = false;

  public async start(ws: WebSocket) {
    this.wssWs = ws;
    this.inputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    this.nextStartTime = this.outputAudioCtx.currentTime;

    this.ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.inputAudioCtx.createMediaStreamSource(this.ms);
    
    // We use a small buffer size to reduce latency
    this.processor = this.inputAudioCtx.createScriptProcessor(4096, 1, 1);
    
    // Connect to destination with 0 gain to ensure processor runs on all browsers without audio feedback
    this.dummyNode = this.inputAudioCtx.createGain();
    this.dummyNode.gain.value = 0;
    
    this.processor.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const channelData = e.inputBuffer.getChannelData(0);
      const base64 = this.pcmToBase64(channelData);
      if (this.wssWs?.readyState === WebSocket.OPEN) {
         this.wssWs.send(JSON.stringify({ audio: base64 }));
      }
    };

    this.source.connect(this.processor);
    this.processor.connect(this.dummyNode);
    this.dummyNode.connect(this.inputAudioCtx.destination);
    
    this.isRecording = true;
  }

  public stop() {
    this.isRecording = false;
    if (this.processor) {
      this.processor.disconnect();
      this.processor.onaudioprocess = null;
    }
    if (this.source) this.source.disconnect();
    if (this.dummyNode) this.dummyNode.disconnect();
    if (this.ms) {
      this.ms.getTracks().forEach(track => track.stop());
    }
    if (this.inputAudioCtx) this.inputAudioCtx.close();
    if (this.outputAudioCtx) this.outputAudioCtx.close();
    
    this.inputAudioCtx = null;
    this.outputAudioCtx = null;
    this.ms = null;
    this.processor = null;
    this.source = null;
    this.dummyNode = null;
  }

  public playAudioChunk(base64Audio: string) {
    if (!this.outputAudioCtx) return;
    
    const pcmData = this.base64ToPcm(base64Audio);
    const audioBuffer = this.outputAudioCtx.createBuffer(1, pcmData.length, 24000);
    audioBuffer.getChannelData(0).set(pcmData);

    const source = this.outputAudioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.outputAudioCtx.destination);

    // Gapless playback
    const currentTime = this.outputAudioCtx.currentTime;
    if (this.nextStartTime < currentTime) {
        this.nextStartTime = currentTime + 0.05; // slight buffer for under-runs
    }
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
  }

  public stopPlayback() {
     // Restart output context to clear pending queued audio chunks instantly
     if (this.outputAudioCtx) {
         this.outputAudioCtx.close();
         this.outputAudioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
         this.nextStartTime = this.outputAudioCtx.currentTime;
     }
  }

  public getPlaybackState(): 'speaking' | 'idle' {
      if (!this.outputAudioCtx) return 'idle';
      // If we still have enqueued audio to play in the future, we are speaking
      return (this.nextStartTime > this.outputAudioCtx.currentTime) ? 'speaking' : 'idle';
  }

  private pcmToBase64(pcmData: Float32Array): string {
    const buffer = new ArrayBuffer(pcmData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcmData.length; i++) {
        let s = Math.max(-1, Math.min(1, pcmData[i]));
        view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToPcm(base64: string): Float32Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    const view = new DataView(bytes.buffer);
    const pcmResult = new Float32Array(bytes.length / 2);
    for (let i = 0; i < pcmResult.length; i++) {
        pcmResult[i] = view.getInt16(i * 2, true) / 32768; 
    }
    return pcmResult;
  }
}
