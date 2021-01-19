/************************************************************
 *
 * Cette visualisation a été réalisée par Guillaume ortega
 *
 */

var loading_modal = document.getElementById("loading_modal");

function showModal() {
    loading_modal.style.display = "block";
}

function hideModal() {
    loading_modal.style.display = "none";
}

// Défini les dimensions du SVD
var margin = {top: 10, right: 20, bottom: 30, left: 50},
    width = 750 - margin.left - margin.right,
    height = 420 - margin.top - margin.bottom;

// Création du SVG
var svg = d3
    .select("#bubble")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var x_axis = svg.append("g")
    .attr("transform", "translate(0," + height + ")");
var y_axis = svg.append("g");
var color = d3.scaleOrdinal()
var graph = svg.append('g');

/**Création de la date */
var bubblesStartDate = new Date("2/15/2020");
var bubblesDataVisualizationDate = bubblesStartDate;
/** On ajoute un event listener sur le slider de changement de date */
d3.select("#bubble_chart_slider").on("input", function () {
    console.log("incrementing date after selected value: " + this.value);
    bubblesDataVisualizationDate = incrementDate(bubblesStartDate, this.value);
    drawVizu();
});

//Préparation du container pour les données
var mobility_data = {}
let minMob = 0
let maxMob = 0
let minCO2 = 0
let maxCO2 = 0
let minCovid = 0
let maxCovid = 0

