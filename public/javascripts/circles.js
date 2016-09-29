$('window').ready(function() {

    var dataset = ['#seccion1', '#seccion2', '#seccion3', '#seccion4'];

    var containerSlide = d3.select('#containerSlide')
        .append('svg')
        .attr('id', 'iconoSeccion')
        .selectAll('a')
        .data(dataset)
        .enter()
        .append('a')
        .attr('href', function(d) {
            return d;
        })
        .append('circle')
        .attr('cx', 8)
        .attr('cy', function(d, i) {
            return 12 * (i + 1) + 27 + (12 * i);
        })
        .attr('r', 6)
        .attr('stroke', '#3C3C3C')
        .attr('fill', function(d, i) {
            if (i == 0) {
                return '#3C3C3C';
            } else {
                return 'none';
            }
        })
        .on('click', function(d, i) {
            for (var i = 0; i < iconos.length; i++) {
                if (this == iconos[i]) {
                    iconos[i].setAttribute('fill', '#3C3C3C');
                    $('#seccion' + [i + 1]).attr('class', 'panels animated')
                } else {
                    iconos[i].setAttribute('fill', 'none');
                    $('#seccion' + [i + 1]).attr('class', 'panels')
                }
            }
        });

    var seccionPosicion1 = window.document.querySelector('#seccion1').getBoundingClientRect().top;
    var seccionPosicion2 = window.document.querySelector('#seccion2').getBoundingClientRect().top;
    var seccionPosicion3 = window.document.querySelector('#seccion3').getBoundingClientRect().top;
    var seccionPosicion4 = window.document.querySelector('#seccion4').getBoundingClientRect().top;
    var iconos = $('circle');

    function detectarPosicion(posicion) {
        for (var i = 0; i < iconos.length; i++) {
            if (iconos[i].parentNode.getAttribute('href') == posicion) {
                iconos[i].setAttribute('fill', '#3C3C3C');
                $('#seccion' + [i + 1]).attr('class', 'panels animated')
            } else {
                iconos[i].setAttribute('fill', 'none');
                $('#seccion' + [i + 1]).attr('class', 'panels')
            }
        }
    }

    $(document).scroll(function(e) {
        var posicionActual = $(document).scrollTop();

        if (posicionActual > (seccionPosicion4 - 70)) {
            detectarPosicion('#seccion4');

        } else if (posicionActual > (seccionPosicion3 - 70)) {
            detectarPosicion('#seccion3');

        } else if (posicionActual > (seccionPosicion2 - 70)) {
            detectarPosicion('#seccion2');

        } else {
            detectarPosicion('#seccion1');

        }
    });

})
