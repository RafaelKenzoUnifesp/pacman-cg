# Pac-Man 3D — Computação Gráfica

![Three.js](https://img.shields.io/badge/Biblioteca-Three.js%20r128-black?style=flat-square&logo=threedotjs)
![WebGL](https://img.shields.io/badge/Render-WebGL2-990000?style=flat-square&logo=webgl)
![JavaScript](https://img.shields.io/badge/Linguagem-JavaScript%20ES6-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Entrega](https://img.shields.io/badge/Entrega%2002-Modelagem%203D%20%26%20Cen%C3%A1rio-blue?style=flat-square)

Releitura tridimensional em primeira pessoa (POV) do clássico jogo **Pac-Man**, desenvolvida com **Three.js** e **WebGL**. O projeto faz parte da avaliação prática da disciplina de Computação Gráfica, trazendo a navegação pelo labirinto com colisão geométrica contínua e sistema de dupla projeção simultânea (visão subjetiva e minimapa superior).

> **Universidade Federal de São Paulo (UNIFESP)** — Instituto de Ciência e Tecnologia (ICT - SJC)  
> **Unidade Curricular:** Computação Gráfica — Profa. Dra. Ana Luisa Dine Martins Lemos

---

## Sumário

1. [Visão Geral do Projeto](#visão-geral-do-projeto)
2. [Arquitetura e Estrutura de Arquivos](#arquitetura-e-estrutura-de-arquivos)
3. [Sistema de Câmeras e Viewports](#sistema-de-câmeras-e-viewports)
4. [Controles do Jogador](#controles-do-jogador)
5. [Como Executar](#como-executar)
6. [Integrantes do Grupo](#integrantes-do-grupo)

---

## Visão Geral do Projeto

O labirinto é construído a partir de uma matriz discreta de blocos (tilemap), replicando a geometria dos corredores do arcade original. Para a etapa inicial de modelagem e cena 3D (Entrega 02), o ambiente conta com:

* **Paredes e Corredores:** Malhas tridimensionais posicionadas e escaladas de acordo com as coordenadas do mapa matricial, com realce de arestas (`EdgesGeometry`) para demarcação de profundidade.
* **Itens do Cenário:** Posicionamento dos pontos normais (Pac-Dots) e pontos de poder (Power Pellets) em alturas coerentes nos corredores.
* **Duplo Ponto de Vista:** Renderização em tela dividida usando tesouramento de viewport (`scissor test`), mantendo o enquadramento em primeira pessoa no centro e uma câmera ortogonal/perspectiva superior no canto.
* **Tratamento de Colisão:** Verificação matemática contínua contra a caixa delimitadora das paredes, permitindo deslizamento suave ao longo dos cantos dos corredores.

---

## Arquitetura e Estrutura de Arquivos

Seguindo o padrão de projeto orientado a objetos adotado nas aulas práticas da disciplina, o código foi modularizado com responsabilidades bem definidas:

```text
pacman-cg/
├── index.html          # Ponto de entrada, canvas de desenho e importação dos scripts
├── transformacoes.js   # Biblioteca de conversão matricial (tile <-> mundo) e vetores
├── maze.js             # Matriz representativa do labirinto (MAZE_MAP)
├── sceneObject.js      # Hierarquia de objetos de cena (SceneObject, Maze, Player)
├── camera.js           # Configurações das câmeras (PovCamera e TopCamera)
├── renderer.js         # Gerenciamento de viewports e chamadas de renderização WebGL
├── scene.js            # Loop de animação (requestAnimationFrame) e escuta de eventos
├── main.js             # Instanciação da cena encapsulada em escopo isolado (IIFE)
└── README.md           # Documentação técnica do projeto
```

---

## Sistema de Câmeras e Viewports

O motor gráfico utiliza duas instâncias de `THREE.PerspectiveCamera` renderizadas no mesmo canvas WebGL:

1. **Câmera Subjetiva (POV):** Enquadrada na altura dos olhos do jogador (`y = 1.4`), acompanha a translação e a rotação angular (yaw) do personagem pelo corredor.
2. **Câmera Superior (Top-down):** Posicionada acima do centro do labirinto com vetor *up* invertido (`0, 0, -1`), enquadrando a totalidade da arena. Um marcador direcional indica a posição exata e orientação do jogador exclusivamente nessa visão através de máscaras de camadas (`layers`).

---

## Controles do Jogador

| Tecla / Comando | Ação |
| :---: | :--- |
| <kbd>W</kbd> ou <kbd>&uarr;</kbd> | Mover para frente (na direção da visão) |
| <kbd>S</kbd> ou <kbd>&darr;</kbd> | Mover para trás |
| <kbd>A</kbd> ou <kbd>&larr;</kbd> | Girar câmera para a esquerda |
| <kbd>D</kbd> ou <kbd>&rarr;</kbd> | Girar câmera para a direita |

---

## Como Executar

Não é necessária a instalação de dependências locais (Node.js ou empacotadores):

1. Clone o repositório ou faça o download dos arquivos:
   ```bash
   git clone https://github.com/RafaelKenzoUnifesp/pacman-cg.git
   ```
2. Abra o arquivo `index.html` em qualquer navegador web com suporte a WebGL2 (Google Chrome, Firefox, Edge).
3. É necessária conexão com a internet apenas para o carregamento do Three.js via CDN.

---

## Integrantes do Grupo

| Nome do(a) Integrante | RA |
| :--- | :---: |
| **Celine Kazumi Miyajima** | 176209 |
| **Lucas Vinicius Gonçalves** | 163924 |
| **Lucas Yuji Sapia Furukawa** | 176581 |
| **Rafael Kenzo Sato Pires** | 169240 |
