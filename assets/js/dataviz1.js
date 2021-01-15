
DEFAULT_COUNTRY_COLOR = "#DDD"

/** Initialisation du SVG */
var width = "100%",
    height = 700;

var svg = d3
    .select("#map_container")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// On rajoute un groupe englobant toute la visualisation pour plus tard
svg.append("g");

/** Chargement de la carte de la France */
var startDate = new Date("1/22/2020");
var dataVisualizationDate = new Date("1/22/2020");
var projection = d3
    .geoConicConformal()
    .center([0.454071, 57.279229])
    .scale(200);

/** On ajoute un event listener sur le slider de changement de date */
d3.select("#slider").on("input", function () {
    dataVisualizationDate = incrementDate(startDate, this.value);
    updateViz();
});

var path = d3.geoPath().projection(projection);

/** Fusion des données COVID, d'émissions de CO2, et des données géojson */
var final_data = null;
var map_color_information = {}
d3.csv("assets/Data/CovidData/2019_nCoV_data.csv").then(function (data) {
    console.log(data);
    for (let i = 0; i < data.length; i++) {
        let information = data[i];
        let name = information.Country;
        let date = information.Date;
        date = date.split(" ")[0];
        date = new Date(date)
        let covid_info = parseInt(information["Confirmed"]);
        if (map_color_information[name] == null) {
            map_color_information[name] = {};
        }
        if (map_color_information[name][date] == null) {
            map_color_information[name][date] = {};
        }
        if (map_color_information[name][date].covid_level == null) {
            map_color_information[name][date].covid_level = 0;
        }
        map_color_information[name][date].covid_level += parseInt(covid_info);
    }

    d3.csv("assets/Data/CO2Data/carbon-monitor-maingraphdatas.csv").then(function (co2Data) {
        for (let l = 0; l < co2Data.length; l++) {
            let name = co2Data[l].country;
            let date = co2Data[l].date;
            if (date !== "") {
                date = DMYtoMDY(date);
                date = new Date(date)
                let co2_value = parseFloat(co2Data[l].MtCO2);
                if (map_color_information[name] == null) {
                    console.log("Covid data not found for country " + name);
                }
                else if (map_color_information[name][date] == null) {
                    map_color_information[name][date] = {};
                } else {
                    if (map_color_information[name][date].co2_level == null) {
                        map_color_information[name][date].co2_level = 0;
                    }
                    map_color_information[name][date].co2_level += parseFloat(co2_value);
                }
            }
        }

        // Clean map_color_informations
        let cleaned_map_color_information = {};
        Object.keys(map_color_information).forEach(country => {
            let cleaned_country_information = {}
            Object.keys(map_color_information[country]).forEach(date => {
                let info = map_color_information[country][date];
                if (info.covid_level != null && info.co2_level != null) {
                    if (cleaned_country_information.dates == null) {
                        cleaned_country_information.dates = []
                    }
                    cleaned_country_information.dates[date] = info;
                    if (cleaned_country_information.min_covid == null
                            || cleaned_country_information.min_covid > info.covid_level) {
                        cleaned_country_information.min_covid = info.covid_level;
                    }
                    if (cleaned_country_information.max_covid == null
                            || cleaned_country_information.max_covid < info.covid_level) {
                        cleaned_country_information.max_covid = info.covid_level;
                    }
                    if (cleaned_country_information.min_co2 == null
                            || cleaned_country_information.min_co2 > info.co2_level) {
                        cleaned_country_information.min_co2 = info.co2_level;
                    }
                    if (cleaned_country_information.max_co2 == null
                            || cleaned_country_information.max_co2 < info.co2_level) {
                        cleaned_country_information.max_co2 = info.co2_level;
                    }
                }
            });
            if (cleaned_country_information.dates != null) {
                cleaned_map_color_information[country] = cleaned_country_information
            }
        });
        map_color_information = cleaned_map_color_information;
        console.log("final covid / co2 data = " + cleaned_map_color_information);
        console.log(cleaned_map_color_information);

        d3.json("assets/Data/WorldMapData/worldmap.geo.json").then(function (jsondata) {
            final_data = jsondata;
            for (let j = 0; j < final_data.features.length; j++) {
                let feature = final_data.features[j];
                let name = feature.properties.name;
                if(map_color_information[name] != null) {
                    feature.properties.map_color_information = map_color_information[name]
                }
            }
            updateViz();
        });
    });
});

/* DATE PREPROCESSING FUNCTIONS */
function DMYtoMDY(date) {
    /** Prend une date au format D/M/Y et renvois une date au format M/D/Y */
    let day = date.split("/")[0]
    let month = date.split("/")[1]
    let year = date.split("/")[2]
    return month + "/" + day + "/" + year;
}

function incrementDate(date, days) {
    let day = 24 * 60 * 60 * 1000;
    return new Date(date.getTime() + day * days);
}

