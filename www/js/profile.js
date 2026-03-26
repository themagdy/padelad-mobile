/**
 * PadelAD - Profile Module
 */
const Profile = {
    /**
     * Render complete profile page (first time after registration)
     */
    renderCompleteProfile() {
        const user = App.currentUser;
        return `
            <div class="main-content">
                <div class="page-header text-center">
                    <h1>🏸 Complete Your Profile</h1>
                    <p>Tell us about yourself to get started</p>
                </div>
                <div style="max-width:560px;margin:0 auto;">
                    <div class="card">
                        <form id="complete-profile-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="cp-name">Full Name</label>
                                    <input type="text" class="form-control" id="cp-name" value="${Utils.escape(user.name)}" required>
                                </div>
                                <div class="form-group">
                                    <label for="cp-age">Age</label>
                                    <input type="number" class="form-control" id="cp-age" min="5" max="100" placeholder="Your age" required>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="cp-hand">Playing Hand</label>
                                    <select class="form-control" id="cp-hand" required>
                                        <option value="">Select hand</option>
                                        <option value="right">Right-Handed</option>
                                        <option value="left">Left-Handed</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="cp-gender">Gender</label>
                                    <select class="form-control" id="cp-gender">
                                        <option value="">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="cp-city">City / Location</label>
                                <input type="text" class="form-control" id="cp-city" placeholder="e.g. Cairo, Dubai, Riyadh" required>
                            </div>
                            <div class="form-group">
                                <label for="cp-phone">Phone (optional)</label>
                                <input type="text" class="form-control" id="cp-phone" placeholder="Your phone number">
                            </div>
                            <div class="form-group">
                                <label for="cp-bio">Short Bio (optional)</label>
                                <textarea class="form-control" id="cp-bio" placeholder="Tell us about your padel experience..." rows="3"></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg mt-md" id="cp-submit">
                                Complete Profile & Start Playing
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Render public profile wrapper with a back button
     */
    renderPublicProfile() {
        return `
            <div class="main-content">
                <div class="d-flex" style="margin-bottom:16px">
                    <button class="btn btn-secondary btn-sm" onclick="window.history.back()">← Back</button>
                </div>
                <div id="profile-page">
                    ${Utils.loader('Loading profile...')}
                </div>
            </div>
        `;
    },

    /**
     * Render personal profile wrapper (no back btn, standalone)
     */
    renderProfile() {
        return `
            <div class="main-content" id="profile-page">
                ${Utils.loader('Loading profile...')}
            </div>
        `;
    },

    /**
     * Helper to load public profiles easily from router
     */
    loadPublicProfile(playerId) {
        this.loadProfile(playerId);
    },

    /**
     * Load and render profile data
     */
    loadProfile(playerId = null) {
        const endpoint = playerId ? `profile/get.php?id=${playerId}` : 'profile/get.php';
        const isOwn = !playerId || playerId === App.currentUser?.id;

        Utils.api(endpoint).then(function (resp) {
            const p = resp.data;
            const winRate = p.total_matches > 0 ? Math.round((p.wins / p.total_matches) * 100) : 0;

            let html = `
                <div class="profile-header">
                    <div class="profile-avatar-large" id="profile-avatar-wrapper">
                        ${Utils.avatar(p.profile_image, 100, p.name, p.gender)}
                        ${isOwn ? `<div class="avatar-upload-overlay" id="avatar-upload-trigger">📷</div>` : ''}
                    </div>
                    <div class="profile-info">
                        <h2>${Utils.escape(p.name)}</h2>
                        <div class="profile-meta">
                            ${p.player_code ? `<span style="font-family:var(--font-main);font-weight:600;font-size:0.8rem;background:rgba(0,200,150,0.1);color:var(--primary);padding:2px 8px;border-radius:6px;border:1px solid rgba(0,200,150,0.2)">🆔 ${Utils.escape(p.player_code)}</span>` : ''}
                            <span>🏆 Rank #${p.rank}</span>
                            <span>⚡ ${p.points} pts</span>
                            ${p.city ? `<span>📍 ${Utils.escape(p.city)}</span>` : ''}
                            ${p.hand ? `<span>✋ ${p.hand === 'right' ? 'Right-Handed' : 'Left-Handed'}</span>` : ''}
                            ${p.age ? `<span>🎂 ${p.age} years</span>` : ''}
                        </div>
                        ${p.bio ? `<p class="mt-sm" style="color:var(--text-secondary);font-size:0.9rem">${Utils.escape(p.bio)}</p>` : ''}
                        ${isOwn ? `<button class="btn btn-secondary btn-sm mt-md" id="edit-profile-btn">✏️ Edit Profile</button>` : ''}
                    </div>
                </div>

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon">⚡</div>
                        <div class="stat-value">${p.points}</div>
                        <div class="stat-label">Total Points</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🏆</div>
                        <div class="stat-value">#${p.rank}</div>
                        <div class="stat-label">Ranking</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">🎾</div>
                        <div class="stat-value">${p.total_matches}</div>
                        <div class="stat-label">Matches Played</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📊</div>
                        <div class="stat-value">${winRate}%</div>
                        <div class="stat-label">Win Rate (${p.wins}W / ${p.losses}L)</div>
                    </div>
                </div>
            `;

            html += `
                <div class="mt-lg" style="margin-top:24px">
                    <h3 style="margin-bottom:16px;font-size:1.1rem;color:var(--text-main);font-weight:600;">Completed Matches</h3>
                    <div id="profile-completed-matches">
                        ${Utils.loader('Loading matches...')}
                    </div>
                </div>
            `;

            // Hidden file input for avatar upload
            if (isOwn) {
                html += `<input type="file" id="avatar-file-input" accept="image/*" style="display:none">`;
            }

            $('#profile-page').html(html);

            // Fetch completed matches
            Utils.api(`match/my_matches.php?player_id=${p.id}&status=completed`).then(function(mResp) {
                const matches = mResp.data;
                if (!matches || matches.length === 0) {
                    $('#profile-completed-matches').html('<div class="empty-state"><p>No completed matches yet.</p></div>');
                    return;
                }
                let mHtml = '';
                matches.forEach(m => {
                    mHtml += Match.renderMatchCard(m, false);
                });
                $('#profile-completed-matches').html(`<div class="match-list">${mHtml}</div>`);
            }).catch(function() {
                $('#profile-completed-matches').html('<div class="empty-state"><p>Failed to load matches.</p></div>');
            });

            // Bind avatar upload
            if (isOwn) {
                $('#avatar-upload-trigger').on('click', function () {
                    $('#avatar-file-input').click();
                });

                $('#avatar-file-input').on('change', function () {
                    const file = this.files[0];
                    if (!file) return;

                    const fd = new FormData();
                    fd.append('image', file);

                    Utils.apiUpload('profile/upload_image.php', fd).then(function (resp) {
                        Utils.toast('Profile image updated!', 'success');
                        App.currentUser.profile_image = resp.data.profile_image;
                        App.renderNavbar();
                        Profile.loadProfile();
                    }).catch(function (msg) {
                        Utils.toast(msg, 'error');
                    });
                });

                $('#edit-profile-btn').on('click', function () {
                    App.navigate('edit-profile');
                });
            }
        }).catch(function (msg) {
            $('#profile-page').html(`<div class="empty-state"><div class="empty-icon">😕</div><p>${msg}</p></div>`);
        });
    },

    /**
     * Render edit profile page
     */
    renderEditProfile() {
        const user = App.currentUser;
        return `
            <div class="main-content">
                <div class="page-header d-flex justify-between align-center" style="flex-wrap:wrap;gap:16px">
                    <div>
                        <h1>Edit Profile</h1>
                        <p>Update your player information</p>
                    </div>
                    <button class="btn btn-secondary" onclick="App.navigate('profile')">← Back</button>
                </div>
                <div style="max-width:560px;">
                    <div class="card" id="edit-profile-card">
                        ${Utils.loader('Loading...')}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Load edit profile form with current data
     */
    loadEditProfile() {
        Utils.api('profile/get.php').then(function (resp) {
            const p = resp.data;
            $('#edit-profile-card').html(`
                <form id="edit-profile-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ep-name">Full Name</label>
                            <input type="text" class="form-control" id="ep-name" value="${Utils.escape(p.name)}" required>
                        </div>
                        <div class="form-group">
                            <label for="ep-age">Age</label>
                            <input type="number" class="form-control" id="ep-age" value="${p.age || ''}" min="5" max="100">
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="ep-hand">Playing Hand</label>
                            <select class="form-control" id="ep-hand">
                                <option value="">Select hand</option>
                                <option value="right" ${p.hand === 'right' ? 'selected' : ''}>Right-Handed</option>
                                <option value="left" ${p.hand === 'left' ? 'selected' : ''}>Left-Handed</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="ep-gender">Gender</label>
                            <select class="form-control" id="ep-gender">
                                <option value="">Prefer not to say</option>
                                <option value="male" ${p.gender === 'male' ? 'selected' : ''}>Male</option>
                                <option value="female" ${p.gender === 'female' ? 'selected' : ''}>Female</option>
                                <option value="other" ${p.gender === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="ep-city">City / Location</label>
                        <input type="text" class="form-control" id="ep-city" value="${Utils.escape(p.city || '')}">
                    </div>
                    <div class="form-group">
                        <label for="ep-phone">Phone</label>
                        <input type="text" class="form-control" id="ep-phone" value="${Utils.escape(p.phone || '')}">
                    </div>
                    <div class="form-group">
                        <label for="ep-bio">Short Bio</label>
                        <textarea class="form-control" id="ep-bio" rows="3">${Utils.escape(p.bio || '')}</textarea>
                    </div>
                    <div class="d-flex gap-sm mt-md">
                        <button type="submit" class="btn btn-primary" id="ep-submit">Save Changes</button>
                        <button type="button" class="btn btn-secondary" id="ep-cancel">Cancel</button>
                    </div>
                </form>
            `);

            Profile.bindEditProfile();
        });
    },

    /**
     * Bind profile form events
     */
    bindCompleteProfile() {
        $('#complete-profile-form').on('submit', function (e) {
            e.preventDefault();
            const $btn = $('#cp-submit');
            $btn.prop('disabled', true).html('<span class="spinner"></span> Saving...');

            const data = {
                name: $('#cp-name').val().trim(),
                age: parseInt($('#cp-age').val()),
                hand: $('#cp-hand').val(),
                city: $('#cp-city').val().trim(),
            };

            const gender = $('#cp-gender').val();
            if (gender) data.gender = gender;

            const phone = $('#cp-phone').val().trim();
            if (phone) data.phone = phone;

            const bio = $('#cp-bio').val().trim();
            if (bio) data.bio = bio;

            Utils.api('profile/update.php', 'POST', data).then(function (resp) {
                App.currentUser.profile_completed = resp.data.profile_completed;
                App.currentUser.name = data.name;
                Utils.toast('Profile completed! Welcome aboard! 🎾', 'success');
                App.navigate('dashboard');
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Complete Profile & Start Playing');
            });
        });
    },

    bindEditProfile() {
        $('#edit-profile-form').on('submit', function (e) {
            e.preventDefault();
            const $btn = $('#ep-submit');
            $btn.prop('disabled', true).html('<span class="spinner"></span> Saving...');

            const data = {
                name: $('#ep-name').val().trim(),
                age: parseInt($('#ep-age').val()) || null,
                hand: $('#ep-hand').val() || null,
                gender: $('#ep-gender').val() || null,
                city: $('#ep-city').val().trim(),
                phone: $('#ep-phone').val().trim(),
                bio: $('#ep-bio').val().trim(),
            };

            Utils.api('profile/update.php', 'POST', data).then(function (resp) {
                App.currentUser.name = data.name;
                App.currentUser.profile_completed = resp.data.profile_completed;
                App.renderNavbar();
                Utils.toast('Profile updated!', 'success');
                App.navigate('profile');
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Save Changes');
            });
        });

        $('#ep-cancel').on('click', function () {
            App.navigate('profile');
        });
    }
};
