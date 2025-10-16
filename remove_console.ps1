# Script para remover console.log e console.error
Get-ChildItem -Path "src\app\module\admin-vitrineBella" -Recurse -Include "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $content = $content -replace '^\s*console\.(log|error)\([^;]*\);\s*$', '' -replace '\n\s*\n\s*\n', "`n`n"
    Set-Content $_.FullName $content -NoNewline
}
Write-Host "Console statements removed from all TypeScript files"
