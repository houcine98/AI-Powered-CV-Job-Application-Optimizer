Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$frontendRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $frontendRoot

try {
    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
    if (-not $npmCommand) {
        throw "npm is not installed or is not available on PATH."
    }

    if (-not (Test-Path (Join-Path $frontendRoot "node_modules"))) {
        Write-Host "Installing frontend dependencies..."
        & $npmCommand.Source install
        if ($LASTEXITCODE -ne 0) {
            exit $LASTEXITCODE
        }
    }

    & $npmCommand.Source run dev
    exit $LASTEXITCODE
}
finally {
    Pop-Location
}
