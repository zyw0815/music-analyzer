import pytest
from app.analyzers.basic_info import BasicInfoAnalyzer


class TestBasicInfo:
    def test_returns_dict(self, sample_wav_mono):
        analyzer = BasicInfoAnalyzer(str(sample_wav_mono))
        result = analyzer.analyze()
        assert isinstance(result, dict)

    def test_file_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["file"]["name"] == "test_mono.wav"
        assert result["file"]["size_bytes"] > 0
        assert result["file"]["format"] == "WAV"
        assert result["file"]["md5"] is not None
        assert len(result["file"]["md5"]) == 32

    def test_audio_section_mono(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["audio"]["sample_rate_hz"] == 44100
        assert result["audio"]["bit_depth"] == 16
        assert result["audio"]["channels"] == 1
        assert result["audio"]["channel_mode"] == "mono"

    def test_audio_section_stereo(self, sample_wav_stereo):
        result = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        assert result["audio"]["channels"] == 2
        assert result["audio"]["channel_mode"] == "stereo"

    def test_timing_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert 0.9 < result["timing"]["duration_seconds"] < 1.1

    def test_loudness_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["loudness"]["peak_db"] is not None
        assert result["loudness"]["rms_db"] is not None
        assert result["loudness"]["peak_db"] <= 0

    def test_tags_section(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert "tags" in result
        assert isinstance(result["tags"], dict)

    def test_dsd_field_null_for_wav(self, sample_wav_mono):
        result = BasicInfoAnalyzer(str(sample_wav_mono)).analyze()
        assert result["dsd"] is None
