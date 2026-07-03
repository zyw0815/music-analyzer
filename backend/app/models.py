from typing import Dict, List, Optional
from pydantic import BaseModel


# --- BasicInfo nested models ---

class FileInfo(BaseModel):
    name: str
    size_bytes: int
    format: str
    encoder: Optional[str] = None
    md5: Optional[str] = None


class AudioInfo(BaseModel):
    codec: str
    sample_rate_hz: int
    bit_depth: int
    channels: int
    channel_mode: str
    bitrate_kbps: Optional[int] = None
    bitrate_mode: str = "CBR"


class TimingInfo(BaseModel):
    duration_seconds: float
    start_offset: float = 0.0


class LoudnessInfo(BaseModel):
    peak_db: float
    rms_db: float
    dynamic_range_db: float


class TagsInfo(BaseModel):
    title: Optional[str] = None
    artist: Optional[str] = None
    album: Optional[str] = None
    year: Optional[str] = None
    genre: Optional[str] = None
    track: Optional[str] = None


class DsdInfo(BaseModel):
    dsd_rate: Optional[int] = None
    dsd_channels: Optional[int] = None
    sample_rate_hz: Optional[int] = None
    bits_per_sample: Optional[int] = None
    is_dsd: bool = True


class BasicInfoResponse(BaseModel):
    file: FileInfo
    audio: AudioInfo
    timing: TimingInfo
    loudness: LoudnessInfo
    tags: Dict[str, str] = {}
    dsd: Optional[DsdInfo] = None


# --- Quality models ---

class SubScores(BaseModel):
    bitrate: int
    integrity: int
    quality_detection: int
    channel: int
    spectral: int
    dynamic_range: int
    distortion: int


class QualityDetails(BaseModel):
    bitrate: str
    integrity: str
    quality_detection: str
    channel: str
    spectral: str
    dynamic_range: str
    distortion: str


class QualityResponse(BaseModel):
    overall_score: int
    grade: str
    sub_scores: SubScores
    details: QualityDetails


# --- Spectrum models ---

class SpectrumData(BaseModel):
    frequencies: List[float]
    magnitude_db: List[float]
    peak_hold_db: List[float]


class SpectrogramData(BaseModel):
    frequencies: List[float]
    times: List[float]
    magnitude_db: List[List[float]]


class FrequencyBand(BaseModel):
    label: str
    energy_db: float


class FrequencyDistribution(BaseModel):
    bands: List[FrequencyBand]


class SpectrumResponse(BaseModel):
    spectrum: SpectrumData
    spectrogram: SpectrogramData
    frequency_distribution: FrequencyDistribution


# --- Waveform models ---

class WaveformData(BaseModel):
    samples: List[float]
    sample_rate: int
    duration_seconds: float


class RmsEnvelope(BaseModel):
    values: List[float]
    times: List[float]


class ClippingRegion(BaseModel):
    start_sample: int
    end_sample: int
    length: int


class SilenceRegion(BaseModel):
    start_time: float
    end_time: float
    duration: float


class WaveformResponse(BaseModel):
    waveform: WaveformData
    rms_envelope: RmsEnvelope
    clipping_regions: List[ClippingRegion]
    silence_regions: List[SilenceRegion]


# --- Channel models ---

class ChannelSpectrum(BaseModel):
    frequencies: List[float]
    magnitude_db: List[float]


class ChannelResponse(BaseModel):
    phase_correlation: float
    channel_balance_db: float
    left_spectrum: ChannelSpectrum
    right_spectrum: ChannelSpectrum
    mid_spectrum: ChannelSpectrum
    side_spectrum: ChannelSpectrum
    stereo_width: float
    is_mono: bool


# --- Combined response ---

class FullAnalysisResponse(BaseModel):
    file_id: str
    basic_info: BasicInfoResponse
    quality: QualityResponse
    spectrum: SpectrumResponse
    waveform: WaveformResponse
    channel: ChannelResponse
