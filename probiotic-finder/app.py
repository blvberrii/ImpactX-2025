from flask import Flask, render_template, request
import json
import os

app = Flask(__name__)

# load data
def load_probiotic_data():
    file_path = os.path.join("data", "probiotics.json")

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        return {
            "strains": [],
            "symptoms": []
        }

probiotic_database = load_probiotic_data()


@app.route("/")
def homepage():
    return render_template("index.html")


@app.route("/choose")
def choose_search_method():
    return render_template("choose.html")


@app.route("/by-symptom")
def search_by_symptom():
    symptoms = probiotic_database.get("symptoms", [])
    return render_template("by_symptom.html", symptoms=symptoms)


@app.route("/by-strain")
def search_by_strain():
    return render_template("by_strain.html")


@app.route("/results", methods=["POST"])
def show_results():
    # get data from the form
    selected_symptoms = request.form.getlist("symptom")
    strain_input = request.form.get("strain")

    all_strains = probiotic_database.get("strains", [])
    results = []

    # opt 1: user selects by symptom
    if selected_symptoms:
        for strain in all_strains:
            strain_symptoms = strain.get("symptoms", [])

            for user_symptom in selected_symptoms:
                # select case insensitively
                if user_symptom.lower() in [s.lower() for s in strain_symptoms]:
                    results.append(strain)
                    break  

    # opt 2: user selects by strain
    if strain_input:
        for strain in all_strains:
            if strain_input.lower() in strain["name"].lower():
                # avoid duplication
                if strain not in results:
                    results.append(strain)

    return render_template("results.html", results=results)


if __name__ == "__main__":
    app.run(debug=True)

