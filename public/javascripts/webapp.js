jQuery(function ($) {

  // console.log(DataProcessor);

  /*
   * Check for Function.prototype.bind and define if not defined.
   */
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== "function") {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
      }

      var aArgs = Array.prototype.slice.call(arguments, 1)
        , fToBind = this
        , fNOP = function () {}
        , fBound = function () {
          return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
            aArgs.concat(Array.prototype.slice.call(arguments)));
      };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }

  var MIN_YEAR = 1922
    , MAX_YEAR = 2015
    , App = {

      initialize: function () {
        this.bindEvents();
      },

      bindEvents: function () {
        var $form = $("#name-form");

        $form.submit(function (event) {
          var names = $("#name").val().split(',')
            , year = $("#year").val()
            , mainName = names.shift()
            , namesLength = names.length
            , url, i;

          event.preventDefault();

          if (mainName !== "") {
            url = "/nombre/" + mainName + "/" + year;
            // url = "/nombre/" + mainName + "/year/" + year;
            if (namesLength > 0) {
              for (i = 0; i < namesLength; i += 1) {
                names[i] = names[i].replace(/^\s+|\s+$/g, '');
              }

              url += "?others=" + names.join(",");
            }
            document.location.href = url;
          }
          else {
            this._displayError({ type: "invalid_name" });
          }
        }.bind(this));
      },

      render: function () {
        var names = $("#name").val().split(",")
          , year = $("#year").val()
          , processor;

        this._clearFormErrors();

        processor = new DataProcessor(names, year);

        processor.fetchData().done(function (data) {

          this.displayStatistics(data.statistics);
          this.processNamesData(data.processedNames, data.year, data.namesData);
          if (data.year) {
            $("#extra-year-datas .specific-year").text(data.year);
            this.displayYearStatistics(data.yearData, 'female', data.year);
            // this.displayYearStatistics(data.yearData, "male", data.year);
          }
        }.bind(this)).fail(function (error) {
          this._displayError(error);
        }.bind(this));
      },

      displayStatistics: function (statistics) {
        var $container = $("#nameDataContainer")
          , i, length, $p, title, desc;

        $container.empty();

        for (i = 0, length = statistics.length; i < length; i += 1) {

          $p = $("<p>" + statistics[i] + "</p>");

          $container.append($p);
        }
      },

      /**
       * Bubble Chart de nombres
       */
      displayYearStatistics: function (yearData, gender, year) {

        var classBubbles = "bubble" + gender;
        var diameter = 450; // Max size of the bubbles

        var bubble = d3.layout.pack()
            .sort(null)
            .size([diameter, diameter])
            .padding(1.5);

        // SVG
        var svg = d3.select("#extra-year-data")
            .append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", classBubbles);

        // Colores femenino y masculino
        var color = (gender == "female") ? "#F5712E" : "#42BD5C";

        // Path a los datos de los años
        var path = "/years/" + year + ".json";

        d3.json(path, function(error, data){

          if (gender == "female") {
            // Convert numerical values from strings to numbers
            // Data de top 10 femenina
            data = data.f.map(function(d){ d.value = +d.quantity; return d; });
          } else {
            // Data de top 10 masculina
            data = data.m.map(function(d){ d.value = +d.quantity; return d; });
          }
          var nodes, bubbles;

          // Bubbles needs very specific format, convert data to this.
          nodes = bubble.nodes({children:data}).filter(function(d) { return !d.children; });

          // Setup the chart
          bubbles = svg.append("g")
              .attr("transform", "translate(0,0)")
              .selectAll(".bubble")
              .data(nodes)
              .enter();

          // Create the bubbles
          bubbles.append("circle")
              .attr("r", function(d){ return d.r; })
              .attr("cx", function(d){ return d.x; })
              .attr("cy", function(d){ return d.y; })
              .style("fill", function(d) { return color; });

          // Format the text for each bubble
          bubbles.append("text")
              .attr("x", function(d){ return d.x; })
              .attr("y", function(d){ return d.y + 5; })
              .attr("text-anchor", "middle")
              .text(function(d){ return processNameForBubble(d.name); })
              .style({
                  "fill":"#646363",
                  "font-family":"Helvetica Neue, Helvetica, Arial, san-serif",
                  "font-size": "14px"
              });

        });

        function toTitleCase(str) {
            return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
        }

        function processNameForBubble(name) {
            var processedName = window.DataProcessor.prototype._processName(name);

            processedName = processedName.replace("_", " ");

            return toTitleCase(processedName);
        }

      },
      /**
       * Line Chart de nombres
       */
      processNamesData: function (names, year, namesData) {

        $("#main").addClass("active");
        $("#main-chart").empty();

        var margin = {top: 20, right: 50, bottom: 30, left: 50},
            width = 800 - margin.left - margin.right,
            height = 350 - margin.top - margin.bottom;

        var bisectDate = d3.bisector(function(d) { return d.year; }).left;

        var x = d3.time.scale()
            .range([0, width]);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickFormat(d3.format("d"))
            .tickValues([1922, 1930, 1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2015]);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        var line = d3.svg.line()
            .x(function(d) {
              return x(d.year); })
            .y(function(d) { return y(d.percentage); });


        var svg = d3.select("#main-chart").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var totalMin, totalMax;

        // Iterate over all names to figure out the max and min for the percentages
        for (var i = 0, namesLength = names.length; i < namesLength; i += 1) {
          name = names[i];
          data = namesData[name];

          currMinMax = d3.extent(data, function(d) { return d.percentage; });

          currMin = currMinMax[0];
          currMax = currMinMax[1]; 
          if (i == 0) {
            totalMin = currMin;
            totalMax = currMax;
          } else {
            if (currMin < totalMin) { totalMin = currMin; }
            if (currMax < totalMax) { totalMax = currMax; }
          }
        }

        x.domain([1922, 2015]);
        y.domain([totalMin, totalMax]);

        svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

        // Iterate over all names to figure out the max and min for the percentages
        for (var i = 0, namesLength = names.length; i < namesLength; i += 1) {
          name = names[i];
          data = namesData[name];
          
          data.forEach(function(d) {
            d.year = +d.year;
            d.percentage = +d.percentage;
          });

          data.sort(function(a, b) {
            return a.year - b.year;
          });
          
          svg.append("path")
              .datum(data)
              .attr("class", "line" + i.toString())
              .attr("d", line);

          var focus = svg.append("g")
              .attr("class", "focus")
              .style("display", "none");

          focus.append("circle")
              .attr("r", 4.5);

          focus.append("text")
              .attr("x", 9)
              .attr("dy", ".35em");

          svg.append("rect")
              .attr("class", "hover-line")
              .attr("width", width)
              .attr("height", height)
              .on("mouseover", function() { focus.style("display", null); })
              .on("mouseout", function() { focus.style("display", "none"); })
              .on("mousemove", mousemove);

          function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            focus.attr("transform", "translate(" + x(d.year) + "," + y(d.percentage) + ")");
            var textHover = (Math.round(d.percentage*100) / 100).toString() + "%";
            focus.select("text").text(textHover);
          }
        }
      },

      humanizeName: function (name) {
        var processedName = name.replace(/_(.)?/, function (fullMatch, group0) {
          return typeof group0 === "string" ? " " + group0.toUpperCase() : "";
        });

        if (name.length > 0) {
          processedName = processedName.replace(/^(.)/, function (fullMatch, firstLetter) {
            return firstLetter.toUpperCase();
          });
        }

        return processedName;
      },

      _displayError: function (error) {
        var $nameField = $(".form-field:has(#name)")
          , $yearField = $(".form-field:has(#year)");

        this._clearFormErrors();

        switch (error.type) {
          case "invalid_name":
            this._displayInputError($nameField, "El nombre es inv&aacute;lido");
            break;
          case "name_not_found":
            this._displayInputError($nameField, "No se encontr&oacute; el nombre ingresado");
            break;
          case "year_not_found":
            this._displayInputError($yearField, "No se encontr&oacute; el a&ntilde;o ingresado");
            break;

        }
      },

      _displayInputError: function ($field, errorMessage) {
        var errorHTML = [
          "<div class=\"form-error\">",
            "<span class=\"tooltip-arrow\"></span>",
            "<p>" + errorMessage + "</p>",
          "</div>"
        ].join("");

        $field.find(".form-input").append(errorHTML);
        $field.addClass("error");
      },

      _clearFormErrors: function () {
        var $form = $("#name-form");
        $form.find(".form-field.error").removeClass("error");
        $form.find(".form-error").remove();
      },

      _getYaxisOptions: function (series) {
        var yaxisOptions = { min: 0 }
          , maxValue = 0
          , i, j, serie, seriesLength, serieLength;

        for (i = 0, seriesLength = series.length; i < seriesLength; i += 1) {
          serie = series[i];
          for (j = 0, serieLength = serie.length; j < serieLength; j += 1) {
            if (serie[j][1] > maxValue) {
              maxValue = serie[j][1];
            }
          }
        }

        if (maxValue <= 6) {
          yaxisOptions.max = 6;
        }

        return yaxisOptions;
      },

      _getSeriesOptions: function (names, series) {
        var seriesOptions = []
          , i, length;

        for (i = 0, length = series.length; i < (length - 1); i += 1) {
          seriesOptions.push({
            label: this.humanizeName(names[i]),
            markerOptions: {
              size: 6,
              lineWidth: 1
            },
          });
        }

        seriesOptions.push({
          markerOptions: {
            color: "#52BE7F",
            show: true,
            size: 9
          }
        });

        return seriesOptions;
      }
    };

  App.initialize();

  if ($("#name").val() !== "") {
    App.render();
  }

  $(".help-tooltip").tooltip();

  // var nombre = 'aaron_santino';
  //
  // var traerGenero = function (nombre) {
  //   return $.ajax({
  //                         url: "/names/" + nombre + ".json",
  //                         method: "GET",
  //                         dataType: "json",
  //                         async: false
  //                       }).responseText;
  // };
  //
  // var contenido = traerGenero(nombre);
  //
  // var gender = JSON.parse(contenido)[0].gender;

});
