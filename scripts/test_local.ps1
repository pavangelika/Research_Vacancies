[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [ValidateSet("help", "backend", "ui", "api-external", "all-safe", "all")]
    [string]$Target = "help"
)

$ErrorActionPreference = "Stop"

function Write-Section {
    param([string]$Message)
    Write-Host ""
    Write-Host "== $Message ==" -ForegroundColor Cyan
}

function Invoke-Step {
    param(
        [string]$Label,
        [scriptblock]$Action
    )
    Write-Section $Label
    & $Action
    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
}

function Show-Help {
    Write-Host "Usage: .\scripts\test_local.ps1 <target>"
    Write-Host ""
    Write-Host "Targets:"
    Write-Host "  help          Show this help"
    Write-Host "  backend       Run pytest tests/backend -q"
    Write-Host "  ui            Run node tests/ui/*.test.js"
    Write-Host "  api-external  Run pytest tests/api -q when RUN_EXTERNAL_API_TESTS=1"
    Write-Host "  all-safe      Run gate tests, backend tests, and UI tests"
    Write-Host "  all           Run all-safe and then api-external"
}

function Run-Backend {
    Invoke-Step "Backend tests" { pytest tests/backend -q }
}

function Run-Ui {
    Invoke-Step "UI JS tests" {
        $failed = @()
        Get-ChildItem "tests\ui\*.test.js" | Sort-Object Name | ForEach-Object {
            Write-Host "RUN $($_.Name)"
            node $_.FullName
            if ($LASTEXITCODE -ne 0) {
                $failed += $_.Name
            }
        }
        if ($failed.Count -gt 0) {
            Write-Host ""
            Write-Host ("FAILED: " + ($failed -join ", ")) -ForegroundColor Red
            exit 1
        }
    }
}

function Run-Gate {
    Invoke-Step "External API gate tests" { pytest tests/test_external_api_gate.py -q }
}

function Assert-ExternalApiEnabled {
    if ($env:RUN_EXTERNAL_API_TESTS -ne "1") {
        Write-Host "External HH API tests are disabled. Set RUN_EXTERNAL_API_TESTS=1 and rerun." -ForegroundColor Yellow
        exit 2
    }
}

function Run-ApiExternal {
    Assert-ExternalApiEnabled
    Invoke-Step "External HH API tests" { pytest tests/api -q }
}

switch ($Target) {
    "help" {
        Show-Help
        exit 0
    }
    "backend" {
        Run-Backend
        exit 0
    }
    "ui" {
        Run-Ui
        exit 0
    }
    "api-external" {
        Run-ApiExternal
        exit 0
    }
    "all-safe" {
        Run-Gate
        Run-Backend
        Run-Ui
        exit 0
    }
    "all" {
        Run-Gate
        Run-Backend
        Run-Ui
        Run-ApiExternal
        exit 0
    }
}
