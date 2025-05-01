class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 0;
    // Reduce buffer size to 8000 samples (0.5 seconds at 16kHz) for lower latency
    this.audioBuffer = new Float32Array(8000);
    this.lastSendTime = 0;
    this.sampleCount = 0;
    this.chunks = 0;
    // Track continuous silence for VAD
    this.silenceCounter = 0;
    this.port.postMessage({ type: 'debug', message: 'AudioProcessor initialized with optimized settings' });
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input.length) {
      return true;
    }

    const inputChannel = input[0];
    let maxAmplitude = 0;

    // Normalize and convert to 16-bit PCM with optimized loop
    const pcmData = new Int16Array(inputChannel.length);
    for (let i = 0; i < inputChannel.length; i++) {
      const normalizedSample = Math.max(-1, Math.min(1, inputChannel[i]));
      pcmData[i] = Math.round(normalizedSample * 32767);
      maxAmplitude = Math.max(maxAmplitude, Math.abs(normalizedSample));
    }

    // Add to buffer
    if (this.bufferSize + inputChannel.length <= this.audioBuffer.length) {
      this.audioBuffer.set(inputChannel, this.bufferSize);
      this.bufferSize += inputChannel.length;
      this.chunks++;
      this.sampleCount += inputChannel.length;
    }

    // Calculate current time in milliseconds
    const currentTimeMs = currentFrame / sampleRate * 1000;

    // Reduce interval to 50ms for more responsive transcription
    if (this.bufferSize > 0 && (currentTimeMs - this.lastSendTime >= 50)) {
      if (maxAmplitude > 0.01) {
        this.silenceCounter = 0;
        const audioToSend = this.audioBuffer.slice(0, this.bufferSize);
        
        // Optimize PCM conversion with pre-allocated buffer
        const pcmBuffer = new Int16Array(audioToSend.length);
        let maxPcmValue = 0;
        
        for (let i = 0; i < audioToSend.length; i++) {
          const normalizedSample = Math.max(-1, Math.min(1, audioToSend[i]));
          const pcmValue = Math.round(normalizedSample * 32767);
          pcmBuffer[i] = pcmValue;
          maxPcmValue = Math.max(maxPcmValue, Math.abs(pcmValue));
        }

        // Lower threshold for more sensitive voice detection
        if (maxPcmValue > 500) {
          this.port.postMessage({
            type: 'audio',
            data: pcmBuffer,
            maxAmplitude,
            timestamp: currentTimeMs,
            bufferInfo: {
              chunks: this.chunks,
              totalSamples: this.sampleCount,
              sampleRate: sampleRate,
              duration: this.bufferSize / sampleRate,
              maxPcmValue,
              isEndOfSpeech: false
            }
          }, [pcmBuffer.buffer]);
        }
      } else {
        this.silenceCounter++;
        
        // If silence for more than 1 second (20 frames of 50ms)
        if (this.silenceCounter >= 20) {
          this.port.postMessage({
            type: 'audio',
            data: new Int16Array(0),
            maxAmplitude: 0,
            timestamp: currentTimeMs,
            bufferInfo: {
              isEndOfSpeech: true,
              silenceDuration: this.silenceCounter * 50
            }
          });
          this.silenceCounter = 0;
        }
      }

      // Reset buffer
      this.bufferSize = 0;
      this.chunks = 0;
      this.lastSendTime = currentTimeMs;
    }

    return true;
  }
}

registerProcessor('audio-processor', AudioProcessor); 