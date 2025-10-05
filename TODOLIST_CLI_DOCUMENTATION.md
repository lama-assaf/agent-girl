# TodoCLI - Simple Command-Line Todo Manager

A lightweight, intuitive command-line application for managing your daily tasks and to-do items. Perfect for developers and anyone who prefers working in the terminal.

## Features

- ✅ Add, complete, and delete tasks
- 📋 List all tasks with status indicators
- 🔍 Search tasks by keyword
- 📊 View task statistics
- 💾 Persistent data storage
- 🎯 Priority levels for tasks
- 📅 Due date management
- 🏷️ Tag system for organization

## Prerequisites

- Node.js 14.0 or higher
- npm or yarn package manager
- Any Unix-like terminal (Linux, macOS, Windows WSL)

## Installation

### Option 1: Install via npm (Recommended)

```bash
npm install -g todo-cli
```

### Option 2: Clone and Install Locally

```bash
git clone https://github.com/yourusername/todo-cli.git
cd todo-cli
npm install
npm link
```

### Option 3: Install via yarn

```bash
yarn global add todo-cli
```

## Quick Start Guide

### 1. Initialize Todo Storage

The first time you run TodoCLI, it will create a storage directory:

```bash
todo init
```

This creates a `.todo` directory in your home folder to store your tasks.

### 2. Add Your First Task

```bash
todo add "Buy groceries"
todo add "Finish project report" --priority high
todo add "Call mom" --due "2024-12-25"
```

### 3. View Your Tasks

```bash
todo list
```

### 4. Complete a Task

```bash
todo done 1
```

### 5. See Your Progress

```bash
todo stats
```

## Basic Usage Examples

### Adding Tasks

```bash
# Simple task
todo add "Read documentation"

# Task with priority
todo add "Fix critical bug" --priority high

# Task with due date
todo add "Submit taxes" --due "2024-04-15"

# Task with tags
todo add "Team meeting" --tags work,meeting

# Complex task with all options
todo add "Complete presentation" --priority medium --due "2024-03-20" --tags work,presentation
```

### Viewing Tasks

```bash
# List all tasks
todo list

# List only pending tasks
todo list --pending

# List completed tasks
todo list --completed

# List tasks by priority
todo list --priority high

# List tasks by tag
todo list --tags work

# Search tasks
todo search "presentation"
```

### Managing Tasks

```bash
# Mark task as complete (using task ID)
todo done 3

# Mark task as complete (using task name)
todo done "Buy groceries"

# Edit a task
todo edit 1 "Buy organic groceries"

# Delete a task
todo delete 2

# Clear all completed tasks
todo clear
```

## Available Commands

### Core Commands

| Command | Description | Example |
|---------|-------------|---------|
| `add` | Add a new task | `todo add "New task"` |
| `list` | Display all tasks | `todo list` |
| `done` | Mark task as complete | `todo done 1` |
| `delete` | Remove a task | `todo delete 2` |
| `edit` | Modify existing task | `todo edit 1 "Updated task"` |
| `search` | Find tasks by keyword | `todo search "urgent"` |
| `stats` | Show task statistics | `todo stats` |
| `clear` | Remove completed tasks | `todo clear` |

### Utility Commands

| Command | Description | Example |
|---------|-------------|---------|
| `init` | Initialize storage | `todo init` |
| `help` | Show help information | `todo help` |
| `version` | Display version | `todo version` |
| `backup` | Backup your tasks | `todo backup` |
| `restore` | Restore from backup | `todo restore backup.json` |

## Command Options

### Adding Tasks (`todo add`)

```bash
todo add "Task description" [options]

Options:
  --priority <level>    Set priority: low, medium, high (default: medium)
  --due <date>          Set due date (YYYY-MM-DD format)
  --tags <tags>         Add tags (comma-separated)
  --notes <text>        Add additional notes
```

### Listing Tasks (`todo list`)

```bash
todo list [options]

Options:
  --pending             Show only pending tasks
  --completed           Show only completed tasks
  --priority <level>    Filter by priority level
  --tags <tags>         Filter by tags (comma-separated)
  --due <date>          Filter by due date
  --limit <number>      Limit number of results
  --sort <field>        Sort by: id, priority, due, created (default: id)
```

### Managing Tasks

```bash
todo done <task-id-or-name>
todo delete <task-id-or-name>
todo edit <task-id> "New description"

Options for edit:
  --priority <level>    Change priority
  --due <date>          Change due date
  --tags <tags>         Change tags
```

## Task Display Format

When you run `todo list`, tasks are displayed in this format:

```
ID  Status  Priority  Due Date    Description
--  ------  --------  ----------  -----------------------------------------------
1   [ ]     HIGH      2024-03-20  Finish project presentation
2   [✓]     MEDIUM    2024-03-15  Review team pull requests
3   [ ]     LOW                  Update personal blog
4   [ ]     HIGH      2024-03-18  Client meeting preparation
```

**Status Indicators:**
- `[ ]` = Pending/Incomplete
- `[✓]` = Completed

