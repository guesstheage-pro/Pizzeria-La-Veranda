// Matteo, inserito il tuo link definitivo del Google Sheet
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTiI1CtZ95yRCMfYLrU6AhBTgeZ58yBJdfm1zrT9nW1fY0yOY8vlOmvshv0wuNvLGONcwX1hVxwEb_G/pub?output=csv'; //

// Orari della Pizzeria extracted da `image_5.png`
const openingSchedule = [
    { day: 1, name: "Lunedì", slots: [[660, 840], [1080, 1290]] }, // 11:00-14:00, 18:00-21:30
    { day: 2, name: "Martedì", slots: [[660, 840], [1080, 1290]] }, // 11:00-14:00, 18:00-21:30
    { day: 3, name: "Mercoledì", slots: [[660, 840], [1080, 1290]] }, // 11:00-14:00, 18:00-21:30
    { day: 4, name: "Giovedì", slots: [[660, 840], [1080, 1290]] }, // 11:00-14:00, 18:00-21:30
    { day: 5, name: "Venerdì", slots: [[660, 840], [1080, 1290]] }, // 11:00-14:00, 18:00-21:30
    { day: 6, name: "Sabato", slots: [[660, 840], [1080, 1350]] }, // 11:00-14:00, 18:00-22:30
    { day: 0, name: "Domenica", slots: [[1080, 1350]] } // 18:00-22:30
];

// Funzione per controllare lo stato di apertura
function checkOpenStatus() {
    const now = new Date();
    const currentTimeMinutes = now.getHours() * 60 + now.getMinutes();
    const currentDaySchedule = openingSchedule.find(s => s.day === now.getDay());
    let isOpen = false;

    if (currentDaySchedule) {
        for (const slot of currentDaySchedule.slots) {
            if (currentTimeMinutes >= slot[0] && currentTimeMinutes < slot[1]) {
                isOpen = true; break;
            }
        }
    }

    const statusBar = document.getElementById('status-bar');
    if (statusBar) {
        if (isOpen) {
            statusBar.textContent = "● Aperto ora 🌿☕🍕";
            statusBar.className = "status-active";
        } else {
            statusBar.textContent = "○ Chiuso ora 🌙";
            statusBar.className = "status-inactive";
        }
    }
}

// Funzione per caricare la home page (Hub)
function loadHomePage() {
    // Assicurati che l'header sia visibile
    d3.select('#main-header').style('display', 'block');
    const container = d3.select('#app-container');
    container.html(''); // Pulisci area principale hub

    const hubGrid = container.append('div').attr('class', 'hub-grid');
    
    // NUOVO RIQUADRO IMPASTO (Richiesta Matteo, simile a Kalkerin)
    const impastoCard = hubGrid.append('div').attr('class', 'impasto-hub-card');
    impastoCard.append('div').attr('class', 'impasto-hub-title').text("I Nostri Impasti: 🌾☕🍕");
    // Testo extracted da `image_5.png`
    impastoCard.append('div').attr('class', 'impasto-hub-text').text("🌾 MIX DI FARINE (glutine) - Acqua - Lievito fresco - Olio di semi di girasole - sale");
    impastoCard.append('div').attr('class', 'impasto-hub-text').style('color', '#e31e24').style('font-weight', '700').text("IMPASTO INTEGRALE + € 1.00");

    // 1. Sezione Navigazione Menù (Richiesti 5 tasti specifici)
    const menuNav = hubGrid.append('div').attr('class', 'menu-nav');
    menuNav.append('h2').attr('class', 'hub-title').text('Scopri i nostri Menù');

    const menuOptions = [
        { key: 'PIZZE_ROSSE', name: 'Le nostre pizze (🍅)' }, //
        { key: 'PIZZE_BIANCHE', name: 'Pizze bianche (🥛)' }, //
        { key: 'CALZONI', name: 'Calzoni (🥟)' }, //
        { key: 'PANPIZZA', name: 'Panpizza (🍔)' }, //
        { key: 'FRITTI', name: 'I nostri fritti (🍟)' } //
    ];

    menuOptions.forEach(opt => {
        const btn = menuNav.append('button')
            .attr('class', 'nav-btn')
            .on('click', () => loadMenuPage(opt.key, opt.name));
        
        btn.append('span').text(opt.name);
        btn.append('span').attr('class', 'btn-arrow').text('→');
    });

    // 2. Sezione Orari
    const orariCard = hubGrid.append('div').attr('class', 'orari-card');
    orariCard.append('h2').attr('class', 'hub-title').text('🕒 I Nostri Orari');
    const orariList = orariCard.append('div').attr('class', 'orari-list');

    const now = new Date();
    openingSchedule.forEach(s => {
        const row = orariList.append('div').attr('class', 'orari-day');
        if (s.day === now.getDay()) row.classed('current', true); // Evidenzia il giorno corrente
        
        row.append('span').text(s.name + ":");
        
        if(s.slots.length === 0) {
            row.append('span').text("Chiuso");
        } else {
            const hoursString = s.slots.map(slot => {
                const startHour = Math.floor(slot[0]/60);
                const startMin = (slot[0]%60).toString().padStart(2,'0');
                const endHour = Math.floor(slot[1]/60);
                const endMin = (slot[1]%60).toString().padStart(2,'0');
                return `${startHour}:${startMin} - ${endHour}:${endMin}`;
            }).join(', ');
            row.append('span').text(hoursString);
        }
    });

    checkOpenStatus(); 
}

