# Ponto a Ponto

Versão digital do nosso jogo de mesa: perguntas de um lado, um desenho que vai
aparecendo do outro. Feito para 2 a 5 pessoas em volta de **uma tela só** — cada
um usa o computador ou o celular na sua vez.

A cada partida o jogo sorteia uma das três folhas: a casinha, o gato ou o
cachorro. E um cronômetro mostra há quanto tempo a partida está rolando.

HTML, CSS e JavaScript puros. Sem framework, sem instalação, sem internet.

---

## Como rodar

**Jeito mais simples:** dê dois cliques no `index.html`. O jogo abre no navegador
e já dá para jogar.

Nesse modo o navegador não deixa a página ler a pasta `dados/` (é uma regra de
segurança dele, não dá para contornar), então o jogo usa uma cópia embutida do
baralho e do desenho, e avisa isso no alto da tela. Para jogar é igual — a
diferença só aparece se você editar os arquivos JSON (veja
[Trocar o baralho](#trocar-o-baralho-de-perguntas)).

**Para o jogo ler os arquivos da pasta `dados/`,** sirva a pasta com um servidor
local. Qualquer um serve; com Node instalado:

```bash
npx serve .
```

Ou com Python:

```bash
python -m http.server 4173
```

Depois abra o endereço que aparecer (algo como `http://localhost:4173`).

## Publicar na Vercel

O jogo é um site estático: não tem build, não tem servidor, não tem variável de
ambiente. Na Vercel isso significa importar o repositório e mandar ver.

1. Suba a pasta para um repositório no GitHub (ou GitLab/Bitbucket).
2. Em vercel.com, **Add New… → Project** e importe esse repositório.
3. Em *Framework Preset* escolha **Other**. Deixe *Build Command* e *Install
   Command* vazios e *Output Directory* como a raiz (`.`).
4. **Deploy**.

O arquivo [`vercel.json`](vercel.json) já diz tudo isso, então normalmente é só
importar e clicar em Deploy sem mexer em nada.

Pela linha de comando também dá, de dentro da pasta:

```bash
npx vercel
```

Publicado, o jogo roda por HTTPS e lê os arquivos da pasta `dados/` normalmente —
a cópia de reserva não entra em ação e o aviso não aparece.

---

## As regras

1. No centro fica uma folha com vários pontos e linhas-guia levemente apagadas.
   Ligando os pontos, a imagem vai aparecendo. A folha da partida é sorteada no
   começo e vale até o fim dela.
2. A cada rodada, uma carta é puxada. A frente mostra a pergunta e a dificuldade
   (fácil, média ou difícil). O verso mostra a resposta correta.
3. Cada jogador escolhe responder ou passar. **Quem passou na rodada anterior é
   obrigado a responder nesta** — ninguém passa duas rodadas seguidas.
4. A resposta correta só é revelada depois que todos fizeram suas escolhas. Aí os
   jogadores conferem entre si e marcam na tela quem acertou e quem errou. O
   sistema não corrige resposta digitada: quem julga são vocês.
5. Pontuação por dificuldade:

   | Dificuldade | Acerto | Erro |
   | ----------- | ------ | ---- |
   | Fácil       | +1     | −1   |
   | Média       | +2     | −2   |
   | Difícil     | +3     | −3   |

   Quem passa não ganha nem perde nada.
6. Quem acertou ganha **1 ligação**: o direito de ligar dois pontos da folha.
   Sempre 1 por acerto, em qualquer dificuldade. Quem errou não desenha.
7. Só dá para ligar dois pontos que tenham uma linha-guia entre eles e que ainda
   não tenha sido feita. A linha fica na cor de quem a fez.
8. A partida termina quando o desenho fica completo ou quando as cartas acabam.
   Vence quem tiver mais pontos.

### Os dois pontos que ficaram em aberto

- **Pontuação negativa:** as duas versões funcionam e a escolha é feita na tela de
  nova partida — "pode ficar negativa" ou "para no zero".
- **Desempate:** ainda não existe critério. Em caso de empate, a tela final mostra
  o empate e todos os empatados aparecem em primeiro.

### Combinações que o jogo assumiu

Coisas que as regras não dizem e que precisaram de uma decisão para o jogo rodar.
Se alguma não for o que vocês querem, é fácil mudar:

- Quando a última carta é jogada, a rodada é resolvida inteira (marcação e
  ligações) e só então a partida termina.
- Se o desenho ficar completo no meio das ligações de uma rodada, a partida acaba
  na hora e quem ainda estava na fila perde a ligação.
- A ordem das ligações segue a ordem dos jogadores no cadastro.
- O cronômetro começa quando a partida começa e para no fim dela. Não existe
  pausa: se vocês pararem para conversar, o tempo continua correndo.

---

## Como jogar na tela

1. **Nova partida:** escolha quantos vão jogar (2 a 5), o nome e a cor de cada um,
   e se a pontuação pode ficar negativa. Duas pessoas não podem ter a mesma cor,
   porque a cor é o que mostra quem fez cada ligação.
2. **A rodada** acontece nesta ordem, com a instrução do momento sempre na barra
   de baixo:
   - cada jogador toca em *Responder* ou *Passar* (quem está obrigado tem o
     *Passar* bloqueado);
   - *Virar a carta* mostra a resposta;
   - vocês conferem e marcam *Acertou* ou *Errou* para quem respondeu;
   - *Confirmar e pontuar* aplica os pontos;
   - quem acertou liga dois pontos, um jogador por vez;
   - *Próxima carta*.
3. **Ligando os pontos:** toque em um ponto e os pontos que ainda podem ser
   ligados a ele ficam destacados. Se a escolha não valer, a barra de baixo
   explica o motivo. Tocar de novo no mesmo ponto desfaz a escolha.

No alto da tela ficam sempre o tempo de jogo, a rodada atual, quantas cartas
restam e quantas ligações já foram feitas. No fim, a tela de resultado repete o
tempo total, as rodadas jogadas e as ligações de cada jogador.

Dá para jogar só pelo teclado: `Tab` anda pelos botões e pelos pontos disponíveis,
`Enter` ou `Espaço` aciona.

---

## Trocar o baralho de perguntas

O baralho fica em `dados/perguntas.json`, uma lista de objetos:

```json
[
  { "dificuldade": "facil", "pergunta": "Qual é a capital do Brasil?", "resposta": "Brasília" }
]
```

- `dificuldade` só aceita `"facil"`, `"media"` ou `"dificil"` (sem acento, como
  está aqui).
- `pergunta` e `resposta` são texto livre. Respostas curtas funcionam melhor: quem
  confere são os jogadores.
- Pode ter quantas cartas quiser. O baralho é embaralhado a cada partida.

## Trocar ou acrescentar desenhos

Os desenhos que entram no sorteio estão listados em `dados/desenhos.json`:

```json
{
  "arquivos": [
    "dados/desenho.json",
    "dados/desenho-gato.json",
    "dados/desenho-cachorro.json"
  ]
}
```

Para acrescentar um desenho, crie o arquivo dele e adicione o caminho nessa
lista. Para tirar um do sorteio, basta remover a linha. Se a lista tiver só um
arquivo, esse desenho sai em todas as partidas.

Cada desenho é um arquivo assim (o `dados/desenho.json` é a casinha):

```json
{
  "nome": "Casinha ao sol",
  "largura": 100,
  "altura": 100,
  "pontos": [[22, 78], [78, 78]],
  "linhas": [[0, 1]]
}
```

- `pontos` é a lista de coordenadas `[x, y]`, dentro de `largura` × `altura`
  (o padrão é 100 × 100, e o `y` cresce para baixo).
- `linhas` é a lista de linhas-guia, cada uma com os **índices** de dois pontos da
  lista acima — `[0, 1]` liga o primeiro ao segundo ponto.
- `nome` aparece na tela ("A folha — Gato") e é opcional, assim como `largura` e
  `altura`.

Qualquer desenho nesse formato funciona sem mexer no código. Dicas de quem
desenhou os três que vieram junto:

- Entre 25 e 35 linhas dá uma partida de tamanho bom.
- Deixe pelo menos 7 unidades de distância entre dois pontos quaisquer. Mais
  perto que isso, no telefone, o dedo começa a acertar o ponto errado.
- Confira que nenhuma linha se repete e que nenhum índice aponta para ponto que
  não existe — o jogo avisa na tela se algo estiver errado.

### Depois de editar os JSON

Se você joga abrindo o `index.html` direto (sem servidor local), regenere a cópia
embutida para suas edições valerem também nesse modo:

```bash
node ferramentas/gerar-reserva.js
```

Isso reescreve `js/dados-reserva.js` a partir dos dois JSON. Quem joga por servidor
local não precisa disso.

---

## Os arquivos

```
index.html                    estrutura das três telas
css/estilo.css                visual, tema claro e escuro, layout do celular
js/estado.js                  as regras: pontuação, rodadas, ligações, cronômetro, fim de jogo
js/desenho.js                 a folha de pontos em SVG
js/interface.js               as telas, o sorteio do desenho e o que cada botão faz
js/dados.js                   carrega os JSON (com a cópia de reserva)
js/principal.js               liga tudo
js/dados-reserva.js           cópia embutida dos JSON (arquivo gerado)
dados/perguntas.json          o baralho
dados/desenhos.json           a lista de desenhos que entram no sorteio
dados/desenho.json            a casinha
dados/desenho-gato.json       o gato
dados/desenho-cachorro.json   o cachorro
ferramentas/gerar-reserva.js  regera a cópia embutida
vercel.json                   configuração de publicação (site estático, sem build)
```

As regras do jogo moram só em `js/estado.js` — ele não conhece a tela. Mexer em
pontuação ou em fim de partida é mexer nesse arquivo.

## Detalhes de uso

- Funciona em celular, tablet e computador, em pé ou deitado. No telefone a
  carta vem antes da folha, o placar encolhe e os pontos que estão em jogo ganham
  uma área de toque maior; na hora de ligar, a tela rola sozinha até a folha.
- Segue o tema claro ou escuro do sistema.
- Respeita a preferência de menos movimento: a carta troca de lado sem girar e as
  linhas aparecem sem animação.
- Tudo roda offline. Nada é enviado para lugar nenhum e nada fica salvo: fechou a
  aba no meio, a partida se perde.
