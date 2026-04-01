/**
 * Padeladd - Match Module
 */
const Match = {
    /**
     * Render create match page
     */
    renderCreateMatch() {
        const now = new Date();
        now.setHours(now.getHours() + 1, 0, 0, 0);
        const defaultTime = now.toISOString().slice(0, 16);

        return `
            <div class="main-content">
                <div class="page-header d-flex justify-between align-center" style="flex-wrap:wrap;gap:16px">
                    <div>
                        <h1>⚡ Create a Match</h1>
                        <p>Set up a new padel match and find opponents</p>
                    </div>
                    <button class="btn btn-secondary" onclick="window.history.back()">← Back</button>
                </div>
                <div style="max-width:560px;">
                    <div class="card">
                        <form id="create-match-form">
                            <div class="form-group" style="position:relative">
                                <label for="match-court-search">📍 Court <span style="color:var(--danger)">*</span></label>
                                <input type="text" class="form-control" id="match-court-search" placeholder="Type to search for a court..." autocomplete="off">
                                <div class="player-search-results hidden" id="court-results" style="position:absolute;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;box-shadow:0 10px 24px rgba(0,0,0,0.5);width:100%"></div>
                                <div class="hidden mt-sm p-sm" id="selected-court" style="background:var(--bg-card-hover);border-radius:6px;border:1px solid var(--border)">
                                    <div class="d-flex align-center justify-between gap-sm">
                                        <span id="selected-court-info"></span>
                                        <button type="button" class="btn btn-ghost btn-sm text-danger" style="color:var(--danger)" id="remove-court">✕ Remove</button>
                                    </div>
                                </div>
                                <input type="hidden" id="match-court-id" value="">
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="match-datetime">📅 Date &amp; Time <span style="color:var(--danger)">*</span></label>
                                    <input type="datetime-local" class="form-control" id="match-datetime" value="${defaultTime}">
                                </div>
                                <div class="form-group">
                                    <label for="match-court-name">🏢 Court Number/Name <span style="color:var(--danger)">*</span></label>
                                    <input type="text" class="form-control" id="match-court-name" placeholder="e.g. 1, 2, Center Court..." maxlength="50">
                                </div>
                            </div>

                            <!-- Creation mode toggle -->
                            <div class="form-group">
                                <label>Creating As</label>
                                <div class="d-flex gap-sm">
                                    <button type="button" class="btn btn-primary btn-sm" id="mode-solo" style="flex:1">👤 Solo</button>
                                    <button type="button" class="btn btn-secondary btn-sm" id="mode-partner" style="flex:1">👥 With Partner</button>
                                </div>
                                <div class="form-hint mt-sm" id="mode-hint">Match published immediately. Anyone can fill the remaining slots.</div>
                            </div>

                            <!-- Partner search (hidden by default) -->
                            <div class="form-group hidden" id="partner-search-group" style="position:relative">
                                <label for="partner-search">Partner to Play With</label>
                                <input type="text" class="form-control" id="partner-search" placeholder="Type player name or ID to search...">
                                <div class="player-search-results hidden" id="partner-results" style="position:absolute;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;box-shadow:0 10px 24px rgba(0,0,0,0.5)"></div>
                                <div class="hidden mt-sm p-sm" id="selected-partner" style="background:var(--bg-card-hover);border-radius:6px;border:1px solid var(--border)">
                                    <div class="d-flex align-center justify-between gap-sm">
                                        <span id="selected-partner-info"></span>
                                        <button type="button" class="btn btn-ghost btn-sm text-danger" style="color:var(--danger)" id="remove-partner">✕ Remove</button>
                                    </div>
                                </div>
                                <input type="hidden" id="partner-id" value="">
                                <div class="form-hint mt-sm" style="color:var(--warning)">⏳ Match will be pending until your partner approves.</div>
                            </div>

                            <div class="form-group">
                                <label id="team-points-label">Your Points</label>
                                <div class="points-display" id="team-points-display" style="font-size:1.5rem;font-weight:700;color:var(--primary)">${App.currentUser?.points || 0} pts</div>
                                <div class="form-hint">Team total determines which opponents can join (±10 points rule)</div>
                            </div>
                            <button type="submit" class="btn btn-primary btn-block btn-lg mt-md" id="create-match-btn">
                                🎾 Create Match
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Bind create match events
     */
    bindCreateMatch() {
        // Mode toggle
        $('#mode-solo').on('click', function () {
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            $('#mode-partner').removeClass('btn-primary').addClass('btn-secondary');
            $('#partner-search-group').addClass('hidden');
            $('#mode-hint').text('Match published immediately. Anyone can fill the remaining slots.');
            $('#partner-id').val('');
            $('#selected-partner').addClass('hidden');
            $('#partner-search').show().val('');
            const myPts = parseInt(App.currentUser?.points || 0);
            $('#team-points-label').text('Your Points');
            $('#team-points-display').text(`${myPts} pts`);
        });

        $('#mode-partner').on('click', function () {
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            $('#mode-solo').removeClass('btn-primary').addClass('btn-secondary');
            $('#partner-search-group').removeClass('hidden');
            $('#mode-hint').text('Match will be pending until your partner approves.');
        });

        // Court autocomplete
        Utils.api('courts/list.php').then(function (resp) {
            App._allCourts = [];
            if (Array.isArray(resp.data)) {
                resp.data.forEach(group => {
                    if (Array.isArray(group.courts)) {
                        group.courts.forEach(c => {
                            App._allCourts.push({ id: c.id, name: c.name, area: group.area });
                        });
                    }
                });
            }
        });

        $('#match-court-search').on('input', function() {
            const query = $(this).val().trim().toLowerCase();
            const $results = $('#court-results');
            if (query.length < 1) { $results.addClass('hidden'); return; }

            const filtered = (App._allCourts || []).filter(c =>
                c.name.toLowerCase().includes(query) || c.area.toLowerCase().includes(query)
            ).slice(0, 10);

            if (filtered.length === 0) {
                $results.html('<div style="padding:12px;color:var(--text-muted)">No courts found</div>').removeClass('hidden');
                return;
            }

            let html = '';
            filtered.forEach(c => {
                html += `
                    <div class="player-search-item court-search-item" data-id="${c.id}" data-name="${Utils.escape(c.name)}" data-area="${Utils.escape(c.area)}">
                        <span>${Utils.escape(c.name)}</span>
                        <span style="margin-left:auto;color:var(--text-muted);font-size:0.85rem">${Utils.escape(c.area)}</span>
                    </div>
                `;
            });
            $results.html(html).removeClass('hidden');
        });

        $(document).off('click', '.court-search-item').on('click', '.court-search-item', function() {
            const id = $(this).data('id');
            const name = $(this).data('name');
            const area = $(this).data('area');
            $('#match-court-id').val(id);
            $('#selected-court-info').html(`📍 <strong>${name}</strong> <span class="text-muted">(${area})</span>`);
            $('#selected-court').removeClass('hidden');
            $('#match-court-search').hide().val('');
            $('#court-results').addClass('hidden');
        });

        $('#remove-court').on('click', function() {
            $('#match-court-id').val('');
            $('#selected-court').addClass('hidden');
            $('#match-court-search').show().val('').focus();
        });

        // Partner search
        $('#partner-search').on('input', Utils.debounce(function () {
            const query = $(this).val().trim();
            if (query.length < 2) { $('#partner-results').addClass('hidden'); return; }

            Utils.api(`leaderboard/get.php?limit=50&search=${encodeURIComponent(query)}`).then(function (resp) {
                const queryToLower = query.toLowerCase();
                const players = resp.data.players.filter(p =>
                    p.id !== App.currentUser.id &&
                    (p.name.toLowerCase().includes(queryToLower) ||
                        (p.player_code && p.player_code.toLowerCase().includes(queryToLower)))
                );

                if (players.length === 0) {
                    $('#partner-results').html('<div style="padding:12px;color:var(--text-muted)">No players found</div>').removeClass('hidden');
                    return;
                }

                let html = '';
                players.forEach(p => {
                    html += `
                        <div class="player-search-item create-partner-item" data-id="${p.id}" data-name="${Utils.escape(p.name)}" data-points="${p.points}">
                            <div class="mini-avatar">${Utils.avatar(p.profile_image, 32, p.name, p.gender)}</div>
                            <span>${Utils.escape(p.name)}</span>
                            ${p.player_code ? `<span style="font-family:monospace;font-size:0.75rem;background:var(--bg-card-hover);color:var(--text-secondary);padding:2px 6px;margin-left:8px;border-radius:4px">#${Utils.escape(p.player_code)}</span>` : ''}
                            <span style="margin-left:auto;color:var(--primary);font-size:0.85rem">${p.points} pts</span>
                        </div>
                    `;
                });
                $('#partner-results').html(html).removeClass('hidden');
            });
        }, 300));

        $(document).off('click', '.create-partner-item').on('click', '.create-partner-item', function () {
            const id = $(this).data('id');
            const name = $(this).data('name');
            const points = $(this).data('points');
            $('#partner-id').val(id);
            $('#selected-partner-info').html(`👥 <strong>${name}</strong> (${points} pts)`);
            $('#selected-partner').removeClass('hidden');
            $('#partner-results').addClass('hidden');
            $('#partner-search').hide().val('');
            const myPts = parseInt(App.currentUser?.points || 0);
            const partnerPts = parseInt(points || 0);
            $('#team-points-label').text('Team Total Points');
            $('#team-points-display').text(`${myPts + partnerPts} pts`);
        });

        $('#remove-partner').on('click', function () {
            $('#partner-id').val('');
            $('#selected-partner').addClass('hidden');
            $('#partner-search').show().val('').focus();
            const myPts = parseInt(App.currentUser?.points || 0);
            $('#team-points-label').text('Your Points');
            $('#team-points-display').text(`${myPts} pts`);
        });

        // Submit
        $('#create-match-form').on('submit', function (e) {
            e.preventDefault();
            const $btn = $('#create-match-btn');
            $btn.prop('disabled', true).html('<span class="spinner"></span> Creating...');

            const courtId   = $('#match-court-id').val();
            const matchTime = $('#match-datetime').val();
            const partnerId = $('#partner-id').val();
            const courtName = $('#match-court-name').val().trim();
            const isSolo    = !$('#partner-search-group').hasClass('hidden') === false || !partnerId;

            if (!courtId)   { Utils.toast('Please select a court', 'error'); $btn.prop('disabled', false).html('🎾 Create Match'); return; }
            if (!matchTime) { Utils.toast('Please set date & time', 'error'); $btn.prop('disabled', false).html('🎾 Create Match'); return; }
            if (!courtName) { Utils.toast('Please enter a court number or name', 'error'); $btn.prop('disabled', false).html('🎾 Create Match'); return; }

            const data = {
                court_id: parseInt(courtId),
                match_time: matchTime,
                court_name_manual: courtName
            };
            if (partnerId) data.partner_id = parseInt(partnerId);

            Utils.api('match/create.php', 'POST', data).then(function (resp) {
                const msg = resp.data.status === 'pending'
                    ? 'Match created! Waiting for partner approval.'
                    : 'Match created! Waiting for opponents.';
                Utils.toast(msg, 'success');
                App.navigate('match/' + resp.data.match_id);
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).html('🎾 Create Match');
            });
        });
    },

    /**
     * Render open matches list
     */
    renderOpenMatches() {
        return `
            <div class="main-content">
                <div class="page-header d-flex justify-between align-center" style="flex-wrap:wrap;gap:16px">
                    <div>
                        <h1>🔥 Open Matches</h1>
                        <p>Join a match and compete!</p>
                    </div>
                    <button class="btn btn-primary" onclick="App.navigate('create-match')">⚡ Create Match</button>
                </div>

                <div class="card" style="margin-bottom:24px;padding:16px;">
                    <div style="display:grid;grid-template-columns:1fr;gap:16px" id="match-filters">
                        <div class="form-group" style="margin:0;position:relative">
                            <label style="font-size:0.95rem;color:#ffffff;margin-bottom:8px">Join with Partner <span style="font-size:0.85rem;font-weight:400;color:var(--text-muted)">(optional)</span><div style="font-size:0.75rem;font-weight:400;color:var(--text-muted);margin-top:2px">Show matches available to join with a partner</div></label>
                            <input type="text" id="filter-partner-search" class="form-control" placeholder="Search partner name or ID...">
                            <div id="filter-partner-results" class="search-results hidden" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;box-shadow:0 10px 24px rgba(0,0,0,0.5)"></div>
                            <div id="filter-partner-selected" class="hidden" style="margin-top:8px;display:flex;align-items:center;gap:8px;background:var(--bg-card-hover);padding:8px;border-radius:6px;border:1px solid var(--border)">
                                <div class="player-info" style="flex:1"></div>
                                <button class="btn btn-ghost btn-sm" style="color:var(--danger);padding:4px" id="filter-partner-clear">✕</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tabs" style="margin-bottom:16px">
                    <button class="tab-btn active" data-filter="eligible" id="filter-eligible">✓ Eligible to Join</button>
                    <button class="tab-btn" data-filter="all" id="filter-all">All Matches</button>
                </div>
                <div class="match-list" id="open-matches-list">
                    ${Utils.loader('Loading matches...')}
                </div>
            </div>
        `;
    },

    /**
     * Load open matches
     */
    loadOpenMatches(filterEligible = true) {
        Utils.api('match/list_open.php').then(function (resp) {
            let matches = resp.data;
            if (!matches || matches.length === 0) {
                $('#open-matches-list').html(`
                    <div class="empty-state">
                        <div class="empty-icon">🎾</div>
                        <p>No open matches right now</p>
                        <button class="btn btn-primary" onclick="App.navigate('create-match')">Create the first match!</button>
                    </div>
                `);
                return;
            }

            App._openMatchesState = { matches: resp.data, partnerPoints: 0, courtQuery: '', filterEligible: filterEligible };
            Match.renderFilteredOpenMatches();
        }).catch(function (msg) {
            $('#open-matches-list').html(`<div class="empty-state"><p>${msg}</p></div>`);
        });
    },

    /**
     * Compute points diff and apply filtering based on state
     */
    renderFilteredOpenMatches() {
        const state = App._openMatchesState;
        if (!state || !state.matches) return;

        const myPoints = App.currentUser.points;
        const partnerPoints = state.partnerPoints || 0;
        const totalTeamPoints = myPoints + partnerPoints;

        state.matches.forEach(m => {
            if (m.is_participant) {
                // Already in the match
                m.can_join = false;
                m.reason = "🚫 You're joined.";
            } else if (partnerPoints && Math.abs(m.team_a_total_points - totalTeamPoints) > 10) {
                // Partner selected but points diff too high for team join
                m.can_join = false;
                m.reason = `Points diff too high (${Math.abs(m.team_a_total_points - totalTeamPoints)} pts apart)`;
            } else {
                // Solo join: always eligible if match is open and has slots
                // Team join: eligible if within ±10 pts
                m.can_join = true;
                m.reason = '';
            }
            m.points_diff = Math.abs(m.team_a_total_points - totalTeamPoints);
            m.user_points = totalTeamPoints;
        });

        let displayMatches = state.matches;

        if (state.filterEligible) {
            displayMatches = displayMatches.filter(m => m.can_join);
        }

        displayMatches.sort((a, b) => (b.can_join ? 1 : 0) - (a.can_join ? 1 : 0));

        if (displayMatches.length === 0) {
            const totalCount = state.matches.length;
            $('#open-matches-list').html(`
                <div class="empty-state">
                    <div class="empty-icon">🎯</div>
                    <p>No eligible matches found based on your filters.</p>
                    <div class="d-flex gap-sm mt-md" style="justify-content:center">
                        <button class="btn btn-primary" onclick="App.navigate('create-match')">Create Your Own Match</button>
                        ${state.filterEligible ? `<button class="btn btn-secondary" onclick="$('#filter-all').click()">Show All Matches</button>` : ''}
                    </div>
                </div>
            `);
            return;
        }

        let html = '';
        displayMatches.forEach(m => { html += Match.renderMatchCard(m, true); });
        $('#open-matches-list').html(html);
    },

    /**
     * Bind open matches filter tab events
     */
    bindOpenMatches() {
        $('#filter-eligible, #filter-all').on('click', function () {
            $('.tabs .tab-btn').removeClass('active');
            $(this).addClass('active');
            if (App._openMatchesState) {
                App._openMatchesState.filterEligible = $(this).data('filter') === 'eligible';
                Match.renderFilteredOpenMatches();
            }
        });

        // Partner search autocomplete
        $('#filter-partner-search').on('input', Utils.debounce(function () {
            const query = $(this).val().trim().toLowerCase();
            if (query.length < 2) { $('#filter-partner-results').addClass('hidden'); return; }

            Utils.api(`leaderboard/get.php?limit=50&search=${encodeURIComponent(query)}`).then(function (resp) {
                const players = resp.data.players.filter(p =>
                    p.id !== App.currentUser.id &&
                    (p.name.toLowerCase().includes(query) ||
                        (p.player_code && p.player_code.toLowerCase().includes(query)))
                );

                if (players.length === 0) {
                    $('#filter-partner-results').html('<div style="padding:12px;color:var(--text-muted)">No partners found</div>').removeClass('hidden');
                    return;
                }

                let html = '';
                players.forEach(p => {
                    html += `
                        <div class="player-search-item filter-partner-item" data-id="${p.id}" data-name="${Utils.escape(p.name)}" data-points="${p.points}" data-code="${Utils.escape(p.player_code || '')}">
                            <div class="mini-avatar">${Utils.avatar(p.profile_image, 32, p.name, p.gender)}</div>
                            <span>${Utils.escape(p.name)}</span>
                            ${p.player_code ? `<span style="font-family:monospace;font-size:0.75rem;background:var(--bg-card-hover);padding:2px 6px;margin-left:8px;border-radius:4px">#${Utils.escape(p.player_code)}</span>` : ''}
                            <span style="margin-left:auto;color:var(--primary);font-size:0.85rem">${p.points} pts</span>
                        </div>
                    `;
                });
                $('#filter-partner-results').html(html).removeClass('hidden');
            });
        }, 300));

        // Partner selection logic
        $(document).on('click', '.filter-partner-item', function () {
            const id = $(this).data('id');
            const name = $(this).data('name');
            const pts = $(this).data('points');

            $('#filter-partner-search').val('').hide();
            $('#filter-partner-results').addClass('hidden');

            $('#filter-partner-selected').removeClass('hidden').find('.player-info').html(`<strong>${name}</strong> <span class="text-muted">(${pts} pts)</span>`);

            if (App._openMatchesState) {
                App._openMatchesState.partnerId = id;
                App._openMatchesState.partnerName = name;
                App._openMatchesState.partnerPoints = pts;
                Match.renderFilteredOpenMatches();
            }
        });

        // Partner clear
        $('#filter-partner-clear').on('click', function () {
            $('#filter-partner-selected').addClass('hidden');
            $('#filter-partner-search').show().val('');

            if (App._openMatchesState) {
                App._openMatchesState.partnerId = null;
                App._openMatchesState.partnerName = null;
                App._openMatchesState.partnerPoints = 0;
                Match.renderFilteredOpenMatches();
            }
        });

        // Hide results on outside click
        $(document).on('click', function (e) {
            if (!$(e.target).closest('#match-filters').length) {
                $('#filter-partner-results').addClass('hidden');
            }
        });
    },

    /**
     * Render my matches page
     */
    renderMyMatches() {
        return `
            <div class="main-content">
                <div class="page-header">
                    <h1>📋 My Matches</h1>
                    <p>Your match history and active games</p>
                </div>
                <div class="tabs">
                    <button class="tab-btn active" data-status="all">All</button>
                    <button class="tab-btn" data-status="open">Open</button>
                    <button class="tab-btn" data-status="full">In Progress</button>
                    <button class="tab-btn" data-status="completed">Completed</button>
                    <button class="tab-btn" data-status="cancelled">Cancelled</button>
                </div>
                <div class="match-list" id="my-matches-list">
                    ${Utils.loader('Loading matches...')}
                </div>
            </div>
        `;
    },

    /**
     * Load my matches
     */
    loadMyMatches(status = null) {
        const endpoint = status ? `match/my_matches.php?status=${status}` : 'match/my_matches.php';

        Utils.api(endpoint).then(function (resp) {
            let matches = resp.data || [];
            
            // If "All" tab is selected, filter out cancelled matches
            if (!status) {
                matches = matches.filter(m => m.status !== 'cancelled');
            }

            if (matches.length === 0) {
                $('#my-matches-list').html(`
                    <div class="empty-state">
                        <div class="empty-icon">📋</div>
                        <p>No ${status || 'active'} matches found</p>
                        <button class="btn btn-primary" onclick="App.navigate('open-matches')">Find a match</button>
                    </div>
                `);
                return;
            }

            let html = '';
            matches.forEach(m => {
                html += Match.renderMatchCard(m, false);
            });
            $('#my-matches-list').html(html);
        }).catch(function (msg) {
            $('#my-matches-list').html(`<div class="empty-state"><p>${msg}</p></div>`);
        });
    },

    /**
     * Bind my matches tab events
     */
    bindMyMatches() {
        $('.tab-btn').on('click', function () {
            $('.tab-btn').removeClass('active');
            $(this).addClass('active');

            const status = $(this).data('status');
            $('#my-matches-list').html(Utils.loader('Loading...'));
            Match.loadMyMatches(status === 'all' ? null : status);
        });
    },

    /**
     * Render a single match card
     */
    renderMatchCard(m, showJoinBtn = false) {
        const teamA = m.team_a;
        const teamB = m.team_b;
        const canJoin = m.can_join !== undefined ? m.can_join : true;
        const isIneligible = showJoinBtn && m.can_join === false;

        const renderPlayer = (player, fallback = 'Waiting for player...') => {
            if (!player) return `<div class="team-player empty-slot"><span>${fallback}</span></div>`;
            return `
                <div class="team-player">
                    <div class="mini-avatar">
                        ${Utils.avatar(player.profile_image, 32, player.name, player.gender)}
                    </div>
                    <div>
                        <div class="team-player-name"><a href="#/player/${player.id}" onclick="event.stopPropagation()" class="player-profile-link">${Utils.escape(player.name)}</a></div>
                        <div class="team-player-points">${player.points} pts ${player.current_points ? `(${player.current_points})` : ''}</div>
                    </div>
                </div>
            `;
        };

        // Build join button or ineligible message
        let joinHtml = '';
        if (showJoinBtn && m.status === 'open') {
            if (canJoin) {
                joinHtml = `
                    <button class="btn btn-accent btn-sm" onclick="event.stopPropagation(); Match.showJoinModal(${m.id}, ${teamA?.total_points || 0})">
                        Join Match
                    </button>
                `;
            } else if (m.reason) {
                joinHtml = `<span class="match-ineligible-reason">${Utils.escape(m.reason)}</span>`;
            }
        }

        return `
            <div class="match-card ${isIneligible ? 'match-card-ineligible' : ''}" data-match-id="${m.id}" onclick="App.navigate('match/${m.id}')">
                <div class="match-card-header">
                    <span class="match-status status-${m.status}">${m.status}</span>
                    ${m.my_waitlist_status ? `<span class="match-status" style="background:var(--warning);color:#000;border:none;margin-left:8px;font-size:0.7rem">Queue: ${m.my_waitlist_status.toUpperCase()}</span>` : ''}
                    <div class="d-flex align-center gap-sm">
                        ${showJoinBtn && m.can_join === true ? '<span class="match-eligible-badge">✓ Eligible</span>' : ''}
                        ${showJoinBtn && m.can_join === false ? '<span class="match-ineligible-badge">✕ Ineligible</span>' : ''}
                        <span class="match-date">${Utils.formatDate(m.created_at)}</span>
                    </div>
                </div>
                ${m.court || m.match_time ? `
                    <div class="match-schedule-bar">
                        ${m.court ? `<span>📍 ${Utils.escape(m.court.name)}</span>` : ''}
                        ${m.court_name_manual ? `<span>🏟️ <b>Court:</b> ${Utils.escape(m.court_name_manual)}</span>` : ''}
                        ${m.match_time ? `<span>🕐 ${Utils.formatDateTime(m.match_time)}</span>` : ''}
                    </div>
                ` : ''}
                <div class="match-teams">
                    <div class="team-side">
                        <div class="team-label">Team A</div>
                        ${renderPlayer(teamA?.player1)}
                        ${renderPlayer(teamA?.player2, 'No partner')}
                    </div>
                    <div class="match-vs">
                        <div class="vs-badge">VS</div>
                    </div>
                    <div class="team-side team-right">
                        <div class="team-label">Team B</div>
                        ${renderPlayer(teamB?.player1)}
                        ${renderPlayer(teamB?.player2, 'No partner')}
                    </div>
                </div>
                ${m.status === 'completed' && m.set1_a != null ? `
                    <div class="match-padel-scores" style="text-align:center;font-size:1.1rem;font-weight:bold;margin:12px 0;background:var(--bg-card-hover);padding:8px;border-radius:8px;">
                        🎾 ${m.set1_a}-${m.set1_b} ${m.set2_a != null ? ` | ${m.set2_a}-${m.set2_b}` : ''} ${m.set3_a != null ? ` | ${m.set3_a}-${m.set3_b}` : ''}
                    </div>
                ` : ''}
                ${m.winner_team ? `
                    <div class="winner-banner">
                        🏆 Team ${m.winner_team.toUpperCase()} Won!
                    </div>
                ` : ''}
                <div class="match-footer">
                    <span class="match-points-diff">
                        Team A: ${teamA?.total_points || 0} pts · Team B: ${teamB?.total_points || 0} pts
                    </span>
                    ${joinHtml}
                </div>
            </div>
        `;
    },

    /**
     * Show join match modal
     */
    showJoinModal(matchId, teamATotalPoints) {
        const myPoints  = App.currentUser?.points || 0;
        const preId     = App._openMatchesState?.partnerId || '';
        const preName   = App._openMatchesState?.partnerName || '';
        const warning   = `<div style="background:rgba(255,160,0,0.1);border:1px solid var(--warning);border-radius:8px;padding:10px 14px;margin-bottom:16px;font-size:0.85rem;color:var(--warning)">
            ⚠️ <strong>By joining, you cannot withdraw within 6 hours before the match.</strong>
        </div>`;

        Utils.showModal('Join Match', `
            <style>
                .modal-backdrop, .modal, .modal * {
                    animation: none !important;
                    transition: none !important;
                }
            </style>
            ${warning}
            <p style="margin-bottom:12px">How do you want to join?</p>
            <div class="d-flex gap-sm" style="margin-bottom:16px">
                <button type="button" class="btn btn-primary btn-sm" id="join-mode-solo" style="flex:1">👤 Solo</button>
                <button type="button" class="btn btn-secondary btn-sm" id="join-mode-team" style="flex:1">👥 With Partner</button>
            </div>

            <div id="join-solo-desc" style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px">
                You'll claim one slot instantly. No approval needed.
            </div>

            <div id="join-partner-section" class="hidden">
                <div class="form-group" style="position:relative;margin-top:12px">
                    <label>Select Your Partner</label>
                    <div class="form-hint mb-sm">Team A has ${teamATotalPoints} pts. Your team must be within ±10 points.</div>
                    <input type="text" class="form-control" id="join-partner-search" placeholder="Type player name or ID..." ${preId ? 'style="display:none"' : ''}>
                    <div class="player-search-results hidden" id="join-partner-results" style="position:absolute;top:100%;left:0;right:0;z-index:100;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;max-height:200px;overflow-y:auto;box-shadow:0 10px 24px rgba(0,0,0,0.5)"></div>
                    <div class="${preId ? '' : 'hidden'} mt-sm p-sm" id="join-selected-partner" style="background:var(--bg-card-hover);border-radius:6px;border:1px solid var(--border)">
                        <div class="d-flex align-center justify-between gap-sm">
                            <span id="join-partner-info">${preName ? `<strong>${Utils.escape(preName)}</strong>` : ''}</span>
                            <button type="button" class="btn btn-ghost btn-sm text-danger" style="color:var(--danger)" id="join-remove-partner">✕ Remove</button>
                        </div>
                    </div>
                    <input type="hidden" id="join-partner-id" value="${preId}">
                </div>
            </div>
        `, `
            <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
            <button class="btn btn-accent" id="confirm-join-btn">Join Match</button>
        `);

        // Mode toggle - keep it instant with CSS class hiding instead of jQuery anims
        $('#join-mode-solo').off('click').on('click', function () {
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            $('#join-mode-team').removeClass('btn-primary').addClass('btn-secondary');
            $('#join-partner-section').addClass('hidden');
            $('#join-solo-desc').removeClass('hidden');
        });
        $('#join-mode-team').off('click').on('click', function () {
            $(this).removeClass('btn-secondary').addClass('btn-primary');
            $('#join-mode-solo').removeClass('btn-primary').addClass('btn-secondary');
            $('#join-partner-section').removeClass('hidden');
            $('#join-solo-desc').addClass('hidden');
        });

        // Partner search in modal
        $('#join-partner-search').on('input', Utils.debounce(function () {
            const query = $(this).val().trim().toLowerCase();
            if (query.length < 2) { $('#join-partner-results').addClass('hidden'); return; }

            Utils.api(`leaderboard/get.php?limit=50&search=${encodeURIComponent(query)}`).then(function (resp) {
                const players = resp.data.players.filter(p =>
                    p.id !== App.currentUser.id &&
                    (p.name.toLowerCase().includes(query) ||
                        (p.player_code && p.player_code.toLowerCase().includes(query)))
                );
                if (players.length === 0) {
                    $('#join-partner-results').html('<div style="padding:12px;color:var(--text-muted)">No players found</div>').removeClass('hidden');
                    return;
                }
                let html = '';
                players.forEach(p => {
                    html += `
                        <div class="player-search-item join-partner-item" data-id="${p.id}" data-name="${Utils.escape(p.name)}" data-points="${p.points}">
                            <div class="mini-avatar">${Utils.avatar(p.profile_image, 32, p.name, p.gender)}</div>
                            <span>${Utils.escape(p.name)}</span>
                            ${p.player_code ? `<span style="font-family:monospace;font-size:0.75rem;background:var(--bg-card-hover);color:var(--text-secondary);padding:2px 6px;margin-left:8px;border-radius:4px">#${Utils.escape(p.player_code)}</span>` : ''}
                            <span style="margin-left:auto;color:var(--primary);font-size:0.85rem">${p.points} pts</span>
                        </div>
                    `;
                });
                $('#join-partner-results').html(html).removeClass('hidden');
            });
        }, 300));

        $('#join-partner-results').off('click', '.join-partner-item').on('click', '.join-partner-item', function () {
            const id = $(this).data('id'); const name = $(this).data('name'); const pts = $(this).data('points');
            $('#join-partner-id').val(id);
            $('#join-partner-info').html(`👥 <strong>${name}</strong> (${pts} pts)`);
            $('#join-selected-partner').removeClass('hidden');
            $('#join-partner-search').val('').hide();
            $('#join-partner-results').addClass('hidden');
        });

        $('#join-remove-partner').off('click').on('click', function () {
            $('#join-partner-id').val('');
            $('#join-selected-partner').addClass('hidden');
            $('#join-partner-search').show().val('');
        });

        // Confirm join
        $('#confirm-join-btn').on('click', function () {
            const $btn   = $(this);
            const isSolo = $('#join-mode-solo').hasClass('btn-primary');
            const pid    = $('#join-partner-id').val();

            if (!isSolo && !pid) {
                Utils.toast('Please select a partner to join with a team', 'error');
                return;
            }

            const data = { match_id: matchId };
            if (!isSolo) data.partner_id = parseInt(pid);

            $btn.prop('disabled', true).html('<span class="spinner"></span> Joining...');

            Utils.api('match/join.php', 'POST', data).then(function (resp) {
                Utils.toast(resp.message || 'Joined!', 'success');
                Utils.closeModal();
                App.navigate('my-matches');
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).html('Join Match');
            });
        });
    },

    /**
     * Render match details page
     */
    renderMatchDetails(matchId) {
        return `
            <div class="main-content" id="match-details-page">
                ${Utils.loader('Loading match details...')}
            </div>
        `;
    },

    /**
     * Load match details
     */
    loadMatchDetails(matchId) {
        Utils.api(`match/details.php?id=${matchId}`).then(function (resp) {
            const m = resp.data;

            const renderPlayerDetail = (player, pointsBefore, pointsAfter) => {
                if (!player) return `<div class="team-player empty-slot"><span>Empty slot</span></div>`;
                const isMe = player.id === App.currentUser?.id;
                return `
                    <div class="team-player" style="${isMe ? 'background:rgba(0,200,150,0.08);padding:8px;border-radius:8px' : ''}">
                        <div class="mini-avatar">
                            ${Utils.avatar(player.profile_image, 32, player.name, player.gender)}
                        </div>
                        <div>
                            <div class="team-player-name">
                                <a href="#/player/${player.id}" class="player-profile-link">${Utils.escape(player.name)}</a> ${isMe ? '<span style="font-size:0.75rem;color:var(--primary)">(You)</span>' : ''}
                            </div>
                            <div class="team-player-points">
                                ${player.current_points} pts
                                ${m.status === 'completed' && pointsBefore !== null ?
                        ` · ${Utils.pointsChange(pointsBefore, pointsAfter)}` : ''}
                            </div>
                        </div>
                    </div>
                `;
            };

            let actionsHtml = '';

            // Render waitlist
            let waitlistHtml = '';
            if (m.waitlist && m.waitlist.length > 0) {
                waitlistHtml += `<div class="card mt-md"><h3 style="margin-bottom:16px">📋 Waiting List Queue</h3><div style="display:flex;flex-direction:column;gap:12px;">`;
                m.waitlist.forEach(w => {
                    const statusBadge = w.status === 'pending' ? '<span style="background:var(--warning);color:#000;font-size:0.75rem;padding:2px 6px;border-radius:4px;font-weight:bold">Pending Partner</span>' : '<span style="background:var(--success);color:#fff;font-size:0.75rem;padding:2px 6px;border-radius:4px;font-weight:bold">Confirmed Ready</span>';
                    
                    let actionBtn = '';
                    if (w.needs_my_confirmation) {
                        actionBtn = `<button class="btn btn-primary btn-sm mt-sm btn-block" onclick="Match.confirmWaitlist(${w.id}, ${m.id})">✅ Confirm Partner Request</button>`;
                    } else if (w.is_mine) {
                        actionBtn = `<button class="btn btn-ghost btn-sm mt-sm text-danger btn-block" style="color:var(--danger)" onclick="Match.withdrawMatch(${m.id})">Leave Waiting List</button>`;
                    }

                    waitlistHtml += `
                        <div style="background:var(--bg-main);border-radius:8px;padding:12px;border:1px solid var(--border)">
                            <div class="d-flex justify-between align-center mb-sm">
                                <strong style="font-size:0.9rem">Team Queue</strong>
                                ${statusBadge}
                            </div>
                            <div class="d-flex gap-lg" style="font-size:0.85rem">
                                <div class="d-flex align-center gap-sm">${Utils.avatar(w.player1.profile_image, 24, w.player1.name, w.player1.gender)} ${Utils.escape(w.player1.name)} <span class="text-muted">(${w.player1.points} pts)</span></div>
                                <div class="d-flex align-center gap-sm">${Utils.avatar(w.player2.profile_image, 24, w.player2.name, w.player2.gender)} ${Utils.escape(w.player2.name)} <span class="text-muted">(${w.player2.points} pts)</span></div>
                            </div>
                            ${actionBtn}
                        </div>
                    `;
                });
                waitlistHtml += `</div></div>`;
            }

            // Management actions
            let managementHtml = '';
            if (m.team_a.player1 && m.team_a.player1.id === App.currentUser?.id && (m.status === 'open' || m.status === 'full')) {
                managementHtml = `<button class="btn btn-ghost btn-sm" style="color:var(--danger);width:100%;margin-top:16px;" onclick="Match.cancelMatch(${m.id})">Cancel Match</button>`;
            } else if ((m.user_team === 'b' || m.team_b?.player1?.id === App.currentUser?.id || m.team_b?.player2?.id === App.currentUser?.id) && (m.status === 'open' || m.status === 'full')) {
                managementHtml = `<button class="btn btn-ghost btn-sm" style="color:var(--danger);width:100%;margin-top:16px;" onclick="Match.withdrawMatch(${m.id})">Withdraw from Match</button>`;
            }

            // Partner approval — Team A partner needs to approve
            if (m.status === 'pending' && m.team_a.player2 && m.team_a.player2.id === App.currentUser?.id) {
                actionsHtml = `
                    <div class="card mt-lg">
                        <h3 style="margin-bottom:12px">🏸 Partner Approval Required</h3>
                        <p style="color:var(--text-secondary);margin-bottom:16px">
                            <strong>${Utils.escape(m.team_a.player1?.name || 'Someone')}</strong> invited you as their Team A partner 
                            for a match at <strong>${Utils.escape(m.court_name_manual || m.court?.name || '')}</strong>.<br>
                            Approving will publish the match so opponents can join.
                        </p>
                        <div class="d-flex gap-sm">
                            <button class="btn btn-primary btn-lg" onclick="Match.approvePartner(${m.id}, 'approve')">✅ Approve & Publish</button>
                            <button class="btn btn-secondary" onclick="Match.approvePartner(${m.id}, 'reject')">❌ Decline</button>
                        </div>
                    </div>
                `;
            } else if (m.status === 'pending' && m.team_a.player1.id === App.currentUser?.id) {
                actionsHtml = `
                    <div class="card mt-lg" style="text-align:center;color:var(--text-secondary)">
                        ⏳ Waiting for <strong>${Utils.escape(m.team_a.player2?.name || 'your partner')}</strong> to approve the match...
                    </div>
                `;
            } else if (m.status === 'open' && !m.is_participant && !m.waitlist?.find(w => w.is_mine)) {
                actionsHtml = `<button class="btn btn-accent btn-lg" onclick="Match.showJoinModal(${m.id}, ${m.team_a.total_points})">⚡ Join This Match</button>`;
            } else if (m.status === 'full' && m.is_participant) {
                if (!m.result_submitted_by) {
                    actionsHtml = `
                        <div class="card mt-lg">
                            <h3 style="margin-bottom:16px">🏆 Submit Match Score</h3>
                            <button class="btn btn-primary btn-block btn-lg" onclick="Match.submitResult(${m.id})">📝 Record Padel Sets</button>
                        </div>
                    `;
                } else if (m.result_submitted_by !== App.currentUser?.id) {
                    actionsHtml = `
                        <div class="card mt-lg">
                            <h3 style="margin-bottom:16px">✅ Confirm Score result</h3>
                            <p style="color:var(--text-secondary);margin-bottom:16px">
                                The match result <strong>${m.set1_a}-${m.set1_b}, ${m.set2_a}-${m.set2_b}${m.set3_a !== null ? `, ${m.set3_a}-${m.set3_b}` : ''}</strong> was submitted by an opponent.
                                <br/>(This means <strong>Team ${m.winner_team.toUpperCase()}</strong> won). Do you confirm?
                            </p>
                            <div class="d-flex gap-sm">
                                <button class="btn btn-primary btn-lg" onclick="Match.confirmResult(${m.id})">✅ Confirm Match Scores</button>
                            </div>
                        </div>
                    `;
                } else {
                    actionsHtml = `
                        <div class="card mt-lg" style="text-align:center;color:var(--text-secondary)">
                            ⏳ Waiting for another player to confirm the result...
                        </div>
                    `;
                }
            }

            const html = `
                <div class="page-header d-flex justify-between align-center" style="flex-wrap:wrap;gap:16px">
                    <div>
                        <h1>Match #${m.id}</h1>
                        <p><span class="match-status status-${m.status}">${m.status}</span> · Created ${Utils.formatDate(m.created_at)}</p>
                    </div>
                    <button class="btn btn-secondary" onclick="window.history.back()">← Back</button>
                </div>

                ${m.court || m.match_time ? `
                    <div class="match-schedule-detail">
                        ${m.court ? `<div class="schedule-item"><span class="schedule-icon">📍</span><div><strong>${Utils.escape(m.court.name)}</strong><span class="text-muted" style="display:block;font-size:0.82rem">${Utils.escape(m.court.area)}</span></div></div>` : ''}
                        ${m.court_name_manual ? `<div class="schedule-item"><span class="schedule-icon">🏟️</span><div><strong>Court: ${Utils.escape(m.court_name_manual)}</strong><span class="text-muted" style="display:block;font-size:0.82rem">Pitch Selection</span></div></div>` : ''}
                        ${m.match_time ? `<div class="schedule-item"><span class="schedule-icon">🕐</span><div><strong>${Utils.formatDateTime(m.match_time)}</strong><span class="text-muted" style="display:block;font-size:0.82rem">Scheduled Time</span></div></div>` : ''}
                    </div>
                ` : ''}

                <div class="card">
                    <div class="match-teams" style="padding:16px 0">
                        <div class="team-side">
                            <div class="team-label" style="margin-bottom:12px">Team A · ${m.team_a.total_points} pts total</div>
                            ${renderPlayerDetail(m.team_a.player1, m.team_a.player1?.points_before, m.team_a.player1?.points_after)}
                            ${renderPlayerDetail(m.team_a.player2, m.team_a.player2?.points_before, m.team_a.player2?.points_after)}
                        </div>
                        <div class="match-vs">
                            <div class="vs-badge">VS</div>
                        </div>
                        <div class="team-side team-right">
                            <div class="team-label" style="margin-bottom:12px">Team B · ${m.team_b.total_points} pts total</div>
                            ${renderPlayerDetail(m.team_b.player1, m.team_b.player1?.points_before, m.team_b.player1?.points_after)}
                            ${renderPlayerDetail(m.team_b.player2, m.team_b.player2?.points_before, m.team_b.player2?.points_after)}
                        </div>
                    </div>
                    ${m.status === 'completed' && m.set1_a != null ? `
                        <div class="match-padel-scores" style="text-align:center;font-size:1.2rem;font-weight:bold;margin:16px;background:var(--bg-card-hover);padding:12px;border-radius:8px;">
                            🎾 ${m.set1_a}-${m.set1_b} ${m.set2_a != null ? ` | ${m.set2_a}-${m.set2_b}` : ''} ${m.set3_a != null ? ` | ${m.set3_a}-${m.set3_b}` : ''}
                        </div>
                    ` : ''}
                    ${m.winner_team ? `<div class="winner-banner">🏆 Team ${m.winner_team.toUpperCase()} Won!</div>` : ''}
                </div>

                ${actionsHtml}
                ${waitlistHtml}
                ${managementHtml}
            `;

            $('#match-details-page').html(html);
        }).catch(function (msg) {
            $('#match-details-page').html(`<div class="empty-state"><div class="empty-icon">😕</div><p>${msg}</p></div>`);
        });
    },

    /**
     * Submit match result
     */
    submitResult(matchId) {
        Utils.showModal('Record Match Score', `
            <p>Enter the games won by each team per set (e.g. 6-4). A minimum of 2 sets is required.</p>
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; text-align:center; font-weight:bold;">
                <div style="padding-bottom:8px; border-bottom:1px solid var(--border)">Team A</div>
                <div style="padding-bottom:8px; border-bottom:1px solid var(--border)">Team B</div>
                
                <input type="number" id="set1_a" class="form-control" min="0" max="7" placeholder="Set 1">
                <input type="number" id="set1_b" class="form-control" min="0" max="7" placeholder="Set 1">
                
                <input type="number" id="set2_a" class="form-control" min="0" max="7" placeholder="Set 2">
                <input type="number" id="set2_b" class="form-control" min="0" max="7" placeholder="Set 2">
                
                <input type="number" id="set3_a" class="form-control" min="0" max="7" placeholder="Set 3 (Opt)">
                <input type="number" id="set3_b" class="form-control" min="0" max="7" placeholder="Set 3 (Opt)">
            </div>
            <p style="color:var(--text-secondary);margin-top:16px;font-size:0.85rem">Another player will need to confirm this result before rankings update.</p>
        `, `
            <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
            <button class="btn btn-primary" id="submit-result-confirm">Submit Score</button>
        `);

        $('#submit-result-confirm').on('click', function () {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<span class="spinner"></span>');

            Utils.api('match/submit_result.php', 'POST', {
                match_id: matchId,
                set1_a: $('#set1_a').val(), set1_b: $('#set1_b').val(),
                set2_a: $('#set2_a').val(), set2_b: $('#set2_b').val(),
                set3_a: $('#set3_a').val(), set3_b: $('#set3_b').val()
            }).then(function (resp) {
                Utils.closeModal();
                Utils.toast(resp.message, 'success');
                Match.loadMatchDetails(matchId);
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Submit Score');
            });
        });
    },

    /**
     * Confirm match result
     */
    confirmResult(matchId) {
        Utils.showModal('Confirm Result', `
            <p>By confirming, the rankings will be updated immediately.</p>
        `, `
            <button class="btn btn-secondary" onclick="Utils.closeModal()">Cancel</button>
            <button class="btn btn-primary" id="confirm-result-btn">✅ Confirm</button>
        `);

        $('#confirm-result-btn').on('click', function () {
            const $btn = $(this);
            $btn.prop('disabled', true).html('<span class="spinner"></span>');

            Utils.api('match/submit_result.php', 'POST', {
                match_id: matchId,
                winner_team: '' // doesn't matter for confirmation, server uses stored winner
            }).then(function (resp) {
                Utils.closeModal();
                Utils.toast('Result confirmed! Rankings updated! 🏆', 'success');
                // Refresh user data
                Auth.checkSession().then(function () {
                    App.renderNavbar();
                    Match.loadMatchDetails(matchId);
                });
            }).catch(function (msg) {
                Utils.toast(msg, 'error');
                $btn.prop('disabled', false).text('Confirm');
            });
        });
    },

    /**
     * Cancel match
     */
    cancelMatch(matchId) {
        if (!confirm('Are you sure you want to cancel this match entirely?')) return;
        Utils.api('match/cancel.php', 'POST', { match_id: matchId }).then(function (resp) {
            Utils.toast(resp.message, 'success');
            Match.loadMatchDetails(matchId);
        }).catch(function(msg) {
            Utils.toast(msg, 'error');
        });
    },

    /**
     * Withdraw from match
     */
    withdrawMatch(matchId) {
        if (!confirm('Are you certain you want to withdraw from this match/queue?')) return;
        Utils.api('match/withdraw.php', 'POST', { match_id: matchId }).then(function(resp) {
            Utils.toast(resp.message, 'success');
            Match.loadMatchDetails(matchId);
        }).catch(function(msg) {
            Utils.toast(msg, 'error');
        });
    },

    /**
     * Confirm waitlist participation
     */
    confirmWaitlist(waitlistId, matchId) {
        Utils.api('match/confirm_waitlist.php', 'POST', { waitlist_id: waitlistId }).then(function(resp) {
            Utils.toast(resp.message, 'success');
            Match.loadMatchDetails(matchId);
        }).catch(function(msg) {
            Utils.toast(msg, 'error');
        });
    },

    /**
     * Approve or reject being added as Team A partner
     */
    approvePartner(matchId, action) {
        const label = action === 'approve' ? 'Approving...' : 'Declining...';
        Utils.api('match/approve_partner.php', 'POST', { match_id: matchId, action: action }).then(function (resp) {
            Utils.toast(resp.message, 'success');
            Match.loadMatchDetails(matchId);
        }).catch(function (msg) {
            Utils.toast(msg, 'error');
        });
    }
};
