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

let selectedSymptoms = []; // user-chosen symptoms
let selectedStrains = [];  //strain inputs (first one is special)
let allProbiotics = [];  // cached api data, used in a few places

// kick things off once the DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    // figure out which page we r on
    if (document.getElementById('symptoms-grid')) {
        initializeSearchPage();
    }
    
    if (document.getElementById('results-container')) {
        return;
    }
}

function initializeSearchPage() {
    // load data
    fetch('/api/probiotics')
        .then(response => response.json())
        .then(data => {
            allProbiotics = data;
        })
        .catch(error => console.error('Error loading probiotics:', error));
    
    // bonitafy symptom buttons
    const symptomsGrid = document.getElementById('symptoms-grid');
    if (symptomsGrid) {
        SYMPTOMS.forEach(symptom => {
            const button = document.createElement('button');
            button.className = 'symptom-button';
            button.textContent = symptom;
            button.onclick = () => toggleSymptom(symptom, button);
            symptomsGrid.appendChild(button);
        });
    }
    
    // initialize strain state
    selectedStrains = [''];
    
    const mainInput = document.getElementById('strain-input');
    if (mainInput) {
        mainInput.addEventListener('input', function(e) {
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
    const strainButton = document.getElementById('strain-mode');
    const symptomButton = document.getElementById('symptom-mode');
    
    if (mode === 'strain') {
        strainSection.style.display = 'block';
        symptomSection.style.display = 'none';
        strainButton.classList.add('active');
        symptomButton.classList.remove('active');
    } else {
        strainSection.style.display = 'none';
        symptomSection.style.display = 'block';
        strainButton.classList.remove('active');
        symptomButton.classList.add('active');
    }
}

// --autocomplete--
let searchTimeout; // reused for all searches
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
            .then(response => response.json())
            .then(data => {
                currentSuggestions = data;
                selectedSuggestionIndex = -1;
                displaySuggestions(data);
            })
            .catch(error => console.error('Error searching:', error));
    }, 200); //debounce feels ok me thinks
}

