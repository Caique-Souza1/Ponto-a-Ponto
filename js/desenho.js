/*
 * desenho.js — a folha de pontos.
 *
 * Monta o SVG a partir de { pontos, linhas } e cuida da escolha dos dois
 * pontos de uma ligação. Qualquer desenho nesse formato funciona aqui,
 * sem mexer no código.
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function criarSVG(nome, atributos) {
    var elemento = document.createElementNS(NS, nome);
    Object.keys(atributos || {}).forEach(function (chave) {
      elemento.setAttribute(chave, atributos[chave]);
    });
    return elemento;
  }

  /*
   * Cria a folha dentro de um elemento.
   * aoEscolherPonto recebe o índice do ponto clicado.
   */
  function Folha(container, desenho, aoEscolherPonto) {
    this.container = container;
    this.desenho = desenho;
    this.aoEscolherPonto = aoEscolherPonto;
    this.pontoSelecionado = null;
    this.interativa = false;
    this.montar();
  }

  Folha.prototype.montar = function () {
    var self = this;
    var largura = this.desenho.largura || 100;
    var altura = this.desenho.altura || 100;
    // Uma margem em volta para os pontos das bordas não ficarem cortados.
    var margem = 4;

    this.container.innerHTML = '';
    var svg = criarSVG('svg', {
      viewBox: (-margem) + ' ' + (-margem) + ' ' + (largura + margem * 2) + ' ' + (altura + margem * 2),
      class: 'folha',
      role: 'group',
      'aria-label': 'Folha de pontos' + (this.desenho.nome ? ': ' + this.desenho.nome : '')
    });

    // Camada 1: as linhas-guia, levemente apagadas.
    this.guias = this.desenho.linhas.map(function (linha) {
      var a = self.desenho.pontos[linha[0]];
      var b = self.desenho.pontos[linha[1]];
      var elemento = criarSVG('line', {
        x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'guia'
      });
      svg.appendChild(elemento);
      return elemento;
    });

    // Camada 2: as ligações já feitas, na cor de quem as fez.
    this.feitas = this.desenho.linhas.map(function (linha) {
      var a = self.desenho.pontos[linha[0]];
      var b = self.desenho.pontos[linha[1]];
      var elemento = criarSVG('line', {
        x1: a[0], y1: a[1], x2: b[0], y2: b[1], class: 'ligacao'
      });
      // Guarda o comprimento da linha para animar o risco de ponta a ponta.
      elemento.style.setProperty('--comprimento',
        Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)));
      elemento.style.display = 'none';
      svg.appendChild(elemento);
      return elemento;
    });

    // Camada 3: os pontos. Cada um é um botão, para funcionar no teclado.
    this.pontos = this.desenho.pontos.map(function (ponto, indice) {
      var grupo = criarSVG('g', {
        class: 'ponto',
        tabindex: '-1',
        role: 'button',
        'aria-label': 'Ponto ' + (indice + 1)
      });
      // O círculo de baixo é só área de clique: dedo em tela pequena agradece.
      grupo.appendChild(criarSVG('circle', { cx: ponto[0], cy: ponto[1], r: 4.2, class: 'alvo' }));
      grupo.appendChild(criarSVG('circle', { cx: ponto[0], cy: ponto[1], r: 1.6, class: 'marca' }));

      grupo.addEventListener('click', function () { self.clicar(indice); });
      grupo.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter' || evento.key === ' ') {
          evento.preventDefault();
          self.clicar(indice);
        }
      });
      svg.appendChild(grupo);
      return grupo;
    });

    this.svg = svg;
    this.container.appendChild(svg);
  };

  Folha.prototype.clicar = function (indice) {
    if (!this.interativa) return;
    this.aoEscolherPonto(indice);
  };

  /* Liga ou desliga a interação com os pontos (só vale na fase de ligações). */
  Folha.prototype.definirInterativa = function (ligada, pontosUteis) {
    this.interativa = ligada;
    var uteis = pontosUteis || [];
    this.pontos.forEach(function (grupo, indice) {
      var util = ligada && uteis.indexOf(indice) !== -1;
      // Só os pontos que ainda levam a alguma ligação entram na ordem do Tab.
      grupo.setAttribute('tabindex', util ? '0' : '-1');
      grupo.classList.toggle('inerte', !ligada);
    });
  };

  /* Destaca o ponto escolhido e os pontos que ainda dão para ligar nele. */
  Folha.prototype.destacar = function (selecionado, vizinhos) {
    this.pontoSelecionado = selecionado;
    var lista = vizinhos || [];
    this.pontos.forEach(function (grupo, indice) {
      grupo.classList.toggle('selecionado', indice === selecionado);
      grupo.classList.toggle('disponivel', lista.indexOf(indice) !== -1);
    });
  };

  /* Pinta uma ligação recém-feita com a cor do jogador. */
  Folha.prototype.marcarLigacao = function (indiceLinha, cor, animar) {
    var elemento = this.feitas[indiceLinha];
    elemento.style.display = '';
    elemento.style.stroke = cor;
    this.guias[indiceLinha].classList.add('guia-usada');
    if (animar) {
      elemento.classList.remove('surgindo');
      // Força o navegador a reiniciar a animação.
      void elemento.getBoundingClientRect();
      elemento.classList.add('surgindo');
    }
  };

  /* Redesenha a folha inteira a partir do estado (usado ao carregar a tela). */
  Folha.prototype.sincronizar = function (estado) {
    var self = this;
    estado.autorDaLinha.forEach(function (autorId, indice) {
      if (autorId === null) return;
      var jogador = estado.jogadores.filter(function (j) { return j.id === autorId; })[0];
      self.marcarLigacao(indice, jogador.cor, false);
    });
  };

  /* Move o foco do teclado para um ponto. */
  Folha.prototype.focar = function (indice) {
    if (this.pontos[indice]) this.pontos[indice].focus();
  };

  global.PontoAPonto = global.PontoAPonto || {};
  global.PontoAPonto.Folha = Folha;
})(window);
