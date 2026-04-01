/**
 * Padeladd - Authentication Module
 */
const Auth = {
    /**
     * Render login page
     */
    renderLogin() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <button class="auth-back-btn" onclick="window.history.back()" title="Back">← Back</button>
                    <div class="auth-logo">
                        <div class="brand-icon" style="cursor:pointer" onclick="App.navigate('welcome')">🏸</div>
                        <h1>Padeladd</h1>
                        <p>Sign in to your account</p>
                    </div>
                    <form id="login-form">
                        <div class="form-group">
                            <label for="login-email">Email</label>
                            <input type="email" class="form-control" id="login-email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="login-password">Password</label>
                            <input type="password" class="form-control" id="login-password" placeholder="Enter your password" required>
                        </div>
                        <div class="auth-optional">
                            <label class="custom-checkbox">
                                <input type="checkbox" id="remember-me">
                                <span class="checkmark"></span>
                                <span class="label-text">Remember me</span>
                            </label>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="login-btn">
                            Sign In
                        </button>
                    </form>
                    <div class="auth-footer">
                        Don't have an account? <a href="#/register" id="go-register">Create one</a>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render register page
     */
    renderRegister() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <button class="auth-back-btn" onclick="window.history.back()" title="Back">← Back</button>
                    <div class="auth-logo">
                        <div class="brand-icon" style="cursor:pointer" onclick="App.navigate('welcome')">🏸</div>
                        <h1>Padeladd</h1>
                        <p>Create your player account</p>
                    </div>
                    <form id="register-form">
                        <div class="form-group">
                            <label for="reg-name">Full Name</label>
                            <input type="text" class="form-control" id="reg-name" placeholder="Enter your name" required minlength="2">
                        </div>
                        <div class="form-group">
                            <label for="reg-email">Email</label>
                            <input type="email" class="form-control" id="reg-email" placeholder="Enter your email" required>
                        </div>
                        <div class="form-group">
                            <label for="reg-password">Password</label>
                            <input type="password" class="form-control" id="reg-password" placeholder="Min 6 characters" required minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="reg-password2">Confirm Password</label>
                            <input type="password" class="form-control" id="reg-password2" placeholder="Confirm password" required>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg" id="register-btn">
                            Create Account
                        </button>
                    </form>
                    <div class="auth-footer">
                        Already have an account? <a href="#/login" id="go-login">Sign in</a>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Bind login form events
     */
    bindLogin() {
        // Check for remembered email
        const savedEmail = localStorage.getItem('remember_email');
        if (savedEmail) {
            $('#login-email').val(savedEmail);
            $('#remember-me').prop('checked', true);
        }

        $('#login-form').on('submit', function (e) {
            e.preventDefault();
            const email = $('#login-email').val().trim();
            const password = $('#login-password').val();
            const remember = $('#remember-me').is(':checked');

            const $btn = $('#login-btn');
            $btn.prop('disabled', true).html('<span class="spinner"></span> Signing in...');

            Utils.api('auth/login.php', 'POST', {
                email: email,
                password: password
            }).then(function (resp) {
                // Remember me logic
                if (remember) {
                    localStorage.setItem('remember_email', email);
                } else {
                    localStorage.removeItem('remember_email');
                }

                App.currentUser = resp.data;
                Utils.toast('Welcome back, ' + resp.data.name + '!', 'success');

                if (!resp.data.profile_completed) {
                    App.navigate('complete-profile');
                } else {
                    App.navigate('dashboard');
                }
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Sign In');
            });
        });
        // Click outside to close
        $('.auth-container').on('mousedown', function (e) {
            if (e.target === this) {
                App.navigate('welcome');
            }
        });
    },

    /**
     * Bind register form events
     */
    bindRegister() {
        $('#register-form').on('submit', function (e) {
            e.preventDefault();

            const password = $('#reg-password').val();
            const password2 = $('#reg-password2').val();

            if (password !== password2) {
                Utils.toast('Passwords do not match', 'error');
                return;
            }

            const $btn = $('#register-btn');
            $btn.prop('disabled', true).html('<span class="spinner"></span> Creating account...');

            Utils.api('auth/register.php', 'POST', {
                name: $('#reg-name').val().trim(),
                email: $('#reg-email').val().trim(),
                password: password
            }).then(function (resp) {
                App.currentUser = resp.data;
                Utils.toast('Account created! Let\'s complete your profile.', 'success');
                App.navigate('complete-profile');
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Create Account');
            });
        });
        // Click outside to close
        $('.auth-container').on('mousedown', function (e) {
            if (e.target === this) {
                App.navigate('welcome');
            }
        });
    },

    /**
     * Logout
     */
    logout() {
        Utils.api('auth/logout.php', 'POST').then(function () {
            App.currentUser = null;
            Utils.toast('Logged out', 'info');
            App.navigate('welcome');
        });
    },

    /**
     * Check session on app load
     */
    checkSession() {
        return Utils.api('auth/session.php', 'GET').then(function (resp) {
            if (resp.success) {
                App.currentUser = resp.data;
                return resp.data;
            }
            return null;
        }).catch(function () {
            return null;
        });
    }
};