function displaySuggestions(suggestions) {
    const suggestionsDiv = document.getElementById('suggestions');
    if (!suggestionsDiv) return;
    
    suggestionsDiv.innerHTML = '';
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    suggestions.forEach((probiotic, index) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.onmouseenter = () => {
            selectedSuggestionIndex = index;
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
    items.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('selected');
        } else {
            item.classList.remove('selected');
        }
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
    
    // update the first strain
    if (selectedStrains.length > 0) {
        selectedStrains[0] = strainName;
    } else {
        selectedStrains = [strainName];
    }
}

function showSuggestions() {
    const input = document.getElementById('strain-input');
    if (input.value.length >= 2) {
        handleStrainSearch(input.value);
    }
}

// keyboard navigaion for main autocomplete
document.addEventListener('keydown', function(e) {
    const input = document.getElementById('strain-input');
    const suggestions = document.getElementById('suggestions');
    
    if (!input || !suggestions || document.activeElement !== input) return;
    if (!suggestions.classList.contains('show')) return;
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
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

// close dropdown by clicking outside
document.addEventListener('click', function(e) {
    const suggestions = document.getElementById('suggestions');
    const input = document.getElementById('strain-input');
    if (suggestions && input && !suggestions.contains(e.target) && e.target !== input) {
        suggestions.classList.remove('show');
    }
    
    // handle dynamically the added dropdowns
    const allSuggestions = document.querySelectorAll('.suggestions-dropdown');
    allSuggestions.forEach(sugg => {
        if (sugg.id !== 'suggestions' && !sugg.contains(e.target)) {
            const container = sugg.parentElement;
            const input = container ? container.querySelector('input') : null;
            if (input && e.target !== input && !sugg.contains(e.target)) {
                sugg.classList.remove('show');
            }
        }
    });
});

// add strain field
function addStrainField() {
    selectedStrains.push('');
    updateStrainList();
}

function updateStrainList() {
    const strainList = document.getElementById('strain-list');
    if (!strainList) return;
    
    strainList.innerHTML = '';
    
    // dont show the first one bcs its alrdy main input
    for (let i = 1; i < selectedStrains.length; i++) {
        const strainItem = document.createElement('div');
        strainItem.className = 'strain-item';
        
        const container = document.createElement('div');
        container.className = 'strain-item-container';
        
        const searchIcon = document.createElement('span');
        searchIcon.className = 'search-icon';
        searchIcon.textContent = '🔍';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Enter probiotic strain name';
        input.value = selectedStrains[i];
        input.setAttribute('data-strain-index', i);
        
        // add suggestions dropdown for this input
        const suggestionsDiv = document.createElement('div');
        suggestionsDiv.className = 'suggestions-dropdown';
        suggestionsDiv.id = `suggestions-${i}`;
        
        // add input event handler for autocomplete
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
        clearBtn.setAttribute('aria-label', 'Remove strain');
        clearBtn.onclick = () => {
            selectedStrains.splice(i, 1);
            updateStrainList(); // brute force but simple
        };
        
        container.appendChild(searchIcon);
        container.appendChild(input);
        container.appendChild(clearBtn);
        container.appendChild(suggestionsDiv);
        strainItem.appendChild(container);
        strainList.appendChild(strainItem);
    }
}

// autocomplete for the additional strain fields
function handleStrainSearchForField(query, suggestionsDiv) {
    if (!suggestionsDiv) return;
    
    clearTimeout(searchTimeout);
    
    if (query.length < 2) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    searchTimeout = setTimeout(() => {
        fetch(`/api/search/strain?q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                displaySuggestionsForField(data, suggestionsDiv);
            })
            .catch(error => console.error('Error searching:', error));
    }, 200);
}

function displaySuggestionsForField(suggestions, suggestionsDiv) {
    if (!suggestionsDiv) return;
    
    suggestionsDiv.innerHTML = '';
    
    if (!suggestions || suggestions.length === 0) {
        suggestionsDiv.classList.remove('show');
        return;
    }
    
    suggestions.forEach((probiotic) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.onclick = () => {
            // Find the input associated with this suggestions div
            const container = suggestionsDiv.parentElement;
            const input = container.querySelector('input');
            if (input) {
                const strainName = probiotic.name || probiotic.full_name;
                input.value = strainName;
                const index = parseInt(input.getAttribute('data-strain-index'));
                if (!isNaN(index) && selectedStrains[index]) {
                    selectedStrains[index] = strainName;
                }
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

// symptom selection
function toggleSymptom(symptom, button) {
    const index = selectedSymptoms.indexOf(symptom);
    if (index > -1) {
        selectedSymptoms.splice(index, 1);
        button.classList.remove('selected');
    } else {
        selectedSymptoms.push(symptom);
        button.classList.add('selected');
    }
}

// opt 1: search by strains
function searchByStrains() {
    const mainInput = document.getElementById('strain-input');
    const mainStrain = mainInput.value.trim();
    
    const strains = [mainStrain, ...selectedStrains.slice(1)].filter(s => s.trim() !== '');
    
    if (strains.length === 0) {
        alert('Please enter at least one probiotic strain.');
        return;
    }
    
   // first stain drives the initial search
    const searchQuery = strains[0];
    fetch(`/api/search/strain?q=${encodeURIComponent(searchQuery)}`)
        .then(response => response.json())
        .then(results => {
            if (results.length === 0) {
                alert('No probiotics found matching your search.');
                return;
            }
            
            if (strains.length > 1) {
                Promise.all(strains.slice(1).map(strain => 
                    fetch(`/api/search/strain?q=${encodeURIComponent(strain)}`)
                        .then(r => {
                            if (!r.ok) throw new Error('Network response was not ok');
                            return r.json();
                        })
                        .catch(error => {
                            console.error('Error searching for strain:', strain, error);
                            return []; // Return empty array on error
                        })
                )).then(moreResults => {
                    const allResults = [...results];
                    moreResults.forEach(resultSet => {
                        if (Array.isArray(resultSet)) {
                            resultSet.forEach(r => {
                                if (!allResults.find(existing => existing.id === r.id)) {
                                    allResults.push(r);
                                }
                            });
                        }
                    });
                    navigateToResults(allResults);
                }).catch(error => {
                    console.error('Error processing multiple strains:', error);
                    navigateToResults(results);
                });
            } else {
                navigateToResults(results);
            }
        })
        .catch(error => {
            console.error('Error searching:', error);
            alert('An error occurred while searching. Please try again.');
        });
}

function navigateToResults(results) {
    const queryString = results.map(r => r.id).join(',');
    window.location.href = `/results?strains=${encodeURIComponent(queryString)}`;
}

// opt 2: search by symptoms
function searchBySymptoms() {
    if (selectedSymptoms.length === 0) {
        alert('Please select at least one symptom.');
        return;
    }
    
    // build query string with multiple symptoms parameters
    const symptomsQuery = selectedSymptoms.map(s => `symptoms=${encodeURIComponent(s)}`).join('&');
    window.location.href = `/results?${symptomsQuery}`;
}

// results page
function loadResults() {
    const urlParams = new URLSearchParams(window.location.search);
    const resultsContainer = document.getElementById('results-container');
    
    if (!resultsContainer) return;
    
    // get strains from url
    const strainsParam = urlParams.get('strains');
    const symptomsParam = urlParams.getAll('symptoms');
    
    if (strainsParam) {
        // search by strain ID
        const strainIds = strainsParam.split(',');
        fetch('/api/probiotics')
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                const results = data.filter(p => strainIds.includes(p.id));
                displayResults(results);
            })
            .catch(error => {
                console.error('Error loading results:', error);
                resultsContainer.innerHTML = '<p>Error loading results. Please try again.</p>';
            });
    } else if (symptomsParam.length > 0) {
        // search by symptoms
        const symptomsQuery = symptomsParam.map(s => `symptoms=${encodeURIComponent(s)}`).join('&');
        fetch(`/api/search/symptom?${symptomsQuery}`)
            .then(response => {
                if (!response.ok) throw new Error('Network response was not ok');
                return response.json();
            })
            .then(data => {
                displayResults(data);
            })
            .catch(error => {
                console.error('Error loading results:', error);
                resultsContainer.innerHTML = '<p>Error loading results. Please try again.</p>';
            });
    } else {
        resultsContainer.innerHTML = '<p>No search parameters found.</p>';
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('results-container');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    resultsContainer.innerHTML = '';
    
    results.forEach(probiotic => {
        const card = document.createElement('div');
        card.className = 'result-card';
        
        const title = document.createElement('h2');
        title.className = 'result-title';
        title.textContent = probiotic.full_name || probiotic.name;
        
        const genusTag = document.createElement('span');
        genusTag.className = 'genus-tag';
        genusTag.textContent = probiotic.genus || '';
        
        // helps With section
        const helpsLabel = document.createElement('div');
        helpsLabel.className = 'section-label';
        helpsLabel.textContent = 'Helps With:';
        
        const helpsWith = document.createElement('div');
        helpsWith.className = 'helps-with';
        
        if (probiotic.helps_with && probiotic.helps_with.length > 0) {
            probiotic.helps_with.forEach(help => {
                const tag = document.createElement('span');
                tag.className = 'help-tag';
                tag.textContent = help;
                helpsWith.appendChild(tag);
            });
        }
        
        // benefits section
        const benefitsLabel = document.createElement('div');
        benefitsLabel.className = 'section-label';
        benefitsLabel.textContent = 'Benefits:';
        
        const benefitsList = document.createElement('ul');
        benefitsList.className = 'benefits-list';
        
        if (probiotic.benefits && probiotic.benefits.length > 0) {
            probiotic.benefits.forEach(benefit => {
                const item = document.createElement('li');
                item.className = 'benefit-item';
                
                const checkmark = document.createElement('span');
                checkmark.className = 'checkmark';
                checkmark.textContent = '✓';
                
                const text = document.createElement('span');
                text.textContent = benefit;
                
                item.appendChild(checkmark);
                item.appendChild(text);
                benefitsList.appendChild(item);
            });
        }
        
        card.appendChild(title);
        card.appendChild(genusTag);
        card.appendChild(helpsLabel);
        card.appendChild(helpsWith);
        card.appendChild(benefitsLabel);
        card.appendChild(benefitsList);
        
        resultsContainer.appendChild(card);
    });
}

