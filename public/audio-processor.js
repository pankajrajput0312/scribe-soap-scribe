class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 0;
    this.audioBuffer = new Float32Array(16000); // 1 second of audio at 16kHz
    this.lastSendTime = 0;
    this.sampleCount = 0;
    this.chunks = 0;
    this.port.postMessage({ type: 'debug', message: 'AudioProcessor initialized' });
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || !input.length) {
      this.port.postMessage({
        type: 'debug',
        message: 'No input data received'
      });
      return true;
    }

    const inputChannel = input[0];
    let maxAmplitude = 0;

    // Normalize and convert to 16-bit PCM
    const pcmData = new Int16Array(inputChannel.length);
    for (let i = 0; i < inputChannel.length; i++) {
      // Normalize audio data to [-1, 1] range
      const normalizedSample = Math.max(-1, Math.min(1, inputChannel[i]));
      // Scale to 16-bit range [-32768, 32767]
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

    // Send buffer every 100ms if we have data
    if (this.bufferSize > 0 && (currentTimeMs - this.lastSendTime >= 100)) {
      // Only send if we detect actual audio (not silence)
      if (maxAmplitude > 0.01) {
        const audioToSend = this.audioBuffer.slice(0, this.bufferSize);
        
        // Convert buffer to 16-bit PCM with proper normalization
        const pcmBuffer = new Int16Array(audioToSend.length);
        let maxPcmValue = 0;
        
        for (let i = 0; i < audioToSend.length; i++) {
          // Normalize and convert to 16-bit PCM
          const normalizedSample = Math.max(-1, Math.min(1, audioToSend[i]));
          const pcmValue = Math.round(normalizedSample * 32767);
          pcmBuffer[i] = pcmValue;
          maxPcmValue = Math.max(maxPcmValue, Math.abs(pcmValue));
        }

        // Only send if we have significant audio
        if (maxPcmValue > 1000) {
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
              maxPcmValue
            }
          }, [pcmBuffer.buffer]);

          // Log debug info
          this.port.postMessage({
            type: 'debug',
            message: 'Audio stats',
            stats: {
              maxAmplitude,
              maxPcmValue,
              bufferSize: this.bufferSize,
              sampleRate,
              duration: this.bufferSize / sampleRate,
              currentTimeMs
            }
          });
        } else {
          this.port.postMessage({
            type: 'debug',
            message: 'Audio too quiet',
            stats: {
              maxPcmValue,
              threshold: 1000
            }
          });
        }
      } else {
        this.port.postMessage({
          type: 'debug',
          message: 'Skipping silent audio',
          amplitude: maxAmplitude
        });
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