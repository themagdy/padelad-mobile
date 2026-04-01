/**
 * Padeladd - Notifications Module
 */
const Notifications = {

    renderNotifications() {
        return `
            <div class="main-content">
                <div class="page-header d-flex justify-between align-center" style="flex-wrap:wrap;gap:16px">
                    <div>
                        <h1>🔔 Notifications</h1>
                        <p>Your recent activity</p>
                    </div>
                    <button class="btn btn-ghost btn-sm" id="mark-all-read-btn">✓ Mark All Read</button>
                </div>
                <div id="notifications-list">
                    ${Utils.loader('Loading...')}
                </div>
            </div>
        `;
    },

    loadNotifications() {
        Utils.api('notifications/list.php').then(function (resp) {
            const items = resp.data.notifications || [];
            App.updateNotificationBadge(resp.data.unread_count);

            if (items.length === 0) {
                $('#notifications-list').html(`
                    <div class="empty-state">
                        <div class="empty-icon">🔔</div>
                        <p>No notifications yet</p>
                    </div>
                `);
                return;
            }

            let html = '<div style="display:flex;flex-direction:column;gap:8px">';
            items.forEach(n => { html += Notifications.renderItem(n); });
            html += '</div>';
            $('#notifications-list').html(html);
        }).catch(function () {
            $('#notifications-list').html('<div class="empty-state"><p>Could not load notifications</p></div>');
        });
    },

    renderItem(n) {
        const unread    = n.is_read == 0;
        const leftBorder = unread ? 'border-left:3px solid var(--primary);' : '';
        const bg        = unread ? 'background:rgba(0,200,150,0.05);' : '';
        const dot       = unread ? '<div style="width:8px;height:8px;background:var(--primary);border-radius:50%;position:absolute;top:14px;right:14px"></div>' : '';
        const onClick   = n.match_id
            ? `Notifications.markRead(${n.id}); App.navigate('match/${n.match_id}')`
            : `Notifications.markRead(${n.id})`;

        return `
            <div class="card notification-item" style="position:relative;padding:14px 16px;cursor:pointer;${leftBorder}${bg}" onclick="${onClick}">
                <div class="d-flex justify-between align-center">
                    <strong style="font-size:0.9rem">${Utils.escape(n.title)}</strong>
                    <span style="font-size:0.75rem;color:var(--text-muted);white-space:nowrap;margin-left:8px">${Utils.timeAgo ? Utils.timeAgo(n.created_at) : n.created_at}</span>
                </div>
                <p style="margin:5px 0 0;color:var(--text-secondary);font-size:0.84rem">${Utils.escape(n.body)}</p>
                ${dot}
            </div>
        `;
    },

    markRead(id) {
        // Fire-and-forget
        Utils.api('notifications/mark_read.php', 'POST', { ids: [id] });
        // Visually mark read
        const $item = $(`.notification-item`).filter(function() {
            return $(this).attr('onclick') && $(this).attr('onclick').includes(`markRead(${id})`);
        });
        $item.css({ 'border-left': 'none', 'background': '' });
        $item.find('div[style*="border-radius:50%"]').remove();
    },

    markAllRead() {
        Utils.api('notifications/mark_read.php', 'POST', { all: true }).then(function () {
            App.updateNotificationBadge(0);
            Notifications.loadNotifications();
        });
    },

    bindNotifications() {
        $('#mark-all-read-btn').on('click', function () {
            Notifications.markAllRead();
        });
    }
};
