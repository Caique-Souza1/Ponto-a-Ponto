/*
 * interface.js — as telas do jogo.
 *
 * Aqui não mora nenhuma regra: tudo que é decisão de jogo vem de estado.js.
 * Este arquivo só desenha a tela a partir do estado e devolve os cliques.
 */
(function (global) {
  'use strict';

  var regras = global.PontoAPonto.regras;
  var FASES = regras.FASES;

  // Paleta de cores dos jogadores. Duas pessoas não podem repetir cor,
  // porque a cor é o que identifica quem fez cada ligação na folha.
  var CORES = [
    { nome: 'Vermelho', valor: '#e0432c' },
    { nome: 'Azul', valor: '#2f6fe2' },
    { nome: 'Verde', valor: '#1f9d5b' },
    { nome: 'Roxo', valor: '#8b44d0' },
    { nome: 'Laranja', valor: '#e08a1e' },
    { nome: 'Rosa', valor: '#d6398c' },
    { nome: 'Turquesa', valor: '#0f9aa8' },
    { nome: 'Marrom', valor: '#8a5a3c' }
  ];

  var MINIMO_JOGADORES = 2;
  var MAXIMO_JOGADORES = 5;

  var dadosDoJogo = null;   // { perguntas, desenho }
  var estado = null;
  var folha = null;
  var pontoSelecionado = null;
  var quantidade = MINIMO_JOGADORES;

  function $(id) { return document.getElementById(id); }

  /* ======================= TELA DE NOVA PARTIDA ======================= */

  function montarTelaNova() {
    var caixa = $('escolha-quantidade');
    caixa.innerHTML = '';

    for (var n = MINIMO_JOGADORES; n <= MAXIMO_JOGADORES; n++) {
      (function (numero) {
        var rotulo = document.createElement('label');
        rotulo.className = 'pilula';
        var entrada = document.createElement('input');
        entrada.type = 'radio';
        entrada.name = 'quantidade';
        entrada.value = String(numero);
        entrada.checked = numero === quantidade;
        entrada.addEventListener('change', function () {
          quantidade = numero;
          montarCadastro();
        });
        var texto = document.createElement('span');
        texto.textContent = String(numero);
        rotulo.appendChild(entrada);
        rotulo.appendChild(texto);
        caixa.appendChild(rotulo);
      })(n);
    }

    montarCadastro();
  }

  /*
   * Monta uma linha de cadastro por jogador, mantendo o que já foi digitado
   * quando a pessoa muda a quantidade de jogadores.
   */
  function montarCadastro() {
    var lista = $('lista-cadastro');
    var anteriores = lerCadastro();
    lista.innerHTML = '';

    for (var i = 0; i < quantidade; i++) {
      var anterior = anteriores[i] || {};
      lista.appendChild(linhaDeCadastro(i, anterior.nome, anterior.cor || CORES[i].valor));
    }
  }

  function linhaDeCadastro(indice, nome, cor) {
    var item = document.createElement('li');
    item.className = 'cadastro-jogador';
    item.dataset.indice = String(indice);

    var idCampo = 'nome-jogador-' + indice;
    var rotulo = document.createElement('label');
    rotulo.setAttribute('for', idCampo);
    rotulo.className = 'rotulo';
    rotulo.textContent = 'Jogador ' + (indice + 1);

    var campo = document.createElement('input');
    campo.type = 'text';
    campo.id = idCampo;
    campo.className = 'campo-texto';
    campo.maxLength = 18;
    campo.placeholder = 'Jogador ' + (indice + 1);
    campo.value = nome || '';
    campo.autocomplete = 'off';

    var cores = document.createElement('div');
    cores.className = 'paleta';
    cores.setAttribute('role', 'radiogroup');
    cores.setAttribute('aria-label', 'Cor do jogador ' + (indice + 1));

    CORES.forEach(function (opcao) {
      var etiqueta = document.createElement('label');
      etiqueta.className = 'bolinha';
      etiqueta.style.setProperty('--cor', opcao.valor);

      var entrada = document.createElement('input');
      entrada.type = 'radio';
      entrada.name = 'cor-' + indice;
      entrada.value = opcao.valor;
      entrada.checked = opcao.valor === cor;
      entrada.setAttribute('aria-label', opcao.nome);
      entrada.addEventListener('change', function () { mostrarErroNova(null); });

      etiqueta.appendChild(entrada);
      etiqueta.appendChild(document.createElement('span'));
      cores.appendChild(etiqueta);
    });

    item.appendChild(rotulo);
    item.appendChild(campo);
    item.appendChild(cores);
    return item;
  }

  /* Lê o que está na tela de cadastro, sem validar. */
  function lerCadastro() {
    return Array.prototype.map.call(
      document.querySelectorAll('#lista-cadastro .cadastro-jogador'),
      function (item) {
        var escolhida = item.querySelector('input[type="radio"]:checked');
        return {
          nome: item.querySelector('input[type="text"]').value.trim(),
          cor: escolhida ? escolhida.value : null
        };
      }
    );
  }

  function mostrarErroNova(mensagem) {
    var alvo = $('erro-nova');
    alvo.textContent = mensagem || '';
    alvo.hidden = !mensagem;
  }

  /* Valida o cadastro e devolve os jogadores, ou null se algo estiver errado. */
  function jogadoresValidados() {
    var cadastro = lerCadastro();
    var cores = [];
    var nomes = [];

    for (var i = 0; i < cadastro.length; i++) {
      var jogador = cadastro[i];
      // Nome vazio vira "Jogador N", para ninguém travar no cadastro.
      var nome = jogador.nome || 'Jogador ' + (i + 1);

      if (nomes.indexOf(nome.toLowerCase()) !== -1) {
        mostrarErroNova('Dois jogadores estão com o nome "' + nome + '". Troque um deles.');
        return null;
      }
      if (!jogador.cor) {
        mostrarErroNova('Escolha uma cor para ' + nome + '.');
        return null;
      }
      if (cores.indexOf(jogador.cor) !== -1) {
        mostrarErroNova('Duas pessoas escolheram a mesma cor. A cor é o que mostra quem fez cada ligação.');
        return null;
      }

      nomes.push(nome.toLowerCase());
      cores.push(jogador.cor);
      cadastro[i] = { nome: nome, cor: jogador.cor };
    }

    mostrarErroNova(null);
    return cadastro;
  }

  function comecarPartida(evento) {
    evento.preventDefault();
    var jogadores = jogadoresValidados();
    if (!jogadores) return;

    var permitirNegativo = document.querySelector('input[name="negativo"]:checked').value === 'sim';

    estado = regras.criarPartida({
      jogadores: jogadores,
      perguntas: dadosDoJogo.perguntas,
      desenho: dadosDoJogo.desenho,
      permitirNegativo: permitirNegativo
    });

    pontoSelecionado = null;
    faseMostrada = null;
    folha = new global.PontoAPonto.Folha($('folha'), dadosDoJogo.desenho, escolherPonto);

    trocarTela('tela-jogo');
    desenharJogo();
  }

  /* ======================= TROCA DE TELAS ======================= */

  function trocarTela(idAtiva) {
    ['tela-nova', 'tela-jogo', 'tela-fim'].forEach(function (id) {
      $(id).hidden = id !== idAtiva;
    });
    window.scrollTo(0, 0);
  }

  /* ======================= TELA DE JOGO ======================= */

  function desenharJogo() {
    if (estado.fase === FASES.FIM) {
      desenharFim();
      return;
    }

    var carta = regras.cartaAtual(estado);

    // Contadores de cima.
    $('contador-rodada').textContent = String(estado.rodada);
    $('contador-cartas').textContent = String(regras.cartasRestantes(estado));
    $('contador-linhas').textContent =
      regras.linhasFeitas(estado) + ' de ' + estado.desenho.linhas.length;

    // A carta. O verso só aparece a partir da fase de marcação.
    $('carta-dificuldade').textContent = regras.ROTULOS_DIFICULDADE[carta.dificuldade];
    $('carta-dificuldade').className = 'selo selo-' + carta.dificuldade;
    $('carta-pergunta').textContent = carta.pergunta;
    $('carta-resposta').textContent = carta.resposta;
    var virada = estado.fase !== FASES.ESCOLHAS;
    $('carta').classList.toggle('virada', virada);
    $('carta').setAttribute('aria-label', virada
      ? 'Carta virada. Resposta: ' + carta.resposta
      : 'Carta. ' + regras.ROTULOS_DIFICULDADE[carta.dificuldade] + '. ' + carta.pergunta);

    desenharJogadores();
    desenharBarraDeAcao();
    ajustarFolha();
    rolarParaOQueImporta();
  }

  // Guarda a fase mostrada por último, para saber quando a rodada virou de etapa.
  var faseMostrada = null;

  /*
   * No celular, tudo fica empilhado: quando chega a hora de ligar os pontos,
   * leva a tela até a folha; quando volta para a pergunta, leva até a carta.
   */
  function rolarParaOQueImporta() {
    if (estado.fase === faseMostrada) return;
    faseMostrada = estado.fase;

    if (window.innerWidth > 860) return;

    var ligando = estado.fase === FASES.LIGACOES && !regras.rodadaEncerrada(estado);
    var alvo = ligando ? $('folha') : $('carta');
    var suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    alvo.scrollIntoView({ block: 'center', behavior: suave ? 'smooth' : 'auto' });
  }

  function desenharJogadores() {
    var lista = $('lista-jogadores');
    lista.innerHTML = '';

    estado.jogadores.forEach(function (jogador) {
      var item = document.createElement('li');
      item.className = 'jogador';
      item.style.setProperty('--cor', jogador.cor);

      var daVez = regras.jogadorDaVezDeLigar(estado);
      if (daVez && daVez.id === jogador.id) item.classList.add('jogador-da-vez');

      var topo = document.createElement('div');
      topo.className = 'jogador-topo';

      var nome = document.createElement('span');
      nome.className = 'jogador-nome';
      nome.textContent = jogador.nome;

      var pontos = document.createElement('span');
      pontos.className = 'jogador-pontos';
      pontos.textContent = jogador.pontos + (Math.abs(jogador.pontos) === 1 ? ' ponto' : ' pontos');

      topo.appendChild(nome);
      topo.appendChild(pontos);
      item.appendChild(topo);

      var situacao = document.createElement('p');
      situacao.className = 'jogador-situacao';
      situacao.textContent = textoDaSituacao(jogador);
      item.appendChild(situacao);

      var botoes = botoesDoJogador(jogador);
      if (botoes) item.appendChild(botoes);

      lista.appendChild(item);
    });
  }

  function textoDaSituacao(jogador) {
    if (estado.fase === FASES.ESCOLHAS) {
      if (jogador.escolha === 'responder') return 'Vai responder.';
      if (jogador.escolha === 'passar') return 'Passou a vez.';
      if (jogador.passouNaRodadaAnterior) return 'Passou na rodada anterior: precisa responder.';
      return 'Ainda não escolheu.';
    }
    if (jogador.escolha === 'passar') return 'Passou: não ganha nem perde ponto.';
    if (jogador.resultado === 'acertou') return 'Acertou.';
    if (jogador.resultado === 'errou') return 'Errou.';
    return 'Respondeu. Acertou ou errou?';
  }

  /* Os botões mudam conforme a fase da rodada. */
  function botoesDoJogador(jogador) {
    var caixa = document.createElement('div');
    caixa.className = 'jogador-botoes';

    if (estado.fase === FASES.ESCOLHAS) {
      caixa.appendChild(botaoEscolha(jogador, 'responder', 'Responder'));
      caixa.appendChild(botaoEscolha(jogador, 'passar', 'Passar'));
      return caixa;
    }

    if (estado.fase === FASES.MARCACAO && jogador.escolha === 'responder') {
      caixa.appendChild(botaoResultado(jogador, 'acertou', 'Acertou'));
      caixa.appendChild(botaoResultado(jogador, 'errou', 'Errou'));
      return caixa;
    }

    return null;
  }

  function botaoEscolha(jogador, escolha, texto) {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'botao botao-pequeno';
    botao.textContent = texto;
    botao.setAttribute('aria-pressed', String(jogador.escolha === escolha));
    if (jogador.escolha === escolha) botao.classList.add('ativo');

    var bloqueado = escolha === 'passar' && !regras.podePassar(jogador);
    if (bloqueado) {
      botao.disabled = true;
      botao.title = jogador.nome + ' passou na rodada anterior e não pode passar duas vezes seguidas.';
    }

    botao.addEventListener('click', function () {
      var resultado = regras.definirEscolha(estado, jogador.id, escolha);
      if (!resultado.ok) { mostrarRecado(resultado.motivo); return; }
      mostrarRecado(null);
      desenharJogo();
    });
    return botao;
  }

  function botaoResultado(jogador, resultado, texto) {
    var botao = document.createElement('button');
    botao.type = 'button';
    botao.className = 'botao botao-pequeno botao-' + resultado;
    botao.textContent = texto;
    botao.setAttribute('aria-pressed', String(jogador.resultado === resultado));
    if (jogador.resultado === resultado) botao.classList.add('ativo');

    botao.addEventListener('click', function () {
      regras.definirResultado(estado, jogador.id, resultado);
      desenharJogo();
    });
    return botao;
  }

  /* A instrução do momento e o botão principal embaixo. */
  function desenharBarraDeAcao() {
    var instrucao = $('instrucao');
    var botao = $('botao-principal');
    var carta = regras.cartaAtual(estado);
    var valor = regras.VALORES[carta.dificuldade];

    if (estado.fase === FASES.ESCOLHAS) {
      instrucao.textContent = 'Cada jogador escolhe responder ou passar. Vale +' + valor +
        ' no acerto e −' + valor + ' no erro.';
      botao.textContent = 'Virar a carta';
      botao.disabled = !regras.todosEscolheram(estado);
      botao.onclick = function () {
        regras.virarCarta(estado);
        mostrarRecado(null);
        desenharJogo();
      };
      return;
    }

    if (estado.fase === FASES.MARCACAO) {
      var respondentes = regras.quemRespondeu(estado);
      instrucao.textContent = respondentes.length === 0
        ? 'Todo mundo passou nesta rodada. Ninguém ganha nem perde ponto.'
        : 'Confiram as respostas entre vocês e marquem quem acertou e quem errou.';
      botao.textContent = 'Confirmar e pontuar';
      botao.disabled = !regras.todosMarcados(estado);
      botao.onclick = function () {
        regras.confirmarResultados(estado);
        desenharJogo();
      };
      return;
    }

    if (estado.fase === FASES.LIGACOES) {
      if (regras.rodadaEncerrada(estado)) {
        instrucao.textContent = 'Rodada encerrada.';
        botao.textContent = 'Próxima carta';
        botao.disabled = false;
        botao.onclick = function () {
          regras.avancar(estado);
          pontoSelecionado = null;
          mostrarRecado(null);
          desenharJogo();
        };
        return;
      }

      var daVez = regras.jogadorDaVezDeLigar(estado);
      var restantes = estado.filaDeLigacoes.length;
      instrucao.textContent = daVez.nome + ', ligue dois pontos da folha. ' +
        (restantes > 1 ? 'Faltam ' + restantes + ' ligações na rodada.' : 'É a última da rodada.');

      if (pontoSelecionado === null) {
        botao.textContent = 'Escolha um ponto na folha';
        botao.disabled = true;
        botao.onclick = null;
      } else {
        botao.textContent = 'Cancelar o ponto escolhido';
        botao.disabled = false;
        botao.onclick = function () {
          pontoSelecionado = null;
          mostrarRecado(null);
          desenharJogo();
        };
      }
    }
  }

  /* Liga a folha só na hora de ligar pontos, e destaca o que dá para escolher. */
  function ajustarFolha() {
    var ligando = estado.fase === FASES.LIGACOES && !regras.rodadaEncerrada(estado);
    folha.sincronizar(estado);

    // A moldura da folha veste a cor de quem está desenhando agora.
    var moldura = $('folha');
    var daVez = regras.jogadorDaVezDeLigar(estado);
    moldura.classList.toggle('vez-de-ligar', ligando);
    if (daVez) moldura.style.setProperty('--cor', daVez.cor);

    if (!ligando) {
      folha.definirInterativa(false, []);
      folha.destacar(null, []);
      return;
    }

    if (pontoSelecionado === null) {
      // Só ficam clicáveis os pontos que ainda têm alguma linha-guia livre.
      var uteis = [];
      estado.desenho.pontos.forEach(function (_, indice) {
        if (regras.vizinhosDisponiveis(estado, indice).length > 0) uteis.push(indice);
      });
      folha.definirInterativa(true, uteis);
      folha.destacar(null, []);
    } else {
      var vizinhos = regras.vizinhosDisponiveis(estado, pontoSelecionado);
      folha.definirInterativa(true, vizinhos.concat([pontoSelecionado]));
      folha.destacar(pontoSelecionado, vizinhos);
    }
  }

  /* Clique em um ponto da folha: primeiro escolhe, depois tenta ligar. */
  function escolherPonto(indice) {
    if (estado.fase !== FASES.LIGACOES || regras.rodadaEncerrada(estado)) return;

    // Primeiro ponto.
    if (pontoSelecionado === null) {
      var vizinhos = regras.vizinhosDisponiveis(estado, indice);
      if (vizinhos.length === 0) {
        mostrarRecado('Esse ponto já está ligado a todos os vizinhos possíveis. Escolha outro ponto.');
        return;
      }
      pontoSelecionado = indice;
      mostrarRecado(null);
      desenharJogo();
      folha.focar(indice);
      return;
    }

    // Clicar de novo no mesmo ponto desfaz a escolha.
    if (pontoSelecionado === indice) {
      pontoSelecionado = null;
      mostrarRecado(null);
      desenharJogo();
      folha.focar(indice);
      return;
    }

    // Segundo ponto: tenta fazer a ligação.
    var daVez = regras.jogadorDaVezDeLigar(estado);
    var resultado = regras.registrarLigacao(estado, pontoSelecionado, indice);

    if (!resultado.ok) {
      mostrarRecado(resultado.motivo);
      return;
    }

    folha.marcarLigacao(resultado.indiceLinha, daVez.cor, true);
    pontoSelecionado = null;
    mostrarRecado(null);
    desenharJogo();
  }

  /* Recado curto para explicar por que uma escolha não valeu. */
  function mostrarRecado(mensagem) {
    var alvo = $('recado');
    alvo.textContent = mensagem || '';
    alvo.hidden = !mensagem;
  }

  /* ======================= TELA FINAL ======================= */

  function desenharFim() {
    var classificacao = regras.classificacao(estado);

    $('motivo-fim').textContent = estado.motivoFim === 'desenho'
      ? 'O desenho ficou completo: todas as ' + estado.desenho.linhas.length + ' ligações foram feitas.'
      : 'As cartas do baralho acabaram, depois de ' + estado.rodada +
        (estado.rodada === 1 ? ' rodada.' : ' rodadas.');

    var anuncio = $('anuncio-campeao');
    if (classificacao.houveEmpate) {
      // As regras ainda não têm critério de desempate: o empate fica registrado.
      anuncio.textContent = 'Empate entre ' +
        classificacao.campeoes.map(function (j) { return j.nome; }).join(' e ') +
        ', com ' + classificacao.campeoes[0].pontos +
        (Math.abs(classificacao.campeoes[0].pontos) === 1 ? ' ponto.' : ' pontos.');
    } else {
      anuncio.textContent = classificacao.campeoes[0].nome + ' venceu com ' +
        classificacao.campeoes[0].pontos +
        (Math.abs(classificacao.campeoes[0].pontos) === 1 ? ' ponto.' : ' pontos.');
    }

    var lista = $('classificacao');
    lista.innerHTML = '';
    classificacao.ordenados.forEach(function (jogador) {
      var item = document.createElement('li');
      item.className = 'linha-classificacao';
      item.style.setProperty('--cor', jogador.cor);
      if (classificacao.campeoes.indexOf(jogador) !== -1) item.classList.add('campeao-linha');

      var nome = document.createElement('span');
      nome.className = 'jogador-nome';
      nome.textContent = jogador.nome;

      var pontos = document.createElement('span');
      pontos.className = 'jogador-pontos';
      pontos.textContent = jogador.pontos + (Math.abs(jogador.pontos) === 1 ? ' ponto' : ' pontos');

      var ligacoes = document.createElement('span');
      ligacoes.className = 'jogador-ligacoes';
      ligacoes.textContent = jogador.ligacoesFeitas === 1
        ? '1 ligação feita'
        : jogador.ligacoesFeitas + ' ligações feitas';

      item.appendChild(nome);
      item.appendChild(pontos);
      item.appendChild(ligacoes);
      lista.appendChild(item);
    });

    // A folha final, só para olhar.
    var folhaFinal = new global.PontoAPonto.Folha($('folha-final'), estado.desenho, function () {});
    folhaFinal.definirInterativa(false, []);
    folhaFinal.sincronizar(estado);

    trocarTela('tela-fim');
  }

  /* ======================= PARTIDA ======================= */

  function iniciar(dados) {
    dadosDoJogo = dados;

    if (dados.usandoReserva) {
      var aviso = $('aviso-reserva');
      aviso.textContent = 'Você abriu o jogo direto do arquivo, então o navegador não deixou ler a pasta ' +
        'dados/. O jogo está usando a cópia embutida do baralho e do desenho. Para valer suas edições nos ' +
        'arquivos JSON, rode um servidor local (veja o README).';
      aviso.hidden = false;
    }

    montarTelaNova();
    $('form-nova').addEventListener('submit', comecarPartida);
    $('botao-nova-partida').addEventListener('click', function () {
      estado = null;
      pontoSelecionado = null;
      mostrarRecado(null);
      trocarTela('tela-nova');
    });
  }

  function mostrarFalha(mensagem) {
    var aviso = $('aviso-reserva');
    aviso.textContent = mensagem;
    aviso.hidden = false;
    aviso.classList.add('aviso-grave');
  }

  global.PontoAPonto.interface = { iniciar: iniciar, mostrarFalha: mostrarFalha };
})(window);
