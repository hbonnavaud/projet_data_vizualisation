/** Initialisation du Tooltip */
var tooltip = d3
    .select("#map_container")
    .append("div")
    .attr("class", "hidden mytooltip");

/** Initialisation du SVG */
var width = 700,
    height = 580;

var svg = d3
    .select("#map_container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// On rajoute un groupe englobant toute la visualisation pour plus tard
svg.append("g");

/** Chargement de la carte de la France */
var projection = d3
    .geoConicConformal()
    .center([2.454071, 46.279229])
    .scale(2800);

var path = d3.geoPath().projection(projection);
var HIGHER_COVID_VALUE = 0;

/** Initialisation de la dates initiale du sélecteur */
var start_date = new Date(2020, 2, 18);

/** Fusion des données COVID et des données géojson */
var final_data = null;

d3.csv("DATA/covid-france-mars-avril.csv").then(function (data) {
    d3.json("DATA/departements_francais.geojson").then(function (jsondata) {
        final_data = jsondata;
        // On parcours les départements
        for (var i = 0; i < final_data.features.length; i++) {

            // On récupère les informations de ce département
            let properties = final_data.features[i].properties;
            let dep_name = properties.nom;

            // On récupère les informations covid pour ce département
            let covid_data = [];
            for (var j = 0; j < data.length; j++) {
                if (data[j].Département === dep_name) {
                    if (data[j].hosp > HIGHER_COVID_VALUE) {
                        HIGHER_COVID_VALUE = data[j].hosp;
                    }
                    covid_data.push({
                        date: data[j].jour,
                        hosp: data[j].hosp
                    });
                }
            }

            // On met à jour les données finales que nous utiliserons pour la suite
            final_data.features[i].properties.covid_data = covid_data;
        }
        updateViz(dateToString(start_date));
    });
});

function drawMap(date) {
    let carte = svg.selectAll("path").data(final_data.features);

    // code pour la creation de la carte quand les donnees sont chargees la 1e fois.
    carte
        .enter()
        .append("path")
        .attr("fill", function (d) {
            return getColor(getCovidValue(d, date));
        })
        .attr("d", path)
        .attr("class", function (d) {
            // chaque forme representant un département aura
            // deux classes province et un identifiant venant du json
            return "province " + d.properties.cartodb_id;
        })
        .attr("d", path) // on cree la forme du département
        .on("mousemove", (event, d) => {
            // on recupere la position de la souris
            var mousePosition = d3.pointer(event);
            // on affiche le toolip
            tooltip
                .classed("hidden", false)
                // on positionne le tooltip en fonction
                // de la position de la souris
                .attr(
                    "style",
                    "left:" +
                    (mousePosition[0] + 15) +
                    "px; top:" +
                    (mousePosition[1] - 35) +
                    "px"
                )
                // on recupere le nom du département et son nombre de cas à cet instant
                .html(d.properties.nom + " : " + getCovidValue(d, date));
        })
        .on("mouseout", function () {
            // on cache le toolip
            tooltip.classed("hidden", true);
        });
}

/** Affichage de la carte à la date en paramètre, la date doit être au format "JJ/MM/AAA" */
function updateViz(date) {
    $("#day").text(date);
    drawMap(date);
}

function getColor(value) {
    if (value === null) {
        return "#ccc";
    } else {
        // Niveau de couleur = a - (255 - b) * (v / max_v) avec
        //    a = niveau de couleur pour la plus faible valeur
        //    b = niveau de couleur pour la plus forte valeur
        //    v = valeur (nombre de cas à convertir en couleur
        //    max_v = plus grande valeur rencontrée dans tout le jeu de données
        let red = 159 - (255 - 31) * (value / HIGHER_COVID_VALUE);
        let green = 229 - (255 - 112) * (value / HIGHER_COVID_VALUE);
        let blue = 189 - (255 - 66) * (value / HIGHER_COVID_VALUE);

        return "rgb(" + red + ", " + green + ", " + blue + ")";
    }
}

function getCovidValue(data, date) {
    let covid_data = data.properties.covid_data;
    let data_index = null;
    for (var i = 0; i < covid_data.length; i++) {
        if (covid_data[i].date === date) {
            data_index = i;
            break;
        }
    }

    if (data_index === null) {
        return null;
    } else {
        return covid_data[i].hosp;
    }
}

d3.select("#slider").on("input", function () {
    let newDate = incrementDate(start_date, this.value);
    let stringDate = dateToString(newDate);
    updateViz(stringDate);
});

function incrementDate(date, days) {
    let day = 24 * 60 * 60 * 1000;
    return new Date(date.getTime() + day * days);
}

function dateToString(date) {
    let day = date.getDate();
    if (date.getDate() < 10) {
        day = "0" + day;
    }
    let month = date.getMonth() + 1;
    if (month < 10) {
        month = "0" + month;
    }
    return day + "/" + month + "/" + date.getFullYear();
}
