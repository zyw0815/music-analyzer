from app.analyzers.basic_info import BasicInfoAnalyzer
from app.analyzers.context import AnalysisContext


def write_minimal_dsf(path, channels=2, sample_rate=2822400, bits_per_sample=1):
    dsd_header = b"DSD " + (28).to_bytes(8, "little") + (0).to_bytes(8, "little") + (0).to_bytes(8, "little")
    fmt_payload = b"".join([
        (1).to_bytes(4, "little"),
        (0).to_bytes(4, "little"),
        (2).to_bytes(4, "little"),
        channels.to_bytes(4, "little"),
        sample_rate.to_bytes(4, "little"),
        bits_per_sample.to_bytes(4, "little"),
        (sample_rate).to_bytes(8, "little"),
        (4096).to_bytes(4, "little"),
        (0).to_bytes(4, "little"),
    ])
    fmt_chunk = b"fmt " + (len(fmt_payload) + 12).to_bytes(8, "little") + fmt_payload
    path.write_bytes(dsd_header + fmt_chunk)


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

    def test_dsd_metadata_uses_original_file(self, sample_wav_stereo, tmp_dir):
        dsf_path = tmp_dir / "original.dsf"
        write_minimal_dsf(dsf_path)
        context = AnalysisContext.from_file(str(sample_wav_stereo))

        result = BasicInfoAnalyzer(str(sample_wav_stereo), context, metadata_path=str(dsf_path)).analyze()

        assert result["file"]["name"] == "original.dsf"
        assert result["file"]["format"] == "DSF"
        assert result["audio"]["codec"] == "DSF"
        assert result["audio"]["sample_rate_hz"] == 2822400
        assert result["audio"]["bit_depth"] == 1
        assert result["audio"]["channels"] == 2
        assert result["dsd"]["dsd_rate"] == 64
        assert result["dsd"]["sample_rate_hz"] == 2822400
