/**
 * Padeladd - Push Notification Module
 * Handles device registration and notification reception via Capacitor
 */
const Push = {
    /**
     * Initialize push notifications
     */
    init() {
        if (!window.Capacitor || !window.Capacitor.isNativePlatform()) {
            console.log('Push: Not running on a native platform, skipping setup.');
            return;
        }

        if (!window.Capacitor.Plugins.PushNotifications) {
            console.error('Push: Capacitor PushNotifications plugin not found.');
            return;
        }

        this.setupPermissions();
        this.setupListeners();
    },

    /**
     * Request permissions and get token
     */
    async setupPermissions() {
        const PushNotifications = window.Capacitor.Plugins.PushNotifications;
        try {
            // Check for notifications permission
            let permStatus = await PushNotifications.checkPermissions();

            if (permStatus.receive === 'prompt') {
                permStatus = await PushNotifications.requestPermissions();
            }

            if (permStatus.receive !== 'granted') {
                console.error('Push: User denied permission!');
                return;
            }

            console.log('Push: Permission granted');
            
            // Register with Apple / Google to receive push via APNS/FCM
            PushNotifications.register();

        } catch (err) {
            console.error('Push: Error requesting permission:', err);
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
        const PushNotifications = window.Capacitor.Plugins.PushNotifications;

        // On success, we should be able to receive notifications
        PushNotifications.addListener('registration',
            (token) => {
                console.log('Push: Device token obtained: ' + token.value);
                if (App.currentUser) {
                    this.saveToken(token.value);
                }
            }
        );

        // Some issue with our setup and push will not work
        PushNotifications.addListener('registrationError',
            (error) => {
                console.error('Push: Error on registration: ' + JSON.stringify(error));
            }
        );

        // Show us the notification payload if the app is open on our device
        PushNotifications.addListener('pushNotificationReceived',
            (notification) => {
                console.log('Push: Foreground message received: ', notification);
                Utils.toast(`${notification.title}: ${notification.body}`, 'info');
            }
        );

        // Method called when tapping on a notification
        PushNotifications.addListener('pushNotificationActionPerformed',
            (notification) => {
                console.log('Push: Background message click:', notification);
                const data = notification.notification.data;
                this.handleNavigation(data);
            }
        );
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
