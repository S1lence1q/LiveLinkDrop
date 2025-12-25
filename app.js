// --- KONFIGURATION ---
// 1. Gå til firebase.google.com -> Opret projekt (Gratis)
// 2. Vælg 'Realtime Database' -> Create -> Start in Test Mode
// 3. Project Settings -> General -> Scroll ned til "Your apps" -> Vælg </> icon
// 4. Kopier koden og overskriv denne sektion:
var firebaseConfig = {
    apiKey: "AIzaSyD8zbwNjLmzTNRWM-f0ujP258mzB_deAiQ",
    authDomain: "live-link-drop.firebaseapp.com",
    databaseURL: "https://live-link-drop-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "live-link-drop",
    storageBucket: "live-link-drop.firebasestorage.app",
    messagingSenderId: "335736846822",
    appId: "1:335736846822:web:6ed6aea2b739933f66fe27",
    measurementId: "G-ZDFT90QC42"
};

// --- APP STATE ---
var appState = {
    mode: 'demo',
    currentRoom: 'global',
    db: null
};

// --- UI REFS ---
var ui = {
    dropZone: document.getElementById('drop-zone'),
    linkContent: document.getElementById('link-content'),
    currentLink: document.getElementById('current-link'),
    timestamp: document.getElementById('timestamp'),
    actionButtons: document.getElementById('action-buttons'),
    copyBtn: document.getElementById('copy-btn'),
    openBtn: document.getElementById('open-btn'),
    sendForm: document.getElementById('send-form'),
    linkInput: document.getElementById('link-input'),
    toast: document.getElementById('toast')
};

// --- INIT ---
function init() {
    console.log("App starting...");

    // Tjek om Firebase scripts er loaded
    if (typeof firebase === 'undefined') {
        alert("Kunne ikke indlæse Firebase! Tjek din internetforbindelse.");
        return;
    }

    // Tjek Konfiguration
    if (firebaseConfig.apiKey === "API_KEY_HER") {
        console.warn("⚠️ Ingen rigtig config. Kører DEMO MODE.");
        appState.mode = 'demo';
        setupDemoMode();
    } else {
        try {
            firebase.initializeApp(firebaseConfig);
            appState.db = firebase.database();
            appState.mode = 'firebase';
            setupFirebase();
        } catch (e) {
            console.error("Firebase config fejl:", e);
            alert("Fejl i Firebase Config (se konsol). Kører Demo Mode.");
            appState.mode = 'demo';
            setupDemoMode();
        }
    }

    setupEventListeners();
}

// --- SETUP FUNCTIONS ---
function setupFirebase() {
    var roomRef = appState.db.ref('rooms/' + appState.currentRoom);
    roomRef.on('value', function (snapshot) {
        var data = snapshot.val();
        if (data) {
            displayLink(data);
        }
    });
}

function setupDemoMode() {
    // Check local storage immediately
    try {
        var saved = localStorage.getItem('lld_global_link');
        if (saved) displayLink(JSON.parse(saved));
    } catch (e) { }

    // Fake "Network Listener" via localStorage events (virker mellem faner)
    window.addEventListener('storage', function (e) {
        if (e.key === 'lld_global_link') {
            try {
                displayLink(JSON.parse(e.newValue));
            } catch (e) { }
        }
    });
}

// --- CORE ACTIONS ---
function sendLink(url) {
    if (!url) return;

    // Auto-fix URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    var data = {
        url: url,
        timestamp: Date.now()
    };

    if (appState.mode === 'firebase') {
        // Send til Skyen
        appState.db.ref('rooms/' + appState.currentRoom).set(data)
            .then(function () {
                ui.linkInput.value = '';
            })
            .catch(function (err) {
                alert("Kunne ikke sende: " + err.message);
            });
    } else {
        // Send Lokalt
        try {
            localStorage.setItem('lld_global_link', JSON.stringify(data));
        } catch (e) {
            console.warn("Storage blocked, showing locally only");
        }
        displayLink(data); // Vis med det samme
        ui.linkInput.value = '';
    }
}

function displayLink(data) {
    if (!data || !data.url) return;

    ui.dropZone.classList.add('active');
    document.querySelector('.empty-state').classList.add('hidden');
    ui.linkContent.classList.remove('hidden');
    ui.actionButtons.querySelectorAll('.hidden').forEach(function (el) {
        el.classList.remove('hidden');
    });

    ui.currentLink.href = data.url;
    ui.currentLink.textContent = data.url;

    var time = new Date(data.timestamp).toLocaleTimeString();
    ui.timestamp.textContent = "Sendt " + time;
}

function setupEventListeners() {
    ui.sendForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendLink(ui.linkInput.value.trim());
    });

    ui.copyBtn.addEventListener('click', function () {
        if (ui.currentLink.href) {
            navigator.clipboard.writeText(ui.currentLink.href).then(function () {
                showToast("Kopieret!");
            });
        }
    });

    ui.openBtn.addEventListener('click', function () {
        if (ui.currentLink.href) window.open(ui.currentLink.href, '_blank');
    });
}

function showToast(msg) {
    ui.toast.textContent = msg;
    ui.toast.classList.remove('hidden');
    setTimeout(function () { ui.toast.classList.add('hidden'); }, 2000);
}

// Start
init();
