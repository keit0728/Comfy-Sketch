## Ntfy Notification

`ntfy` is a notification service. **When sending notifications, use this command.**

Send notification via curl to ntfy.sh:

```bash
curl -d "<message>" ntfy.sh/<topic>
```

Example:

```bash
curl -d "Task completed successfully!" ntfy.sh/my-notifications
```

With title:

```bash
curl -H "Title: <title>" -d "<message>" ntfy.sh/<topic>
```

With priority:

```bash
curl -H "Priority: high" -d "<message>" ntfy.sh/<topic>
```
