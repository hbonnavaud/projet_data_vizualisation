/** Initialisation du Tooltip */
var tooltip = d3
    .select("#map_container")
    .append("div")
    .attr("class", "hidden mytooltip");

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
var projection = d3
    .geoConicConformal()
    .center([0.454071, 57.279229])
    .scale(200);

var path = d3.geoPath().projection(projection);

/** Fusion des données COVID et des données géojson */
var final_data = null;

d3.json("assets/Data/WorldMapData/worldmap.geo.json").then(function (jsondata) {
    final_data = jsondata;
    updateViz();
});

function drawMap() {
    let carte = svg.selectAll("path").data(final_data.features);

    // code pour la creation de la carte quand les donnees sont chargees la 1e fois.
    carte
        .enter()
        .append("path")
        .attr("fill", "#777777")
        .attr("d", path) // on cree la forme du département
        .on("mousemove", (event, d) => {
            // do nothing
        })
        .on("mouseout", function () {
            // do nothing
        });
}

/** Affichage de la carte à la date en paramètre, la date doit être au format "JJ/MM/AAA" */
function updateViz() {
    drawMap();
}
