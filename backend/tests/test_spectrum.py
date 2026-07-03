from app.analyzers.spectrum import SpectrumAnalyzer
import numpy as np


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

    def test_high_sample_rate_low_band_resolution(self):
        sr = 192000
        duration = 1.0
        t = np.arange(int(sr * duration)) / sr
        y = 0.8 * np.sin(2 * np.pi * 40 * t)

        result = SpectrumAnalyzer("unused")._frequency_distribution(y, sr)

        low_band = result["energy_db"][0]
        bass_band = result["energy_db"][1]
        assert low_band > bass_band