//Lis les données
showModal();
d3.csv("assets/Data/MobilityData/truncated_global_mobility_report.csv").then(function (data) {
    for (let i = 0; i < data.length; i++) {
        let information = data[i];
        let name = information.country_region;
        let date = information.date;
        date = new Date(date)
        date.setHours(0)

        //On veut les données du Pays entier et pas d'une région
        if (information["sub_region_1"] !== "") {
            continue;
        }
        let mobility_info_residential = 0;
        if (information["residential_percent_change_from_baseline"] !== "") {
            mobility_info_residential = parseInt(information["residential_percent_change_from_baseline"]);
        }

        let mobility_info_workplaces = 0;
        if (information["workplaces_percent_change_from_baseline"] !== "") {
            mobility_info_workplaces = parseInt(information["workplaces_percent_change_from_baseline"]);
        }

        let mobility_info_transit_stations = 0;
        if (information["transit_stations_percent_change_from_baseline"] !== "") {
            mobility_info_transit_stations = parseInt(information["transit_stations_percent_change_from_baseline"]);
        }

        let mobility_info_parks = 0;
        if (information["parks_percent_change_from_baseline"] !== "") {
            mobility_info_parks = parseInt(information["parks_percent_change_from_baseline"]);
        }

        let mobility_info_grocery_pharmacy = 0;
        if (information["grocery_and_pharmacy_percent_change_from_baseline"] !== "") {
            mobility_info_grocery_pharmacy = parseInt(information["grocery_and_pharmacy_percent_change_from_baseline"]);
        }

        let mobility_info_retail_and_recreation = 0;
        if (information["retail_and_recreation_percent_change_from_baseline"] !== "") {
            mobility_info_retail_and_recreation = parseInt(information["retail_and_recreation_percent_change_from_baseline"]);
        }

        let mobility_info_total = mobility_info_grocery_pharmacy + mobility_info_parks + mobility_info_residential + mobility_info_retail_and_recreation + mobility_info_transit_stations + mobility_info_workplaces
        if (mobility_data[name] == null) {
            mobility_data[name] = {};
        }
        if (mobility_data[name][date] == null) {
            mobility_data[name][date] = {};
        }
        if (mobility_data[name][date].mobility_level == null) {
            mobility_data[name][date].mobility_level = 0;
        }
        if (mobility_info_total < minMob) {
            minMob = mobility_info_total
        } else if (mobility_info_total > maxMob) {
            maxMob = mobility_info_total
        }
        mobility_data[name][date].mobility_level = mobility_info_total;
    }

    d3.csv("assets/Data/CovidData/truncated_owid-covid-data.csv").then(function (data) {
        for (let i = 0; i < data.length; i++) {
            let information = data[i];
            let name = information.location;
            let date_parts = information.date.split("-");
            let date = new Date(date_parts[1] + "/" + date_parts[2] + "/" + date_parts[0]);
            let covid_info = parseInt(information.total_cases);
            if (mobility_data[name] === undefined) {
                console.log("Mobility data not found for country " + name);
                continue;
            }
            let res1 = mobility_data[name];
            let res2 = mobility_data[name][date];
            if (mobility_data[name][date] === undefined) {
                console.log("Mobility data not found for date " + date);
                continue;
            }
            if (mobility_data[name][date].covid_level === undefined) {
                mobility_data[name][date].covid_level = 0;
            }
            mobility_data[name][date].covid_level += covid_info;
            if (mobility_data[name][date].covid_level < minCovid) {
                minCovid = mobility_data[name][date].covid_level
            } else if (mobility_data[name][date].covid_level > maxCovid) {
                maxCovid = mobility_data[name][date].covid_level
            }
        }
        d3.csv("assets/Data/CO2Data/carbon-monitor-maingraphdatas.csv").then(function (co2Data) {
            for (let l = 0; l < co2Data.length; l++) {
                let name = co2Data[l].country;
                let date = co2Data[l].date;
                if (date !== "") {
                    date = DMYtoMDY(date);
                    date = new Date(date)
                    let co2_value = parseFloat(co2Data[l].MtCO2);
                    if (mobility_data[name] == null) {
                        //console.log("Mobility data not found for country " + name);
                        continue;
                    } else if (mobility_data[name][date] == null) {
                        //console.log("Mobility data not found for date " + date);
                        continue;
                    } else {
                        if (mobility_data[name][date].co2_level == null) {
                            mobility_data[name][date].co2_level = 0;
                        }
                        mobility_data[name][date].co2_level += parseFloat(co2_value);
                        if (mobility_data[name][date].co2_level < minCO2) {
                            minCO2 = mobility_data[name][date].co2_level
                        } else if (mobility_data[name][date].co2_level > maxCO2) {
                            maxCO2 = mobility_data[name][date].co2_level
                        }
                    }
                }
            }

            // On nettoie les données pour supprimer toutes les données qui ne contiennenet pas suffisement d'informations
            // Pour pouvoir apparaître dans notre visualisation.
            for (let i = 0; i < Object.keys(mobility_data).length; ++i) {
                let country_name = Object.keys(mobility_data)[i];
                for (let j = 0; j < Object.keys(mobility_data[country_name]).length; ++j) {
                    let date = Object.keys(mobility_data[country_name])[j];

                    if (mobility_data[country_name][date] === undefined
                        || mobility_data[country_name][date].covid_level === undefined
                        || mobility_data[country_name][date].co2_level === undefined
                        || mobility_data[country_name][date].mobility_level === undefined) {
                        delete mobility_data[country_name][date];
                        --j;
                    }
                    if(Object.keys(mobility_data[country_name]).length === 0) {
                        delete mobility_data[country_name];
                        --i;
                        break;
                    }
                }
            }
            // Mise à jour de la légende à partir de nos nouvelles données

            color.domain(Object.keys(mobility_data)).range(d3.schemeSet3);

            for(let country_name in mobility_data) {
                let li = d3.select("#bubble_legend_content").append("li");
                li.append("span").attr("style", "background: " + color(country_name) + ";");
                li.append("p").text(country_name);
            }
            hideModal();
            drawVizu();
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
    let result = new Date(date.getTime() + day * days);
    result.setHours(0);
    return result;
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

function drawVizu() {

    //Affiche Date
    console.log("Drawing dataviz for date " + dateToString(bubblesDataVisualizationDate));
    document.getElementById("date").innerHTML = dateToString(bubblesDataVisualizationDate);

    let current_max_covid = 0
    for (var name in mobility_data) {
        if (mobility_data[name][bubblesDataVisualizationDate] !== undefined) {
            if (mobility_data[name][bubblesDataVisualizationDate].covid_level > current_max_covid) {
                current_max_covid = mobility_data[name][bubblesDataVisualizationDate].covid_level
            }
        }
    }

    //Création du SVG
    // Axis
    var x = d3.scaleLinear().domain([minCovid, current_max_covid]).range([0, width]); // Axe X
    var y = d3.scaleLinear().domain([minCO2, maxCO2]).range([height, 0]); // Axe Y
    var z = d3.scaleLinear().domain([minMob, maxMob]).range([1, 100]); // Taille des bulles

    // Update axis
    x_axis.call(d3.axisBottom(x));
    y_axis.call(d3.axisLeft(y));

    // Add dots

    // d3.select("svg").remove()
    graph
        .html("")
        .selectAll("dot")
        .data(Object.keys(mobility_data))
        .enter()
        .append("circle")
        .attr("cx", function(d) {
            if (mobility_data[d][bubblesDataVisualizationDate] === undefined) {
                return 0;
            }
            let info = mobility_data[d][bubblesDataVisualizationDate];
            let cov_lev = mobility_data[d][bubblesDataVisualizationDate].covid_level;
            let x_val = x(mobility_data[d][bubblesDataVisualizationDate].covid_level);
            return x(mobility_data[d][bubblesDataVisualizationDate].covid_level);
        })
        .attr("cy", function(d) {
            if (mobility_data[d][bubblesDataVisualizationDate] === undefined) { return 0; }
            return y(mobility_data[d][bubblesDataVisualizationDate].co2_level);
        })
        .attr("r", function(d) {
            if (mobility_data[d][bubblesDataVisualizationDate] === undefined) { return 0; }
            let mob = z(mobility_data[d][bubblesDataVisualizationDate].mobility_level);
            return mob;
        })
        .style("fill", function (d) {
            if (mobility_data[d][bubblesDataVisualizationDate] === undefined) { return 0; }
            return color(d);
        })
        .style("opacity", "0.8")
        .attr("stroke", "white")
        .style("stroke-width", "2px")
}