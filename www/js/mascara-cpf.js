// Máscara de CPF - Compatível com Electron
(function() {
    'use strict';

    function formatarCPF(valor) {
        // Remove tudo que não é número
        var numeros = valor.replace(/\D/g, '');
        
        // Limita a 11 dígitos
        numeros = numeros.substring(0, 11);
        
        // Aplica a máscara XXX.XXX.XXX-XX
        if (numeros.length <= 3) {
            return numeros;
        } else if (numeros.length <= 6) {
            return numeros.substring(0, 3) + '.' + numeros.substring(3);
        } else if (numeros.length <= 9) {
            return numeros.substring(0, 3) + '.' + numeros.substring(3, 6) + '.' + numeros.substring(6);
        } else {
            return numeros.substring(0, 3) + '.' + numeros.substring(3, 6) + '.' + numeros.substring(6, 9) + '-' + numeros.substring(9, 11);
        }
    }

    // Inicializa quando o DOM está pronto
    function inicializarMascaraCPF() {
        var cpfInput = document.getElementById('cpf_ipt');
        
        if (!cpfInput) {
            // Tenta novamente depois de um tempo
            setTimeout(inicializarMascaraCPF, 500);
            return;
        }

        // Handler para input
        function aoDigitar() {
            this.value = formatarCPF(this.value);
        }

        // Handler para tecla pressionada
        function aoTeclaPresionada(e) {
            var char = String.fromCharCode(e.which);
            if (!/[0-9]/.test(char) && e.which !== 8 && e.which !== 9 && e.which !== 46) {
                e.preventDefault();
            }
        }

        // Adiciona listeners
        cpfInput.addEventListener('input', aoDigitar, false);
        cpfInput.addEventListener('keypress', aoTeclaPresionada, false);
        cpfInput.addEventListener('change', aoDigitar, false);
        cpfInput.addEventListener('blur', aoDigitar, false);
        
        // Listener para paste
        cpfInput.addEventListener('paste', function() {
            var self = this;
            setTimeout(function() {
                self.value = formatarCPF(self.value);
            }, 10);
        }, false);

        console.log('Máscara de CPF inicializada com sucesso');
    }

    // Inicia quando o documento estiver pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializarMascaraCPF);
    } else {
        inicializarMascaraCPF();
    }
})();
