jQuery(function ($) {

  var NAMES_BASE_URL = "/names/"
    , YEARS_BASE_URL = "/years/"
    , MIN_YEAR = 1922
    , MAX_YEAR = 2015
    , statisticsCalculator = {}
    , DataProcessor = function (names, year, gender = "m") {
        this.names = names;
        this.processedNames = this._processNames(names);
        this.year = this._processYear(year);
        this.gender = gender; // dato genero
    };

  DataProcessor.prototype.fetchData = function (callback) {
    var namesDone = 0
      , yearDone = ! this.year
      , $processing = new $.Deferred()
      , namesData = {}
      , mainName = this.processedNames[0]
      , checkDone, yearData, i, length, name;

    checkDone = function () {
      if ((namesDone === this.processedNames.length) && yearDone) {
        statistics = this._fetchStatistics(namesData[mainName], this.year);
        $processing.resolve({
          names: this.names,
          processedNames: this.processedNames,
          year: this.year,
          namesData: namesData,
          yearData: yearData,
          statistics: statistics
        });
      }
    }.bind(this);

    window.GENDER = false;

    for (i = 0, length = this.processedNames.length; i < length; i += 1) {
      name = this.processedNames[i];

      if (this.processedNames[i] === "") {
        $processing.reject({ type: "invalid_name", name: name });
        return $processing;
      }

      (function (newName) {
        $('#errorName').attr('class', 'hide').empty(); // Borramos errores año

        this._fetchNameData(newName).done(function (nameDataResponse) {

          if (!window.GENDER) {
            window.GENDER = nameDataResponse[0].gender; // agrego genero global
            // color genero seccion 3
            if (window.GENDER == "f") {
              $('#section3').css({'background-color': 'rgb(244, 129, 64)'});
            } else {
              $('#section3').css({'background-color': '#4CAF50'});
            }
          }

          namesDone += 1;
          namesData[newName] = nameDataResponse;
          checkDone();

          // Envia a la seccion 2 cuando recibe un pedido
          if (window.location.pathname !== '/') {
              window.location.hash = "#seccion2";
          }

        }).fail(function (nameDataResponse) {
          $('#name').css( 'margin-bottom', '0.5rem' );
          $('#errorName').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
          $('#errorName').append('No tenemos resultados. Revisá que el nombre esté bien escrito o probá con otro.');
          $.fn.fullpage.destroy('all');
          $('#section1').css({ margin: '0px', height: '100vh'});
          $('#section1 > section').css({ margin: '0px'});
          $('#section2').hide();
          $('#section3').hide();
          $('#section4').hide();
          $('#section5').hide();
        });

      }.bind(this)(name));
    }

    if (!yearDone) {
      $('#errorYear').attr('class', 'hide').empty(); // Borramos errores año
      this._fetchYearData().done(function (yearDataResponse) {
        yearDone = true;
        yearData = yearDataResponse;
        checkDone();
      }).fail(function () {
        $('#year').css( 'margin-bottom', '0.5rem' );
        $('#errorYear').attr('class', '').css( 'margin-bottom', '0.5rem' ).append('<div class="glyphicon glyphicon-exclamation-sign" style="margin-right:5px;"></div>');
        $('#errorYear').append('No tenemos esa fecha. Por favor, buscá entre 1922 y 2015.');
      });
    }

    return $processing;
  };

  DataProcessor.prototype._fetchNameData = function (processedName) {
    return $.ajax({
      url: NAMES_BASE_URL + processedName + ".json",
      method: "GET",
      dataType: "json"
    });
  };

  DataProcessor.prototype._fetchYearData = function () {
    return $.ajax({
      url: YEARS_BASE_URL + this.year + ".json",
      method: "GET",
      dataType: "json"
    });
  };

  DataProcessor.prototype._processNames = function (names) {
    var processedNames = []
      , i, length

    for (i = 0, length = names.length; i < length; i += 1) {
      processedNames.push(this._processName(names[i]));
    }

    return processedNames;
  };

  DataProcessor.prototype._processName = function (name) {
    var replacements = [
      [/á/, "a"],
      [/é/, "e"],
      [/í/, "i"],
      [/ó/, "o"],
      [/ú/, "u"],
      [/ñ/, "n"],
      [/[^\sa-zA-Z\d]+/g, " "],
      [/\s+/g, "_"],
      [/^_+/, ""],
      [/_+$/, ""]
    ]
    , length = replacements.length
    , i = 0;

    name = name.toLowerCase();

    for (; i < length; i += 1) {
      name = name.replace(replacements[i][0], replacements[i][1]);
    }

    return name;
  };

  DataProcessor.prototype._processYear = function (yearStr) {
    var year = parseInt(yearStr, 10);

    if (year >= 0) {
      return year;
    }
    else {
      return null;
    }
  };

  DataProcessor.prototype._fetchStatistics = function (nameData, currYear) {
    var statistics = []
      , name = this.names[0];

    statistics.push(statisticsCalculator.totalNames(name, nameData));
    statistics.push(statisticsCalculator.minMaxYear(name, nameData));
    statistics.push(statisticsCalculator.currentYear(name, nameData, currYear));

    return statistics;
  };

  statisticsCalculator.totalNames = function (name, nameData) {
    var totalQuantity = 0
    , length = nameData.length
    , i = 0;

    for (; i < length; i += 1) {
      totalQuantity += nameData[i].quantity;
    }

    if (totalQuantity > 1) {
      return `Entre 1922 y 2015, se registraron <b>${ new Intl.NumberFormat("de-DE").format(totalQuantity) }</b> personas llamadas <b>${ capitalizeFirstLetter(name.toLowerCase()) }</b>.`;
    } else {
      return `Entre 1922 y 2015, sólo vos te llamaste <b>${ capitalizeFirstLetter(name.toLowerCase()) }</b>.`;
    }
  };
  statisticsCalculator.minMaxYear = function (name, nameData) {
    var maxYear = 1922
      , maxYearNumber = 0
      , length = nameData.length
      , i = 0;

    for (; i < length; i += 1) {
      if (nameData[i].quantity > maxYearNumber) {
        maxYear = nameData[i].year;
        maxYearNumber = nameData[i].quantity;
      }
    }

    var minYear = MIN_YEAR
      , minYearNumber = 9999999
      , length = nameData.length
      , year, quantity, i;

    for (year = MIN_YEAR; year <= MAX_YEAR; year++) {
      quantity = 0;
      for (i = 0; i < nameData.length; i += 1) {
        if (nameData[i].year == year) {
          quantity = nameData[i].quantity;
        }
      }
      if (quantity < minYearNumber) {
        minYear = year;
        minYearNumber = quantity;
      }
    }
    return `Tu nombre alcanzó la mayor popularidad en <b>${ maxYear }</b> y, la menor, en <b>${ minYear }</b>.`;
  };
  statisticsCalculator.currentYear = function (name, nameData, currYear) {
    var indexCurrYear = currYear - MIN_YEAR;
    var numNamesCurrYear = nameData[indexCurrYear].quantity;

    if (numNamesCurrYear == 0) {
      return `Nadie se llamó así en ${ currYear }.`;
    } else if(numNamesCurrYear == 1){
      return `En ${ currYear }, sólo vos te llamaste así.`;
    } else {
      return `En ${ currYear }, otras <b>${ new Intl.NumberFormat("de-DE").format(numNamesCurrYear - 1) }</b> personas se llamaron igual que vos.`;
    }
  }

  function capitalizeFirstLetter(name) {
    var nombres = name.split(" ");
    var connectors = ["de", "los", "del", "las", "la", "el"];

    // Solo capitalizar palabra si no es un conector
    for (var i=0; i < nombres.length; i++) {
      if (connectors.indexOf(nombres[i]) == -1)
        nombres[i] = nombres[i].charAt(0).toUpperCase() + nombres[i].slice(1);
    }

    name = nombres.join(" ");

    return name;
  }

  window.DataProcessor = DataProcessor;

});
