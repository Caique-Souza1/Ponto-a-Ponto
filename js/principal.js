/*
 * principal.js — liga o jogo.
 *
 * Carrega o baralho e o desenho e entrega para a interface. Se nada puder
 * ser carregado, avisa na tela em vez de deixar a página muda.
 */
(function (global) {
  'use strict';

  global.PontoAPonto.dados.carregar()
    .then(function (dados) {
      global.PontoAPonto.interface.iniciar(dados);
    })
    .catch(function (erro) {
      global.PontoAPonto.interface.mostrarFalha(
        'Não foi possível começar: ' + erro.message
      );
    });
})(window);