function drawMap() {

    final_data.features.sort((elt1, elt2) => {
        if (elt1.properties.map_color_information == undefined) {
            return -1;
        } else if (elt2.properties.map_color_information == undefined) {
            return 1;
        } else {
            return 0;
        }
    });

    let carte = svg.selectAll("path").data(final_data.features);

    // code en cas de mise a jour de la carte / de changement de semaine
    carte
        .attr("fill", function (d) {
            return getFillColorFor(d, dataVisualizationDate);
        })
        .attr("style", function (d) {
            return "stroke:" + getStrokeColorFor(d, dataVisualizationDate);
        });


    // code pour la creation de la carte quand les donnees sont chargees la 1e fois.
    carte
        .enter()
        .append("path")
        .attr("fill", function (d) {
            return getFillColorFor(d, dataVisualizationDate);
        })
        .attr("style", function (d) {
            return "stroke:" + getStrokeColorFor(d, dataVisualizationDate);
        })
        .attr("stroke-width", "2px")
        .on("mousemove", (event, d) => {
            showTooltip(d, event);
        })
        .on("mouseout", function() {hideTooltip();})
        .attr("d", path); // on cree la forme du département
}

/** Affichage de la carte à la date en paramètre, la date doit être au format "JJ/MM/AAA" */
function updateViz() {
    // Update date
    document.getElementById("date").innerHTML = dateToString(dataVisualizationDate);
    drawMap();
}

