/* Guia Brasil - lógica do chat.
   Script clássico (sem módulos) para o index.html abrir com dois cliques. */

(function () {
  "use strict";

  /* ------------------------------------------------------------------ *
   * Onde fica o PHP que protege a chave do Grok.
   * Sendo aberto por dois cliques, a origem é "null" e o PHP precisa
   * liberar o acesso com cabeçalhos CORS.
   * ------------------------------------------------------------------ */

  var CHAVE_ESCALA = "guia-brasil:escala";

  /*
   * Abrindo o index.html com dois cliques, a página vem de file:// e o
   * navegador não deixa descobrir a porta sozinho. Então tentamos algumas:
   * é o mesmo caminho que o iniciar.bat usa.
   */
  var PORTA_INICIAL = 8000;
  var ULTIMA_PORTA = 8010;

  var ABRINDO_DIRETO = window.location.protocol === "file:";

  var PROXY = ABRINDO_DIRETO
    ? "http://localhost:" + PORTA_INICIAL + "/api/proxy.php"
    : "api/proxy.php";

  var MAX_MENSAGEM = 2000;
  var ESCALA_MIN = 0.85;
  var ESCALA_MAX = 1.6;
  var ESCALA_PASSO = 0.125;

  var estado = {
    mensagens: [],
    carregando: false,
    servidorOk: false,
    modo: "demo",
  };

  var controles = {};
  var elemento = {};
  var controlador = null;
  var indice = 0;
  var colarNoFim = true;

  /* ------------------------------------------------------------------ *
   * Utilidades
   * ------------------------------------------------------------------ */

  function $(id) {
    return document.getElementById(id);
  }

  function proximoId() {
    indice += 1;
    return "msg-" + Date.now() + "-" + indice;
  }

  function escapar(texto) {
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function dormir(ms) {
    return new Promise(function (resolva) {
      setTimeout(resolva, ms);
    });
  }

  function rolarParaFim(comportamento) {
    var alvo = elemento.conversa;
    if (!alvo) return;
    alvo.scrollTo({
      top: alvo.scrollHeight,
      behavior: comportamento || "auto",
    });
  }

  function sinalCancelamento(ms) {
    if (window.AbortSignal && AbortSignal.timeout) {
      return AbortSignal.timeout(ms);
    }
    return undefined;
  }

  /* ------------------------------------------------------------------ *
   * Markdown: só o que o agente realmente produz.
   * O texto entra sempre escapado, então nunca vem HTML do modelo.
   * ------------------------------------------------------------------ */

  function linkSeguro(url, texto) {
    if (!/^(https?:\/\/|mailto:)/i.test(url)) return texto;
    return (
      '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + texto + "</a>"
    );
  }

  function emLinha(texto) {
    return texto
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_todo, titulo, url) {
        return linkSeguro(url, titulo);
      });
  }

  function emUmaLinha(linhas) {
    return linhas
      .map(function (linha) {
        return linha.trim();
      })
      .join(" ")
      .replace(/\s+/g, " ");
  }

  function listaOrdenada(linhas) {
    var itens = [];
    var atual = null;

    linhas.forEach(function (linha) {
      var achou = /^\s*\d+[.)]\s+(.*)$/.exec(linha);
      if (achou) {
        if (atual !== null) itens.push(atual);
        atual = achou[1];
      } else if (atual !== null) {
        atual += " " + linha.replace(/^\s{1,4}/, "");
      }
    });
    if (atual !== null) itens.push(atual);

    if (!itens.length) return "";

    return (
      "<ol>" +
      itens
        .map(function (item) {
          return "<li>" + emLinha(escapar(emUmaLinha([item]))) + "</li>";
        })
        .join("") +
      "</ol>"
    );
  }

  function listaSimples(linhas) {
    var itens = [];
    var atual = null;

    linhas.forEach(function (linha) {
      if (/^\s*[-*+]\s+/.test(linha)) {
        if (atual !== null) itens.push(atual);
        atual = linha.replace(/^\s*[-*+]\s+/, "");
      } else if (atual !== null) {
        atual += " " + linha.replace(/^\s{1,4}/, "");
      }
    });
    if (atual !== null) itens.push(atual);

    if (!itens.length) return "";

    return (
      "<ul>" +
      itens
        .map(function (item) {
          return "<li>" + emLinha(escapar(emUmaLinha([item]))) + "</li>";
        })
        .join("") +
      "</ul>"
    );
  }

  function markdown(texto) {
    var blocos = String(texto).replace(/\r\n/g, "\n").split(/\n{2,}/);
    var saida = [];

    blocos.forEach(function (bruto) {
      var bloco = bruto.replace(/\s+$/, "");
      if (!bloco.trim()) return;

      var linhas = bloco.split("\n");

      if (/^\s*```/.test(bloco)) {
        var corpo = bloco
          .replace(/^\s*```[^\n]*\n?/, "")
          .replace(/```\s*$/, "");
        saida.push("<pre><code>" + escapar(corpo) + "</code></pre>");
        return;
      }

      var titulo = /^\s*(#{1,6})\s+(.*)$/.exec(bloco);
      if (titulo) {
        var nivel = Math.min(titulo[1].length, 6);
        saida.push(
          "<h" + nivel + ">" + emLinha(escapar(titulo[2])) + "</h" + nivel + ">"
        );
        return;
      }

      if (/^\s*>/.test(bloco)) {
        var cita = bloco
          .split("\n")
          .map(function (l) {
            return l.replace(/^\s*>\s?/, "");
          })
          .join(" ");
        saida.push("<blockquote>" + emLinha(escapar(cita)) + "</blockquote>");
        return;
      }

      if (/^\s*([-*_])\1{2,}\s*$/.test(bloco)) {
        saida.push("<hr />");
        return;
      }

      if (linhas[0] && /^\s*\d+[.)]\s+/.test(linhas[0])) {
        saida.push(listaOrdenada(linhas));
        return;
      }
      if (linhas[0] && /^\s*[-*+]\s+/.test(linhas[0])) {
        saida.push(listaSimples(linhas));
        return;
      }

      saida.push("<p>" + emLinha(escapar(emUmaLinha(linhas))) + "</p>");
    });

    return saida.join("");
  }

  function limparMarkdown(texto) {
    return String(texto)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*(\d+)[.)]\s+/gm, function (_t, n) {
        return "Passo " + n + ". ";
      })
      .replace(/(\*\*|__|\*|_)/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  /* ------------------------------------------------------------------ *
   * Renderização das mensagens
   * ------------------------------------------------------------------ */

  function icone(nome, tamanho) {
    var t = tamanho || 20;
    return (
      '<svg width="' + t + '" height="' + t + '"><use href="#i-' + nome + '"></use></svg>'
    );
  }

  function mostrarMensagens() {
    var vazio = estado.mensagens.length === 0;
    elemento.boasVindas.hidden = !vazio;
    elemento.fila.hidden = vazio;
    controles.nova.hidden = vazio;

    if (vazio) return;

    elemento.fila.innerHTML = "";

    estado.mensagens.forEach(function (mensagem) {
      if (mensagem.role === "user") {
        var linha = document.createElement("div");
        linha.className = "fila__usuario";
        var bolha = document.createElement("p");
        bolha.className = "bolha-usuario";
        bolha.textContent = mensagem.content;
        linha.appendChild(bolha);
        elemento.fila.appendChild(linha);
        return;
      }

      var caixa = document.createElement("div");
      caixa.className = "bolha-assistente";
      caixa.id = mensagem.id;

      if (mensagem.content) {
        var corpo = document.createElement("div");
        corpo.className = "guia";
        corpo.innerHTML = markdown(mensagem.content);
        caixa.appendChild(corpo);
        if (!estado.carregando) caixa.appendChild(montarAcoes(mensagem.content));
      } else {
        var pontos = document.createElement("div");
        pontos.className = "pontos";
        pontos.setAttribute("role", "status");
        pontos.setAttribute("aria-label", "Escrevendo resposta");
        pontos.innerHTML = "<span></span><span></span><span></span>";
        caixa.appendChild(pontos);
      }

      elemento.fila.appendChild(caixa);
    });
  }

  function montarAcoes(texto) {
    var caixa = document.createElement("div");
    caixa.className = "acoes";

    var ouvir = document.createElement("button");
    ouvir.type = "button";
    ouvir.className = "botao";
    ouvir.innerHTML = icone("speaker") + "<span>Ouvir</span>";
    ouvir.addEventListener("click", function () {
      alternarVoz(ouvir, texto);
    });
    caixa.appendChild(ouvir);

    var copiar = document.createElement("button");
    copiar.type = "button";
    copiar.className = "botao";
    copiar.innerHTML = icone("copy") + "<span>Copiar</span>";
    copiar.addEventListener("click", function () {
      copiarTexto(texto, copiar);
    });
    caixa.appendChild(copiar);

    var imprimir = document.createElement("button");
    imprimir.type = "button";
    imprimir.className = "botao";
    imprimir.innerHTML = icone("print") + "<span>Imprimir</span>";
    imprimir.addEventListener("click", function () {
      window.print();
    });
    caixa.appendChild(imprimir);

    return caixa;
  }

  /* Agrupa as atualizações em um quadro por vez. Sem isso, um texto
     novo é redesenhado do zero a cada palavra que chega da IA. */
  var pendentes = {};
  var quadroAgendado = false;

  function agendarConteudo(id, texto) {
    pendentes[id] = texto;
    if (quadroAgendado) return;

    quadroAgendado = true;
    window.requestAnimationFrame(function () {
      quadroAgendado = false;
      for (var chave in pendentes) {
        desenharConteudo(chave, pendentes[chave]);
      }
      pendentes = {};
      if (colarNoFim) rolarParaFim("auto");
    });
  }

  function desenharConteudo(id, texto) {
    var caixa = document.getElementById(id);
    if (!caixa || !texto) return;

    var corpo = caixa.querySelector(".guia");
    if (!corpo) {
      caixa.innerHTML = "";
      corpo = document.createElement("div");
      corpo.className = "guia";
      caixa.appendChild(corpo);
    }
    corpo.innerHTML = markdown(texto);
  }

  function guardar(id, texto) {
    estado.mensagens = estado.mensagens.map(function (m) {
      return m.id === id ? { id: m.id, role: m.role, content: texto } : m;
    });
  }

  /* ------------------------------------------------------------------ *
   * Copiar
   * ------------------------------------------------------------------ */

  function copiarTexto(texto, botao) {
    var rotulo = botao.querySelector("span");
    var use = botao.querySelector("svg use");

    function pintou(ok) {
      if (!rotulo || !use) return;
      rotulo.textContent = ok ? "Copiado" : "Copiar";
      use.setAttribute("href", ok ? "#i-check" : "#i-copy");
      if (ok) {
        setTimeout(function () {
          rotulo.textContent = "Copiar";
          use.setAttribute("href", "#i-copy");
        }, 2200);
      }
    }

    // A área de transferência só existe em contexto seguro; em file://
    // usamos o método antigo, que funciona em qualquer navegador.
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(texto).then(
        function () {
          pintou(true);
        },
        function () {
          pintou(selecionarManualmente(texto));
        }
      );
      return;
    }
    pintou(selecionarManualmente(texto));
  }

  function selecionarManualmente(texto) {
    var area = document.createElement("textarea");
    area.value = texto;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.top = "-1000px";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(area);
    return ok;
  }

  /* ------------------------------------------------------------------ *
   * Voz alta
   * ------------------------------------------------------------------ */

  function vozPortuguesa() {
    if (!window.speechSynthesis) return null;
    var vozes = window.speechSynthesis.getVoices();
    var i;
    for (i = 0; i < vozes.length; i++) {
      if (vozes[i].lang.toLowerCase() === "pt-br") return vozes[i];
    }
    for (i = 0; i < vozes.length; i++) {
      if (vozes[i].lang.toLowerCase().indexOf("pt") === 0) return vozes[i];
    }
    return null;
  }

  function alternarVoz(botao, texto) {
    if (!window.speechSynthesis) return;

    var rotulo = botao.querySelector("span");
    var use = botao.querySelector("svg use");
    var falando = botao.dataset.falando === "1";

    function marcar(ligado) {
      botao.dataset.falando = ligado ? "1" : "0";
      if (rotulo) rotulo.textContent = ligado ? "Parar" : "Ouvir";
      if (use) use.setAttribute("href", ligado ? "#i-stop" : "#i-speaker");
    }

    window.speechSynthesis.cancel();
    if (falando) {
      marcar(false);
      return;
    }

    var fala = new SpeechSynthesisUtterance(limparMarkdown(texto));
    fala.lang = "pt-BR";
    fala.rate = 0.95;
    var voz = vozPortuguesa();
    if (voz) fala.voice = voz;
    fala.onend = function () {
      marcar(false);
    };
    fala.onerror = function () {
      marcar(false);
    };

    marcar(true);
    window.speechSynthesis.speak(fala);
  }

  /* ------------------------------------------------------------------ *
   * Ditado por voz
   * ------------------------------------------------------------------ */

  function instalarDitado() {
    var Construtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Construtor) return;

    var reconhecimento = null;

    controles.mic.hidden = false;
    controles.mic.addEventListener("click", function () {
      if (estado.carregando) return;
      if (reconhecimento) {
        reconhecimento.stop();
        return;
      }

      try {
        reconhecimento = new Construtor();
      } catch (e) {
        return;
      }

      reconhecimento.lang = "pt-BR";
      reconhecimento.continuous = false;
      reconhecimento.interimResults = false;

      function ativo(ligado) {
        controles.mic.classList.toggle("botao--mic-ativo", ligado);
        controles.mic.setAttribute(
          "aria-label",
          ligado ? "Parar de falar" : "Falar o seu problema em vez de escrever"
        );
        controles.mic.querySelector("svg use").setAttribute(
          "href",
          ligado ? "#i-stop" : "#i-mic"
        );
      }

      reconhecimento.onresult = function (evento) {
        var ditado = "";
        for (var i = evento.resultIndex; i < evento.results.length; i++) {
          ditado += evento.results[i][0].transcript;
        }
        if (ditado.trim()) {
          controles.mensagem.value =
            (controles.mensagem.value + " " + ditado).trim().slice(0, MAX_MENSAGEM);
          ajustarAltura();
          atualizarBotaoEnviar();
        }
      };
      reconhecimento.onerror = function () {
        ativo(false);
        reconhecimento = null;
      };
      reconhecimento.onend = function () {
        ativo(false);
        reconhecimento = null;
      };

      try {
        reconhecimento.start();
        ativo(true);
      } catch (e) {
        reconhecimento = null;
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Tamanho das letras
   * ------------------------------------------------------------------ */

  function escalaAtual() {
    var valor = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--escala")
    );
    return isFinite(valor) ? valor : 1;
  }

  function aplicarEscala(valor) {
    var escala = Math.min(ESCALA_MAX, Math.max(ESCALA_MIN, valor));
    escala = Math.round(escala * 1000) / 1000;
    document.documentElement.style.setProperty("--escala", String(escala));
    controles.valorTexto.textContent = Math.round(escala * 100) + "%";
    controles.menos.disabled = escala <= ESCALA_MIN;
    controles.mais.disabled = escala >= ESCALA_MAX;
    try {
      window.localStorage.setItem(CHAVE_ESCALA, String(escala));
    } catch (e) {
      /* modo privado bloqueia o armazenamento */
    }
  }

  function instalarEscala() {
    var salva = 1;
    try {
      salva = parseFloat(window.localStorage.getItem(CHAVE_ESCALA) || "") || 1;
    } catch (e) {
      salva = 1;
    }
    aplicarEscala(salva);
    controles.menos.addEventListener("click", function () {
      aplicarEscala(escalaAtual() - ESCALA_PASSO);
    });
    controles.mais.addEventListener("click", function () {
      aplicarEscala(escalaAtual() + ESCALA_PASSO);
    });
  }

  /* ------------------------------------------------------------------ *
   * Campo de escrita
   * ------------------------------------------------------------------ */

  function ajustarAltura() {
    var campo = controles.mensagem;
    var raiz = parseFloat(getComputedStyle(document.documentElement).fontSize) || 18;
    campo.style.height = "auto";
    campo.style.height = Math.min(campo.scrollHeight, 12 * raiz) + "px";
  }

  function atualizarBotaoEnviar() {
    if (estado.carregando) return;
    controles.enviar.disabled = controles.mensagem.value.trim() === "";
  }

  function mostrarBotaoParar() {
    controles.enviar.classList.add("oculto-visual");
    controles.enviar.disabled = false;
    controles.enviar.setAttribute("aria-label", "Parar de escrever");
    controles.enviar.querySelector("svg use").setAttribute("href", "#i-stop");
  }

  function voltarBotaoEnviar() {
    controles.enviar.classList.remove("oculto-visual");
    controles.enviar.querySelector("svg use").setAttribute("href", "#i-send");
    controles.enviar.setAttribute("aria-label", "Enviar mensagem");
    atualizarBotaoEnviar();
  }

  function mostrarErro(mensagem) {
    elemento.erroTexto.textContent = mensagem;
    elemento.caixaErro.hidden = false;
  }

  function esconderErro() {
    elemento.caixaErro.hidden = true;
  }

  /* ------------------------------------------------------------------ *
   * Conversa com o PHP (Grok) e com o modo demonstração
   * ------------------------------------------------------------------ */

  async function lerDoProxy(id, historico) {
    var resposta = await fetch(PROXY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: historico }),
      signal: controlador.signal,
    });

    if (!resposta.ok) {
      var dados = null;
      try {
        dados = await resposta.json();
      } catch (e) {
        /* resposta sem JSON */
      }
      throw new Error(
        (dados && dados.error) ||
          "Não consegui enviar sua mensagem. Tente de novo."
      );
    }

    if (!resposta.body) {
      throw new Error("A resposta veio vazia. Tente escrever de novo.");
    }

    var leitor = resposta.body.getReader();
    var decodificador = new TextDecoder();
    var buffer = "";
    var recebido = "";

    while (true) {
      var passo = await leitor.read();
      if (passo.done) break;

      buffer += decodificador.decode(passo.value, { stream: true });
      var linhas = buffer.split("\n");
      buffer = linhas.pop() || "";

      for (var i = 0; i < linhas.length; i++) {
        var linha = linhas[i].trim();
        if (!linha) continue;

        var evento;
        try {
          evento = JSON.parse(linha);
        } catch (e) {
          continue;
        }

        if (evento.t === "token") {
          recebido += evento.v;
          guardar(id, recebido);
          agendarConteudo(id, recebido);
        } else if (evento.t === "error") {
          throw new Error(evento.v);
        }
      }
    }

    if (!recebido.trim()) {
      throw new Error("A resposta veio vazia. Tente escrever de novo.");
    }
  }

  async function responderDemo(id, pergunta) {
    var texto = window.respostasDemo.buscar(pergunta);
    var partes = texto.match(/\s+|\S+/g) || [];
    var recebido = "";

    for (var i = 0; i < partes.length; i++) {
      recebido += partes[i];
      guardar(id, recebido);
      agendarConteudo(id, recebido);
      await dormir(partes[i].indexOf("\n") >= 0 ? 24 : 14);
    }
  }

  async function enviar(texto) {
    var pergunta = String(texto).trim();
    if (!pergunta || estado.carregando) return;

    var doUsuario = { id: proximoId(), role: "user", content: pergunta };
    var idResposta = proximoId();
    var historico = estado.mensagens.concat([doUsuario]);

    estado.mensagens = historico.concat([
      { id: idResposta, role: "assistant", content: "" },
    ]);
    estado.carregando = true;

    controles.mensagem.value = "";
    ajustarAltura();
    esconderErro();
    mostrarBotaoParar();
    colarNoFim = true;
    mostrarMensagens();
    rolarParaFim();

    controlador = new AbortController();

    // A pessoa pode ter ligado o servidor depois de abrir a página.
    // Só conferimos de novo se ainda estamos no modo demonstração.
    if (ABRINDO_DIRETO && !estado.servidorOk) {
      await verificarServidor();
    }

    try {
      if (estado.servidorOk && estado.modo === "grok") {
        await lerDoProxy(
          idResposta,
          historico.map(function (m) {
            return { role: m.role, content: m.content };
          })
        );
      } else {
        await responderDemo(idResposta, pergunta);
      }
    } catch (erro) {
      if (erro && erro.name === "AbortError") {
        estado.mensagens = estado.mensagens.filter(function (m) {
          return m.id !== idResposta;
        });
        return;
      }

      // Sem texto nenhum, a bolha vazia só confunde: some com ela.
      // Com texto parcial, mantém o que já apareceu e explica o erro.
      var parcial = estado.mensagens.some(function (m) {
        return m.id === idResposta && m.content;
      });

      if (!parcial) {
        estado.mensagens = estado.mensagens.filter(function (m) {
          return m.id !== idResposta;
        });
      }

      mostrarErro(
        erro && erro.message
          ? erro.message
          : "Algo deu errado. Por favor, tente de novo."
      );
    } finally {
      controlador = null;
      estado.carregando = false;
      voltarBotaoEnviar();
      mostrarMensagens();
      rolarParaFim();
    }
  }

  /* ------------------------------------------------------------------ *
   * Verificação do servidor
   * ------------------------------------------------------------------ */

  async function verificarServidor() {
    try {
      if (ABRINDO_DIRETO) {
        await acharServidor();
      }

      var resposta = await fetch(PROXY + "?status=1", {
        cache: "no-store",
        signal: sinalCancelamento(6000),
      });
      if (!resposta.ok) throw new Error("status " + resposta.status);
      var dados = await resposta.json();
      estado.servidorOk = true;
      estado.modo = dados.modo || dados.mode || "grok";
    } catch (e) {
      estado.servidorOk = false;
      estado.modo = "demo";
    }

    if (estado.modo === "grok") {
      elemento.faixa.hidden = true;
      return;
    }

    elemento.faixa.hidden = false;
    elemento.faixa.innerHTML = estado.servidorOk
      ? "Para receber respostas intelligententes, crie o arquivo <code>api/config.php</code> com a sua chave do Grok."
      : 'O servidor não está no ar, então estou usando respostas prontas. Para usar a IA, dê dois cliques em <code>iniciar.bat</code>.';
  }

  /**
   * Procura o servidor em algumas portas, porque o iniciar.bat pula a porta
   * 8000 se ela já estiver ocupada por outro programa.
   */
  async function acharServidor() {
    for (var porta = PORTA_INICIAL; porta <= ULTIMA_PORTA; porta += 1) {
      var url = "http://localhost:" + porta + "/api/proxy.php?status=1";
      try {
        var resposta = await fetch(url, {
          cache: "no-store",
          signal: sinalCancelamento(2000),
        });
        if (resposta.ok) {
          PROXY = "http://localhost:" + porta + "/api/proxy.php";
          return porta;
        }
      } catch (e) {
        // Porta não responde: seguimos para a próxima.
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------ *
   * Rolagem: não atrapalha se a pessoa subiu para reler
   * ------------------------------------------------------------------ */

  function instalarRolagem() {
    elemento.conversa.addEventListener("scroll", function () {
      var alvo = elemento.conversa;
      colarNoFim = alvo.scrollHeight - alvo.scrollTop - alvo.clientHeight < 140;
    });
  }

  /* ------------------------------------------------------------------ *
   * Tela inicial
   * ------------------------------------------------------------------ */

  var EXEMPLOS = [
    "Não consigo entrar no gov.br, esqueci a senha",
    "Como faço para pegar a segunda via do meu carnê no Meu INSS",
    "Meu cartão do SUS sumiu, o que eu faço?",
    "Quero saber se tenho direito a um benefício do INSS",
  ];

  function montarExemplos() {
    elemento.exemplos.innerHTML = "";

    EXEMPLOS.forEach(function (texto) {
      var item = document.createElement("li");
      var botao = document.createElement("button");
      botao.type = "button";
      botao.className = "exemplo";
      botao.textContent = texto;
      botao.addEventListener("click", function () {
        enviar(texto);
      });
      item.appendChild(botao);
      elemento.exemplos.appendChild(item);
    });
  }

  /* ------------------------------------------------------------------ *
   * Início
   * ------------------------------------------------------------------ */

  function iniciar() {
    controles = {
      mensagem: $("mensagem"),
      enviar: $("btn-enviar"),
      mic: $("btn-mic"),
      nova: $("btn-nova"),
      menos: $("btn-texto-menos"),
      mais: $("btn-texto-mais"),
      valorTexto: $("valor-texto"),
    };

    elemento = {
      conversa: $("conversa"),
      boasVindas: $("boas-vindas"),
      exemplos: $("exemplos"),
      fila: $("fila"),
      faixa: $("faixa"),
      caixaErro: $("caixa-erro"),
      erroTexto: $("erro-texto"),
    };

    montarExemplos();
    instalarEscala();
    instalarDitado();
    instalarRolagem();
    verificarServidor();

    controles.mensagem.addEventListener("input", function () {
      ajustarAltura();
      atualizarBotaoEnviar();
    });

    controles.mensagem.addEventListener("keydown", function (evento) {
      if (evento.key === "Enter" && !evento.shiftKey && !evento.isComposing) {
        evento.preventDefault();
        enviar(controles.mensagem.value);
      }
    });

    $("formulario").addEventListener("submit", function (evento) {
      evento.preventDefault();
      if (estado.carregando) {
        if (controlador) controlador.abort();
        return;
      }
      enviar(controles.mensagem.value);
    });

    controles.nova.addEventListener("click", function () {
      if (controlador) controlador.abort();
      estado.mensagens = [];
      estado.carregando = false;
      esconderErro();
      voltarBotaoEnviar();
      mostrarMensagens();
      controles.mensagem.focus();
    });

    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = vozPortuguesa;
    }

    window.addEventListener("beforeunload", function () {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });

    controles.mensagem.focus();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
