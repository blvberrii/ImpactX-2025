const SYMPTOMS = [
"Acne", "Aging skin", "Allergies", "Anxiety", "Bacterial vaginosis",
"Bloating", "C. diff infection", "Cold and flu", "Constipation",
"Diarrhea", "Digestive issues", "Eczema", "Gas", "Gut inflammation",
"High blood pressure", "High cholesterol", "IBS", "Infant colic",
"Iron deficiency", "Kidney stones", "Lactose intolerance", "Leaky gut",
"Memory issues", "Oral health issues", "Pathogen overgrowth", "Pouchitis",
"Respiratory infections", "Seasonal allergies", "Skin inflammation",
"Stress", "Traveler's diarrhea", "Ulcerative colitis", "Urinary tract infection",
"Vaginal health", "Vaginal yeast", "Weight management"
];
let selectedSymptoms = [];          // user-chosen symptoms
let selectedStrains = [];           // strain inputs (first one is special)
let allProbiotics = [];             // cached api data, used in a few places
// kick things off once the DOM is ready
document.addEventListener('DOMContentLoaded', function () {
initializePage();
});
function initializePage() {
// figure out which page we r on
if (document.getElementById('symptoms-grid')) {
initializeSearchPage();
}
// results page loads via URL params, so nothing to do here
if (document.getElementById('results-container')) {
    return;
}

}
function initializeSearchPage() {
// grab probiotics data up front
fetch('/api/probiotics')
.then(res => res.json())
.then(data => {
allProbiotics = data;
})
.catch(err => {
console.error('Error loading probiotics:', err);
});
// bonitafy symptom buttons
const symptomsGrid = document.getElementById('symptoms-grid');
if (symptomsGrid) {
    SYMPTOMS.forEach(symptom => {
        const btn = document.createElement('button');
        btn.className = 'symptom-button';
        btn.textContent = symptom;
        btn.onclick = () => toggleSymptom(symptom, btn);
        symptomsGrid.appendChild(btn);
    });
}

// initialize strain state
selectedStrains = ['']; // first input is handled separately

const mainInput = document.getElementById('strain-input');
if (mainInput) {
    mainInput.addEventListener('input', function (e) {
        if (selectedStrains.length > 0) {
            selectedStrains[0] = e.target.value;
        }
    });
}

}
// toggle between strain and symptom search
function switchMode(mode) {
const strainSection = document.getElementById('strain-search-section');
const symptomSection = document.getElementById('symptom-search-section');
const strainBtn = document.getElementById('strain-mode');
const symptomBtn = document.getElementById('symptom-mode');
if (mode === 'strain') {
    strainSection.style.display = 'block';
    symptomSection.style.display = 'none';
    strainBtn.classList.add('active');
    symptomBtn.classList.remove('active');
} else {
    strainSection.style.display = 'none';
    symptomSection.style.display = 'block';
    strainBtn.classList.remove('active');
    symptomBtn.classList.add('active');
}

}
// --- Autocomplete (main strain input) ---
let searchTimeout;                  // reused for all searches 
let currentSuggestions = [];
let selectedSuggestionIndex = -1;
function handleStrainSearch(query) {
const input = document.getElementById('strain-input');
const suggestions = document.getElementById('suggestions');
if (!input || !suggestions) return;

clearTimeout(searchTimeout);

if (query.length < 2) {
    suggestions.classList.remove('show');
    return;
}

searchTimeout = setTimeout(() => {
    fetch(`/api/search/strain?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => {
            currentSuggestions = data;
            selectedSuggestionIndex = -1;
            displaySuggestions(data);
        })
        .catch(err => console.error('Error searching:', err));
}, 200); // debounce feels okay here

}
function displaySuggestions(list) {
const suggestionsDiv = document.getElementById('suggestions');
if (!suggestionsDiv) return;
suggestionsDiv.innerHTML = '';

if (!list || list.length === 0) {
    suggestionsDiv.classList.remove('show');
    return;
}

list.forEach((probiotic, idx) => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    item.onmouseenter = () => {
        selectedSuggestionIndex = idx;
        updateSuggestionSelection();
    };

    item.onclick = () => selectSuggestion(probiotic);

    const name = document.createElement('div');
    name.className = 'suggestion-name';
    name.textContent = probiotic.name || probiotic.full_name;

    const genus = document.createElement('div');
    genus.className = 'suggestion-genus';
    genus.textContent = probiotic.genus || '';

    item.appendChild(name);
    item.appendChild(genus);
    suggestionsDiv.appendChild(item);
});

suggestionsDiv.classList.add('show');

}
function updateSuggestionSelection() {
const items = document.querySelectorAll('.suggestion-item');
items.forEach((item, i) => {
item.classList.toggle('selected', i === selectedSuggestionIndex);
});
}
function selectSuggestion(probiotic) {
const input = document.getElementById('strain-input');
const suggestions = document.getElementById('suggestions');
if (!input || !suggestions || !probiotic) return;
const strainName = probiotic.name || probiotic.full_name;
input.value = strainName;
suggestions.classList.remove('show');
selectedSuggestionIndex = -1;

// keep selectedStrains in sync
if (selectedStrains.length > 0) {
    selectedStrains[0] = strainName;
} else {
    selectedStrains = [strainName];
}

}
function showSuggestions() {
const input = document.getElementById('strain-input');
if (input && input.value.length >= 2) {
handleStrainSearch(input.value);
}
}
// keyboard navigation for main autocomplete
document.addEventListener('keydown', function (e) {
const input = document.getElementById('strain-input');
const suggestions = document.getElementById('suggestions');
if (!input || !suggestions) return;
if (document.activeElement !== input) return;
if (!suggestions.classList.contains('show')) return;

if (e.key === 'ArrowDown') {
    e.preventDefault();
    selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        currentSuggestions.length - 1
    );
    updateSuggestionSelection();
} else if (e.key === 'ArrowUp') {
    e.preventDefault();
    selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
    updateSuggestionSelection();
} else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
    e.preventDefault();
    selectSuggestion(currentSuggestions[selectedSuggestionIndex]);
} else if (e.key === 'Escape') {
    suggestions.classList.remove('show');
    selectedSuggestionIndex = -1;
}

});
// close dropdowns when clicking outside
document.addEventListener('click', function (e) {
const mainSuggestions = document.getElementById('suggestions');
const mainInput = document.getElementById('strain-input');
if (mainSuggestions && mainInput &&
    !mainSuggestions.contains(e.target) &&
    e.target !== mainInput) {
    mainSuggestions.classList.remove('show');
}

// handle dynamically added dropdowns
document.querySelectorAll('.suggestions-dropdown').forEach(dropdown => {
    if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
    }
});

});
// --- Multiple strain fields ---
function addStrainField() {
selectedStrains.push('');
updateStrainList();
}
function updateStrainList() {
const strainList = document.getElementById('strain-list');
if (!strainList) return;
strainList.innerHTML = '';

// skip index 0 (main input)
for (let i = 1; i < selectedStrains.length; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'strain-item';

    const container = document.createElement('div');
    container.className = 'strain-item-container';

    const icon = document.createElement('span');
    icon.className = 'search-icon';
    icon.textContent = '🔍';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Enter probiotic strain name';
    input.value = selectedStrains[i];
    input.setAttribute('data-strain-index', i);

    const suggestionsDiv = document.createElement('div');
    suggestionsDiv.className = 'suggestions-dropdown';

    input.oninput = (e) => {
        selectedStrains[i] = e.target.value;
        handleStrainSearchForField(e.target.value, suggestionsDiv);
    };

    input.onfocus = () => {
        if (input.value.length >= 2) {
            handleStrainSearchForField(input.value, suggestionsDiv);
        }
    };

    const clearBtn = document.createElement('button');
    clearBtn.className = 'clear-strain';
    clearBtn.type = 'button';
    clearBtn.onclick = () => {
        selectedStrains.splice(i, 1);
        updateStrainList(); // brute force but simple
    };

    container.appendChild(icon);
    container.appendChild(input);
    container.appendChild(clearBtn);
    container.appendChild(suggestionsDiv);
    wrapper.appendChild(container);
    strainList.appendChild(wrapper);
}

}
// autocomplete for extra strain inputs
function handleStrainSearchForField(query, suggestionsDiv) {
if (!suggestionsDiv) return;
clearTimeout(searchTimeout);

if (query.length < 2) {
    suggestionsDiv.classList.remove('show');
    return;
}

searchTimeout = setTimeout(() => {
    fetch(`/api/search/strain?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => displaySuggestionsForField(data, suggestionsDiv))
        .catch(err => console.error('Error searching:', err));
}, 200);

}
function displaySuggestionsForField(list, suggestionsDiv) {
if (!suggestionsDiv) return;
suggestionsDiv.innerHTML = '';

if (!list || list.length === 0) {
    suggestionsDiv.classList.remove('show');
    return;
}

list.forEach(probiotic => {
    const item = document.createElement('div');
    item.className = 'suggestion-item';

    item.onclick = () => {
        const container = suggestionsDiv.parentElement;
        const input = container.querySelector('input');
        if (!input) return;

        const strainName = probiotic.name || probiotic.full_name;
        input.value = strainName;

        const idx = parseInt(input.getAttribute('data-strain-index'), 10);
        if (!isNaN(idx)) {
            selectedStrains[idx] = strainName;
        }

        suggestionsDiv.classList.remove('show');
    };

    const name = document.createElement('div');
    name.className = 'suggestion-name';
    name.textContent = probiotic.name || probiotic.full_name;

    const genus = document.createElement('div');
    genus.className = 'suggestion-genus';
    genus.textContent = probiotic.genus || '';

    item.appendChild(name);
    item.appendChild(genus);
    suggestionsDiv.appendChild(item);
});

suggestionsDiv.classList.add('show');

}
// --- Symptoms ---
function toggleSymptom(symptom, button) {
const idx = selectedSymptoms.indexOf(symptom);
if (idx > -1) {
selectedSymptoms.splice(idx, 1);
button.classList.remove('selected');
} else {
selectedSymptoms.push(symptom);
button.classList.add('selected');
}
}
// --- Search actions ---
function searchByStrains() {
const mainInput = document.getElementById('strain-input');
const mainStrain = mainInput.value.trim();
const strains = [mainStrain, ...selectedStrains.slice(1)]
    .filter(s => s.trim() !== '');

if (strains.length === 0) {
    alert('Please enter at least one probiotic strain.');
    return;
}

// first strain drives the initial search
fetch(`/api/search/strain?q=${encodeURIComponent(strains[0])}`)
    .then(res => res.json())
    .then(results => {
        if (!results || results.length === 0) {
            alert('No probiotics found matching your search.');
            return;
        }

        if (strains.length > 1) {
            Promise.all(
                strains.slice(1).map(strain =>
                    fetch(`/api/search/strain?q=${encodeURIComponent(strain)}`)
                        .then(r => r.ok ? r.json() : [])
                        .catch(() => [])
                )
            ).then(extraResults => {
                const merged = [...results];
                extraResults.forEach(set => {
                    set.forEach(item => {
                        if (!merged.find(m => m.id === item.id)) {
                            merged.push(item);
                        }
                    });
                });
                navigateToResults(merged);
            }).catch(() => {
                navigateToResults(results);
            });
        } else {
            navigateToResults(results);
        }
    })
    .catch(() => {
        alert('An error occurred while searching. Please try again.');
    });

}
function navigateToResults(results) {
const ids = results.map(r => r.id).join(',');
window.location.href = `/results?strains=${encodeURIComponent(ids)}`;
}
function searchBySymptoms() {
if (selectedSymptoms.length === 0) {
alert('Please select at least one symptom.');
return;
}
const query = selectedSymptoms
    .map(s => `symptoms=${encodeURIComponent(s)}`)
    .join('&');

window.location.href = `/results?${query}`;

}
// --- Results page ---
function loadResults() {
const params = new URLSearchParams(window.location.search);
const container = document.getElementById('results-container');
if (!container) return;
const strainsParam = params.get('strains');
const symptomsParam = params.getAll('symptoms');

if (strainsParam) {
    const ids = strainsParam.split(',');
    fetch('/api/probiotics')
        .then(res => res.json())
        .then(data => {
            const matches = data.filter(p => ids.includes(p.id));
            displayResults(matches);
        })
        .catch(() => {
            container.innerHTML = '<p>Error loading results. Please try again.</p>';
        });
} else if (symptomsParam.length > 0) {
    const query = symptomsParam
        .map(s => `symptoms=${encodeURIComponent(s)}`)
        .join('&');

    fetch(`/api/search/symptom?${query}`)
        .then(res => res.json())
        .then(data => displayResults(data))
        .catch(() => {
            container.innerHTML = '<p>Error loading results. Please try again.</p>';
        });
} else {
    container.innerHTML = '<p>No search parameters found.</p>';
}

}
function displayResults(results) {
const container = document.getElementById('results-container');
if (!container) return;
if (!results || results.length === 0) {
    container.innerHTML = '<p>No results found.</p>';
    return;
}

container.innerHTML = '';

results.forEach(probiotic => {
    const card = document.createElement('div');
    card.className = 'result-card';

    const title = document.createElement('h2');
    title.textContent = probiotic.full_name || probiotic.name;

    const genus = document.createElement('span');
    genus.className = 'genus-tag';
    genus.textContent = probiotic.genus || '';

    const helpsLabel = document.createElement('div');
    helpsLabel.className = 'section-label';
    helpsLabel.textContent = 'Helps With:';

    const helpsWith = document.createElement('div');
    helpsWith.className = 'helps-with';

    (probiotic.helps_with || []).forEach(h => {
        const tag = document.createElement('span');
        tag.className = 'help-tag';
        tag.textContent = h;
        helpsWith.appendChild(tag);
    });

    const benefitsLabel = document.createElement('div');
    benefitsLabel.className = 'section-label';
    benefitsLabel.textContent = 'Benefits:';

    const benefitsList = document.createElement('ul');
    benefitsList.className = 'benefits-list';

    (probiotic.benefits || []).forEach(b => {
        const li = document.createElement('li');
        li.className = 'benefit-item';

        const check = document.createElement('span');
        check.textContent = '✓';

        const text = document.createElement('span');
        text.textContent = b;

        li.appendChild(check);
        li.appendChild(text);
        benefitsList.appendChild(li);
    });

    card.appendChild(title);
    card.appendChild(genus);
    card.appendChild(helpsLabel);
    card.appendChild(helpsWith);
    card.appendChild(benefitsLabel);
    card.appendChild(benefitsList);

    container.appendChild(card);
});

}