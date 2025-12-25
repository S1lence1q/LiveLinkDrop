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
function sendLink(input) {
    if (!input) return;

    // Simple URL detection
    var isUrl = /^(http|https):\/\/[^ "]+$/.test(input);

    // If no protocol but looks like domain (e.g. "google.com"), add https
    if (!isUrl && /^[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/.test(input) && !input.includes(' ')) {
        input = 'https://' + input;
        isUrl = true;
    }

    var data = {
        content: input,
        type: isUrl ? 'url' : 'text',
        timestamp: Date.now()
    };

    if (appState.mode === 'firebase') {
        appState.db.ref('rooms/' + appState.currentRoom).set(data)
            .then(function () {
                ui.linkInput.value = '';
            })
            .catch(function (err) {
                alert("Kunne ikke sende: " + err.message);
            });
    } else {
        try {
            localStorage.setItem('lld_global_link', JSON.stringify(data));
        } catch (e) { }
        displayLink(data);
        ui.linkInput.value = '';
    }
}

function displayLink(data) {
    // Support old format (data.url) + new format (data.content)
    var content = data.content || data.url;
    if (!content) return;

    ui.dropZone.classList.add('active');
    document.querySelector('.empty-state').classList.add('hidden');
    ui.linkContent.classList.remove('hidden');

    // Detect type if missing (old data)
    var isUrl = data.type === 'url' || (data.url && !data.type);

    if (isUrl) {
        // Link Style
        ui.currentLink.href = content;
        ui.currentLink.textContent = formatDisplayUrl(content);
        ui.currentLink.style.pointerEvents = "auto";
        ui.currentLink.classList.add('gradient-text');

        ui.actionButtons.querySelectorAll('.hidden').forEach(function (el) {
            el.classList.remove('hidden');
        });
        ui.openBtn.classList.remove('hidden');
    } else {
        // Text Style
        ui.currentLink.removeAttribute('href');
        ui.currentLink.textContent = content;
        ui.currentLink.style.pointerEvents = "none";
        ui.currentLink.classList.remove('gradient-text');

        // Show Copy only
        ui.actionButtons.querySelectorAll('.hidden').forEach(function (el) {
            el.classList.remove('hidden');
        });
        ui.openBtn.classList.add('hidden');
    }

    var time = new Date(data.timestamp).toLocaleTimeString();
    ui.timestamp.textContent = (isUrl ? "Link" : "Tekst") + " sendt " + time;
}

function formatDisplayUrl(urlString) {
    try {
        var url = new URL(urlString);
        var path = url.pathname + url.search;
        if (path === '/' || path === '') return url.hostname;
        if (path.length > 30) path = path.substring(0, 30) + "...";
        return url.hostname + " " + path;
    } catch (e) {
        return urlString;
    }
}

function setupEventListeners() {
    ui.sendForm.addEventListener('submit', function (e) {
        e.preventDefault();
        sendLink(ui.linkInput.value.trim());
    });

    ui.copyBtn.addEventListener('click', function () {
        var val = ui.currentLink.href ? ui.currentLink.href : ui.currentLink.textContent;
        if (val) {
            navigator.clipboard.writeText(val).then(function () {
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
