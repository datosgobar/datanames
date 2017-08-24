jQuery(function ($) {

  var NAMES_BASE_URL = "/names/"
    , YEARS_BASE_URL = "/years/"
    , MIN_YEAR = 1922
    , MAX_YEAR = 2015
    , statisticsCalculator = {}
    , DataProcessor = function (main_name, main_name_data, other_names, other_names_data, year, gender = "m") {
        this.mainName = main_name;
        this.mainNameData = main_name_data;
        this.otherNames = other_names;
        this.otherNamesData = other_names_data;
        this.mainNameData = main_name_data;
        this.year = this._processYear(year);
        this.gender = gender;
    };

  DataProcessor.prototype.fetchData = function (callback) {
    var yearDone = ! this.year,
        mainName = this.mainName,
        mainNameData = this.mainNameData,
        otherNames = this.otherNames,
        otherNamesData = this.otherNamesData,
        year = this.year,
        $processing = new $.Deferred(),
        checkDone, yearData, i, length, name;

    var processedNames = [];
    var namesData = {};
    processedNames.push(mainName);
    namesData[mainName] = mainNameData;
    for (var i=0; i < otherNames.length; i++) {
      processedNames.push(otherNames[i]);
      namesData[otherNames[i]] = JSON.parse(otherNamesData[i]);
    }

    checkDone = function () {
      if (yearDone) {
        statistics = this._fetchStatistics(mainNameData, year);
        $processing.resolve({
          year: year,
          yearData: yearData,
          statistics: statistics,
          processedNames: processedNames,
          namesData: namesData
        });
      }
    }.bind(this);

    window.GENDER = false;

    if (mainNameData.length == 0) {
      $processing.reject({ type: "invalid_name", name: mainName });
      return $processing;
    }

    otherNamesData.forEach(function(v, k) {
      if (v.length === 2) {
        $processing.reject({ type: "invalid_name", name: otherNames[k] });
        return $processing;
      }
    });

    if (year === '') { // Validaciones años
      $processing.reject({ type: "empty_year", year: year });
      return $processing;
    } else if (year > MAX_YEAR || year < MIN_YEAR) {
      $processing.reject({ type: "range_year", year: year });
      return $processing;
    } else if (isNaN(Number(year.toString().trim())) === true || parseInt(year.toString().trim()).toString().length !== 4) {
      $processing.reject({ type: "invalid_year", year: year });
      return $processing;
    }

    $('#errorName').attr('class', 'hide').empty(); // Borramos errores año

    if (!window.GENDER) {
      window.GENDER = mainNameData[0].gender; // agrego genero global
      // color genero seccion 3
      if (window.GENDER == "f") {
        $('#section3').css({'background-color': 'rgb(244, 129, 64)'});
      } else {
        $('#section3').css({'background-color': '#4CAF50'});
      }
    }

    // Envia a la seccion 2 cuando recibe un pedido
    if (window.location.pathname !== '/') {
        window.location.hash = "#seccion2";
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

  DataProcessor.prototype._fetchYearData = function () {
    return $.ajax({
      url: YEARS_BASE_URL + this.year + ".json",
      method: "GET",
      dataType: "json"
    });
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
      ["_", " "],
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

  DataProcessor.prototype._fetchStatistics = function (mainNameData, currYear) {
    var statistics = []
      , name = this.mainName;

    statistics.push(statisticsCalculator.totalNames(name, mainNameData));
    statistics.push(statisticsCalculator.minMaxYear(name, mainNameData));
    statistics.push(statisticsCalculator.currentYear(name, mainNameData, currYear));

    return statistics;
  };

  statisticsCalculator.totalNames = function (name, mainNameData) {
    var totalQuantity = 0
    , length = mainNameData.length
    , i = 0;

    for (; i < length; i += 1) {
      totalQuantity += mainNameData[i].quantity;
    }

    if (totalQuantity > 1) {
      return `Entre 1922 y 2015, se registraron <b>${ new Intl.NumberFormat("de-DE").format(totalQuantity) }</b> personas llamadas <b>${ capitalizeFirstLetter(name.toLowerCase()) }</b>.`;
    } else {
      return `Entre 1922 y 2015, sólo vos te llamaste <b>${ capitalizeFirstLetter(name.toLowerCase()) }</b>.`;
    }
  };

  statisticsCalculator.minMaxYear = function (name, nameData) {
    var yearMinPop = nameData.filter(function(d) { return d.percentage === d3.min(nameData, (c) => c.percentage); })[0].year,
        yearMaxPop = nameData.filter(function(d) { return d.percentage === d3.max(nameData, (c) => c.percentage); })[0].year;

    return `Tu nombre alcanzó la mayor popularidad en <b>${ yearMaxPop }</b> y, la menor, en <b>${ yearMinPop }</b>.`;
  };

  statisticsCalculator.currentYear = function (name, mainNameData, currYear) {
    var indexCurrYear = currYear - MIN_YEAR;
    var numNamesCurrYear = mainNameData[indexCurrYear].quantity;

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
