/*
 * estado.js — as regras do Ponto a Ponto.
 *
 * Este arquivo não conhece a tela: só guarda a partida e diz o que pode
 * ou não acontecer. A interface pergunta, aqui a gente responde.
 */
(function (global) {
  'use strict';

  // Quanto vale cada dificuldade: o acerto soma, o erro desconta o mesmo tanto.
  var VALORES = { facil: 1, media: 2, dificil: 3 };

  var ROTULOS_DIFICULDADE = { facil: 'Fácil', media: 'Média', dificil: 'Difícil' };

  // As fases pelas quais uma rodada passa, sempre nesta ordem.
  var FASES = {
    ESCOLHAS: 'escolhas',   // cada jogador decide responder ou passar
    MARCACAO: 'marcacao',   // carta virada, marcando quem acertou e quem errou
    LIGACOES: 'ligacoes',   // quem acertou liga dois pontos, um por vez
    FIM: 'fim'
  };

  /* Embaralha uma cópia da lista (Fisher-Yates). */
  function embaralhar(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var troca = copia[i];
      copia[i] = copia[j];
      copia[j] = troca;
    }
    return copia;
  }

  /*
   * Monta uma partida nova. Recebe os jogadores já com nome e cor,
   * o baralho de perguntas, o desenho e a opção de pontuação negativa.
   */
  function criarPartida(config) {
    var estado = {
      jogadores: config.jogadores.map(function (jogador, indice) {
        return {
          id: indice,
          nome: jogador.nome,
          cor: jogador.cor,
          pontos: 0,
          ligacoesFeitas: 0,
          escolha: null,            // 'responder' ou 'passar' nesta rodada
          passouNaRodadaAnterior: false,
          resultado: null           // 'acertou' ou 'errou' nesta rodada
        };
      }),
      baralho: embaralhar(config.perguntas),
      indiceCarta: -1,
      rodada: 0,
      fase: null,
      permitirNegativo: !!config.permitirNegativo,
      desenho: config.desenho,
      // Para cada linha-guia do desenho: null se ainda não foi feita,
      // ou o id do jogador que a fez.
      autorDaLinha: config.desenho.linhas.map(function () { return null; }),
      filaDeLigacoes: [],           // ids de quem ainda tem uma ligação para fazer
      motivoFim: null,
      comecouEm: Date.now(),        // marca o início para o cronômetro
      terminouEm: null
    };

    iniciarRodada(estado);
    return estado;
  }

  /*
   * Começa a rodada seguinte puxando uma carta.
   * Se o baralho acabou, a partida termina aqui.
   */
  function iniciarRodada(estado) {
    if (estado.indiceCarta + 1 >= estado.baralho.length) {
      encerrar(estado, 'cartas');
      return;
    }

    estado.indiceCarta += 1;
    estado.rodada += 1;
    estado.fase = FASES.ESCOLHAS;

    estado.jogadores.forEach(function (jogador) {
      // Quem passou na rodada anterior é obrigado a responder nesta.
      jogador.passouNaRodadaAnterior = jogador.escolha === 'passar';
      jogador.escolha = null;
      jogador.resultado = null;
    });
  }

  function cartaAtual(estado) {
    return estado.baralho[estado.indiceCarta] || null;
  }

  function cartasRestantes(estado) {
    return Math.max(0, estado.baralho.length - estado.indiceCarta - 1);
  }

  function jogadorPor(estado, id) {
    return estado.jogadores.filter(function (jogador) { return jogador.id === id; })[0];
  }

  /* Quem passou na rodada anterior não pode passar de novo. */
  function podePassar(jogador) {
    return !jogador.passouNaRodadaAnterior;
  }

  function definirEscolha(estado, id, escolha) {
    if (estado.fase !== FASES.ESCOLHAS) {
      return { ok: false, motivo: 'Não é hora de escolher.' };
    }
    var jogador = jogadorPor(estado, id);
    if (escolha === 'passar' && !podePassar(jogador)) {
      return {
        ok: false,
        motivo: jogador.nome + ' passou na rodada anterior e precisa responder nesta.'
      };
    }
    jogador.escolha = escolha;
    return { ok: true };
  }

  function todosEscolheram(estado) {
    return estado.jogadores.every(function (jogador) { return jogador.escolha !== null; });
  }

  /* Vira a carta: a resposta correta só aparece depois de todos escolherem. */
  function virarCarta(estado) {
    if (estado.fase !== FASES.ESCOLHAS || !todosEscolheram(estado)) return false;
    estado.fase = FASES.MARCACAO;
    return true;
  }

  /* Quem respondeu precisa ser marcado como acertou ou errou. */
  function quemRespondeu(estado) {
    return estado.jogadores.filter(function (jogador) { return jogador.escolha === 'responder'; });
  }

  function definirResultado(estado, id, resultado) {
    if (estado.fase !== FASES.MARCACAO) return false;
    var jogador = jogadorPor(estado, id);
    if (jogador.escolha !== 'responder') return false;
    jogador.resultado = resultado;
    return true;
  }

  function todosMarcados(estado) {
    return quemRespondeu(estado).every(function (jogador) { return jogador.resultado !== null; });
  }

  /*
   * Aplica os pontos da rodada e monta a fila de quem ganhou ligação.
   * Quem passou não ganha nem perde nada.
   */
  function confirmarResultados(estado) {
    if (estado.fase !== FASES.MARCACAO || !todosMarcados(estado)) return false;

    var valor = VALORES[cartaAtual(estado).dificuldade];

    estado.jogadores.forEach(function (jogador) {
      if (jogador.resultado === 'acertou') {
        jogador.pontos += valor;
      } else if (jogador.resultado === 'errou') {
        jogador.pontos -= valor;
        // Sem pontuação negativa, o placar para no zero.
        if (!estado.permitirNegativo && jogador.pontos < 0) jogador.pontos = 0;
      }
    });

    // Cada acerto dá direito a exatamente uma ligação, em qualquer dificuldade.
    estado.filaDeLigacoes = estado.jogadores
      .filter(function (jogador) { return jogador.resultado === 'acertou'; })
      .map(function (jogador) { return jogador.id; });

    // A rodada fica na fase de ligações mesmo quando ninguém acertou: assim os
    // jogadores ainda veem a resposta na tela e só então pedem a próxima carta.
    estado.fase = FASES.LIGACOES;
    return true;
  }

  /* A rodada acabou quando não há mais ninguém na fila de ligações. */
  function rodadaEncerrada(estado) {
    return estado.fase === FASES.LIGACOES && estado.filaDeLigacoes.length === 0;
  }

  /* De quem é a vez de ligar dois pontos. */
  function jogadorDaVezDeLigar(estado) {
    if (estado.fase !== FASES.LIGACOES || estado.filaDeLigacoes.length === 0) return null;
    return jogadorPor(estado, estado.filaDeLigacoes[0]);
  }

  /* Procura a linha-guia entre dois pontos; devolve o índice ou -1. */
  function acharLinhaGuia(estado, a, b) {
    for (var i = 0; i < estado.desenho.linhas.length; i++) {
      var linha = estado.desenho.linhas[i];
      if ((linha[0] === a && linha[1] === b) || (linha[0] === b && linha[1] === a)) return i;
    }
    return -1;
  }

  /*
   * Diz se dá para ligar dois pontos e, quando não dá, explica o motivo
   * em português para a interface mostrar ao jogador.
   */
  function podeLigar(estado, a, b) {
    if (a === b) {
      return { ok: false, motivo: 'Escolha dois pontos diferentes.' };
    }
    var indice = acharLinhaGuia(estado, a, b);
    if (indice === -1) {
      return {
        ok: false,
        motivo: 'Não existe linha-guia entre esses dois pontos. Só dá para ligar pontos que já têm uma guia na folha.'
      };
    }
    if (estado.autorDaLinha[indice] !== null) {
      var autor = jogadorPor(estado, estado.autorDaLinha[indice]);
      return {
        ok: false,
        motivo: 'Essa ligação já foi feita por ' + autor.nome + '. Escolha uma linha-guia ainda apagada.'
      };
    }
    return { ok: true, indiceLinha: indice };
  }

  /* Lista os pontos que ainda podem ser ligados a este. */
  function vizinhosDisponiveis(estado, ponto) {
    var vizinhos = [];
    estado.desenho.linhas.forEach(function (linha, indice) {
      if (estado.autorDaLinha[indice] !== null) return;
      if (linha[0] === ponto) vizinhos.push(linha[1]);
      else if (linha[1] === ponto) vizinhos.push(linha[0]);
    });
    return vizinhos;
  }

  /* Faz a ligação para o jogador da vez e passa a vez adiante. */
  function registrarLigacao(estado, a, b) {
    var jogador = jogadorDaVezDeLigar(estado);
    if (!jogador) return { ok: false, motivo: 'Não é hora de ligar pontos.' };

    var teste = podeLigar(estado, a, b);
    if (!teste.ok) return teste;

    estado.autorDaLinha[teste.indiceLinha] = jogador.id;
    jogador.ligacoesFeitas += 1;
    estado.filaDeLigacoes.shift();

    // Desenho pronto: a partida acaba mesmo que ainda houvesse gente na fila.
    if (desenhoCompleto(estado)) encerrar(estado, 'desenho');

    return { ok: true, indiceLinha: teste.indiceLinha, jogador: jogador };
  }

  function linhasFeitas(estado) {
    return estado.autorDaLinha.filter(function (autor) { return autor !== null; }).length;
  }

  function desenhoCompleto(estado) {
    return linhasFeitas(estado) === estado.desenho.linhas.length;
  }

  /* Fim das ligações: puxa a próxima carta (ou encerra, se acabaram). */
  function avancar(estado) {
    if (estado.fase === FASES.FIM) return;
    iniciarRodada(estado);
  }

  function encerrar(estado, motivo) {
    estado.fase = FASES.FIM;
    estado.motivoFim = motivo; // 'desenho' ou 'cartas'
    estado.filaDeLigacoes = [];
    // O cronômetro para aqui e não anda mais.
    if (estado.terminouEm === null) estado.terminouEm = Date.now();
  }

  /* Quanto tempo a partida já levou, em milissegundos. */
  function duracao(estado) {
    return (estado.terminouEm === null ? Date.now() : estado.terminouEm) - estado.comecouEm;
  }

  /*
   * Classificação final. Não existe critério de desempate nas regras,
   * então empate fica empate mesmo: todos com a maior pontuação aparecem juntos.
   */
  function classificacao(estado) {
    var ordenados = estado.jogadores.slice().sort(function (a, b) { return b.pontos - a.pontos; });
    var maior = ordenados.length ? ordenados[0].pontos : 0;
    var campeoes = ordenados.filter(function (jogador) { return jogador.pontos === maior; });
    return { ordenados: ordenados, campeoes: campeoes, houveEmpate: campeoes.length > 1 };
  }

  global.PontoAPonto = global.PontoAPonto || {};
  global.PontoAPonto.regras = {
    FASES: FASES,
    VALORES: VALORES,
    ROTULOS_DIFICULDADE: ROTULOS_DIFICULDADE,
    criarPartida: criarPartida,
    cartaAtual: cartaAtual,
    cartasRestantes: cartasRestantes,
    jogadorPor: jogadorPor,
    podePassar: podePassar,
    definirEscolha: definirEscolha,
    todosEscolheram: todosEscolheram,
    virarCarta: virarCarta,
    quemRespondeu: quemRespondeu,
    definirResultado: definirResultado,
    todosMarcados: todosMarcados,
    confirmarResultados: confirmarResultados,
    rodadaEncerrada: rodadaEncerrada,
    avancar: avancar,
    jogadorDaVezDeLigar: jogadorDaVezDeLigar,
    podeLigar: podeLigar,
    vizinhosDisponiveis: vizinhosDisponiveis,
    registrarLigacao: registrarLigacao,
    linhasFeitas: linhasFeitas,
    desenhoCompleto: desenhoCompleto,
    duracao: duracao,
    classificacao: classificacao
  };
})(window);
