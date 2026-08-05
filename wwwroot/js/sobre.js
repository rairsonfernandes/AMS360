/* ========================================
   AMS360 - Página Sobre
   ======================================== */

(function() {
    'use strict';

    // ========================================
    // INICIALIZAÇÃO
    // ========================================

    document.addEventListener('DOMContentLoaded', function() {
        // Atualizar hora
        updateClock();
        setInterval(updateClock, 60000);
    });

    // ========================================
    // RELÓGIO
    // ========================================

    function updateClock() {
        const now = new Date();
        const updateTime = document.getElementById('updateTime');
        if (updateTime) {
            updateTime.textContent = now.toLocaleString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }
    }

    // ========================================
    // BUSCA DE CIDADES
    // ========================================

    window.buscarCidade = function(termo, closeMenu) {
        termo = termo.trim();
        if (termo === '') {
            alert('Por favor, digite o nome de uma cidade.');
            return;
        }

        var url = '/Weather/Index?city=' + encodeURIComponent(termo);
        window.location.href = url;
    };

    window.buscarCidadeDesktop = function() {
        var input = document.getElementById('searchInputDesktop');
        if (input) buscarCidade(input.value, false);
    };

    window.buscarCidadeMobile = function() {
        var input = document.getElementById('searchInputMobile');
        if (input) buscarCidade(input.value, true);
    };

    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            var target = e.target;
            if (target && target.id === 'searchInputDesktop') {
                buscarCidadeDesktop();
            } else if (target && target.id === 'searchInputMobile') {
                buscarCidadeMobile();
            }
        }
    });

    // ========================================
    // MENU MOBILE
    // ========================================

    window.toggleMobileMenu = function() {
        var menu = document.getElementById('mobileMenu');
        var body = document.body;
        if (menu) {
            menu.classList.toggle('show');
            body.style.overflow = menu.classList.contains('show') ? 'hidden' : '';
        }
    };

    document.addEventListener('click', function(e) {
        var menu = document.getElementById('mobileMenu');
        var toggler = document.querySelector('.navbar-toggler-ams');
        if (menu && menu.classList.contains('show')) {
            if (!menu.contains(e.target) && !toggler?.contains(e.target)) {
                menu.classList.remove('show');
                document.body.style.overflow = '';
            }
        }
    });

})();