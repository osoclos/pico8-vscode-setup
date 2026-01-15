<#
    .SYNOPSIS
        Prepares files and environment for launching PICO-8 and launches PICO-8

    .DESCRIPTION
        1. Computes the relative path from the root path to the entry .lua file.
        2. Copies the template cartridge file and patches the entry cartridge file with the computed relative path.
        3. Runs PICO-8 with the cartridge.
#>

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

if (-not (Test-Path $env:ENTRY_CART_PATH)) {
    $template_file_path = ".vscode\__template.p8"
    if (-not (Test-Path $template_file_path)) {
        Write-Error "Template cartridge .p8 file is missing! If you deleted it by accident, it is strongly recommended that you re-download it from the template repository again. (https://github.com/osoclos/pico8-vscode-setup/tree/main/.vscode/__template.p8)"
        exit 1
    }

    $template_content = Get-Content $template_file_path
    $cartridge_content = foreach ($line in $template_content) {
        Write-Output $line
        if ($line -match [regex]::Escape("__lua__")) {
            Write-Output ("#include " + $env:ENTRY_FILE_PATH)
        }
    }

    Set-Content $env:ENTRY_CART_PATH $cartridge_content
}

Start-Process -FilePath $env:PICO8_EXE_PATH -ArgumentList $env:ENTRY_CART_PATH, "-run", $env:ENTRY_CART_PATH -NoNewWindow -Wait
