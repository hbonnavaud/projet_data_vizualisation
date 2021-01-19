/************************************************************
 *
 * Cette visualisation a été réalisée par Guillaume ortega
 *
 */








// Défini les dimensions du SVD
var margin = {top: 10, right: 20, bottom: 30, left: 50},
    width = 750 - margin.left - margin.right,
    height = 420 - margin.top - margin.bottom;

//Création du SVG
let svg = d3
    .select("#bubble")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

/**Création de la date */
var startDate = new Date("2/15/2020");
var dataVisualizationDate = new Date("3/6/2020");
/** On ajoute un event listener sur le slider de changement de date */
d3.select("#slider").on("input", function () {
    dataVisualizationDate = incrementDate(startDate, this.value);
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
d3.csv("assets/Data/MobilityData/Global_Mobility_Report.csv").then(function (data) {
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

    d3.csv("assets/Data/CovidData/2019_nCoV_data.csv").then(function (data) {
        for (let i = 0; i < data.length; i++) {
            let information = data[i];
            let name = information.Country;
            let date = information.Date;
            date = date.split(" ")[0];
            date = new Date(date)
            let covid_info = parseInt(information["Confirmed"]);
            if (mobility_data[name] == null) {
                //console.log("Mobility data not found for country " + name);
                continue;
            }
            if (mobility_data[name][date] == null) {
                //console.log("Mobility data not found for date " + date);
                continue;
            }
            if (mobility_data[name][date].covid_level == null) {
                mobility_data[name][date].covid_level = 0;
            }
            mobility_data[name][date].covid_level += parseInt(covid_info);
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

'#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6)

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

function drawVizu() {
    d3.select("svg").remove()

    //Affiche Date
    document.getElementById("date").innerHTML = dateToString(dataVisualizationDate);

    let current_max_covid = 0
    for (var name in mobility_data) {
        if (mobility_data[name][dataVisualizationDate] === undefined
            || mobility_data[name][dataVisualizationDate].covid_level === undefined
            || mobility_data[name][dataVisualizationDate].co2_level === undefined
            || mobility_data[name][dataVisualizationDate].mobility_level === undefined) {
            continue;
        }
        if (mobility_data[name][dataVisualizationDate].covid_level > current_max_covid) {
            current_max_covid = mobility_data[name][dataVisualizationDate].covid_level
        }
    }
    //Création du SVG
    let svg = d3
        .select("#bubble")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


    // Add X axis
    var x = d3.scaleLinear().domain([minCovid, current_max_covid]).range([0, width]); // Axe X

    svg
        .append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    // Add Y axis
    var y = d3.scaleLinear().domain([minCO2, maxCO2]).range([height, 0]); // Axe Y
    svg.append("g").call(d3.axisLeft(y));

    // Add a scale for bubble size
    var z = d3.scaleLinear().domain([minCovid, maxMob]).range([1, 300]); // Taille des bulles

    for (var name in mobility_data) {
        if (mobility_data[name][dataVisualizationDate] === undefined
            || mobility_data[name][dataVisualizationDate].mobility_level === undefined
            || mobility_data[name][dataVisualizationDate].covid_level === undefined
            || mobility_data[name][dataVisualizationDate].co2_level === undefined
        ) {
            console.log("Pas de data pour " + name + " le " + dataVisualizationDate)
            continue;
        }
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        }
        svg
            .append("g")
            .selectAll("dot")
            .data(Object.entries(mobility_data))
            .enter()
            .append("circle")
            .attr("cx", x(mobility_data[name][dataVisualizationDate].covid_level))
            .attr("cy", y(mobility_data[name][dataVisualizationDate].co2_level))
            .attr("r", z(mobility_data[name][dataVisualizationDate].mobility_level))
            .style("fill", '#' + (0x1000000 + (Math.random()) * 0xffffff).toString(16).substr(1, 6))
            .style("opacity", "0.7")
            .attr("stroke", "black")
    }
}