**Priority Levels:**
- `HIGH` = Urgent tasks
- `MEDIUM` = Normal priority
- `LOW` = Can wait

## Configuration

TodoCLI can be customized with a configuration file:

```bash
todo config
```

This creates a `.todo-config.json` file in your home directory:

```json
{
  "storagePath": "~/.todo",
  "defaultPriority": "medium",
  "dateFormat": "YYYY-MM-DD",
  "maxTasks": 1000,
  "autoBackup": true,
  "backupInterval": "daily",
  "theme": "default"
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `storagePath` | Directory to store task data | `~/.todo` |
| `defaultPriority` | Default priority for new tasks | `medium` |
| `dateFormat` | Date display format | `YYYY-MM-DD` |
| `maxTasks` | Maximum number of tasks | `1000` |
| `autoBackup` | Enable automatic backups | `true` |
| `backupInterval` | Backup frequency | `daily` |
| `theme` | Color theme | `default` |

## Data Storage

TodoCLI stores your data in JSON format:

```
~/.todo/
├── tasks.json          # Main task storage
├── config.json         # Local configuration
├── backups/            # Backup directory
│   ├── 2024-03-15.json
│   └── 2024-03-16.json
└── stats.json          # Usage statistics
```

### Manual Backup

```bash
# Create a backup
todo backup --output my-tasks-backup.json

# List available backups
todo backup --list

# Restore from backup
todo restore my-tasks-backup.json
```

## Advanced Usage

### Bulk Operations

```bash
# Complete multiple tasks
todo done 1,3,5

# Delete multiple tasks
todo delete 2,4,6

# Add multiple tasks from file
todo import tasks.txt
```

### Task Templates

Create reusable task templates:

```bash
# Create a template
todo template create "Daily Standup" "Update team on progress, discuss blockers, plan day"

# Use a template
todo add --template "Daily Standup"

# List templates
todo template list

# Delete a template
todo template delete "Daily Standup"
```

### Recurring Tasks

```bash
# Add recurring task
todo add "Weekly team meeting" --recur weekly --day monday

# Add daily task
todo add "Check emails" --recur daily

# Add monthly task
todo add "Pay rent" --recur monthly --day 1
```

## Integration Examples

### Shell Integration

Add to your `.bashrc` or `.zshrc`:

```bash
# Quick todo command
alias t='todo'

# Show pending tasks on terminal startup
echo "📋 Pending Tasks: $(todo list --pending --count)"
```

### Git Hook Integration

Create a `.git/hooks/pre-commit` file:

```bash
#!/bin/bash
# Check if there are high-priority tasks before committing
high_priority=$(todo list --priority high --pending --count)
if [ "$high_priority" -gt 0 ]; then
    echo "⚠️  You have $high_priority high-priority tasks pending!"
    read -p "Continue with commit? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi
```

### Cron Integration

Add to your crontab for daily task reminders:

```bash
# Daily task summary at 9 AM
0 9 * * * /usr/local/bin/todo list --pending | mail -s "Daily Todo Summary" your@email.com

# Weekly backup on Sundays
0 0 * * 0 /usr/local/bin/todo backup
```

## Troubleshooting

### Common Issues

**1. Command not found**

```bash
# If todo command isn't available after npm install
npm list -g --depth=0 | grep todo-cli
# If not listed, reinstall:
npm install -g todo-cli
```

**2. Permission denied**

```bash
# Fix permission issues
sudo chown -R $USER:$(id -gn $USER) ~/.todo
```

**3. Data corruption**

```bash
# Restore from backup
todo restore $(todo backup --list | tail -1)

# Or reset to empty state
rm -rf ~/.todo
todo init
```

**4. Large task lists**

```bash
# Search specific tasks instead of listing all
todo search "urgent"
todo list --priority high --limit 10
```

### Performance Tips

- Use search instead of listing all tasks for large lists
- Regularly clear completed tasks with `todo clear`
- Keep task descriptions concise
- Use tags for better organization

## API Reference

### Exit Codes

- `0` = Success
- `1` = General error
- `2` = Task not found
- `3` = Invalid input
- `4` = File system error

### Environment Variables

```bash
TODO_STORAGE_PATH    # Override default storage location
TODO_CONFIG_PATH     # Override config file location
TODO_NO_COLOR        # Disable color output (true/false)
TODO_QUIET           # Suppress non-error output (true/false)
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/yourusername/todo-cli.git
cd todo-cli
npm install
npm test
npm run dev
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📖 [Documentation](https://todo-cli.docs.com)
- 🐛 [Issue Tracker](https://github.com/yourusername/todo-cli/issues)
- 💬 [Community Forum](https://github.com/yourusername/todo-cli/discussions)
- 📧 [Email Support](mailto:support@todo-cli.com)

## Changelog

### Version 2.0.0 (Latest)
- Added recurring tasks feature
- Improved search functionality
- New task templates system
- Enhanced backup and restore
- Better performance for large task lists

### Version 1.5.0
- Added tags support
- Improved date handling
- New configuration options

### Version 1.0.0
- Initial release
- Basic task management
- Priority levels
- Due date support