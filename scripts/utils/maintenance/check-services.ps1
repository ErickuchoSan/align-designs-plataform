# Quick service status check
try {
    $nginx = Get-Service -Name 'AlignDesignsNginx' -ErrorAction Stop
    $monorepo = Get-Service -Name 'AlignDesignsMonorepo' -ErrorAction Stop

    if ($nginx.Status -eq 'Running' -and $monorepo.Status -eq 'Running') {
        exit 0
    } else {
        exit 1
    }
} catch {
    exit 1
}
