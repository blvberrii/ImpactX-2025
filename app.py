from flask import Flask, render_template, jsonify, request
import json
import os

app = Flask(__name__)

# load da data
def load_probiotic_data():
    try:
        with open('probiotics_data.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        return []
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/search')
def search():
    return render_template('search.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/results')
def results():
    return render_template('results.html')

@app.route('/api/probiotics')
def get_all_probiotics():
    data = load_probiotic_data()
    return jsonify(data)

@app.route('/api/search/strain', methods=['GET'])
def search_by_strain():
    query = request.args.get('q', '').strip().lower()
    data = load_probiotic_data()
    
    if not query:
        return jsonify([])
    
    results = []
    for probiotic in data:
        strain_name = probiotic.get('name', '').lower()
        genus = probiotic.get('genus', '').lower()
        
        # check if query matches strain name or genus
        if query in strain_name or query in genus:
            results.append(probiotic)
    
    return jsonify(results[:10])  # Limit to 10 results

# opt 1 search by symptom
@app.route('/api/search/symptom', methods=['GET'])
def search_by_symptom():
    symptoms = request.args.getlist('symptoms')
    
    if not symptoms:
        return jsonify([])
    
    data = load_probiotic_data()
    results = []
    
    for probiotic in data:
        helps_with = [item.lower() for item in probiotic.get('helps_with', [])]
        # check if any of the selected symptoms match
        for symptom in symptoms:
            symptom_lower = symptom.lower()
            if any(symptom_lower in item for item in helps_with):
                if probiotic not in results:
                    results.append(probiotic)
    
    return jsonify(results)

# opt 2 search by strain 
@app.route('/api/probiotic/<strain_id>')
def get_probiotic(strain_id):
    data = load_probiotic_data()
    for probiotic in data:
        if probiotic.get('id') == strain_id:
            return jsonify(probiotic)
    return jsonify({'error': 'Probiotic not found'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)


