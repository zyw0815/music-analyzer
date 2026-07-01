from app.analyzers.channel import ChannelAnalyzer


class TestChannelAnalyzer:
    def test_returns_dict(self, sample_wav_stereo):
        assert isinstance(ChannelAnalyzer(str(sample_wav_stereo)).analyze(), dict)

    def test_phase_correlation_range(self, sample_wav_stereo):
        r = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        assert -1 <= r["phase_correlation"] <= 1

    def test_channel_balance(self, sample_wav_stereo):
        assert "channel_balance_db" in ChannelAnalyzer(str(sample_wav_stereo)).analyze()

    def test_has_spectrums(self, sample_wav_stereo):
        r = ChannelAnalyzer(str(sample_wav_stereo)).analyze()
        for k in ["left_spectrum", "right_spectrum", "mid_spectrum", "side_spectrum"]:
            assert k in r
            assert "frequencies" in r[k]

    def test_stereo_width(self, sample_wav_stereo):
        assert ChannelAnalyzer(str(sample_wav_stereo)).analyze()["stereo_width"] >= 0

    def test_mono_detection(self, sample_wav_mono):
        assert ChannelAnalyzer(str(sample_wav_mono)).analyze()["is_mono"] is True

    def test_stereo_not_flagged_mono(self, sample_wav_stereo):
        assert ChannelAnalyzer(str(sample_wav_stereo)).analyze()["is_mono"] is False
