import io
import wave

import numpy as np
import librosa


class PlayerConverter:
    def __init__(self, file_path):
        self.file_path = file_path

    def to_wav_bytes(self):
        y, sr = librosa.load(self.file_path, sr=None, mono=False)
        if y.ndim == 1:
            y = np.expand_dims(y, 0)
        n_channels, n_samples = y.shape
        y_int16 = (y * 32767).clip(-32768, 32767).astype(np.int16)
        buf = io.BytesIO()
        with wave.open(buf, "w") as wf:
            wf.setnchannels(n_channels)
            wf.setsampwidth(2)
            wf.setframerate(sr)
            interleaved = np.empty(n_channels * n_samples, dtype=np.int16)
            for ch in range(n_channels):
                interleaved[ch::n_channels] = y_int16[ch]
            wf.writeframes(interleaved.tobytes())
        return buf.getvalue()
