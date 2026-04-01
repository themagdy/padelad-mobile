/**
 * Padeladd - Leaderboard Module
 */
const Leaderboard = {
    currentPage: 1,
    searchQuery: '',
    currentGender: null,

    /**
     * Render leaderboard page
     */
    renderLeaderboard() {
        // Clear filter on entry
        this.searchQuery = '';
        this.currentPage = 1;

        // Determine default gender based on user profile
        if (this.currentGender === null) {
            this.currentGender = (App.currentUser?.gender === 'female') ? 'female' : 'male';
        }

        const paginationTop = `
            <div class="d-flex justify-between align-center" style="display:none;margin-bottom:16px" data-lb-pagination>
                <button class="btn btn-secondary btn-sm" data-lb-prev>← Previous</button>
                <span class="text-muted" data-lb-page-info></span>
                <button class="btn btn-secondary btn-sm" data-lb-next>Next →</button>
            </div>
        `;
        const paginationBottom = `
            <div class="d-flex justify-between align-center" style="display:none;margin-top:16px" data-lb-pagination>
                <button class="btn btn-secondary btn-sm" data-lb-prev>← Previous</button>
                <span class="text-muted" data-lb-page-info></span>
                <button class="btn btn-secondary btn-sm" data-lb-next>Next →</button>
            </div>
        `;

        return `
            <div class="main-content">
                <div class="page-header">
                    <h1>🏆 Leaderboard</h1>
                    <p>Top padel players ranked by total points</p>
                </div>
                <div class="card" style="margin-bottom:16px;padding:16px;">
                    <div class="tabs" style="margin-bottom:16px">
                        <button class="tab-btn ${this.currentGender === 'male' ? 'active' : ''}" data-lb-gender="male">Men's Rank</button>
                        <button class="tab-btn ${this.currentGender === 'female' ? 'active' : ''}" data-lb-gender="female">Women's Rank</button>
                    </div>
                    <div class="form-group" style="margin:0;position:relative">
                        <div style="position:relative">
                            <input type="text" class="form-control" id="lb-search" placeholder="🔍 Search players by name..." autocomplete="off" style="padding-left:16px;">
                        </div>
                    </div>
                </div>
                ${paginationTop}
                <div class="card" style="padding:0;overflow:hidden;">
                    <table class="leaderboard-table" id="leaderboard-table">
                        <tbody id="leaderboard-body">
                            <tr><td colspan="5">${Utils.loader('Loading leaderboard...')}</td></tr>
                        </tbody>
                    </table>
                </div>
                ${paginationBottom}
            </div>
        `;
    },

    /**
     * Load leaderboard data
     */
    loadLeaderboard(page = 1) {
        this.currentPage = page;
        const searchParam = this.searchQuery ? `&search=${encodeURIComponent(this.searchQuery)}` : '';
        const genderParam = this.currentGender ? `&gender=${this.currentGender}` : '';

        Utils.api(`leaderboard/get.php?page=${page}&limit=20${searchParam}${genderParam}`).then(function (resp) {
            const { players, total, pages } = resp.data;

            if (!players || players.length === 0) {
                $('#leaderboard-body').html(`
                    <tr><td colspan="5">
                        <div class="empty-state">
                            <div class="empty-icon">🏆</div>
                            <p>${Leaderboard.searchQuery ? 'No players found matching your search.' : 'No players yet. Be the first to register!'}</p>
                            ${Leaderboard.searchQuery ? '<button class="btn btn-secondary btn-sm mt-sm" onclick="$(\'#lb-search\').val(\'\').trigger(\'input\')">Clear Search</button>' : ''}
                        </div>
                    </td></tr>
                `);
                $('[data-lb-pagination]').hide();
                return;
            }

            let html = '';
            players.forEach(p => {
                const winRate = p.total_matches > 0 ? Math.round((p.wins / p.total_matches) * 100) : 0;
                const isMe = p.id === App.currentUser?.id;
                const rankClass = p.rank <= 3 ? `rank-${p.rank}` : '';

                html += `
                    <tr onclick="App.navigate('player/${p.id}')" style="${isMe ? 'background:rgba(0,200,150,0.06)' : ''}">
                        <td data-label="Rank" style="width:60px">
                            <div class="rank-badge ${rankClass}">${p.rank <= 3 ? ['🥇', '🥈', '🥉'][p.rank - 1] : p.rank}</div>
                        </td>
                        <td data-label="Player">
                            <div class="player-cell">
                                <div class="player-avatar" style="flex-direction:row">
                                    ${Utils.avatar(p.profile_image, 48, p.name, p.gender)}
                                </div>
                                <div>
                                    <div class="player-name">
                                        ${Utils.escape(p.name)}
                                        ${isMe ? '<span style="font-size:0.75rem;color:var(--primary);margin-left:4px">(You)</span>' : ''}
                                    </div>
                                    <div class="player-city d-flex gap-sm align-center mt-xs">
                                        ${p.player_code ? `<span style="font-family:monospace;font-size:0.75rem;background:var(--bg-card-hover);color:var(--text-secondary);padding:2px 6px;border:1px solid var(--border);border-radius:4px">#${Utils.escape(p.player_code)}</span>` : ''}
                                        ${p.city ? `<span>📍 ${Utils.escape(p.city)}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td data-label="Points" class="text-center">
                            <div class="points-display">${p.points}</div>
                            <div style="font-size:0.75rem;color:var(--text-muted)">points</div>
                        </td>
                        <td data-label="Stats" class="text-center">
                            <div class="win-rate">${p.total_matches} matches</div>
                            <div class="win-rate">${p.wins}W / ${p.losses}L</div>
                        </td>
                        <td data-label="Win Rate" class="text-right">
                            <div class="win-rate" style="color:${winRate >= 50 ? 'var(--success)' : 'var(--text-muted)'}">${winRate}% WR</div>
                        </td>
                    </tr>
                `;
            });

            $('#leaderboard-body').html(html);

            // Pagination (both top and bottom)
            if (pages > 1) {
                $('[data-lb-pagination]').css('display', 'flex');
                $('[data-lb-page-info]').text(`Page ${page} of ${pages}`);
                $('[data-lb-prev]').prop('disabled', page <= 1);
                $('[data-lb-next]').prop('disabled', page >= pages);
            } else {
                $('[data-lb-pagination]').hide();
            }
        }).catch(function (msg) {
            $('#leaderboard-body').html(`<tr><td colspan="5"><div class="empty-state"><p>${msg}</p></div></td></tr>`);
        });
    },

    /**
     * Bind leaderboard events
     */
    bindLeaderboard() {
        const self = this;

        // Pagination (using data attributes to bind both top and bottom)
        $(document).off('click', '[data-lb-prev]').on('click', '[data-lb-prev]', function () {
            if (self.currentPage > 1) {
                self.loadLeaderboard(self.currentPage - 1);
                window.scrollTo(0, 0);
            }
        });
        $(document).off('click', '[data-lb-next]').on('click', '[data-lb-next]', function () {
            self.loadLeaderboard(self.currentPage + 1);
            window.scrollTo(0, 0);
        });

        // Search by player name
        $('#lb-search').on('input', Utils.debounce(function () {
            self.searchQuery = $(this).val().trim();
            self.loadLeaderboard(1);
        }, 300));

        // Tab switching (Gender)
        $(document).off('click', '[data-lb-gender]').on('click', '[data-lb-gender]', function () {
            $('.tabs .tab-btn').removeClass('active');
            $(this).addClass('active');
            
            self.currentGender = $(this).data('lb-gender');
            $('#lb-search').val('');
            self.searchQuery = '';
            
            self.loadLeaderboard(1);
        });
    }
};