function componentToHex(c) {
    var hex = parseInt(c).toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function getFillColorFor(d, date) {
    /** Renvois la couleur du pays appelé *country_name* à la date indiquée */
    let data = d.properties.map_color_information;
    if (data == null) {
        return DEFAULT_COUNTRY_COLOR;  // get default color
    }
    let best_date_information = getDateInformation(data, date);

    if (best_date_information == null) {
        return DEFAULT_COUNTRY_COLOR;  // get default color
    }
    let co2_rate = (best_date_information.co2_level - data.min_co2) / (data.max_co2 - data.min_co2)
    let color = getColorGradient(co2_rate, [200, 200, 200], [100, 100, 100]);

    return rgbToHex(color[0], color[1], color[2]);
}


function getStrokeColorFor(d, date) {
    /** Renvois la couleur du pays appelé *country_name* à la date indiquée */
    let data = d.properties.map_color_information;
    if (data == null) {
        return "";  // get default color
    }
    let best_date_information = getDateInformation(data, date);

    if (best_date_information == null) {
        return "";  // get default color
    }
    let covid_rate = (best_date_information.covid_level - data.min_covid) / (data.max_covid - data.min_covid)
    let color = getColorGradient(covid_rate, [255, 255, 255], [255, 0, 0]);
    return "rgba(" + color[0] + ", " + color[1] + ", " + color[2] + ", " + covid_rate + ")";
}

function getColorGradient(value, min_color, max_color) {
    /**
     * Retourne une couleur selon un gradient, paramètres :
     *  - value : une valeur entre 0 et 1 sur le gradient entre les deux couleurs données
     *  - min_color : La couleur minimal (correspondant à value=0)
     *  - max_color : La couleur maximale (correspondant à value=1)
     *  Les couleurs doivent-être au format [Red, Green, Blue]
     */

    if (value == null) {
        return undefined;
    }
    let result = [];
    // On cherche la valeur correspondante pour chacune des trois couleurs R, G, B
    for (let i = 0; i < min_color.length; i++) {
        let temp_value = value;
        if (min_color[i] > max_color[i]) {
            temp_value = 1 - value
        }
        let lower = Math.min(min_color[i], max_color[i])  // Plus faible valeur pour la couleur courante
        let higher = Math.max(min_color[i], max_color[i])  // Plus forte valeur pour la couleur courante
        result.push((higher - lower) * temp_value + lower)
    }
    return result
}

function getDateInformation(information, date, debug=false) {
    /**
     * OBSOLETE, UTILISE LORS DE LA COLORATION INITIALE -> Couleur selon le niveau de co2 et gradient selon le niveau de covid
     *
     * Retourne les informations relatives à une date donnée à partir d'un dictionnaire de type {date: information; ...}
     * On souhaite les informations correspondant à la plus vielle date parmis celles inférieures (ou =) à la date demandée
     * Il faut égallement que les informations associées à cette date soit connues.
     */
    if (debug) {
        console.log("test");
    }
    let best_date = null;
    let best_info = null;
    Object.keys(information.dates).forEach(current_date => {
        if (debug) {
            console.log("test");
        }
        if (current_date == date) {
            // Si la date est exactement la date demandée, on la garde.
            best_date = current_date;
            best_info = information.dates[current_date];
        }
        if ((best_date == null || (new Date(best_date) < new Date(current_date) && new Date(current_date) < date))) {
            best_date = current_date;
            best_info = information.dates[current_date];
        }
    });
    if (debug) {
        console.log("best date found = " + best_date + " for informations = ");
        console.log(information);
    }
    return best_info;
}


function getFillColor(co2_rate, covid_rate) {
    let R, G, B;  // to 100
    let clair;  // to 255
    clair = co2_rate * 255 / 100;
    if (covid_rate == null || co2_rate === null){
        return DEFAULT_COUNTRY_COLOR;
    }
    if (covid_rate < 0.5) { // blue to yellow
        R = covid_rate / 0.5 * 100;
        G = 100;
        B = ((0.5 - covid_rate) / 0.5) * 100;
    } else if (covid_rate > 0.5) { // yellow to red
        R = 100;
        G = ((1 - covid_rate) / 0.5) * 100;
        B = 0;
    } else {
        R = G = 100;
        B = 0;
    }
    R = parseInt(R * clair);
    G = parseInt(G * clair);
    B = parseInt(B * clair);
    return rgbToHex(R,G,B);
}


function getCountryColor(co2_rate, covid_rate) {
    let R, G, B; // to 100
    let clair; // to 255
    clair = co2_rate * 255 / 100;
    if (covid_rate == null || co2_rate === null){
        return DEFAULT_COUNTRY_COLOR;
    }
    if (covid_rate < 0.5) { // blue to yellow
        R = covid_rate / 0.5 * 100;
        G = 100;
        B = ((0.5 - covid_rate) / 0.5) * 100;
    } else if (covid_rate > 0.5) { // yellow to red
        R = 100;
        G = ((1 - covid_rate) / 0.5) * 100;
        B = 0;
    } else {
        R = G = 100;
        B = 0;
    }
    R = parseInt(R * clair);
    G = parseInt(G * clair);
    B = parseInt(B * clair);
    return rgbToHex(R,G,B);
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

// Tooltip functions

var tooltip = d3.select(".mytooltip")

function showTooltip(d, event) {

    // On remplit les informations contenues dans le tooltip
    /*
        <div class="hidden mytooltip">
            <div class="mx-2 mt-2" id="tooltip-country-name"></div>
            <div class="d-flex justify-content-around">
                <div class="m-2" id="tooltip-country-covid">Covid :</div>
                <div class="m-2" id="tooltip-country-co2">CO2 : </div>
            </div>
            <div id="tooltip-graph">

            </div>
        </div>
     */
    let country_info = d.properties.map_color_information
    if (country_info == undefined) {
        return;
    }
    let best_date_information = getDateInformation(country_info, dataVisualizationDate);
    d3.select("#tooltip-country-name").text(d.properties.name);
    let covid_container = d3.select("#tooltip-country-covid");
    covid_container.text("Covid : " + best_date_information.covid_level);
    let co2_container = d3.select("#tooltip-country-co2");
    co2_container.text("CO2 : " + best_date_information.co2_level);

    tooltip.classed("hidden", false);
    // On calcule la position du tooltip en fonction de la position de la sourie
    var mousePosition = d3.pointer(event);
    let left = 0;
    if (mousePosition[0] < d3.select("#map_container").node().getBoundingClientRect().width / 2) {
        left = mousePosition[0] + 40; // Affichage du tooltip à droite de la souris
    } else {
        left = mousePosition[0] - 10 - tooltip.node().getBoundingClientRect().width; // Affichage du tooltip à gauche de la souris
    }
    let top = mousePosition[1] - tooltip.node().getBoundingClientRect().height / 2;

    // on affiche le toolip
    tooltip
        .classed("hidden", false)
        // on positionne le tooltip en fonction
        // de la position de la souris
        .attr( "style", "left:" + left + "px; top:" + top + "px");

    drawTooltipGraph(d.properties.map_color_information);

}

function drawTooltipGraph(country_informations) {
    // Empty graph
    d3.select("#tooltip-graph").html("")
    let dates = Object.keys(country_informations.dates)
    // set the dimensions and margins of the graph
    var margin = {top: 10, right: 10, bottom: 60, left: 40},
        width_between_two_dates = 12,
        width = width_between_two_dates * (dates.length + 1),
        height = 500 - margin.top - margin.bottom; // on axis x

    // append the svg object to the body of the page
    var svg = d3.select("#tooltip-graph")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // X axis
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(dates.map(function(d) {
            return dateToString(new Date(d));
        }))
        .padding(1);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Add Y axis
    var y = d3.scaleLinear()
        .domain([country_informations.min_covid, country_informations.max_covid])
        .range([ height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    // Lines
    svg.selectAll("myline")
        .data(dates)
        .enter()
        .append("line")
        .attr("x1", function(d) {
            let val = x(dateToString(new Date(d)));
            return val;
        })
        .attr("x2", function(d) {
            let val = x(dateToString(new Date(d)));
            return val;
        })
        .attr("y1", function(d) {
            let val = y(country_informations[d].covid_level);
            return val;
        })
        .attr("y2", y(0))
        .attr("stroke", "grey");

    // Circles
    svg.selectAll("mycircle")
        .data(dates)
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            let val = x(dateToString(new Date(d)))
            return val;
        })
        .attr("cy", function(d) {
            let val = y(country_informations[d].covid_level);
            return val;
        })
        .attr("r", function(d) {
            let truncated_co2_value = (country_informations[d].co2_level - country_informations.min_co2)
            let truncated_co2_max = (country_informations.max_co2 - country_informations.min_co2)
            let co2_degree = truncated_co2_value / truncated_co2_max
            return co2_degree * 10;
        })
        .style("fill", "#69b3a2")
        .attr("stroke", "black");
}

function hideTooltip() {
    tooltip.classed("hidden", true);
}