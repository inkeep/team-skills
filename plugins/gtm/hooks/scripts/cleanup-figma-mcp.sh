#!/usr/bin/env bash
# cleanup-figma-mcp.sh — Kill orphaned figma-console-mcp processes
#
# Orphaned processes (ppid=1) hold WebSocket ports 9223-9232, blocking
# new MCP server instances from binding. This runs on SessionStart
# before MCP servers initialize.
#
# Only kills processes whose parent is PID 1 (reparented to init after
# their parent Claude Code session died). Active sessions are untouched.

for pid in $(lsof -i :9223-9232 -t 2>/dev/null); do
  ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
  [ "$ppid" = "1" ] && kill "$pid" 2>/dev/null
done

exit 0
