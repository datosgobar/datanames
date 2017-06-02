jQuery(function ($) {

  //////////////////////////////////////////////////////////////////////////////
  // Check for Function.prototype.bind and define if not defined.
  if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5 internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP = function () {},
          fBound = function () {
            return  fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
  Number.prototype.format = function(n, x, s, c) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
    num = this.toFixed(Math.max(0, ~~n));

    return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
  };
  //////////////////////////////////////////////////////////////////////////////
  // Funciones Globales
  function toTitleCase(str) {
      return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
  }
  function formatName(name) {
    var names = name.split('_');

    names.forEach(function (v, k) {
      if (v !== 'de' && v !== 'la' && v !== 'los' && v !== 'las' && v !== 'del') {
        names[k] = toTitleCase(window.DataProcessor.prototype._processName(v));
      } else {
        names[k] = v.toLowerCase();
      }
    });

    names = names.join(' ');

    return names;
  }

  //////////////////////////////////////////////////////////////////////////////
  // Variables Globales
  var MIN_YEAR      = 1922, MAX_YEAR = 2015,
      DEFAULT_NAMES = ['Emilia', 'Benjamin'],
      DEFAULT_YEAR  = MAX_YEAR,
      ACTIVE_YEAR_DATA, ACTIVE_YEAR,
      ACTIVE_NAMES, ACTIVE_NAMES_DATA,
      ACTIVE_GENDER, STATISTICS,
      APP_WIDTH = $(window).width(),
      APP_NAME_CHART = {},
      bebeCheck = true,
      countNames = 0;

  //////////////////////////////////////////////////////////////////////////////
  // Variables Globales
  var App = {
    initialize: function () {
      this.bindEvents();
    },
    bindEvents: function () {
      var regexName = /^[a-zA-Z ,áéíóú]+$/,
          url;

      $('#name-form').submit(function (event) {
        var names      = $('#name').val().split(','),
            year       = $('#year').val(),
            mainName   = names.shift(),
            errores_estado = false,
            errores         = {
              empty_name:   false,
              empty_year:   false,
              invalid_name: false,
              invalid_year: false,
              limit_name:   false,
              range_year:   false
            };

        event.preventDefault();                       // Se detiene envio de formulario
        d3.selectAll('.form_errors ul li').remove();  // Se eliminan antiguos mensajes de error

        if (mainName === '') {                        // Validaciones nombres
          errores.empty_name = true;
          errores_estado = true;
        } else if (!regexName.test(mainName) || $('#name').val().length > 120 || $('#name').val().length < 2) { // Validacion Nombre - Formato Incorrecto
          errores.invalid_name = true;
          errores_estado = true;
        } else if (names.length > 2) {
          errores.limit_name = true;
          errores_estado = true;
        }

        if (year === '') {                            // Validaciones años
          year = DEFAULT_YEAR;
          errores.empty_year = true;
          errores_estado = true;
        } else if (year > MAX_YEAR || year < MIN_YEAR) {
          errores.range_year = true;
          errores_estado = true;
        } else if (isNaN(parseInt(year)) === true) {
          errores.invalid_year = true;
          errores_estado = true;
        }

        // Generamos URL
        if (errores_estado === false) {
          url = `/nombre/${ mainName }/${ year }`;

          //Se reemplazan caracteres especiales para la URL
          if (names.length > 0) {
            for (var i = 0; i < names.length; i += 1) {
              names[i] = names[i].replace(/^\s+|\s+$/g, '');
            }
            url += `?others=${ names.join(',') }`;
          }

          document.location.href = url;
        } else { App.displayErrors(errores); }
      });
    },
    render: function () {
      var names = DEFAULT_NAMES,
          year  = DEFAULT_YEAR,
          processor;

      // Si el nombre esta vacio, toma por defecto el nombre predeterminado
      if ($('#name').val() !== '') { names = $('#name').val().split(','); }

      // Si el año esta vacio, toma por defecto el nombre predeterminado
      if ($('#year').val() !== '') { year = $('#year').val(); }

      processor = new DataProcessor(names, year);

      processor.fetchData().done(function (data) {
        ACTIVE_YEAR_DATA  = data.yearData;
        ACTIVE_YEAR       = data.year;
        ACTIVE_NAMES      = data.processedNames;
        ACTIVE_NAMES_DATA = data.namesData;
        STATISTICS        = data.statistics;
        ACTIVE_GENDER     = data.namesData[data.names[0].toLowerCase().replace(' ', '_')][0].gender;

        this.nameChart(ACTIVE_NAMES, ACTIVE_YEAR, ACTIVE_NAMES_DATA);
        this.nameStatistics(STATISTICS);
        this.bubbleChart(ACTIVE_YEAR);
      }.bind(this)).fail(function (error) {
        console.error(error);
        this.displayErrors(error);
      }.bind(this));
    },
    bubbleChart: function (year) {
      d3.selectAll('#extra-year-data svg').remove();  // Se elimina grafico anterior

      var height = $('#extra-year-data').height(),
          width  = (APP_WIDTH > 768)?($('#extra-year-data').width() / 2):($('#extra-year-data').width());

      if (APP_WIDTH > 768) {
        draw('female', year);
        draw('male', year);
      } else {
        draw((ACTIVE_GENDER === 'f')?('female'):('male') ,year);
      }

      function draw(gender, year) {
        var path   = `/years/${ year }.json`,
            bubble = d3.layout.pack()
              .sort(function(a, b) {
                return (a.value - b.value);
              })
              .size([width, height])
              .padding(5),
            svg    = d3.select('#extra-year-data')
              .append('svg')
              .attr('preserveAspectRatio', 'xMidYMid meet')
              .attr('viewBox', `0 0 ${ width } ${ height }`)
              .attr('width', width)
              .attr('height', height)
              .attr('class', `bubble${ gender }`)
              .append('g'),
            color  = (gender === 'female')?('rgba(244, 129, 64, 0.3)'):('rgba(66, 190, 92, 0.3)'),
            contadorBubble = 0,
            nodes, bubbles;

        d3.json(path, function(error, data) {
          // Convert numerical values from strings to numbers
          if (gender === 'female') {
            data = data.f.map(function(d){ d.value = +d.quantity; return d; });
          } else {
            data = data.m.map(function(d){ d.value = +d.quantity; return d; });
          }

          // Bubbles needs very specific format, convert data to this.
          nodes = bubble.nodes({children:data}).filter(function(d) { return !d.children; });
          // Setup the chart
          bubbles = svg.selectAll('.bubble')
            .data(nodes)
            .enter();
          // Create the bubbles
          bubbles.append('circle')
            .attr('id', function(d) {
              contadorBubble++;

              return `tooltipBubble${ contadorBubble }`;
            })
            .attr('r', function(d) {
              return d.r;
            })
            .attr('cx', function(d) {
              return (`bubble${ gender }` === 'bubblefemale' && APP_WIDTH > 768)?($('#extra-year-data > svg.bubblemale').width() - d.x):(d.x);
            })
            .attr('cy', function(d) {
              return d.y;
            })
            .attr('class', `${ gender }f`)
            .attr('tooltip', function(d,i) {
              var contenido = `<div class="tooltip_format" style="max-width: 200px">
                <div>
                  <strong>${ formatName(d.name) }</strong>
                  <span>${ d.quantity } personas registradas con este nombre en ${ $('select')[0].value }.</span>
                </div>
              </div>`;

              new Opentip(this, contenido, { style: 'bubbleStyle', tipJoint: 'bottom', borderRadius: 20 });
            })
            .style('fill', function(d) {
              return color;
            });
          // Format the text for each bubble
          bubbles.append('text')
            .filter(function(d) { return (d.name.split('_').length === 1); })
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'central')
            .attr('x', function(d) {
              return (`bubble${ gender }` === 'bubblefemale' && APP_WIDTH > 768)?($('#extra-year-data > svg.bubblemale').width() - d.x):(d.x);
            })
            .attr('y', function(d) { return d.y; })
            .text(function(d) { return formatName(d.name) });
          bubbles.append('text')
            .filter(function(d) { return (d.name.split('_').length !== 1); })
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'central')
            .attr('x', function(d) {
              return (`bubble${ gender }` === 'bubblefemale' && APP_WIDTH > 768)?($('#extra-year-data > svg.bubblemale').width() - d.x):(d.x);
            })
            .attr('y', function(d) { return d.y - 10; })
            .text(function(d) {
              var name = d.name.split('_');

              name.forEach(function (v, k) {
                if (v !== 'de' && v !== 'la' && v !== 'los' && v !== 'las' && v !== 'del') {
                  name[k] = formatName(v);
                } else {
                  name[k] = v.toLowerCase();
                }
              });

              switch (name.length) {
                case 1:
                  return name[0];
                case 2:
                  return name[0];
                case 3:
                  return name[0];
                case 4:
                  return `${ name[0] } ${ name[1] }`;
                case 5:
                  return `${ name[0] } ${ name[1] }`;
              }
            });
          bubbles.append('text')
            .filter(function(d) { return (d.name.split('_').length !== 1); })
            .attr('text-anchor', 'middle')
            .attr('alignment-baseline', 'central')
            .attr('x', function(d) {
              return (`bubble${ gender }` === 'bubblefemale' && APP_WIDTH > 768)?($('#extra-year-data > svg.bubblemale').width() - d.x):(d.x);
            })
            .attr('y', function(d) { return d.y + 10; })
            .text(function(d) {
              var name = d.name.split('_');

              name.forEach(function (v, k) {
                if (v !== 'de' && v !== 'la' && v !== 'los' && v !== 'las' && v !== 'del') {
                  name[k] = formatName(v);
                } else {
                  name[k] = v.toLowerCase();
                }
              });

              switch (name.length) {
                case 2:
                  return name[1];
                case 3:
                  return `${ name[1] } ${ name[2] }`;
                case 4:
                  return `${ name[2] } ${ name[3] }`;
                case 5:
                  return `${ name[2] } ${ name[3] } ${ name[4] }`;
              }
            });
        });
      }
    },
    nameChart: function (names, year, namesData) {
      APP_NAME_CHART.margin = {top: 30, right: 25, bottom: 50, left: 75};

      var width   = $('#main-chart').width() - APP_NAME_CHART.margin.left - APP_NAME_CHART.margin.right,
          height  = $('#main-chart').height() - APP_NAME_CHART.margin.top - APP_NAME_CHART.margin.bottom;

      APP_NAME_CHART.bisectDate   = d3.bisector(function(d) { return d.year; }).left;
      APP_NAME_CHART.x            = d3.time.scale().range([0, width]);
      APP_NAME_CHART.y            = d3.scale.linear().range([height, 0]);
      APP_NAME_CHART.xAxis        = d3.svg.axis()
        .scale(APP_NAME_CHART.x)
        .orient('bottom')
        .tickFormat(d3.format('d'))
        .tickValues(function() {
          if (APP_WIDTH > 768) {
            return [1925, 1935, 1945, 1955, 1965, 1975, 1985, 1995, 2005, 2015];
          } else {
            return [MIN_YEAR, 1968, MAX_YEAR];
          }
        });
      APP_NAME_CHART.yAxis        = d3.svg.axis()
        .scale(APP_NAME_CHART.y)
        .orient('left')
        .tickFormat(function(d){
          return (d * 10).toFixed(2) + ' ‰';
        });
      APP_NAME_CHART.line         = d3.svg.line()
        .x(function(d) {
          return APP_NAME_CHART.x(d.year);
        })
        .y(function(d) {
          return APP_NAME_CHART.y(d.percentage);
        });
      APP_NAME_CHART.svg          = d3.select('#main-chart').append('svg')
        .attr('width', width + APP_NAME_CHART.margin.left + APP_NAME_CHART.margin.right)
        .attr('height', height + APP_NAME_CHART.margin.top + APP_NAME_CHART.margin.bottom)
        .attr('preserveAspectRatio', 'xMidYMid meet');
      APP_NAME_CHART.svg_g        = APP_NAME_CHART.svg.append('g')
        .attr('transform', `translate(${ APP_NAME_CHART.margin.left }, ${ APP_NAME_CHART.margin.top })`);
      APP_NAME_CHART.tooltipLine  = d3.select('#main-chart').append('div')
        .attr('id', 'tooltipLine');

      // Iterate over all names to figure out the max and min for the percentages
      var totalMin, totalMax, name, data, currMin, currMax, currMinMax;

      for (var i = 0; i < names.length; i += 1) {
        name = names[i];
        data = namesData[name];

        currMinMax = d3.extent(data, function(d) { return d.percentage; });

        currMin = currMinMax[0];
        currMax = currMinMax[1];
        if (i === 0) {
          totalMin = currMin;
          totalMax = currMax;
        } else {
          if (currMin < totalMin) { totalMin = currMin; }
          if (currMax > totalMax) { totalMax = currMax; }
        }
      }

      APP_NAME_CHART.x.domain([MIN_YEAR, MAX_YEAR]);
      APP_NAME_CHART.y.domain([totalMin, totalMax]);
      APP_NAME_CHART.svg_g_xAxis = APP_NAME_CHART.svg_g.append('g')
        .attr('class', 'x axis xAxis')
        .attr('transform', `translate(0, ${ height })`)
        .call(APP_NAME_CHART.xAxis);
      APP_NAME_CHART.svg_g_yAxis = APP_NAME_CHART.svg_g.append('g')
        .attr('class', 'y axis yAxis')
        .call(APP_NAME_CHART.yAxis);

      var voronoi = d3.geom.voronoi()
        .x(function(d) { return APP_NAME_CHART.x(d.year); })
        .y(function(d) { return APP_NAME_CHART.y(d.value); })
        .clipExtent([[-APP_NAME_CHART.margin.left, -APP_NAME_CHART.margin.top], [width + APP_NAME_CHART.margin.right, height + APP_NAME_CHART.margin.bottom]]);

      var numFem = 0, numMas = 0, calc_gender, flatData = [];

      for (i = 0; i < names.length; i++) {
        name = names[i];
        data = namesData[name];

        if (data[0].gender === 'f') {
          if (numFem === 0) {
            calc_gender = 'f0';
          } else if (numFem === 1) {
            calc_gender = 'f1';
          } else {
            calc_gender = 'f2';
          }
          numFem++;
        } else {
          if (numMas === 0) {
            calc_gender = 'm0';
          } else if (numMas === 1) {
            calc_gender = 'm1';
          } else {
            calc_gender = 'm2';
          }
          numMas++;
        }

        data.forEach(function(d) {
          d.year = +d.year;
          d.quantity = +d.quantity;
          d.percentage = +d.percentage;
          d.name = name;
          d.class = calc_gender;

          flatData.push({class: d.class, quantity: d.quantity, name: d.name, year: d.year, value: d.percentage});
        });
        data.sort(function(a, b) {
          return a.year - b.year;
        });

        APP_NAME_CHART.svg_g_path = APP_NAME_CHART.svg_g.append('path')
          .datum(data)
          .attr('id', `line_${ i }`)
          .attr('class', function(d) { return d[0].class; })
          .attr('d', APP_NAME_CHART.line); // Revisar

        // Referencias Nombres
        d3.select('#infoNombres')
          .datum(data)
          .append('svg')
            .attr('class', function(d) { return d[0].class; })
            .style('margin-right', '5px')
          .append('line')
            .attr('x1', '0px')
            .attr('x2', '15px')
            .attr('class', function(d) { return d[0].class; });
        d3.select('#infoNombres').append('text').text(formatName(names[i]));
      }

      if (bebeCheck === true) {
        APP_NAME_CHART.svg_g_baby = APP_NAME_CHART.svg_g.append('svg:image')
          .datum(flatData)
          .attr('xlink:href', function(d) {
            if (d[0].class.charAt(0) === 'f') {
              return  '/images/icono-nacimiento-mujer.png';
            } else {
              return '/images/icono-nacimiento-varon.png';
            }
          })
          .attr('width', 34)
          .attr('height', 34)
          .attr('bebe', function(d) {
            if (bebeCheck === true) {
              d.forEach(function(v) {
                var tempValueYear = ($('#year').val())?($('#year').val()):(DEFAULT_YEAR);
                if (parseInt(v.year) === parseInt(tempValueYear) && bebeCheck === true) {
                  APP_NAME_CHART.yearBaby  = v.year;
                  APP_NAME_CHART.valueBaby = v.value;
                  bebeCheck = false;
                }
              });
            }
          })
          .attr('transform', function(d){
            return `translate(${ APP_NAME_CHART.x(APP_NAME_CHART.yearBaby) - 17 }, ${ APP_NAME_CHART.y(APP_NAME_CHART.valueBaby) - 17 })`;
          });

        bebeCheck = false;
      }

      APP_NAME_CHART.focus = APP_NAME_CHART.svg_g.append('g')
        .attr('class', 'focus')
        .attr('transform', 'translate(-100,-100)');
      APP_NAME_CHART.focus.append('circle').attr('r', 9);
      APP_NAME_CHART.voronoiGroup = APP_NAME_CHART.svg_g.append('g').attr('class', 'voronoi');

      var voronoi_path = APP_NAME_CHART.voronoiGroup.selectAll('path')
        .data(voronoi(flatData))
        .enter()
        .append('path')
        .attr('d', function(d) {
          if (d) { return `M${ d.join('L') }Z`; }
        })
        .datum(function(d) {
          if (d) { return d.point; }
        })
        .attr('tooltip', function(d){
          if (d) {
            var contenido = `<div class="tooltip_format">
              <div style="margin-right: 10px">
                <strong>${ formatName(d.name) } en ${ d.year }</strong>
                <span>Personas con este nombre</span>
                <span>Popularidad<span style="">*</span></span>
              </div>
              <div>
                <span>${ d.quantity.format(0, 3, '.', ',') }</span>
                <span>${ (d.value * 10).format(3, 3, '', ',') }‰</span>
              </div>
            </div>`;

            new Opentip(this, contenido, { style: 'bubbleStyle', tipJoint: 'bottom', borderRadius: 20 });
          }

        })
        .on('mouseover', function(d){
          APP_NAME_CHART.focus
            .attr('transform', `translate(${ APP_NAME_CHART.x(d.year) }, ${ APP_NAME_CHART.y(d.value) })`)
            .select('circle').style('stroke', function(){
              switch (d.class) {
                case 'f0':
                  return 'rgb(244, 129, 64)';
                case 'f1':
                  return '#BF360C';
                case 'f2':
                  return '#FBE9E7';
                case 'm0':
                  return '#4CAF50';
                case 'm1':
                  return '#1B5E20';
                case 'm2':
                  return '#C8E6C9';
              }
            });
        })
        .on('mouseout', function(d){
          APP_NAME_CHART.focus.attr('transform', 'translate(-100,-100)');
        });
    },
    updateNameChart: function (names, year, namesData) {
      var width   = $('#main-chart').width() - APP_NAME_CHART.margin.left - APP_NAME_CHART.margin.right,
          height  = $('#main-chart').height() - APP_NAME_CHART.margin.top - APP_NAME_CHART.margin.bottom;

      APP_NAME_CHART.x
        .range([0, width]);
      APP_NAME_CHART.y
        .range([height, 0]);
      APP_NAME_CHART.xAxis
        .scale(APP_NAME_CHART.x)
        .tickValues(function() {
            if (APP_WIDTH > 768) {
              return [1925, 1935, 1945, 1955, 1965, 1975, 1985, 1995, 2005, 2015];
            } else {
              return [MIN_YEAR, 1968, MAX_YEAR];
            }
          });
      APP_NAME_CHART.yAxis
        .scale(APP_NAME_CHART.y);
      APP_NAME_CHART.line
        .x(function(d) {
          return APP_NAME_CHART.x(d.year);
        })
        .y(function(d) {
          return APP_NAME_CHART.y(d.percentage);
        });
      APP_NAME_CHART.svg
        .attr('width', width + APP_NAME_CHART.margin.left + APP_NAME_CHART.margin.right)
        .attr('height', height + APP_NAME_CHART.margin.top + APP_NAME_CHART.margin.bottom);
      APP_NAME_CHART.svg_g
        .attr('transform', `translate(${ APP_NAME_CHART.margin.left }, ${ APP_NAME_CHART.margin.top })`);
      APP_NAME_CHART.svg_g_xAxis
        .attr('transform', `translate(0, ${ height })`)
        .call(APP_NAME_CHART.xAxis);
      APP_NAME_CHART.svg_g_yAxis
        .call(APP_NAME_CHART.yAxis);

      var voronoi = d3.geom.voronoi()
        .x(function(d) { return APP_NAME_CHART.x(d.year); })
        .y(function(d) { return APP_NAME_CHART.y(d.value); })
        .clipExtent([[-APP_NAME_CHART.margin.left, -APP_NAME_CHART.margin.top], [width + APP_NAME_CHART.margin.right, height + APP_NAME_CHART.margin.bottom]]);

      var numFem = 0, numMas = 0, calc_gender, name, data, flatData = [];

      for (var i = 0; i < names.length; i++) {
        name = names[i];
        data = namesData[name];

        if (data[0].gender === 'f') {
          if (numFem === 0) {
            calc_gender = 'f0';
          } else if (numFem === 1) {
            calc_gender = 'f1';
          } else {
            calc_gender = 'f2';
          }
          numFem++;
        } else {
          if (numMas === 0) {
            calc_gender = 'm0';
          } else if (numMas === 1) {
            calc_gender = 'm1';
          } else {
            calc_gender = 'm2';
          }
          numMas++;
        }

        data.forEach(function(d) {
          d.year = +d.year;
          d.quantity = +d.quantity;
          d.percentage = +d.percentage;
          d.name = name;
          d.class = calc_gender;

          flatData.push({class: d.class, quantity: d.quantity, name: d.name, year: d.year, value: d.percentage});
        });
        data.sort(function(a, b) {
          return a.year - b.year;
        });

        d3.select(`#line_${ i }`)
          .datum(data)
          .attr('d', APP_NAME_CHART.line);
      }

      APP_NAME_CHART.svg_g_baby
        .attr('transform', `translate(${ APP_NAME_CHART.x(APP_NAME_CHART.yearBaby) - 17 }, ${ APP_NAME_CHART.y(APP_NAME_CHART.valueBaby) - 17 })`);

      d3.selectAll('.voronoi path').remove();

      var voronoi_path = APP_NAME_CHART.voronoiGroup.selectAll('path')
        .data(voronoi(flatData))
        .enter()
        .append('path')
        .attr('d', function(d) {
          if (d) { return `M${ d.join('L') }Z`; }
        })
        .datum(function(d) {
          if (d) { return d.point; }
        })
        .attr('tooltip', function(d){
          if (d) {
            var contenido = `<div class="tooltip_format">
              <div style="margin-right: 10px">
                <strong>${ formatName(d.name) } en ${ d.year }</strong>
                <span>Personas con este nombre</span>
                <span>Popularidad<span style="">*</span></span>
              </div>
              <div>
                <span>${ d.quantity.format(0, 3, '.', ',') }</span>
                <span>${ (d.value * 10).format(3, 3, '', ',') }‰</span>
              </div>
            </div>`;

            new Opentip(this, contenido, { style: 'bubbleStyle', tipJoint: 'bottom', borderRadius: 20 });
          }

        })
        .on('mouseover', function(d){
          APP_NAME_CHART.focus
            .attr('transform', `translate(${ APP_NAME_CHART.x(d.year) }, ${ APP_NAME_CHART.y(d.value) })`)
            .select('circle').style('stroke', function(){
              switch (d.class) {
                case 'f0':
                  return 'rgb(244, 129, 64)';
                case 'f1':
                  return '#BF360C';
                case 'f2':
                  return '#FBE9E7';
                case 'm0':
                  return '#4CAF50';
                case 'm1':
                  return '#1B5E20';
                case 'm2':
                  return '#C8E6C9';
              }
            });
        })
        .on('mouseout', function(d){
          APP_NAME_CHART.focus.attr('transform', 'translate(-100,-100)');
        });

    },
    nameStatistics: function (statistics) {
      var container = $('#nameDataContainer'),
          title, desc;

      container.empty();

      for (var i = 0; i < statistics.length; i++) {
        container.append(`<p>${ statistics[i] }</p>`);
      }

      return true;
    },
    displayErrors: function (all_errors) {
      var error_element = $('.form_errors ul');

      if (all_errors.empty_name === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>Por favor, completá tu nombre.</span></li>`);
      }
      if (all_errors.empty_year === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>Por favor, completá un año.</span></li>`);
      }
      if (all_errors.invalid_name === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>Revisá que tu nombre esté bien escrito.</span></li>`);
      }
      if (all_errors.invalid_year === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>Revisá que el año esté bien escrito.</span></li>`);
      }
      if (all_errors.limit_name === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>Podes ingresar hasta 3 nombres.</span></li>`);
      }
      if (all_errors.range_year === true) {
        error_element.append(`<li><span class="glyphicon glyphicon-exclamation-sign"></span><span>No tenemos esa fecha. Por favor, buscá entre ${ MIN_YEAR } y ${ MAX_YEAR }.</span></li>`);
      }
    }
  };

  App.initialize();
  App.render();

  $('.help-tooltip').tooltip();

  $(window).ready(function(){

    // Informacion Select
    var decadaStatistics, anioStatistics, datoSeleccionado;

    for (var i = MAX_YEAR; i >= MIN_YEAR; i--) {
      $('#yearData').append(`<option id="element${ i }">${ i }</option>`);
    }
    for (i = 2010; i >= 1920; i -= 10) {
      $('#decadaData').append(`<option id="element${ i }">${ i }</option>`);
    }

    var selectores = $('select')
      .SumoSelect({ nativeOnDevice: ['Android', 'BlackBerry', 'iPhone', 'iPad', 'iPod', 'Opera Mini', 'IEMobile', 'Silk']})
      .on('sumo:opened', (sumo) => {
        $.fn.fullpage.setAutoScrolling(false);
        $('body').css({ 'overflow': 'hidden' });
      })
      .on('sumo:closed', (sumo) => {
        $.fn.fullpage.setAutoScrolling(true);
        $('body').css({ 'overflow': 'visible' });
      });

    if ($('#year').val()) {
      selectores[0].sumo.selectItem($('#year').val().toString());
    }

    selectores[1].sumo.selectItem('1920');

    $('#decadaData').parent().hide();
    $('#yearData').parent().show();

    function informacionAnios() {
      $('#decadaData').parent().hide();
      $('#yearData').parent().show();

      return ($('#year').val())?($('#year').val()):(DEFAULT_YEAR);
    }
    function informacionDecadas() {
      $('#decadaData').parent().show();
      $('#yearData').parent().hide();

      return 'decada-1920';
    }
    function ejecutarStatisticsYear(year) {
      if ($(window).width() < 768){
        App.bubbleChart(year);
      } else {
        App.bubbleChart(year);
      }
    }

  //////////////////////////////////////////////////////////////////////////////
  // Manejo de eventos

  /* Ocultar el placeholder del input
    cuando el usuario hace foco en el elemento. */
    $('input[type=text]')
    .on('focusin', function() {
      $('this').addClass('not-placeholder');
    })
    .on('focusout', function() {
      $('this').removeClass('not-placeholder');
    });

  /* Cambiar las opciones del selector en funcion
    de los años o las decadas */
    $('input[type=radio]')
    .on('change', function(e) {
      if (this.value === 'decada') {
        decadaStatistics = informacionDecadas();
        ejecutarStatisticsYear(decadaStatistics);
      } else if (this.value === 'anio') {
        anioStatistics = informacionAnios();
        ejecutarStatisticsYear(anioStatistics);
      }
    });

  /* Generar el grafico de burbujas en funcion de
    la seleccion del input */
    $('.selectBubble')
    .on('change', function(e) {
      if ($('#anio').is(':checked')) {
        datoSeleccionado = $('#yearData').val();
      } else {
        datoSeleccionado = 'decada-' + $('#decadaData').val();
      }


      ejecutarStatisticsYear(datoSeleccionado);
    });

  /* Generar el grafico de burbujas en funcion
    del ancho de la pantalla */
    APP_WIDTH = $(window).width();

    var widthCheck = APP_WIDTH;

    $(window).resize(function() {
      bebeCheck = true;
      APP_WIDTH = $(window).width();

      App.updateNameChart(ACTIVE_NAMES, ACTIVE_YEAR, ACTIVE_NAMES_DATA);

      APP_WIDTH = $(window).width();

      if (widthCheck < 768 && APP_WIDTH > 768) {
        App.bubbleChart(ACTIVE_YEAR);
        widthCheck = APP_WIDTH;
      } else if (widthCheck > 768 && APP_WIDTH < 768) {
        App.bubbleChart(ACTIVE_YEAR);
        widthCheck = APP_WIDTH;
      }
    });
  });
});
