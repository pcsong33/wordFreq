const root = typeof exports !== 'undefined' && exports !== null ? exports : this;

const Bubbles = function() {
    // standard variables accessible inside function Bubbles
    let width = 980;
    let height = 510;
    let data = [];
    let node = null;
    let label = null;
    const margin = {top: 5, right: 0, bottom: 0, left: 0};
    // largest size for bubbles
    const maxRadius = 65;

    // scale used to size bubbles
    const rScale = d3.scale.sqrt().range([0,maxRadius]);
    let rValue = function (d) { return parseInt(d.count);};

    // function to define the 'id' of a data element
    const idValue = function (d) { return d.name;};

    const rankValue = function (d) { return d.rank;};
    // function to define what to display in each bubble

    const textValue = function (d) { return d.name;};
    // spacing constants
    const collisionPadding = 20;
    const minCollisionRadius = 10;

    //  jitter controls the "jumpiness" of the collisions
    let jitter = 0.5;


    // ensures that the frequency value is a number
    const transformData = function(rawData) {
        rawData.forEach(function(d) {
            d.count = parseInt(d.count);
            return rawData.sort(function() {return 0.5 - Math.random();});
        });
        return rawData;
    };

    // tick callback function will be executed for every iteration of the force simulation

    const tick = function(e) {
        const dampenedAlpha = e.alpha * 0.1;

        // Gravity and collid functions

        node
            .each(gravity(dampenedAlpha))
            .each(collide(jitter))
            .attr("transform", d => `translate(${d.x},${d.y})`);

        // As the labels are created in raw html and not svg, need to ensure we specify the 'px' for moving based on pixels
        return label
            .style("left", d => ((margin.left + d.x) - (d.dx / 2)) + "px")
            .style("top", d => ((margin.top + d.y) - (d.dy / 2)) + "px");
    };

    // The force variable is the force layout controlling the bubbles

    const force = d3.layout.force()
        .gravity(0)
        .charge(0)
        .size([width, height])
        .on("tick", tick);

    // Creates new chart function.

    const chart = selection => selection.each(function(rawData) {

        // first, get the data in the right format
        data = transformData(rawData);
        // setup the radius scale's domain now that
        // we have some data
        const maxDomainValue = d3.max(data, d => rValue(d));
        rScale.domain([0, maxDomainValue]);

        const svg = d3.select(this)
            .selectAll("svg")
            .data([data]);
        const svgEnter = svg.enter()
            .append("svg");
        svg.attr("width", width + margin.left + margin.right );
        svg.attr("height", height + margin.top + margin.bottom );

        // node will be used to group the bubbles
        node = svgEnter.append("g").attr("id", "bubble-nodes")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // clickable background rect to clear the current selection
        node.append("rect")
            .attr("id", "bubble-background")
            .attr("width", width)
            .attr("height", height)
            .on("click", clear);

        // label is the container div for all the labels that sit on top of the bubbles
        // - remember that we are keeping the labels in plain html and
        //  the bubbles in svg
        label = d3.select(this).selectAll("#bubble-labels").data([data])
            .enter()
            .append("div")
            .attr("id", "bubble-labels");

        update();

        // see if url includes an id already
        hashchange();

        // automatically call hashchange when the url has changed
        return d3.select(window)
            .on("hashchange", hashchange);
    });

    // ---
    // update starts up the force directed layout and then
    // updates the nodes and labels
    // ---
    var update = function() {
        // add a radius to our data nodes that will serve to determine
        // when a collision has occurred. This uses the same scale as
        // the one used to size our bubbles, but it kicks up the minimum
        // size to make it so smaller bubbles have a slightly larger
        // collision 'sphere'
        data.forEach((d, i) => d.forceR = Math.max(minCollisionRadius, rScale(rValue(d))));

        // start up the force layout
        force.nodes(data).start();

        // call our update methods to do the creation and layout work
        updateNodes();
        return updateLabels();
    };

    // ---
    // updateNodes creates a new bubble for each node in our dataset
    // ---




    var updateNodes = function() {
        // here we are using the idValue function to uniquely bind our
        // data to the (currently) empty 'bubble-node selection'.
        // if you want to use your own data, you just need to modify what
        // idValue returns
        node = node.selectAll(".bubble-node").data(data, d => idValue(d));
        // console.log(data);
        // data.forEach(function (item) {
        //     console.log(item.count)
        // });


        var line = d3.svg.line(points)
            .x(function(d) {
                return d.x;
            })
            .y(function(d) {
                return d.y;
            })
            .interpolate("basis");

        var points = [
            {x: 0, y: -13},
            {x: 7, y: -20},
            {x: 20, y: -25},
            {x: 30, y: -20},
            {x: 32, y: -5},
            {x: 25, y: 10},
            {x: 0, y: 30},
            {x: -25, y: 10},
            {x: -32, y: -5},
            {x: -30, y: -20},
            {x: -20, y: -25},
            {x: -7, y: -20},
            {x: 0, y: -13}];

        // we don't actually remove any nodes from our data in this example
        // but if we did, this line of code would remove them from the
        // visualization as well
        // node.exit().remove();
        var colors = ['#FA877F', '#FFAD87', '#DEDEF0'];
        var random_color = colors[Math.floor(Math.random() * colors.length)];

        return node.enter()
            .append("a")
            .attr("class", "bubble-node")
            .attr("xlink:href", d => `#${encodeURIComponent(idValue(d))}`)
            .call(force.drag)
            .call(connectEvents)
            .append("circle")
            .attr("r", (d) => rScale(rValue(d)))
            .style("fill","pink")


        // in case we want to append an image
            // .append("image")
            // .attr("xlink:href", "heart.png")
            // .attr("x",  d => (-1.5 * rScale(rValue(d))) + "px")
            // .attr("y",  d => (-1.5 * rScale(rValue(d))) + "px")
            // .attr("width",  d => (3 * rScale(rValue(d))) + "px")
            // .attr("height",  d => (3 * rScale(rValue(d))) + "px");



            // .style("left", d => ((margin.left + d.x) - (d.dx / 2)) + "px")
            // .style("top", d => ((margin.top + d.y) - (d.dy / 2)) + "px");
            // .append('path')
            // .attr("d", function scale (d) {
            //     return line(points);
            // })
            // .style("fill", "pink")
        //.attr("d", function scale (d) {
        //                 return line(points) *  rScale(rValue(d) / 2);
        //             })

        // nodes are just links with circles inside.
        // the styling comes from the css


    };




    // ---
    // updateLabels is more involved as we need to deal with getting the sizing
    // to work well with the font size
    // ---
    var updateLabels = function() {
        // as in updateNodes, we use idValue to define what the unique id for each data
        // point is
        label = label.selectAll(".bubble-label").data(data, d => idValue(d));

        label.exit().remove();

        // labels are anchors with div's inside them
        // labelEnter holds our enter selection so it
        // is easier to append multiple elements to this selection
        const labelEnter = label.enter()
            .append("a")
            .attr("class", "bubble-label")
            .attr("href", d => `#${encodeURIComponent(idValue(d))}`)
            .call(force.drag)
            .call(connectEvents);

        labelEnter.append("div")
            .attr("class", "bubble-label-name")
            .text(d => textValue(d));

        labelEnter.append("div")
            .attr("class", "bubble-label-value")
            .text(d => rValue(d));

        // label font size is determined based on the size of the bubble
        // this sizing allows for a bit of overhang outside of the bubble
        // - remember to add the 'px' at the end as we are dealing with
        //  styling divs
        label
            .style("font-size", d => Math.max(8, rScale(rValue(d) / 2)) + "px")
            .style("width", d => (2.5 * rScale(rValue(d))) + "px");

        // interesting hack to get the 'true' text width
        // - create a span inside the label
        // - add the text to this span
        // - use the span to compute the nodes 'dx' value
        //  which is how much to adjust the label by when
        //  positioning it
        // - remove the extra span
        label.append("span")
            .text(d => textValue(d))
            .each(function(d) { return d.dx = Math.max(2.5 * rScale(rValue(d)), this.getBoundingClientRect().width); })
            .remove();

        // reset the width of the label to the actual width
        label
            .style("width", d => d.dx + "px");

        // compute and store each nodes 'dy' value - the
        // amount to shift the label down
        // 'this' inside of D3's each refers to the actual DOM element
        // connected to the data node
        return label.each(function(d) { return d.dy = this.getBoundingClientRect().height; });
    };

    // ---
    // custom gravity to skew the bubble placement
    // ---
    var gravity = function(alpha) {
        // start with the center of the display
        const cx = width / 2;
        const cy = height / 2;
        // use alpha to affect how much to push
        // towards the horizontal or vertical
        const ax = alpha / 8;
        const ay = alpha;

        // return a function that will modify the
        // node's x and y values
        return function(d) {
            d.x += (cx - d.x) * ax;
            return d.y += (cy - d.y) * ay;
        };
    };

    // ---
    // custom collision function to prevent
    // nodes from touching
    // This version is brute force
    // we could use quadtree to speed up implementation
    // (which is what Mike's original version does)
    // ---
    var collide = jitter => // return a function that modifies
        // the x and y of a node
        d => data.forEach(function(d2) {
            // check that we aren't comparing a node
            // with itself
            if (d !== d2) {
                // use distance formula to find distance
                // between two nodes
                const x = d.x - d2.x;
                const y = d.y - d2.y;
                let distance = Math.sqrt((x * x) + (y * y));
                // find current minimum space between two nodes
                // using the forceR that was set to match the
                // visible radius of the nodes
                const minDistance = d.forceR + d2.forceR + collisionPadding;

                // if the current distance is less then the minimum
                // allowed then we need to push both nodes away from one another
                if (distance < minDistance) {
                    // scale the distance based on the jitter variable
                    distance = ((distance - minDistance) / distance) * jitter;
                    // move our two nodes
                    const moveX = x * distance;
                    const moveY = y * distance;
                    d.x -= moveX;
                    d.y -= moveY;
                    d2.x += moveX;
                    return d2.y += moveY;
                }
            }
        });

    // ---
    // adds mouse events to element
    // ---
    var connectEvents = function(d) {
        d.on("click", click);
        d.on("mouseover", mouseover);
        return d.on("mouseout", mouseout);
    };

    // ---
    // clears currently selected bubble
    // ---
    var clear = () => location.replace("#");

    // ---
    // changes clicked bubble by modifying url
    // ---
    var click = function(d) {
        location.replace("#" + encodeURIComponent(idValue(d)));
        return d3.event.preventDefault();
    };

    // ---
    // called when url after the # changes
    // ---
    var hashchange = function() {
        const id = decodeURIComponent(location.hash.substring(1)).trim();
        return updateActive(id);
    };

    // ---
    // activates new node
    // ---
    var updateActive = function(id) {
        node.classed("bubble-selected", d => id === idValue(d));
        // if no node is selected, id will be empty
        const rank = d3.max(data, function rankFinder (d) {
            for (var x=0; x<data.length; x++) {
                if (id === idValue(d)) {
                    return rankValue(d)
                }
            }
        });

        if (id.length > 0) {
            return d3.select("#status")
                .html(`<h3>The word <span class=\"active\">${id}
                        </span> was the <span class=\"active\">#${rank}
                        </span> most common word</h3>`);
        } else {
            return d3.select("#status").html("<h3>No word is selected</h3>");
        }
    };




    // ---
    // hover event
    // ---
    var mouseover = d => node.classed("bubble-hover", p => p === d);

    // ---
    // remove hover class
    // ---
    var mouseout = d => node.classed("bubble-hover", false);

    // ---
    // public getter/setter for jitter variable
    // ---
    chart.jitter = function(_) {
        if (!arguments.length) {
            return jitter;
        }
        jitter = _;
        force.start();
        return chart;
    };

    // ---
    // public getter/setter for height variable
    // ---
    chart.height = function(_) {
        if (!arguments.length) {
            return height;
        }
        height = _;
        return chart;
    };

    // ---
    // public getter/setter for width variable
    // ---
    chart.width = function(_) {
        if (!arguments.length) {
            return width;
        }
        width = _;
        return chart;
    };

    // ---
    // public getter/setter for radius function
    // ---
    chart.r = function(_) {
        if (!arguments.length) {
            return rValue;
        }
        rValue = _;
        return chart;
    };

    // final act of our main function is to
    // return the chart function we have created
    return chart;
};

