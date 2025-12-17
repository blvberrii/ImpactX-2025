# FloraFinder

When searching for the right probiotic supplement, it can be quite confusing to look at the many different supplements with different strains. With FloraFinder, you can narrow down which strains to look for, or you can find out what specific strains can do!

## Features

- **Search by Strain Name**: Find out benefits of the strains
- **Search by Symptoms**: Select symptoms to find strains that can heelp
- **Detailed Results**: View comprehensive information about each probiotic including benefits and what conditions they help with


### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Installation

1. **Clone or download this repository**

2. **Create a virtual environment (recommended)**
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On Mac/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

5. **Run the application**
   ```bash
   python app.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:5000` to view the application


## Usage

1. **Homepage**: Click "Start Your Search" or click the "Search" button on the top right
2. **Search by Strain**: Type probiotic strain names. Autocomplete suggestions are also given.
3. **Search by Symptoms**: Click "By Symptom" mode and select symptoms you want to address
4. **View Results**: See detailed information about matching probiotics
5. **Learn More**: Visit the About page to understand more about probiotics

## Technologies Used

- **Backend**: Python Flask
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Data**: JSON file for probiotic information

## Notes

- This application is for educational purposes only
- Please consult with a healthcare provider before starting any probiotic supplement
- The probiotic database includes scientifically-studied strains with documented benefits

## License

This project is submitted for ImpactX 2025 hackathon.
