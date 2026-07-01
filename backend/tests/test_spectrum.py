from app.analyzers.spectrum import SpectrumAnalyzer


class TestSpectrumAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert isinstance(result, dict)

    def test_has_spectrum(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert "spectrum" in result
        assert len(result["spectrum"]["frequencies"]) > 0

    def test_has_spectrogram(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert "spectrogram" in result
        assert len(result["spectrogram"]["frequencies"]) > 0

    def test_has_frequency_distribution(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert len(result["frequency_distribution"]["bands"]) == 5

    def test_frequencies_in_range(self, sample_wav_stereo):
        result = SpectrumAnalyzer(str(sample_wav_stereo)).analyze()
        assert result["spectrum"]["frequencies"][0] >= 0
        assert result["spectrum"]["frequencies"][-1] <= 22050
