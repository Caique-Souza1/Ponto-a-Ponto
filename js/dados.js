/*
 * dados.js — carrega o baralho de perguntas e o desenho.
 *
 * Os arquivos de verdade são dados/perguntas.json e dados/desenho.json.
 * Só que, quando a gente abre o index.html direto do disco (endereço file://),
 * o navegador proíbe ler arquivos da pasta por segurança. Para o jogo funcionar
 * mesmo assim, existe uma cópia embutida em js/dados-reserva.js, usada só
 * nesse caso — e a tela avisa quando isso acontece.
 */
(function (global) {
  'use strict';

  /* Confere se o baralho tem o formato esperado. */
  function validarPerguntas(lista) {
    if (!Array.isArray(lista) || lista.length === 0) {
      throw new Error('O baralho precisa ser uma lista com pelo menos uma pergunta.');
    }
    lista.forEach(function (carta, indice) {
      if (!carta || typeof carta.pergunta !== 'string' || typeof carta.resposta !== 'string') {
        throw new Error('A carta ' + (indice + 1) + ' precisa ter pergunta e resposta.');
      }
      if (['facil', 'media', 'dificil'].indexOf(carta.dificuldade) === -1) {
        throw new Error('A carta ' + (indice + 1) + ' tem dificuldade inválida: ' + carta.dificuldade);
      }
    });
    return lista;
  }

  /* Confere se o desenho tem pontos e linhas coerentes entre si. */
  function validarDesenho(desenho) {
    if (!desenho || !Array.isArray(desenho.pontos) || !Array.isArray(desenho.linhas)) {
      throw new Error('O desenho precisa ter as listas "pontos" e "linhas".');
    }
    if (desenho.pontos.length < 2 || desenho.linhas.length < 1) {
      throw new Error('O desenho precisa de pelo menos dois pontos e uma linha.');
    }
    desenho.linhas.forEach(function (linha, indice) {
      if (!Array.isArray(linha) || linha.length !== 2) {
        throw new Error('A linha ' + (indice + 1) + ' precisa ser um par [a, b].');
      }
      if (!desenho.pontos[linha[0]] || !desenho.pontos[linha[1]]) {
        throw new Error('A linha ' + (indice + 1) + ' aponta para um ponto que não existe.');
      }
    });
    return desenho;
  }

  /* Busca um JSON da pasta dados/. Devolve null se o navegador não deixar. */
  function buscarArquivo(caminho) {
    return fetch(caminho)
      .then(function (resposta) {
        if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
        return resposta.json();
      })
      .catch(function () { return null; });
  }

  /*
   * Devolve { perguntas, desenho, usandoReserva }.
   * usandoReserva = true significa que os .json não puderam ser lidos.
   */
  function carregar() {
    return Promise.all([
      buscarArquivo('dados/perguntas.json'),
      buscarArquivo('dados/desenho.json')
    ]).then(function (resultados) {
      var perguntas = resultados[0];
      var desenho = resultados[1];
      var usandoReserva = false;

      if (!perguntas || !desenho) {
        var reserva = global.PontoAPonto && global.PontoAPonto.reserva;
        if (!reserva) {
          throw new Error('Não foi possível ler os arquivos da pasta dados/ e não há cópia de reserva.');
        }
        perguntas = perguntas || reserva.perguntas;
        desenho = desenho || reserva.desenho;
        usandoReserva = true;
      }

      return {
        perguntas: validarPerguntas(perguntas),
        desenho: validarDesenho(desenho),
        usandoReserva: usandoReserva
      };
    });
  }

  global.PontoAPonto = global.PontoAPonto || {};
  global.PontoAPonto.dados = { carregar: carregar };
})(window);
