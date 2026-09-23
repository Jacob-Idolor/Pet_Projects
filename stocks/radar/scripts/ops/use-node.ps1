# Dot-source this file to activate the project-local Node toolchain in PowerShell.
$stocksRadarRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$stocksNodeVersion = (Get-Content -LiteralPath (Join-Path $stocksRadarRoot '.nvmrc') -Raw).Trim()
$stocksNodeDirectory = Join-Path $stocksRadarRoot ".cache/node-v$stocksNodeVersion-win-x64"
if (!(Test-Path -LiteralPath (Join-Path $stocksNodeDirectory 'node.exe'))) {
    throw "Install Node $stocksNodeVersion or extract its official Windows x64 ZIP into $stocksNodeDirectory first."
}
$env:Path = "$stocksNodeDirectory;$env:Path"
node --version
