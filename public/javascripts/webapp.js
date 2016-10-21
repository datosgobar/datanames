jQuery(function ($) {

  function toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }

  function formatName(name) {
      var processedName = window.DataProcessor.prototype._processName(name);

      processedName = processedName.replace("_", " ");

      return toTitleCase(processedName);
  }

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
    , DEFAULT_NAME = 'aaron santino' // nombre por defecto
    , DEFAULT_YEAR = '1922' // año por defecto
    , yearSelected
    , nameSelected
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
            , url
            , i
            , errores = false
            , regexName = /^[a-zA-Z ,]+$/;

          event.preventDefault();

          $('#errorName').attr('class', 'hide').empty(); // Borramos errores nombres

          if (mainName === "") { // Validacion Nombre - Nombre vacio
            errores = true;
            App._displayError('nombre_vacio');
          } else if (!regexName.test(mainName)) { // Validacion Nombre - Formato Incorrecto
            errores = true;
            App._displayError('nombre_incorrecto');
          }

          $('#errorYear').attr('class', 'hide').empty(); // Borramos errores año

          // Validacion Año - Año vacio
          if (year === "") {
            year = DEFAULT_YEAR;
          } else if (year > 2015 || year < 1922) {
            errores = true;
            App._displayError('anio_fueraDeRango');
          } else if (isNaN(parseInt(year)) == true) {
            errores = true;
            App._displayError('anio_incorrecto');
          }

          // Generamos URL
          if (errores == false) {
            url = "/nombre/" + mainName + "/" + year;

            //Se reemplazan caracteres especiales para la URL
            if (namesLength > 0) {
              for (i = 0; i < namesLength; i += 1) {
                names[i] = names[i].replace(/^\s+|\s+$/g, '');
              }
              url += "?others=" + names.join(",");
            }
            document.location.href = url
          }
        })
      },

      render: function () {

        var names, year, processor;

        // Si el nombre esta vacio, toma por defecto el nombre predeterminado
        if ($("#name").val() === '') {
          names = [DEFAULT_NAME];
        } else {
          names = $("#name").val().split(',')
        }
        // Si el año esta vacio, toma por defecto el nombre predeterminado
        if ($("#year").val() === '') {
          year = DEFAULT_YEAR;
        } else {
          year = $("#year").val();
        }

        processor = new DataProcessor(names, year);

        processor.fetchData().done(function (data) {

          dataYearData = data.yearData;
          dataYear = data.year;

          this.displayStatistics(data.statistics);
          this.processNamesData(data.processedNames, data.year, data.namesData);
          if (data.year) {
            $("#extra-year-datas .specific-year").text(data.year);
            if ($(window).width() < 600){
              App.displayYearStatistics('female', dataYear, 'mobile');
              App.displayYearStatistics('male', dataYear, 'mobile');
            } else {
              App.displayYearStatistics('female', dataYear);
              App.displayYearStatistics('male', dataYear);
            }
          }
        }.bind(this)).fail(function (error) {
          this._displayError(error);
        }.bind(this));

        nameSelected = processor.names;
        yearSelected = processor.year;
      },

      displayStatistics: function (statistics) {
        var $container = $("#nameDataContainer")
          , i, length, $p, title, desc;

        $container.empty();

        if (window.GENDER == undefined || window.GENDER == "f"){
          $('#section3').css({'background-color': '#F5712E'});
        } else {
          $('#section3').css({'background-color': '#42BD5C'});
        }

        for (i = 0, length = statistics.length; i < length; i += 1) {

          $p = $("<p>" + statistics[i] + "</p>");

          $container.append($p);
        }
      },

      /**
       * Bubble Chart de nombres
       */
      displayYearStatistics: function (gender, year, mobile) {

        var classBubbles = "bubble" + gender;
        var heightDiameter = (mobile == 'mobile') ? $("#extra-year-data").height() / 2 : $("#extra-year-data").height(); // Max heiht of the bubbles
        var widthDiameter = (mobile == 'mobile') ? $("#extra-year-data").width() : $("#extra-year-data").width() / 2; // Max width of the bubbles
        var contadorBubble = 0;

        var bubble = d3.layout.pack()
            .sort(function(a, b) {
              return (a.value - b.value)
            })
            .size([widthDiameter, heightDiameter])
            .padding(5);

        // SVG
        var svg = d3.select("#extra-year-data")
            .append("svg")
            .style('width', '100%')
            .attr("preserveAspectRatio", "xMidYMid meet")
            .attr("viewBox", function(){
                return "0 " + "0 " + $("#extra-year-data").width()/2 + " " + $("#extra-year-data").height();
            })
            .attr("width", function(){
              return mobile == 'mobile' ? '100%' : '50%';
            })
            .attr("height", "100%")
            .attr("class", classBubbles);

        // Colores femenino y masculino
        var color = (gender == "female") ? "rgba(242, 113, 47, 0.3)" : "rgba(66, 190, 92, 0.3)";

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
          bubbles = svg.selectAll(".bubble")
              .data(nodes)
              .enter();

          var medida = $('#extra-year-data > svg.bubblemale').width();

          // Create the bubbles
          bubbles.append("circle")
              .attr('id', function(d){
                contadorBubble ++;
                return 'tooltipBubble' + contadorBubble;
              })
              .attr("r", function(d){return d.r;})
              .attr("cx", function(d){
                return this.parentNode.getAttribute('class') === 'bubblefemale' ? medida - d.x : d.x;
              })
              .attr("cy", function(d){ return d.y; })
              .attr("class", function(d){ return gender + "f"; })
              .attr("tooltip", function(d,i){
                var contenido = "<div style='text-align:center;'><b>" + formatName(d.name) + "</b>";
                contenido += "<hr>";
                contenido += "<span style='color:silver;'>Cantidad</span><br>";
                contenido += "<b>" + d.quantity + "</b>";
                contenido += "<hr>";
                contenido += "<span style='color:silver;'>Año</span><br>";
                contenido += "<b>" + "1922" + "</b></div>";

                new Opentip(this, contenido, { style: "bubbleStyle", tipJoint: "bottom" });
              })
              .style("fill", function(d) { return color; })
              .style("fill", function(d) { return color; });


          // Format the text for each bubble
          bubbles.append("text")
              .attr("x", function(d){
                return this.parentNode.getAttribute('class') === 'bubblefemale' ? medida - d.x : d.x;
              })
              .attr("y", function(d){ return d.y + 5; })
              .attr("text-anchor", "middle")
              .attr('id', function(d, i){
                return 'bubble' + i;
              })
              .text(function(d){ return formatName(d.name); })
              .style({
                "fill":"#5D5D5D",
                "font-size": "14px"
              });
        });
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

        var tooltipLine = d3.select("#main-chart").append("div")
            .attr("id", "tooltipLine")

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
            if (currMax > totalMax) { totalMax = currMax; }
          }
        }

        x.domain([1922, 2015]);
        y.domain([totalMin, totalMax]);

        svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

        svg.append("g")
              .attr("class", "y axis")
              .call(yAxis);

        var voronoi = d3.geom.voronoi()
              .x(function(d) { return x(d.year); })
              .y(function(d) { return y(d.value); })
              .clipExtent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);

        var flatData = [];
        var numFem = 0;
        var numMas = 0;

        for (var i = 0, namesLength = names.length; i < namesLength; i += 1) {
          name = names[i];
          data = namesData[name];

          data.forEach(function(d) {
            d.year = +d.year;
            d.quantity = +d.quantity;
            d.percentage = +d.percentage;
            d.name = name;
            d.class = d.gender;
            if (d.gender == "f") {
              if (numFem == 0) {
                d.class = d.class+0;
              } else {
                d.class = d.class+1;
              }
              numFem++;
            } else {
              if (numMas == 0) {
                d.class = d.class+0;
              } else {
                d.class = d.class+1;
              }
              numMas++;
            }

            flatData.push({class: d.class, quantity: d.quantity, name: d.name, year: d.year, value: d.percentage});
          });

          data.sort(function(a, b) {
            return a.year - b.year;
          });

          svg.append("path")
              .datum(data)
              .attr("class", function(d) { return d[0].class; })
              .attr("d", line);

          // Linea Nombre
          d3.select("#infoNombres")
            .append('svg')
              .attr('width', '30px')
              .attr('height', '2px')
              .style('margin-right', '5px')
            .append("line")
              .datum(data)
              .attr('x1', '0px')
              .attr('x2', '30px')
              .attr('y1', '0px')
              .attr('y2', '0px')
              .attr("class", function(d) { return d[0].class; });

          d3.select("#infoNombres").append("text")
            .attr("style", "margin-right: 10px;")
            .text(names[i]);
        }

        var focus = svg.append("g")
              .attr("class", "focus")
              .attr("transform", "translate(-100,-100)");

          focus.append("circle")
              .attr("r", 4.5);

          var voronoiGroup = svg.append("g")
            .attr("class", "voronoi");

          voronoiGroup.selectAll("path")
              .data(voronoi(flatData))
              .enter().append("path")
              .attr("d", function(d) { if (d) {return "M" + d.join("L") + "Z"; }})
              .datum(function(d) { if (d) {return d.point; }})
              .on("mouseover", mouseover)
              .on("mouseout", mouseout);

          function mouseover(d) {
              focus.attr("transform", "translate(" + x(d.year) + "," + y(d.value) + ")");

              var tooltipTxt = "<div style='text-align:center;'><b>" + formatName(d.name) + "</b>";
              tooltipTxt += "<hr>";
              tooltipTxt += "<span style='color:silver;'>Cantidad</span><br>";
              tooltipTxt += "<b>" + d.quantity + "</b>";
              tooltipTxt += "<hr>";
              tooltipTxt += "<span style='color:silver;'>Porcentaje sobre el total de registros del año</span><br>";
              tooltipTxt += "<b>" + d.value + "</b>";
              tooltipTxt += "<hr>";
              tooltipTxt += "<span style='color:silver;'>Año</span><br>";
              tooltipTxt += "<b>" + d.year + "</b></div>";

              $("#tooltipLine").html(tooltipTxt);

              d3.select("#tooltipLine")
                .attr("style",
                    function() {
                        return "left:" + (x(d.year)+80) + "px; top:" + (y(d.value)-150) + "px";
                    });
              $("#tooltipLine").show();
            }

          function mouseout(d) {
            focus.attr("transform", "translate(-100,-100)");
            $("#tooltipLine").hide();
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

        if (error == 'nombre_vacio') {
          $('#name').css( 'margin-bottom', '0.5rem' );
          $('#errorName').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
          $('#errorName').append('¡Ups! Por favor, completá este dato.');
        }
        if (error == 'nombre_incorrecto') {
          $('#name').css( 'margin-bottom', '0.5rem' );
          $('#errorName').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
          $('#errorName').append('¡Ups! Revisá que el nombre esté bien escrito.');
        }
        if (error == 'anio_fueraDeRango') {
          $('#year').css( 'margin-bottom', '0.5rem' );
          $('#errorYear').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
          $('#errorYear').append('¡Ups! No tenemos esa fecha. Por favor, buscá entre 1922 y 2015.');
        }
        if (error == 'anio_incorrecto') {
          $('#year').css( 'margin-bottom', '0.5rem' );
          $('#errorYear').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
          $('#errorYear').append('¡Ups! Revisá que el año esté bien escrito.');
        }

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
  App.render();

  $(".help-tooltip").tooltip();

  // Ocultar el placeholder del input cuando el usuario hace foco en el elemento.
  var formSelector = $('input');
  var placeholderData;

  formSelector.each(function(key, value){
    value.addEventListener('focusin', function(){
      placeholderData = $(this).attr('placeholder');
      $(this).attr('placeholder', '');
    })
    value.addEventListener('focusout', function(){
      $(this).attr('placeholder', placeholderData);
    })
  });

  // Informacion Select
    informacionAnios();

    $('input[type="radio"]').on('change', function(e) {
      $('#extra-year-data').empty();
      if (this.value === 'decada') {
        var decadaStatistics = informacionDecadas();
        ejecutarStatisticsYear(decadaStatistics);
      } else if (this.value === 'anio') {
        var anioStatistics = informacionAnios();
        ejecutarStatisticsYear(anioStatistics);
      }
    });

    $('.selectBubble').on('change', function(e) {
      $('#extra-year-data').empty();
      if ($('#anio').is(':checked')) {
        var datoSeleccionado = window.document.querySelector('.selectBubble').value;
      } else {
        var datoSeleccionado = 'decada-' + window.document.querySelector('.selectBubble').value;
      }
      ejecutarStatisticsYear(datoSeleccionado);
    });

    function informacionAnios() {
      window.document.querySelector('.selectBubble').innerHTML = ''; // Borramos datos del select
      for (var i = 1922; i <= 2015; i++) {
        window.document.querySelector('.selectBubble').innerHTML += "<option id='element" + i + "'>" + i + "</option>";
      } // Generamos datos del select
      window.document.querySelector('#element' + yearSelected).selected = true; // Seleccionamos año ingresado por el usuario
      return yearSelected;
    }
    function informacionDecadas() {
      window.document.querySelector('.selectBubble').innerHTML = '';
      for (var i = 1920; i <= 2015; i += 10) {
        window.document.querySelector('.selectBubble').innerHTML += "<option id='decada" + i + "'>" + i + "</option>";
      }
      window.document.querySelector('#decada1920').selected = true;
      return 'decada-1920';
    }
    function ejecutarStatisticsYear(anio) {
      if ($(window).width() < 600){
        App.displayYearStatistics('female', anio, 'mobile');
        App.displayYearStatistics('male', anio, 'mobile');
      } else {
        App.displayYearStatistics('female', anio);
        App.displayYearStatistics('male', anio);
      }
    }
});
