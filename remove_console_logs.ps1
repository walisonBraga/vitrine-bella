# Script para remover todos os console.log do projeto
# Remove console.log, console.warn, console.error, console.info

Write-Host "Removendo todos os console.log do projeto..." -ForegroundColor Green

# Arquivos TypeScript e JavaScript
$files = Get-ChildItem -Path "." -Recurse -Include "*.ts", "*.js" | Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*dist*" }

$totalRemoved = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Remove console.log, console.warn, console.error, console.info
    $content = $content -replace "console\.log\([^)]*\);?\s*", ""
    $content = $content -replace "console\.warn\([^)]*\);?\s*", ""
    $content = $content -replace "console\.error\([^)]*\);?\s*", ""
    $content = $content -replace "console\.info\([^)]*\);?\s*", ""
    
    # Remove linhas vazias extras
    $content = $content -replace "\n\s*\n\s*\n", "`n`n"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $removed = ([regex]::Matches($originalContent, "console\.(log|warn|error|info)")).Count
        $totalRemoved += $removed
        Write-Host "Removido $removed console.log de $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "Total de console.log removidos: $totalRemoved" -ForegroundColor Green
Write-Host "Limpeza concluída!" -ForegroundColor Green
