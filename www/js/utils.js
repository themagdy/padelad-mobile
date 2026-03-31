/**
 * Padeladd - Utility Functions
 */
const Utils = {
    /**
     * API base URL
     */
    API_BASE: (window.location.protocol === 'file:' || window.cordova || window.Capacitor) 
        ? 'https://ahmedmagdy.com/padeladd/api' 
        : 'api',

    /**
     * Make AJAX request to API
     */
    api(endpoint, method = 'GET', data = null) {
        const options = {
            url: `${this.API_BASE}/${endpoint}`,
            method: method,
            dataType: 'json',
            contentType: 'application/json',
            xhrFields: {
                withCredentials: true
            }
        };

        if (data && method !== 'GET') {
            options.data = JSON.stringify(data);
        }

        return $.ajax(options).then(function (resp) {
            if (resp && resp.success === false) {
                return $.Deferred().reject({ customMessage: resp.message || 'API Error' }).promise();
            }
            return resp;
        }).catch(function (xhr) {
            if (xhr && xhr.customMessage) {
                return $.Deferred().reject(xhr.customMessage).promise();
            }

            let msg = 'Something went wrong';
            if (xhr.status === 0) {
                msg = 'Connection error. Check your internet connection or API domain.';
            } else if (xhr.status === 404) {
                msg = 'API not found (404). Check API endpoint URL.';
            } else if (xhr.status === 401) {
                App.currentUser = null;
                App.navigate('login');
                msg = 'Session expired. Please log in again.';
            } else if (xhr.status >= 500) {
                msg = 'Server error (' + xhr.status + '). Please try again later.';
            }

            try {
                if (xhr.responseText) {
                    const resp = JSON.parse(xhr.responseText);
                    msg = resp.message || msg;
                }
            } catch (e) { }

            return $.Deferred().reject(msg).promise();
        });
    },

    /**
     * Upload file via FormData
     */
    apiUpload(endpoint, formData) {
        return $.ajax({
            url: `${this.API_BASE}/${endpoint}`,
            method: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
        }).then(function (resp) {
            if (resp && resp.success === false) {
                return $.Deferred().reject({ customMessage: resp.message || 'Upload failed' }).promise();
            }
            return resp;
        }).catch(function (xhr) {
            if (xhr && xhr.customMessage) {
                return $.Deferred().reject(xhr.customMessage).promise();
            }

            let msg = 'Upload failed';
            try {
                if (xhr.responseText) {
                    const resp = JSON.parse(xhr.responseText);
                    msg = resp.message || msg;
                }
            } catch (e) { }
            return $.Deferred().reject(msg).promise();
        });
    },

    /**
     * Show toast notification
     */
    toast(message, type = 'info') {
        const icon = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type] || 'ℹ';
        const $toast = $(`
            <div class="toast toast-${type}">
                <span>${icon}</span>
                <span>${this.escape(message)}</span>
                <button class="toast-close">×</button>
            </div>
        `);

        $('#toast-container').append($toast);
        $toast.find('.toast-close').on('click', () => {
            $toast.css('animation', 'slideOutRight 0.3s ease forwards');
            setTimeout(() => $toast.remove(), 300);
        });

        setTimeout(() => {
            if ($toast.parent().length) {
                $toast.css('animation', 'slideOutRight 0.3s ease forwards');
                setTimeout(() => $toast.remove(), 300);
            }
        }, 4000);
    },

    /**
     * Show modal
     */
    showModal(title, bodyHtml, footerHtml = '') {
        this.closeModal();
        const $modal = $(`
            <div class="modal-backdrop" id="app-modal">
                <div class="modal">
                    <div class="modal-header">
                        <h2>${this.escape(title)}</h2>
                        <button class="modal-close" id="modal-close-btn">×</button>
                    </div>
                    <div class="modal-body">${bodyHtml}</div>
                    ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
                </div>
            </div>
        `);

        $('#modal-container').html($modal);

        // Close handlers
        $modal.find('#modal-close-btn').on('click', () => this.closeModal());
        $modal.on('click', function (e) {
            if ($(e.target).hasClass('modal-backdrop')) Utils.closeModal();
        });
    },

    closeModal() {
        $('#modal-container').empty();
    },

    /**
     * HTML escape
     */
    escape(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Format date
     */
    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        const now = new Date();
        const diff = now - d;

        if (diff >= 0 && diff < 60000) return 'Just now';
        if (diff >= 0 && diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
        if (diff >= 0 && diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
        if (diff >= 0 && diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';

        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    /**
     * Format date and time (for scheduled future events)
     */
    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    /**
     * Get avatar HTML
     */
    avatar(profileImage, size = 40, name = '', gender = '') {
        if (profileImage) {
            return `<img src="uploads/${profileImage}" alt="${this.escape(name)}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;">`;
        }

        let bg = 'var(--bg-secondary)';
        let icon = '👤';

        if (gender === 'male') {
            bg = 'rgba(56, 139, 253, 0.15)'; // Blue tint
            icon = '👱🏻‍♂️';
        } else if (gender === 'female') {
            bg = 'rgba(255, 107, 53, 0.15)'; // Orange/Pink tint
            icon = '👩🏼';
        } else {
            icon = name ? name.charAt(0).toUpperCase() : '👤';
        }

        return `<span style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:1px solid rgba(255,255,255,0.05);display:inline-flex;align-items:center;justify-content:center;font-size:${size * 0.55}px;font-weight:bold">${icon}</span>`;
    },

    /**
     * Points change display
     */
    pointsChange(before, after) {
        if (before === null || after === null) return '';
        const diff = after - before;
        if (diff > 0) return `<span class="points-change positive">+${diff}</span>`;
        if (diff < 0) return `<span class="points-change negative">${diff}</span>`;
        return `<span class="points-change neutral">0</span>`;
    },

    /**
     * Loading HTML
     */
    loader(message = 'Loading...') {
        return `<div class="loading-overlay"><div class="spinner spinner-lg"></div><span>${message}</span></div>`;
    },

    /**
     * Debounce function
     */
    debounce(fn, delay = 300) {
        let timer;
        return function (...args) {
            clearTimeout(timer);
            timer = setTimeout(() => fn.apply(this, args), delay);
        };
    }
};
