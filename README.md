# Guia Brasil

Ajuda para pessoas idosas resolverem problemas em sites do governo brasileiro
(Meu INSS, gov.br, Cartão SUS, benefícios).

---

## Como usar (3 passos)

### 1. Ligue a chave do Grok

1. Crie uma conta em **https://console.x.ai** e gere uma chave (API key).
2. Copie o arquivo `api\config.exemplo.php` e renomeie o cópia para `config.php`.
3. Abra o `config.php` e troque `COLE_SUA_CHAVE_AQUI` pela sua chave. Salve.

O arquivo `config.php` **nunca** é enviado para a internet, e a chave nunca
aparece no navegador. Por isso ele está no `.gitignore`.

### 2. Ligue o site

Dê **dois cliques** em `iniciar.bat`.

Abre uma janela preta. É o servidor. Não feche enquanto estiver usando.

### 3. Abra no navegador

O navegador abre sozinho em `http://localhost:8000`.

Sem a chave, o site funciona em **modo demonstração**, com respostas prontas.
Com a chave, as respostas vêm do Grok, com busca na internet.

---

## O que tem em cada arquivo

| Arquivo | Para que serve |
|---|---|
| `index.html` | A página. Pode abrir direto com dois cliques. |
| `styles.css` | O visual, com letras grandes e botões grandes. |
| `app.js` | A conversa, a voz alta, o microfone e o tamanho das letras. |
| `respostas-demo.js` | Respostas prontas para quando não tem chave. |
| `api\proxy.php` | A ponte para o Grok. É o único lugar que vê a chave. |
| `api\instrucoes.php` | O texto que ensina o Grok a responder do jeito simples. |
| `api\config.php` | **Sua chave.** Não compartilhe. |
| `iniciar.bat` | Liga o servidor e abre o navegador. |

### Se quiser mudar o jeito de o Guia Brasil falar

Abra `api\instrucoes.php` e edite o texto. É um arquivo de texto normal.
Não é preciso mexer em mais nada.

---

## Sobre a busca na internet

Quando a busca está ligada, ela fica **presa só em sites oficiais** do governo
(`gov.br`, `meuinss.gov.br`, `trabalho.gov.br`, `saude.gov.br`, `planalto.gov.br`).
Isso reduz muito o risco de o Guia Brasil indicar um site falso.

Para mudar essa lista, edite o campo `dominios` no `config.php`.
O limite é 5 endereços. Para usar a internet toda, coloque `[]`.

---

## Privacidade e segurança

- A chave fica no servidor. O navegador só fala com `proxy.php`.
- O site **nunca** pede senha, cartão, código de verificação ou dados de banco.
- Se alguém digitar um desses dados, o Guia Brasil avisa para apagar a mensagem.
- A conversa é guardada só no seu navegador. Nada é enviado para guardar.
- O modo privado do navegador não guarda a conversa.

---

## Problemas comuns

**A janela preta fecha na hora**
O PHP não foi encontrado. O XAMPP precisa estar instalado em `C:\xampp`.
Se estiver em outro lugar, edite a linha `set "PHP="` dentro de `iniciar.bat`.

**Diz "A chave do Grok não foi aceita"**
A chave está errada, vencida ou ainda é o texto de exemplo. Confira o `config.php`.

**Diz "Esse modelo do Grok não está disponível"**
O nome em `modelo` não existe para a sua conta. Veja os modelos válidos em
**https://docs.x.ai** e troque no `config.php`.

**Diz "o serviço está sem crédito"**
A conta em console.x.ai precisa de saldo.

**A busca na internet não responde**
Prova a busca com `"busca" => false` no `config.php`. O site continua funcionando,
mas sem consultar a web.

**Abri o index.html e não funciona**
Dá para abrir direto, mas o PHP precisa estar ligado em outra aba
(é o `iniciar.bat`). Sem ele, o site usa as respostas prontas.

---

## Detalhes técnicos

- PHP 8.0 ou mais novo.
- Só usa o PHP que já vem no XAMPP. Não precisa instalar mais nada.
- Não usa internet para carregar nada: sem fontes externas, sem CDN.
- Funciona sem internet no modo demonstração.
- O envio das respostas é em NDJSON, uma linha por pedaço de texto, para o
  texto aparecer na tela aos poucos, como se fosse digitando.