// ---
// Helper function that simplifies the calling
// of our chart with it's data and div selector
// specified
// ---
root.plotData = (selector, data, plot) => d3.select(selector)
    .datum(data)
    .call(plot);

const texts = [
    {key:"All",file:"total_wordfreq.csv",name:"All Schools"},
    {key:"Harvard",file:"harvard.csv",name:"Harvard"},
    {key:"Boston College",file:"bostoncollege.csv",name:"Boston College"},
    {key:"Brown",file:"brown.csv",name:"Brown University"},
    {key:"Claremont",file:"Claremont.csv",name:"Claremont Colleges"},
    {key:"Cornell",file:"cornell.csv",name:"Cornell University"},
    {key:"Columbia",file:"Columbia.csv",name:"Columbia University"},
    {key:"UW-Madison",file:"madison.csv",name:"University of Wisconsin-Madison"},
    {key:"MIT",file:"mit.csv",name:"Massachusetts Institute of Technology"},
    {key:"UChicago",file:"uchicago.csv",name:"University of Chicago"},
    {key:"Wellesley",file:"wellesley.csv",name:"Wellesley College"},
    {key:"WashU",file:"washU.csv",name:"Washington University in St. Louis"},
    {key:"Yale",file:"yale.csv",name:"Yale University"}
];

// ---
// jQuery document ready.
// ---
$(function() {
    // create a new Bubbles chart
    const plot = Bubbles();

    // ---
    // function that is called when
    // data is loaded
    // ---
    const display = data => plotData("#vis", data, plot);

    // we are storing the current text in the search component
    // just to make things easy
    let key = decodeURIComponent(location.search).replace("?","");
    let text = texts.filter(t => t.key === key)[0];

    // default to the first text if something gets messed up
    if (!text) {
        text = texts[0];
    }

    // select the current text in the drop-down
    $("#text-select").val(key);

    // bind change in jitter range slider
    // to update the plot's jitter
    d3.select("#jitter")
        .on("input", function() {
            return plot.jitter(parseFloat(this.output.value));
        });

    // bind change in drop down to change the
    // search url and reset the hash url
    d3.select("#text-select")
        .on("change", function(e) {
            key = $(this).val();
            location.replace("#");
            return location.search = encodeURIComponent(key);
        });

    // set the book title from the text name
    d3.select("#book-title").html(text.name);

    // load our data
    return d3.csv(`data/${text.file}`, display);
});

