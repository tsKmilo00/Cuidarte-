# Atajo para usar SonarQube local con Docker (Actividad 2)
# Uso:  .\sonar.ps1 up | down | scan | scan-backend | scan-frontend
param([Parameter(Mandatory = $true)][ValidateSet("up", "down", "scan", "scan-backend", "scan-frontend")][string]$Accion)

Set-Location $PSScriptRoot

# Lee .env.sonar (si existe)
$config = @{}
if (Test-Path ".env.sonar") {
    Get-Content ".env.sonar" | ForEach-Object {
        if ($_ -match '^\s*([^#=\s]+)\s*=\s*(.*)$') { $config[$Matches[1]] = $Matches[2].Trim() }
    }
}
$puerto = if ($config["PORT_SONARQUBE"]) { $config["PORT_SONARQUBE"] } else { "9000" }

function Invoke-Scan([string]$carpeta) {
    if (-not $config["SONAR_TOKEN"]) { throw "Falta SONAR_TOKEN en .env.sonar (ver .env.sonar.example)" }
    docker run --rm `
        -e SONAR_HOST_URL="http://host.docker.internal:$puerto" `
        -e SONAR_TOKEN="$($config['SONAR_TOKEN'])" `
        -v "${PWD}\${carpeta}:/usr/src" `
        sonarsource/sonar-scanner-cli:latest
}

switch ($Accion) {
    # -p: proyecto propio, para que "down" nunca toque los contenedores de Cuidarte+
    "up"            { docker compose -p cuidarteplus-sonar -f docker-compose.sonar.yml up -d; Write-Host "SonarQube en http://localhost:$puerto (usuario admin / clave admin la primera vez)" }
    "down"          { docker compose -p cuidarteplus-sonar -f docker-compose.sonar.yml down }
    "scan-backend"  { Invoke-Scan "BACKEND" }
    "scan-frontend" { Invoke-Scan "FRONTEND" }
    "scan"          { Invoke-Scan "BACKEND"; Invoke-Scan "FRONTEND" }
}
