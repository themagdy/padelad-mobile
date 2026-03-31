/**
 * Padeladd - Main App (SPA Router & Core)
 */
const App = {
    currentUser: null,
    currentRoute: null,

    /**
     * Initialize app
     */
    init() {
        const self = this;

        // Check session first
        Auth.checkSession().then(function (user) {
            self.currentUser = user;

            // Initialize Push (only affects mobile)
            Push.init();

            // Setup native back button handling
            self.setupBackButton();

            // Listen for hash changes
            $(window).on('hashchange', function () {
                self.handleRoute();
            });

            // Initial route
            self.handleRoute();
        });
    },

    /**
     * Setup native back button handling for mobile (Cordova/Capacitor)
     */
    setupBackButton() {
        const self = this;
        const handleBack = () => {
            // 1. Close Modal if open
            if ($('#app-modal').length) {
                Utils.closeModal();
                return;
            }

            // 2. Close mobile menu if open
            if ($('#main-nav').hasClass('show')) {
                $('#main-nav').removeClass('show');
                return;
            }

            // 3. Handle navigation back
            const rootRoutes = ['dashboard', 'welcome'];
            if (!rootRoutes.includes(self.currentRoute)) {
                window.history.back();
            } else {
                // For root routes, we don't call preventDefault or history.back
                // This allows the OS to handle the back button (usually exits app)
                return true; // signal that we didn't handle it
            }
        };

        // Standard Cordova/Capacitor backbutton listener
        const attachListener = () => {
            document.addEventListener('backbutton', function (e) {
                const result = handleBack();
                if (result !== true) {
                    e.preventDefault();
                }
            }, false);
        };

        if (window.cordova) {
            attachListener();
        } else {
            document.addEventListener('deviceready', attachListener, false);
        }
    },

    /**
     * Navigate to a route
     */
    navigate(route) {
        window.location.hash = '#/' + route;
    },

    /**
     * Navigate replacing current history entry (no back loop)
     */
    redirectReplace(route) {
        history.replaceState(null, '', '#/' + route);
        this.handleRoute();
    },

    /**
     * Handle current hash route
     */
    handleRoute() {
        const hash = window.location.hash.replace('#/', '') || '';
        const parts = hash.split('/');
        const route = parts[0] || 'welcome';
        const param = parts[1] || null;

        this.currentRoute = route;

        // Auth guard
        const publicRoutes = ['welcome', 'login', 'register'];
        if (!publicRoutes.includes(route) && !this.currentUser) {
            this.navigate('login');
            return;
        }

        // If logged in and going to public routes, redirect to dashboard
        if (this.currentUser && ['welcome', 'login', 'register'].includes(route)) {
            if (!this.currentUser.profile_completed) {
                this.redirectReplace('complete-profile');
                return;
            }
            this.redirectReplace('dashboard');
            return;
        }

        // Render navbar for authenticated users, or public navbar for guests
        if (this.currentUser) {
            this.renderNavbar();
        } else {
            this.renderPublicNavbar(route);
        }

        // Route to view
        this.renderView(route, param);
    },

    /**
     * Render navigation bar
     */
    renderNavbar() {
        const u = this.currentUser;
        if (!u) return;

        const isActive = (r) => this.currentRoute === r ? 'active' : '';

        $('#navbar-container').html(`
            <!-- Mobile Top Brand Bar -->
            <div class="mobile-brand-header d-md-none">
                <div class="navbar-brand" onclick="App.navigate('dashboard')">
                    <div class="brand-icon">🏸</div>
                    <span>Padeladd</span>
                </div>
                <!-- Logout on Mobile Top Right -->
                <button class="btn-logout-mobile" onclick="Auth.logout()">🚪 Logout</button>
            </div>

            <nav class="navbar">
                <div class="navbar-brand d-none d-md-flex" onclick="App.navigate('dashboard')">
                    <div class="brand-icon">🏸</div>
                    <span>Padeladd</span>
                </div>
                
                <ul class="navbar-nav" id="main-nav">
                    <li><button class="nav-link ${isActive('dashboard')}" onclick="App.navigate('dashboard')"><span>🏠</span> <span>Home</span></button></li>
                    <li><button class="nav-link ${isActive('leaderboard')}" onclick="App.navigate('leaderboard')"><span>🏆</span> <span>Rank</span></button></li>
                    <li><button class="nav-link ${isActive('open-matches')}" onclick="App.navigate('open-matches')"><span>🔥</span> <span>Padel</span></button></li>
                    <li><button class="nav-link ${isActive('my-matches')}" onclick="App.navigate('my-matches')"><span>📋</span> <span>History</span></button></li>
                    <li>
                        <button class="nav-link ${isActive('profile')}" id="user-menu-btn" onclick="App.navigate('profile')">
                            <div class="nav-avatar">
                                ${Utils.avatar(u.profile_image, 24, u.name, u.gender)}
                            </div>
                            <span>Profile</span>
                        </button>
                    </li>
                    <li class="d-none d-md-block"><button class="nav-link text-danger" onclick="Auth.logout()" style="color:var(--danger);font-weight:600"><span>🚪</span> <span>Logout</span></button></li>
                </ul>
            </nav>
        `);

        // Mobile toggle
        $('#nav-toggle-btn').on('click', function () {
            $('#main-nav').toggleClass('show');
        });

        // Close mobile nav on link click
        $('#main-nav .nav-link').on('click', function () {
            $('#main-nav').removeClass('show');
        });
    },

    /**
     * Render lightweight public navbar (for landing, login, register)
     */
    renderPublicNavbar(currentRoute) {
        // Don't show navbar on login/register pages (they have their own back button)
        if (currentRoute === 'login' || currentRoute === 'register') {
            $('#navbar-container').empty();
            return;
        }

        $('#navbar-container').html(`
            <nav class="navbar navbar-public">
                <div class="navbar-brand" onclick="App.navigate('welcome')">
                    <div class="brand-icon">🏸</div>
                    <span>Padeladd</span>
                </div>
                <div class="d-flex gap-sm">
                    <button class="btn btn-ghost" onclick="App.navigate('login')">Sign In</button>
                    <button class="btn btn-primary btn-sm" onclick="App.navigate('register')">Get Started</button>
                </div>
            </nav>
        `);
    },

    /**
     * Render view based on route
     */
    renderView(route, param) {
        const $view = $('#view-container');
        
        // Simple Smooth Fade Transition
        $view.removeClass('view-fade-in').css('opacity', 0);
        setTimeout(() => {
            $view.css('opacity', 1).addClass('view-fade-in');
        }, 10);

        switch (route) {
            // ===== Public Routes =====
            case 'welcome':
                $view.html(this.renderLanding());
                break;

            case 'login':
                $view.html(Auth.renderLogin());
                Auth.bindLogin();
                break;

            case 'register':
                $view.html(Auth.renderRegister());
                Auth.bindRegister();
                break;

            // ===== Auth Routes =====
            case 'complete-profile':
                $view.html(Profile.renderCompleteProfile());
                Profile.bindCompleteProfile();
                break;

            case 'dashboard':
                $view.html(this.renderDashboard());
                this.loadDashboard();
                break;

            case 'leaderboard':
                $view.html(Leaderboard.renderLeaderboard());
                Leaderboard.loadLeaderboard();
                Leaderboard.bindLeaderboard();
                break;

            case 'create-match':
                $view.html(Match.renderCreateMatch());
                Match.bindCreateMatch();
                break;

            case 'open-matches':
                $view.html(Match.renderOpenMatches());
                Match.loadOpenMatches();
                Match.bindOpenMatches();
                break;

            case 'my-matches':
                $view.html(Match.renderMyMatches());
                Match.loadMyMatches();
                Match.bindMyMatches();
                break;

            case 'match':
                $view.html(Match.renderMatchDetails(param));
                Match.loadMatchDetails(param);
                break;

            case 'player':
                $view.html(Profile.renderPublicProfile(param));
                Profile.loadPublicProfile(param);
                break;
                
            case 'profile':
                $view.html(Profile.renderProfile());
                Profile.loadProfile();
                break;

            case 'player':
                $view.html(Profile.renderProfile(parseInt(param)));
                Profile.loadProfile(parseInt(param));
                break;

            case 'edit-profile':
                $view.html(Profile.renderEditProfile());
                Profile.loadEditProfile();
                break;

            default:
                $view.html(`
                    <div class="main-content">
                        <div class="empty-state">
                            <div class="empty-icon">🤷</div>
                            <h2>Page Not Found</h2>
                            <p>The page you're looking for doesn't exist.</p>
                            <button class="btn btn-primary mt-md" onclick="App.navigate('dashboard')">Go to Dashboard</button>
                        </div>
                    </div>
                `);
        }

        // Scroll to top
        window.scrollTo(0, 0);
    },

    /**
     * Render landing page
     */
    renderLanding() {
        return `
            <div class="main-content">
                <div class="landing-hero">
                    <h1>Compete. Rank Up.<br>Dominate the Court.</h1>
                    <p>
                        Padeladd is the ultimate padel ranking platform. Create matches, challenge opponents, 
                        and climb the leaderboard. Fair play, competitive spirit, real rankings.
                    </p>
                    <div class="hero-buttons">
                        <button class="btn btn-primary btn-lg" onclick="App.navigate('register')">
                            🎾 Get Started — It's Free
                        </button>
                        <button class="btn btn-secondary btn-lg" onclick="App.navigate('login')">
                            Sign In
                        </button>
                    </div>
                </div>

                <div class="landing-features">
                    <div class="feature-card">
                        <div class="feature-icon">⚡</div>
                        <h3>Fair Ranking System</h3>
                        <p>Points-based rankings with special upset rules. Beat a stronger team and swap positions!</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🎯</div>
                        <h3>Balanced Matchmaking</h3>
                        <p>Teams can only play if their points difference is within 10 points. Every match is competitive.</p>
                    </div>
                    <div class="feature-card">
                        <div class="feature-icon">🏆</div>
                        <h3>Live Leaderboard</h3>
                        <p>Track your rank, wins, and points in real-time. Climb to the top and prove you're the best.</p>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render dashboard
     */
    renderDashboard() {
        const u = this.currentUser;
        return `
            <div class="main-content">
                <div class="page-header">
                    <h1>Welcome back, ${Utils.escape(u.name)} 👋</h1>
                    <p>
                        Here's your padel overview  
                        ${u.player_code ? `<span style="display:inline-block;font-family:var(--font-main);font-weight:600;font-size:0.8rem;background:rgba(0,200,150,0.1);color:var(--primary);padding:3px 10px;border-radius:6px;border:1px solid rgba(0,200,150,0.2);margin-left:10px">🆔 ${Utils.escape(u.player_code)}</span>` : ''}
                    </p>
                </div>

                <div class="stats-grid" id="dashboard-stats">
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value" id="dash-points">${u.points}</div>
                        <div class="stat-label">Your Points</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value" id="dash-rank">#${u.rank || '—'}</div>
                        <div class="stat-label">Your Rank</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎾</div>
                        <div class="stat-value" id="dash-matches">—</div>
                        <div class="stat-label">Matches Played</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🔥</div>
                        <div class="stat-value" id="dash-winrate">—</div>
                        <div class="stat-label">Win Rate</div>
                    </div>
                </div>

                <div class="grid-stack-mobile" style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
                    <button class="btn btn-primary btn-lg btn-block" onclick="App.navigate('create-match')">
                        ⚡ Create Match
                    </button>
                    <button class="btn btn-accent btn-lg btn-block" onclick="App.navigate('open-matches')">
                        🔥 Find Match
                    </button>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3>📋 Recent Matches</h3>
                        <button class="btn btn-ghost btn-sm" onclick="App.navigate('my-matches')">View All →</button>
                    </div>
                    <div id="dashboard-recent-matches">
                        ${Utils.loader('Loading...')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Load dashboard data
     */
    loadDashboard() {
        // Refresh user session data
        Auth.checkSession().then(function (user) {
            if (user) {
                App.currentUser = user;
                $('#dash-points').text(user.points);
                $('#dash-rank').text('#' + user.rank);
                App.renderNavbar();
            }
        });

        // Load profile stats
        Utils.api('profile/get.php').then(function (resp) {
            const p = resp.data;
            $('#dash-matches').text(p.total_matches);
            const wr = p.total_matches > 0 ? Math.round((p.wins / p.total_matches) * 100) + '%' : '0%';
            $('#dash-winrate').text(wr);
        });

        // Load recent matches
        Utils.api('match/my_matches.php').then(function (resp) {
            const matches = resp.data;
            if (!matches || matches.length === 0) {
                $('#dashboard-recent-matches').html(`
                    <div class="empty-state" style="padding:24px">
                        <p>No matches yet. Time to play!</p>
                    </div>
                `);
                return;
            }

            let html = '';
            matches.slice(0, 5).forEach(m => {
                html += Match.renderMatchCard(m, false);
            });
            $('#dashboard-recent-matches').html(`<div class="match-list">${html}</div>`);
        }).catch(function () {
            $('#dashboard-recent-matches').html(`<div class="empty-state"><p>Failed to load matches</p></div>`);
        });
    }
};

// ===== Boot the app =====
$(document).ready(function () {
    App.init();
});
