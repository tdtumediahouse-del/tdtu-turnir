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

const DEFAULT_TEAMS = [
    { id: 't1', name: 'UFA', shortName: 'UFA', color: '#3b82f6' },
    { id: 't2', name: 'Bilva Group', shortName: 'BLV', color: '#22c55e' },
    { id: 't3', name: '404', shortName: '404', color: '#ef4444' },
    { id: 't4', name: 'FC Imperial', shortName: 'IMP', color: '#a855f7' },
    { id: 't5', name: 'Leaders', shortName: 'LDR', color: '#eab308' },
    { id: 't6', name: '36-25', shortName: '362', color: '#06b6d4' },
    { id: 't7', name: 'Milan', shortName: 'MLN', color: '#dc2626' },
    { id: 't8', name: 'Shovozlar', shortName: 'SHV', color: '#f97316' },
    { id: 't9', name: 'Tavakkal', shortName: 'TVK', color: '#10b981' },
    { id: 't10', name: 'Chempionlar', shortName: 'CHP', color: '#f59e0b' },
    { id: 't11', name: 'AERO', shortName: 'AER', color: '#0ea5e9' },
    { id: 't12', name: 'Ferdimant', shortName: 'FRD', color: '#f43f5e' },
    { id: 't13', name: 'Apex', shortName: 'APX', color: '#6366f1' }
];

const DEFAULT_MATCHES = [
    { id: 'gm1', team1: 't1', team2: 't2', score1: null, score2: null, status: 'pending' },
    { id: 'gm2', team1: 't2', team2: 't3', score1: null, score2: null, status: 'pending' },
    { id: 'gm3', team1: 't3', team2: 't4', score1: null, score2: null, status: 'pending' },
    { id: 'gm4', team1: 't4', team2: 't5', score1: null, score2: null, status: 'pending' },
    { id: 'gm5', team1: 't5', team2: 't6', score1: null, score2: null, status: 'pending' },
    { id: 'gm6', team1: 't6', team2: 't7', score1: null, score2: null, status: 'pending' },
    { id: 'gm7', team1: 't7', team2: 't8', score1: null, score2: null, status: 'pending' },
    { id: 'gm8', team1: 't8', team2: 't9', score1: null, score2: null, status: 'pending' },
    { id: 'gm9', team1: 't9', team2: 't10', score1: null, score2: null, status: 'pending' },
    { id: 'gm10', team1: 't10', team2: 't11', score1: null, score2: null, status: 'pending' },
    { id: 'gm11', team1: 't11', team2: 't12', score1: null, score2: null, status: 'pending' },
    { id: 'gm12', team1: 't12', team2: 't13', score1: null, score2: null, status: 'pending' },
    { id: 'gm13', team1: 't13', team2: 't1', score1: null, score2: null, status: 'pending' }
];

const DEFAULT_PLAYOFF = {
    qf1: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
    qf2: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
    sf1: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
    sf2: { team1: null, team2: null, score1: null, score2: null, status: 'pending' },
    final: { team1: null, team2: null, score1: null, score2: null, status: 'pending' }
};

