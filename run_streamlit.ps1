$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
python -m pip install -r requirements.txt
$legacy = Start-Process -FilePath "npm.cmd" -ArgumentList "run", "dev:legacy" -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -PassThru
try {
    python -m streamlit run streamlit_app.py --server.port 8501
}
finally {
    if ($legacy -and -not $legacy.HasExited) { Stop-Process -Id $legacy.Id }
}
