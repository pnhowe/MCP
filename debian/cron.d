*/1 * * * * root [ -x /usr/lib/mcp/cron/iterate ] && /usr/lib/mcp/cron/iterate
20 1 0 * * 0 root [ -x /usr/lib/mcp/util/manage.py ] && /usr/lib/mcp/util/manage.py clearsessions
