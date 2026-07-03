import pytest
import numpy as np
import struct
import wave
from pathlib import Path


@pytest.fixture
def fixtures_dir():
    return Path(__file__).parent / "fixtures"


@pytest.fixture
def tmp_dir():
    d = Path(__file__).resolve().parents[1] / "tmp" / "test"
    d.mkdir(parents=True, exist_ok=True)
    return d


@pytest.fixture
def sample_wav_mono(tmp_dir):
    """Generate a 1-second 440Hz mono WAV file."""
    path = tmp_dir / "test_mono.wav"
    sr = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    samples = (np.sin(2 * np.pi * 440 * t) * 0.8 * 32767).astype(np.int16)
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path


@pytest.fixture
def sample_wav_stereo(tmp_dir):
    """Generate a 1-second 440Hz stereo WAV file (L=440Hz, R=880Hz)."""
    path = tmp_dir / "test_stereo.wav"
    sr = 44100
    duration = 1.0
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    left = (np.sin(2 * np.pi * 440 * t) * 0.8 * 32767).astype(np.int16)
    right = (np.sin(2 * np.pi * 880 * t) * 0.6 * 32767).astype(np.int16)
    stereo = np.column_stack([left, right]).flatten()
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(stereo.tobytes())
    return path


@pytest.fixture
def sample_wav_clipping(tmp_dir):
    """Generate a 1-second WAV with clipping (samples at max)."""
    path = tmp_dir / "test_clipping.wav"
    sr = 44100
    samples = np.ones(int(sr * 0.5), dtype=np.int16) * 32767
    samples = np.concatenate([samples, np.ones(int(sr * 0.5), dtype=np.int16) * -32767])
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path


@pytest.fixture
def sample_wav_silence(tmp_dir):
    """Generate a 2-second WAV with 0.5s signal, 1s silence, 0.5s signal."""
    path = tmp_dir / "test_silence.wav"
    sr = 44100
    t_half = np.linspace(0, 0.5, int(sr * 0.5), endpoint=False)
    tone = (np.sin(2 * np.pi * 440 * t_half) * 0.5 * 32767).astype(np.int16)
    silent = np.zeros(int(sr * 1.0), dtype=np.int16)
    samples = np.concatenate([tone, silent, tone])
    with wave.open(str(path), "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(samples.tobytes())
    return path
