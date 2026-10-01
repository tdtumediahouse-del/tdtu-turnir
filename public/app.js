const firebaseConfig = {
    apiKey: "AIzaSyB0uIxdiHbKPQ_msqIPWDEyyq0KHhUPJVA",
    authDomain: "baraban-15164.firebaseapp.com",
    databaseURL: "https://baraban-15164-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "baraban-15164",
    storageBucket: "baraban-15164.firebasestorage.app",
    messagingSenderId: "836479526930",
    appId: "1:836479526930:web:9312fa9f8e3b5c0d80d0cb",
    measurementId: "G-K615WMWKV8"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        const showSplash = ref(true);
        const currentTab = ref('O\'yinlar');
        
        const teams = ref([]);
        const matches = ref([]);
        const playoff = ref({
            qf1: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
            qf2: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
            sf1: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
            sf2: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
            final: { team1: null, team2: null, score1: null, score2: null, status: 'pending' }
        });

        onMounted(() => {
            setTimeout(() => {
                showSplash.value = false;
            }, 1400);

            // Listen to firebase
            db.ref('turnir').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    if (data.teams) teams.value = data.teams;
                    if (data.matches) matches.value = data.matches;
                    if (data.playoff) {
                        playoff.value = { ...playoff.value, ...data.playoff };
                    }
                }
            });
        });

        const tabIndex = computed(() => {
            const tabs = ['O\'yinlar', 'Jadval', 'Play-off', 'Haqida'];
            return tabs.indexOf(currentTab.value);
        });

        const setTab = (tab) => {
            currentTab.value = tab;
        };

        const getTeamById = (id) => {
            if (!id) return null;
            return teams.value.find(t => t.id === id) || null;
        };

        const getTeamName = (id) => {
            const t = getTeamById(id);
            return t ? t.name : '';
        };

        const teamLogo = (teamId) => {
            if (!teamId) return `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#334155"/></svg>`;
            const team = getTeamById(teamId);
            if (!team) return `<svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="50" fill="#334155"/></svg>`;
            
            const color = team.color || '#334155';
            const initials = team.shortName ? team.shortName.substring(0, 3).toUpperCase() : '---';
            
            return `
                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
                    <path d="M50 0 L90 20 L90 60 C90 80 50 100 50 100 C50 100 10 80 10 60 L10 20 Z" fill="url(#grad_${teamId})"/>
                    <path d="M50 5 L85 23 L85 58 C85 75 50 93 50 93 C50 93 15 75 15 58 L15 23 Z" fill="${color}"/>
                    <text x="50" y="55" font-family="Inter, sans-serif" font-weight="900" font-size="28" fill="white" text-anchor="middle" dominant-baseline="middle">${initials}</text>
                    <defs>
                        <linearGradient id="grad_${teamId}" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
                            <stop offset="100%" stop-color="#000000" stop-opacity="0.5"/>
                        </linearGradient>
                    </defs>
                </svg>
            `;
        };

        const standings = computed(() => {
            let table = teams.value.map(t => ({
                team: t, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0
            }));

            matches.value.forEach(m => {
                if (m.status === 'finished' || m.status === 'technical') {
                    const t1 = table.find(t => t.team.id === m.team1);
                    const t2 = table.find(t => t.team.id === m.team2);
                    if (t1 && t2) {
                        const s1 = Number(m.score1) || 0, s2 = Number(m.score2) || 0;
                        t1.played++; t2.played++;
                        t1.gf += s1; t1.ga += s2;
                        t2.gf += s2; t2.ga += s1;
                        
                        if (s1 > s2) {
                            t1.won++; t2.lost++; t1.points += 3;
                        } else if (s1 < s2) {
                            t2.won++; t1.lost++; t2.points += 3;
                        } else {
                            t1.drawn++; t2.drawn++; t1.points += 1; t2.points += 1;
                        }
                    }
                }
            });

            table.forEach(r => { r.gd = r.gf - r.ga; });

            table.sort((a, b) => {
                if (b.points !== a.points) return b.points - a.points;
                if (b.gd !== a.gd) return b.gd - a.gd;
                return b.gf - a.gf;
            });

            return table;
        });

        const isGroupStageComplete = computed(() => {
            if (matches.value.length === 0) return false;
            return matches.value.every(m => m.status === 'finished' || m.status === 'technical');
        });

        const isPlayoffStage = computed(() => {
            return isGroupStageComplete.value;
        });

        const isFinalsStage = computed(() => {
            return isPlayoffStage.value && 
                   playoff.value.sf1.status === 'finished' && 
                   playoff.value.sf2.status === 'finished';
        });

        const champion = computed(() => {
            const f = playoff.value.final;
            if (f.status === 'finished' && f.team1 && f.team2) {
                if (f.score1 > f.score2) return getTeamById(f.team1);
                if (f.score2 > f.score1) return getTeamById(f.team2);
            }
            return null;
        });

        const isWinner = (match, teamId) => {
            if (match.status !== 'finished') return false;
            if (match.score1 > match.score2 && match.team1 === teamId) return true;
            if (match.score2 > match.score1 && match.team2 === teamId) return true;
            return false;
        };

        const getTeamClass = (match, teamIndex) => {
            if (match.status !== 'finished') return '';
            const tId = teamIndex === 1 ? match.team1 : match.team2;
            return isWinner(match, tId) ? 'won' : 'lost';
        };

        return {
            showSplash, currentTab, tabIndex, setTab,
            teams, matches, playoff,
            getTeamName, teamLogo,
            standings, isGroupStageComplete, isPlayoffStage, isFinalsStage,
            champion, isWinner, getTeamClass
        };
    }
}).mount('#app');
