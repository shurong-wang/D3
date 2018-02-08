// d3.js drop shadow example
// put together by http://charlbotha.com/

var items = [
    { x: 50, y: 10 }
];

// we can increase this, everything will scale up with us
var w = 960, h = 500,
    svg = d3.select("#chart")
        .append("svg")
        .attr("width", w)
        .attr("height", h);

// filter chain comes from:
// https://github.com/wbzyl/d3-notes/blob/master/hello-drop-shadow.html
// cpbotha added explanatory comments
// read more about SVG filter effects here: http://www.w3.org/TR/SVG/filters.html

// filters go in defs element
var defs = svg.append("defs");

// create filter with id #drop-shadow
// height=130% so that the shadow is not clipped
var filter = defs.append("filter")
    .attr("id", "drop-shadow")
    .attr("height", "130%");

// SourceAlpha refers to opacity of graphic that this filter will be applied to
// convolve that with a Gaussian with standard deviation 3 and store result
// in blur
filter.append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 5)
    .attr("result", "blur");

// translate output of Gaussian blur to the right and downwards with 2px
// store result in offsetBlur
filter.append("feOffset")
    .attr("in", "blur")
    .attr("dx", 5)
    .attr("dy", 5)
    .attr("result", "offsetBlur");

// overlay original SourceGraphic over translated blurred opacity by using
// feMerge filter. Order of specifying inputs is important!
var feMerge = filter.append("feMerge");

feMerge.append("feMergeNode")
    .attr("in", "offsetBlur")
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");

// for each rendered node, apply #drop-shadow filter
svg.selectAll("rect")
    .data(items)
    .enter().append("rect")
    .attr("width", 170)
    .attr("height", 100)
    .attr("fill", "steelblue")
    .attr("stroke-width", 2)
    .style("filter", "url(#drop-shadow)")
    .attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });

svg.append('circle')
    .attr('r', 70)
    .style('fill', 'rgb(0,200,200)')
    .style("filter", "url(#drop-shadow)")
    .attr("transform", "translate(" + 130 + "," + 220 + ")");
