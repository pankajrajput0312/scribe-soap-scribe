class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._lastSendTime = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const audioData = input[0];
    
    // Check if there's actual audio data (not just silence)
    const maxAmplitude = Math.max(...Array.from(audioData).map(Math.abs));
    if (maxAmplitude > 0.01) {
      // Clone the input data
      const audioBuffer = new Float32Array(audioData);
      this._buffer.push(audioBuffer);

      const now = currentTime * 1000; // Convert to milliseconds
      // Send accumulated audio every 100ms
      if (now - this._lastSendTime >= 100 && this._buffer.length > 0) {
        // Combine all buffered audio
        const totalLength = this._buffer.reduce((sum, arr) => sum + arr.length, 0);
        const combinedBuffer = new Float32Array(totalLength);
        let offset = 0;
        
        this._buffer.forEach(buffer => {
          combinedBuffer.set(buffer, offset);
          offset += buffer.length;
        });

        // Send the audio data to the main thread
        this.port.postMessage({
          type: 'audio',
          data: combinedBuffer,
          maxAmplitude,
          timestamp: now
        });

        this._lastSendTime = now;
        this._buffer = [];
      }
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 