const app = Vue.createApp({
    data() {
        return {
            teams: [],
            matches: [],
            playoff: null,
            currentTab: 'guruh',
            saveState: 'Saqlangan',
            isUpdatingRemote: false,
            saveTimeout: null
        };
    },
    computed: {
        finishedMatchesCount() {
            return this.matches.filter(m => m.status !== 'pending').length;
        },
        groupFinished() {
            return this.matches.length > 0 && this.finishedMatchesCount === this.matches.length;
        },
        standings() {
            let table = this.teams.map(t => ({
                id: t.id, name: t.name, shortName: t.shortName, color: t.color,
                played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0
            }));

            this.matches.forEach(m => {
                if (m.status === 'pending') return;
                let t1 = table.find(t => t.id === m.team1);
                let t2 = table.find(t => t.id === m.team2);
                if (!t1 || !t2) return;

                let s1 = parseInt(m.score1) || 0;
                let s2 = parseInt(m.score2) || 0;

                t1.played++; t2.played++;
                t1.gf += s1; t1.ga += s2;
                t2.gf += s2; t2.ga += s1;

                if (s1 > s2) { t1.w++; t1.pts += 3; t2.l++; }
                else if (s1 < s2) { t2.w++; t2.pts += 3; t1.l++; }
                else { t1.d++; t2.d++; t1.pts += 1; t2.pts += 1; }
            });

            table.forEach(t => { t.gd = t.gf - t.ga; });

            table.sort((a, b) => {
                if (b.pts !== a.pts) return b.pts - a.pts;
                if (b.gd !== a.gd) return b.gd - a.gd;
                if (b.gf !== a.gf) return b.gf - a.gf;
                return a.name.localeCompare(b.name);
            });

            return table;
        }
    },
    methods: {
        getTeamName(id) {
            const team = this.teams.find(t => t.id === id);
            return team ? team.name : 'Noma\'lum';
        },
        getTeamLogo(id) {
            const team = this.teams.find(t => t.id === id);
            if (!team) return '';
            let color = encodeURIComponent(team.color);
            let short = encodeURIComponent(team.shortName);
            return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 110"><path d="M50 0 L100 15 L100 65 C100 90 50 110 50 110 C50 110 0 90 0 65 L0 15 Z" fill="${color}"/><text x="50" y="65" font-family="Arial" font-size="32" font-weight="bold" fill="white" text-anchor="middle">${short}</text></svg>`;
        },
        triggerSave() {
            this.saveState = 'Saqlanmoqda...';
            if (this.saveTimeout) clearTimeout(this.saveTimeout);
            
            this.saveTimeout = setTimeout(() => {
                this.isUpdatingRemote = true;
                const data = {
                    teams: this.teams.length ? this.teams : DEFAULT_TEAMS,
                    matches: this.matches,
                    playoff: this.playoff || DEFAULT_PLAYOFF
                };
                
                db.ref('turnir').set(data)
                    .then(() => { this.saveState = 'Saqlangan'; })
                    .catch(() => { this.saveState = 'Xato'; })
                    .finally(() => { 
                        setTimeout(() => { this.isUpdatingRemote = false; }, 500);
                    });
            }, 800);
        },
        finishMatch(match) {
            if (match.score1 === null || match.score2 === null || match.score1 === '' || match.score2 === '') {
                alert("Iltimos, hisobni kiriting!");
                return;
            }
            match.status = 'finished';
            this.triggerSave();
        },
        setTechnical(match, winner) {
            match.score1 = winner === 1 ? 3 : 0;
            match.score2 = winner === 2 ? 3 : 0;
            match.status = 'technical';
            this.triggerSave();
        },
        resetMatch(match) {
            match.score1 = null;
            match.score2 = null;
            match.status = 'pending';
            this.triggerSave();
        },
        
        // Play-off Methods
        initPlayoff() {
            if (!this.groupFinished) {
                alert("Guruh bosqichi to'liq yakunlanmagan!");
                return;
            }
            if (confirm("Play-off setkasini turnir jadvali asosida yangilaysizmi? (Eski play-off ma'lumotlari o'chadi)")) {
                const s = this.standings;
                if (s.length < 6) return;
                
                if (!this.playoff) this.playoff = JSON.parse(JSON.stringify(DEFAULT_PLAYOFF));
                
                this.playoff.qf1.team1 = s[2].id; // 3-o'rin
                this.playoff.qf1.team2 = s[5].id; // 6-o'rin
                this.resetPlayoffMatchCore('qf1');
                
                this.playoff.qf2.team1 = s[3].id; // 4-o'rin
                this.playoff.qf2.team2 = s[4].id; // 5-o'rin
                this.resetPlayoffMatchCore('qf2');
                
                this.playoff.sf1.team1 = s[0].id; // 1-o'rin
                this.playoff.sf2.team1 = s[1].id; // 2-o'rin
                
                this.triggerSave();
            }
        },
        finishPlayoff(key) {
            const m = this.playoff[key];
            if (m.score1 === null || m.score2 === null) {
                alert("Hisobni kiriting!"); return;
            }
            if (m.score1 === m.score2) {
                alert("Play-offda durang bo'lishi mumkin emas. Penaltilar seriyasi hisobini kiriting."); return;
            }
            m.status = 'finished';
            
            const winnerId = m.score1 > m.score2 ? m.team1 : m.team2;
            this.advancePlayoffWinner(key, winnerId);
            this.triggerSave();
        },
        setPlayoffTech(key, winner) {
            const m = this.playoff[key];
            m.score1 = winner === 1 ? 3 : 0;
            m.score2 = winner === 2 ? 3 : 0;
            m.status = 'technical';
            const winnerId = winner === 1 ? m.team1 : m.team2;
            this.advancePlayoffWinner(key, winnerId);
            this.triggerSave();
        },
        advancePlayoffWinner(key, winnerId) {
            if (key === 'qf1') {
                this.playoff.sf2.team2 = winnerId;
                this.resetPlayoffMatchCore('sf2');
            } else if (key === 'qf2') {
                this.playoff.sf1.team2 = winnerId;
                this.resetPlayoffMatchCore('sf1');
            } else if (key === 'sf1') {
                this.playoff.final.team1 = winnerId;
                this.resetPlayoffMatchCore('final');
            } else if (key === 'sf2') {
                this.playoff.final.team2 = winnerId;
                this.resetPlayoffMatchCore('final');
            }
        },
        resetPlayoffMatchCore(key) {
            const m = this.playoff[key];
            m.score1 = null; m.score2 = null; m.status = 'pending';
            
            // Cascade reset
            if (key === 'qf1') {
                this.playoff.sf2.team2 = null;
                this.resetPlayoffMatchCore('sf2');
            } else if (key === 'qf2') {
                this.playoff.sf1.team2 = null;
                this.resetPlayoffMatchCore('sf1');
            } else if (key === 'sf1') {
                this.playoff.final.team1 = null;
                this.resetPlayoffMatchCore('final');
            } else if (key === 'sf2') {
                this.playoff.final.team2 = null;
                this.resetPlayoffMatchCore('final');
            }
        },
        resetPlayoffMatch(key) {
            this.resetPlayoffMatchCore(key);
            this.triggerSave();
        },
        
        // Admin actions
        initTournament() {
            if(confirm("Yangi turnir ma'lumotlarini yuklaysizmi? (Eski ma'lumotlar o'chadi)")) {
                this.teams = JSON.parse(JSON.stringify(DEFAULT_TEAMS));
                this.matches = JSON.parse(JSON.stringify(DEFAULT_MATCHES));
                this.playoff = JSON.parse(JSON.stringify(DEFAULT_PLAYOFF));
                this.triggerSave();
            }
        },
        resetScores() {
            if(confirm("Barcha o'yin natijalarini nollaysizmi?")) {
                this.matches.forEach(m => { m.score1 = null; m.score2 = null; m.status = 'pending'; });
                this.playoff = JSON.parse(JSON.stringify(DEFAULT_PLAYOFF));
                this.triggerSave();
            }
        },
        resetAll() {
            if(confirm("Hamma ma'lumotlarni, jumladan jamoalarni ham o'chirasizmi?")) {
                this.teams = [];
                this.matches = [];
                this.playoff = null;
                this.triggerSave();
            }
        }
    },
    mounted() {
        db.ref('turnir').on('value', snap => {
            if (this.isUpdatingRemote) return;
            const data = snap.val();
            if (data) {
                this.teams = data.teams || [];
                this.matches = data.matches || [];
                this.playoff = data.playoff || JSON.parse(JSON.stringify(DEFAULT_PLAYOFF));
            }
        });
    }
});

app.component('playoff-match', {
    template: '#playoff-match-template',
    props: ['match']
});

app.mount('#app');
