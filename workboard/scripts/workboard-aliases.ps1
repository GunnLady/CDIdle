# CDIdle Workboard PowerShell aliases.
$script:CDIdleRoot = 'D:\codex\CDIdle'

function Invoke-CDIdleBoardScript {
  param(
    [Parameter(Mandatory)] [string] $ScriptName,
    [Parameter(ValueFromRemainingArguments)] [object[]] $Arguments
  )
  Push-Location $script:CDIdleRoot
  try { & npm.cmd run $ScriptName @Arguments }
  finally { Pop-Location }
}

function board-start { Invoke-CDIdleBoardScript 'board:start' @args }
function board-start-hidden { Invoke-CDIdleBoardScript 'board:start:hidden' @args }
function board-stop { Invoke-CDIdleBoardScript 'board:stop' @args }
function board-validate { Invoke-CDIdleBoardScript 'board:validate' @args }
function board-sync { Invoke-CDIdleBoardScript 'board:sync' @args }
function board-sync-apply { Invoke-CDIdleBoardScript 'board:sync:apply' @args }
