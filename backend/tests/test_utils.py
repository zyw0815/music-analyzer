import subprocess

import pytest

from app import utils


def test_convert_dsd_to_pcm_uses_ffmpeg_decoder(monkeypatch, tmp_dir):
    source = tmp_dir / "sample.dsf"
    source.write_bytes(b"DSD ")
    calls = []

    def fake_run(cmd, **kwargs):
        calls.append((cmd, kwargs))
        return subprocess.CompletedProcess(cmd, 0, "", "")

    monkeypatch.setattr(utils.subprocess, "run", fake_run)

    output = utils.convert_dsd_to_pcm(source)

    cmd, kwargs = calls[0]
    assert output.suffix == ".wav"
    assert "dsd2pcm" not in cmd
    assert cmd[:5] == ["ffmpeg", "-y", "-hide_banner", "-loglevel", "error"]
    assert "-acodec" in cmd
    assert "pcm_s24le" in cmd
    assert kwargs["check"] is True
    assert kwargs["capture_output"] is True
    assert kwargs["text"] is True


def test_convert_dsd_to_pcm_reports_ffmpeg_stderr(monkeypatch, tmp_dir):
    source = tmp_dir / "broken.dsf"
    source.write_bytes(b"bad")
    partial_outputs = []

    def fake_run(cmd, **kwargs):
        output_path = utils.Path(cmd[-1])
        partial_outputs.append(output_path)
        output_path.write_bytes(b"partial")
        raise subprocess.CalledProcessError(8, cmd, stderr="Invalid DSD stream")

    monkeypatch.setattr(utils.subprocess, "run", fake_run)

    with pytest.raises(RuntimeError, match="Invalid DSD stream"):
        utils.convert_dsd_to_pcm(source)

    assert partial_outputs
    assert not partial_outputs[0].exists()
