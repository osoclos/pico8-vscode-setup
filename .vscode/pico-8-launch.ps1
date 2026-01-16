<#
    .SYNOPSIS
        Prepares files and environment for launching PICO-8 and launches PICO-8

    .DESCRIPTION
        1. Computes the relative path from the root path to the entry .lua file.
        2. Copies the template cartridge file and patches the entry cartridge file with the computed relative path.
        3. Runs PICO-8 with the cartridge, alongside any user-defined arguments.
#>

$END_LUA_SECTION_SEGMENT = "--__lua-end__--"

if ([string]::IsNullOrWhiteSpace($env:PICO8_EXE_PATH)) {
    Write-Error "ERR: PICO8_EXE_PATH has not been specified. Did you specify a path in the .vscode/tasks.json file?"
    exit 1
}

if (-not (Test-Path $env:PICO8_EXE_PATH)) {
    Write-Error "ERR: PICO8_EXE_PATH points to a missing or invalid file. Did you provide a valid path to the PICO-8 executable?"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:ENTRY_FILE_PATH)) {
    Write-Error "ERR: ENTRY_FILE_PATH has not been specified. Did you specify a path in the .vscode/tasks.json file?"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($env:ENTRY_CART_PATH)) {
    Write-Error "ERR: ENTRY_CART_PATH has not been specified. Did you specify a path in the .vscode/tasks.json file?"
    exit 1
}

$entry_content = Get-Content $env:ENTRY_FILE_PATH

if (Test-Path $env:ENTRY_CART_PATH) {
    $content = Get-Content $env:ENTRY_CART_PATH

    $in_lua_section = $false
    $patched_content = foreach ($line in $content) {
        if (-not $in_lua_section) {
            Write-Output $line
            if ($line -match [regex]::Escape("__lua__")) {
                $in_lua_section = $true
                Write-Output $entry_content $END_LUA_SECTION_SEGMENT
            }
        } elseif ($line -match [regex]::Escape($END_LUA_SECTION_SEGMENT)) {
            $in_lua_section = $false
        }
    }

    Set-Content $env:ENTRY_CART_PATH $patched_content
} else {
    $cartridge_content =
@"
pico-8 cartridge // http://www.pico-8.com
version 42
__lua__
$entry_content
$END_LUA_SECTION_SEGMENT

__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00077000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00700700000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
"@

    Set-Content $env:ENTRY_CART_PATH $cartridge_content
}

$final_args = @($env:ENTRY_CART_PATH)
if (-not [string]::IsNullOrWhiteSpace($env:PICO8_ARGS)) {
    $final_args += $env:PICO8_ARGS
}

Start-Process -FilePath $env:PICO8_EXE_PATH -ArgumentList $final_args -NoNewWindow -Wait
