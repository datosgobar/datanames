jQuery(function ($) {

  var variableGenero;
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

    for (i = 0, length = this.processedNames.length; i < length; i += 1) {
      name = this.processedNames[i];

      if (this.processedNames[i] === "") {
        $processing.reject({ type: "invalid_name", name: name });
        return $processing;
      }

      (function (newName) {
        this._fetchNameData(newName).done(function (nameDataResponse) {
          window.GENDER = nameDataResponse[0].gender; // agrego genero global
          variableGenero = nameDataResponse[0].gender; // agrego genero global

          if (window.GENDER == undefined || window.GENDER == "f"){
            $('#section3')[0].style.backgroundColor = '#F5712E';
            // document.querySelectorAll('.line0')[0].style.stroke = '#F5712E';
          } else {
            $('#section3')[0].style.backgroundColor = '#42BD5C';
            // document.querySelectorAll('.line0')[0].style.stroke = '#42BD5C';
          }

          namesDone += 1;
          namesData[newName] = nameDataResponse;
          checkDone();
        }).fail(function () {
          $processing.reject({ type: "name_not_found", name: newName });
        });
      }.bind(this)(name));
    }

    if (!yearDone) {
      this._fetchYearData().done(function (yearDataResponse) {
        yearDone = true;
        yearData = yearDataResponse;
        checkDone();
      }).fail(function () {
        $processing.reject({ type: "year_not_found" });
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
      [/( de los| del| de las| de la| de)(\s.*)?/, " "],
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

    return "Entre los años 1922 y 2015, nacieron <b>" + totalQuantity + " " + capitalizeFirstLetter(name) + "</b>.";
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

    return "Tu nombre alcanzó la mayor popularidad en <b>" + maxYear + "</b> y la menor en <b>" + minYear + "</b>.";
  };

  statisticsCalculator.currentYear = function (name, nameData, currYear) {
    var indexCurrYear = currYear - MIN_YEAR;
    var numNamesCurrYear = nameData[indexCurrYear].quantity;

    if(numNamesCurrYear == 1){
      return "El año en el que naciste, solo <b>" + numNamesCurrYear + "</b> persona se llamó igual que vos. ¡Uauu!";
    } else {
      return "El año en el que naciste, otras <b>" + numNamesCurrYear + "</b> personas se llamaron igual que vos. ¡Uauu!";
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
