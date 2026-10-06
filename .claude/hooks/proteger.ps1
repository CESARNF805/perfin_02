# Hook PreToolUse do Perfin_02.
# Bloqueia edição de arquivos sensíveis e comandos destrutivos.
# Exit 2 = bloqueia a ação e envia o motivo ao Claude.

[Console]::InputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$entrada = [Console]::In.ReadToEnd() | ConvertFrom-Json
$ferramenta = $entrada.tool_name
$params = $entrada.tool_input

function Bloquear($motivo) {
    [Console]::Error.WriteLine("Bloqueado pelo hook do Perfin_02: $motivo")
    exit 2
}

if ($ferramenta -in @('Edit', 'Write', 'MultiEdit', 'NotebookEdit')) {
    $arquivo = [string]$params.file_path
    if (-not $arquivo) { $arquivo = [string]$params.notebook_path }
    $nome = Split-Path $arquivo -Leaf

    if ($nome -match '^\.env(\..+)?$' -and $nome -notmatch '\.example$') {
        Bloquear "arquivo de ambiente ($nome) não pode ser editado. Use .env.example."
    }
    if ($nome -match '\.(pem|key|pfx|p12)$' -or $nome -match '^(credentials|secrets?)(\..+)?$') {
        Bloquear "arquivo de credenciais ($nome) não pode ser editado."
    }
}

if ($ferramenta -in @('Bash', 'PowerShell')) {
    $comando = [string]$params.command
    $perigosos = @(
        '\brm\s+-[a-zA-Z]*(rf|fr)',
        'Remove-Item\b.*-Recurse\b.*-Force|Remove-Item\b.*-Force\b.*-Recurse',
        '\bgit\s+push\b.*(--force|\s-f\b)',
        '\bgit\s+reset\s+--hard',
        '\bgit\s+clean\s+-[a-zA-Z]*f',
        '\bDROP\s+(TABLE|DATABASE|SCHEMA)\b',
        '\bTRUNCATE\s+TABLE\b'
    )
    foreach ($padrao in $perigosos) {
        if ($comando -match $padrao) {
            Bloquear "comando destrutivo detectado. Peça ao usuário para executá-lo manualmente."
        }
    }
}

exit 0
