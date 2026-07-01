import pytest
from app.analyzers.quality import QualityAnalyzer


class TestQualityAnalyzer:
    def test_returns_dict_with_expected_keys(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert "overall_score" in result
        assert "grade" in result
        assert "sub_scores" in result
        assert "details" in result

    def test_overall_score_range(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert 0 <= result["overall_score"] <= 100

    def test_grade_is_valid(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert result["grade"] in ["极佳", "优秀", "良好", "一般", "较差"]

    def test_seven_sub_scores(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        expected_keys = {"bitrate", "integrity", "quality_detection", "channel", "spectral", "dynamic_range", "distortion"}
        assert set(result["sub_scores"].keys()) == expected_keys

    def test_high_quality_file_scores_high(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        assert result["overall_score"] >= 60

    def test_clipping_file_scores_lower(self, sample_wav_clipping):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_clipping)).analyze()
        result = QualityAnalyzer(str(sample_wav_clipping), info).analyze()
        assert result["sub_scores"]["distortion"] < 50

    def test_details_has_strings(self, sample_wav_stereo):
        from app.analyzers.basic_info import BasicInfoAnalyzer
        info = BasicInfoAnalyzer(str(sample_wav_stereo)).analyze()
        result = QualityAnalyzer(str(sample_wav_stereo), info).analyze()
        for key, val in result["details"].items():
            assert isinstance(val, str), f"detail for {key} should be string"
