/*
 * gerar-reserva.js — copia dados/*.json para dentro de js/dados-reserva.js.
 *
 * Isso NÃO é um passo de build do jogo: o Ponto a Ponto roda sem rodar isto.
 * A cópia de reserva só é usada quando o index.html é aberto direto do disco
 * (endereço file://), caso em que o navegador não deixa o jogo ler a pasta dados/.
 *
 * Use depois de editar os JSON, se você joga abrindo o arquivo direto:
 *     node ferramentas/gerar-reserva.js
 */
var fs = require('fs');
var path = require('path');

var raiz = path.join(__dirname, '..');
var perguntas = JSON.parse(fs.readFileSync(path.join(raiz, 'dados/perguntas.json'), 'utf8'));
var desenho = JSON.parse(fs.readFileSync(path.join(raiz, 'dados/desenho.json'), 'utf8'));

var conteudo = [
  '/*',
  ' * dados-reserva.js — cópia embutida de dados/perguntas.json e dados/desenho.json.',
  ' *',
  ' * ARQUIVO GERADO. Não edite à mão: edite os JSON na pasta dados/ e rode',
  ' *     node ferramentas/gerar-reserva.js',
  ' *',
  ' * Serve só para o jogo funcionar ao abrir o index.html direto do disco,',
  ' * quando o navegador proíbe a leitura da pasta dados/.',
  ' */',
  'window.PontoAPonto = window.PontoAPonto || {};',
  'window.PontoAPonto.reserva = {',
  '  perguntas: ' + JSON.stringify(perguntas, null, 2).split('\n').join('\n  ') + ',',
  '  desenho: ' + JSON.stringify(desenho, null, 2).split('\n').join('\n  '),
  '};',
  ''
].join('\n');

fs.writeFileSync(path.join(raiz, 'js/dados-reserva.js'), conteudo, 'utf8');
console.log('js/dados-reserva.js gerado com ' + perguntas.length + ' perguntas e ' +
  desenho.linhas.length + ' linhas.');