// Funzione per caricare la pagina interna del menù filtrato
async function loadMenuPage(searchKey, pageTitle) {
    // Nascondi header principale
    d3.select('#main-header').style('display', 'none');
    const container = d3.select('#app-container');
    container.html('<div class="loading-spinner">Caricamento prodotti... 🍕☕</div>'); 

    try {
        // Caricamento Dati
        const response = await fetch(SHEET_URL);
        const csvData = await response.text();
        const data = d3.csvParse(csvData);

        // FILTRO INTELLIGENTE: controlla se MenuType contiene la parola chiave (in maiuscolo)
        const filteredData = data.filter(d => {
            const sheetValue = (d.MenuType || "").toUpperCase();
            return sheetValue.includes(searchKey.toUpperCase()) && d.Disponibile.toUpperCase() === 'SI';
        });

        container.html(''); // Pulisci area principale hub
        
        // Tasto Indietro
        container.append('div').attr('class', 'back-container')
            .append('button').attr('class', 'back-btn').text('🔙 Torna al Menù Principale')
            .on('click', loadHomePage);

        // Titolo della pagina
        container.append('h1').text(pageTitle).attr('class', 'category-main-title');

        if (filteredData.length === 0) {
            container.append('p').text('Al momento non ci sono articoli disponibili. 😅☕🍕').style('text-align', 'center').style('color', '#888');
            return;
        }

        // Raggruppa per Categoria (Pizze Rosse, Pizze Bianche, ecc.)
        const nestedData = d3.groups(filteredData, d => d.Categoria);

        nestedData.forEach(([category, items]) => {
            // Titolo Categoria (Verde del logo)
            container.append('h2').attr('class', 'category-title').text(category);
            
            items.forEach(item => {
                const menuItem = container.append('div').attr('class', 'menu-item');
                const info = menuItem.append('div').attr('class', 'item-info');
                info.append('div').attr('class', 'item-name').text(item['Nome Articolo']);
                if (item['Descrizione']) info.append('div').attr('class', 'item-desc').text(item['Descrizione']);
                
                // Format prezzo (es: 4.60 -> 4,60)
                const prezzoVal = parseFloat(item['Prezzo'].replace(',', '.')).toFixed(2).replace('.', ',');
                menuItem.append('div').attr('class', 'item-price').text('€ ' + prezzoVal); // Prezzo rosso
            });
        });

    } catch (e) {
        container.html('<p style="text-align:center">Oops! Errore nel caricamento del menù. Riprovare. 😅☕🍕</p>');
    }
}

// Inizializzazione
document.addEventListener('DOMContentLoaded', loadHomePage);
