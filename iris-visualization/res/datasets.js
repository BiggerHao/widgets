import irisData from './iris.csv';
import wineData from './wine.csv';
import adultData from './adult.csv';
import heartData from './heart.csv';
import entities from './../src/entities';


export default {
    iris: {
        data: irisData,
        title: "Iris",
        fields: new entities.Field("petalWidth", "petalLength", "sepalLength", "sepalWidth", "variety"),
        labels: new entities.Label("Petal Width (cm)", "# of Iris", "Petal Length (cm)", "Sepal Length (cm)", "Sepal Width (cm)", "Variety"),
        size: 200
    },
    wine: {
        data: wineData,
        title: "Wine",
        fields: new entities.Field("fixedAcidity", "volatileAcidity", "freeSulfurDioxide", "totalSulfurDioxide", "type"),
        labels: new entities.Label("Fixed Acidity (g / dm^3)", "# of Wines", "Volatile Acidity (g / dm^3)", "Free Sulfur Dioxide (mg / dm^3)", "Total Sulfur Dioxide (mg / dm^3)", "Type of wine"),
        size: 5000
    },
    adult: {
        data: adultData,
        title: "Adult",
        fields: new entities.Field("age", "fnlwgt", "hours-per-week", "capital-gain", "race"),
        labels: new entities.Label("Age", "# of Adults", "Final Weight (Similarity)", "Hours Per Week", "Capital Gain ($)", "Race"),
        size: 5000
    },
    heart: {
        data: heartData,
        title: "Heart",
        fields: new entities.Field("age", "trestbps", "chol", "thalach", "sex"),
        labels: new entities.Label("Age", "# of patients", "resting blood pressure (in mm Hg on admission to the hospital) ", "serum cholestoral (mg/dl)", "Maximum Heart Rate (bpm)", "Sex"),
        size: 10000
    }
};