from app.analyzers.waveform import WaveformAnalyzer


class TestWaveformAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        assert isinstance(WaveformAnalyzer(str(sample_wav_stereo)).analyze(), dict)

    def test_has_waveform(self, sample_wav_stereo):
        r = WaveformAnalyzer(str(sample_wav_stereo)).analyze()
        assert len(r["waveform"]["samples"]) > 0
        assert r["waveform"]["sample_rate"] == 44100

    def test_has_rms_envelope(self, sample_wav_stereo):
        assert len(WaveformAnalyzer(str(sample_wav_stereo)).analyze()["rms_envelope"]["values"]) > 0

    def test_detects_clipping(self, sample_wav_clipping):
        assert len(WaveformAnalyzer(str(sample_wav_clipping)).analyze()["clipping_regions"]) > 0

    def test_detects_silence(self, sample_wav_silence):
        assert len(WaveformAnalyzer(str(sample_wav_silence)).analyze()["silence_regions"]) > 0

    def test_no_clipping_in_clean_file(self, sample_wav_stereo):
        assert len(WaveformAnalyzer(str(sample_wav_stereo)).analyze()["clipping_regions"]) == 0
