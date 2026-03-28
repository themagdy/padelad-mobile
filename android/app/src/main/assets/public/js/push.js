/**
 * Padeladd - Push Notification Module
 * Handles device registration and notification reception
 */
const Push = {
    /**
     * Initialize push notifications
     */
    init() {
        if (!window.cordova) {
            console.log('Push: Not running in Cordova environment, skipping setup.');
            return;
        }

        // Check if plugin exists
        if (!window.FirebaseMessaging) {
            console.error('Push: FirebaseMessaging plugin not found.');
            return;
        }

        this.setupPermissions();
        this.setupListeners();
    },

    /**
     * Request permissions and get token
     */
    async setupPermissions() {
        try {
            // Check for notifications permission
            let permission = await FirebaseMessaging.requestPermission();
            console.log('Push: Permission granted:', permission);

            if (permission === 'granted') {
                this.refreshToken();
            }
        } catch (err) {
            console.error('Push: Error requesting permission:', err);
        }
    },

    /**
     * Get and save the registration token
     */
    async refreshToken() {
        try {
            const token = await FirebaseMessaging.getToken();
            console.log('Push: Device token obtained:', token);
            
            if (token && App.currentUser) {
                this.saveToken(token);
            }
        } catch (err) {
            console.error('Push: Error getting token:', err);
        }
    },

    /**
     * Send token to backend
     */
    saveToken(token) {
        Utils.api('auth/update_fcm_token.php', 'POST', { token: token })
            .then(() => console.log('Push: Token synced with server.'))
            .catch(err => console.error('Push: Failed to sync token:', err));
    },

    /**
     * Listen for incoming notifications
     */
    setupListeners() {
        // Foreground notification
        FirebaseMessaging.onMessage((payload) => {
            console.log('Push: Foreground message received:', payload);
            
            // Show as in-app toast if it's not a silence notification
            if (payload.notification) {
                Utils.toast(`${payload.notification.title}: ${payload.notification.body}`, 'info');
            }
        });

        // Background notification clicked
        FirebaseMessaging.onBackgroundMessage((payload) => {
            console.log('Push: Background message click:', payload);
            this.handleNavigation(payload.data);
        });

        // Token refreshed by Firebase
        FirebaseMessaging.onTokenRefresh((token) => {
            console.log('Push: Token refreshed by Firebase:', token);
            if (App.currentUser) {
                this.saveToken(token);
            }
        });
    },

    /**
     * Handle app navigation based on notification data
     */
    handleNavigation(data) {
        if (!data) return;

        // Example: Navigate to a specific match if match_id is present
        if (data.match_id) {
            App.navigate(`match/${data.match_id}`);
        }
    }
};
