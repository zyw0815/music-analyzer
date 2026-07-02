from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestHealth:
    def test_health(self):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


class TestAnalyze:
    def test_analyze_wav(self, sample_wav_stereo):
        with open(sample_wav_stereo, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("original-title.wav", f, "audio/wav")})
        assert r.status_code == 200
        data = r.json()
        assert "file_id" in data
        assert data["basic_info"]["file"]["name"] == "original-title.wav"
        assert "basic_info" in data
        assert "quality" in data
        assert "spectrum" in data
        assert "waveform" in data
        assert "channel" in data

    def test_analyze_basic(self, sample_wav_mono):
        with open(sample_wav_mono, "rb") as f:
            r = client.post("/api/analyze/basic", files={"file": ("basic-original.wav", f, "audio/wav")})
        assert r.status_code == 200
        assert r.json()["file"]["name"] == "basic-original.wav"
        assert r.json()["audio"]["sample_rate_hz"] == 44100

    def test_analyze_job(self, sample_wav_stereo):
        with open(sample_wav_stereo, "rb") as f:
            r = client.post("/api/analyze/jobs", files={"file": ("job-original.wav", f, "audio/wav")})
        assert r.status_code == 200
        job_id = r.json()["job_id"]

        job = client.get(f"/api/analyze/jobs/{job_id}")
        assert job.status_code == 200
        data = job.json()
        assert data["status"] == "done"
        assert data["progress"] == 100
        assert data["result"]["basic_info"]["file"]["name"] == "job-original.wav"

    def test_rejects_invalid_format(self, tmp_dir):
        fake = tmp_dir / "test.xyz"
        fake.write_bytes(b"fake")
        with open(fake, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("test.xyz", f, "audio/wav")})
        assert r.status_code == 400

    def test_stream(self, sample_wav_mono):
        with open(sample_wav_mono, "rb") as f:
            r = client.post("/api/analyze", files={"file": ("test.wav", f, "audio/wav")})
        file_id = r.json()["file_id"]
        r2 = client.get(f"/api/stream/{file_id}")
        assert r2.status_code == 200
        assert r2.headers["content-type"] == "audio/wav"
