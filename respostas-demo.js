/* Respostas usadas quando o PHP não está no ar (modo demonstração).
   Precisam ficar em JavaScript, e não em PHP, para que o index.html
   continue funcionando quando aberto com dois cliques. */

(function () {
  "use strict";

  var RESPOSTAS = [
    {
      teste: /senha|entrar|logar|acesso|conta|gov\.br|esqueci|recuperar/i,
      texto:
        "Entendi. Você quer entrar no gov.br e não consegue. Isso é bem comum, acontece com quase todo mundo. Vamos por partes, sem pressa.\n" +
        "\n" +
        "## PASSO A PASSO\n" +
        "\n" +
        "1. **Abra o site do governo.**\n" +
        "   Toque no navegador do celular ou digite `www.gov.br` no computador. Vai aparecer a página inicial do governo. É esse site mesmo, com a foto da bandeira.\n" +
        "\n" +
        "2. **Aperte o botão \"Entrar\".**\n" +
        "   Ele fica no canto da direita da tela, bem em cima. Vai abrir um espaço para você digitar o seu CPF e a sua senha.\n" +
        "\n" +
        "3. **Aperte \"Esqueci minha senha\".**\n" +
        "   Essa frase fica em letra azul, embaixo do espaço da senha. Pode apertar sem medo, isso não vai estragar nada.\n" +
        "\n" +
        "4. **Escolha como quer recuperar.**\n" +
        "   Aparece uma tela com três opções. A mais fácil é receber um código no seu e-mail ou no seu celular. Toque na opção do e-mail que você usa.\n" +
        "\n" +
        "5. **Digite o código que chegou.**\n" +
        "   Olhe no e-mail ou na mensagem do celular. Vai ter um código com números. Digite ele no espaço da tela e aperte **Avançar**.\n" +
        "\n" +
        "6. **Crie uma senha nova.**\n" +
        "   Escolha uma senha fácil de lembrar. Anote em um caderno e guarde em lugar seguro. Não precisa ser difícil, só precisa ser difícil de outra pessoa adivinhar.\n" +
        "\n" +
        "## SE DER PROBLEMA\n" +
        "\n" +
        "- Se a opção do e-mail não funcionar, tente a opção do número de telefone.\n" +
        "- Se o código não chegar, confira se o e-mail está certo, sem espaço e sem erro de digitação.\n" +
        "- Se a tela pedir o CPF e a data de nascimento, é normal. A data de nascimento é a sua, não a do seu filho.\n" +
        "\n" +
        "## ONDE ISSO FICA\n" +
        "\n" +
        "`https://www.gov.br` - esse é o único site oficial do governo. Cuidado com sites parecidos que terminam com outras letrinhas.\n" +
        "\n" +
        "Quer que eu te ajude a chegar nessa tela? Me diga se você está no celular ou no computador.",
    },

    {
      teste: /inss/i,
      texto:
        "Entendi. Vamos resolver isso no Meu INSS. É o site do próprio INSS, o lugar onde você vê benefícios, segunda via e pedidos.\n" +
        "\n" +
        "## PASSO A PASSO\n" +
        "\n" +
        "1. **Abra o site do Meu INSS.**\n" +
        "   Digite `www.gov.br` no navegador. Depois procure o nome **Meu INSS** e toque nele. Também dá para entrar pelo aplicativo, procurando \"Meu INSS\" na loja de aplicativos do celular.\n" +
        "\n" +
        "2. **Coloque seu CPF e sua senha.**\n" +
        "   Se você nunca criou senha, o Meu INSS manda uma **senha provisória**. Ela vem por e-mail ou por telefone. Anote ela em um papel.\n" +
        "\n" +
        "3. **Crie sua senha definitiva.**\n" +
        "   Na primeira vez que entra, o site pede para você escolher uma senha com 8 ou mais caracteres. Escolha uma que você lembre fácil. Confira se as duas caixas ficaram iguais e aperte **Confirmar**.\n" +
        "\n" +
        "4. **Aperte \"Alterar senha\" depois de entrar.**\n" +
        "   Se você já tem senha, dá para mudar quando quiser. Isso é bom para trocar uma senha antiga e difícil de lembrar.\n" +
        "\n" +
        "## SE DER PROBLEMA\n" +
        "\n" +
        "- Se aparecer \"CPF não encontrado\", confira se digitou todos os 11 números, sem espaço e sem ponto.\n" +
        "- Se você esqueceu a senha de novo, use a opção \"Esqueci minha senha\" na mesma tela de entrada.\n" +
        "- Se o site pedir um código no celular, abra o aplicativo do gov.br no celular para ver o código. É a confirmação de segurança.\n" +
        "\n" +
        "## ONDE ISSO FICA\n" +
        "\n" +
        "`https://www.meuinss.gov.br` - site oficial do Meu INSS.\n" +
        "\n" +
        "O que exatamente você quer fazer lá? Me conte que eu te guio.",
    },

    {
      teste: /carne|carnê|segunda via|2ª via|boleto|pagar/i,
      texto:
        "Entendi. Você quer a segunda via do carnê para pagar. Isso é o boleto das mensalidades do INSS. Vamos lá.\n" +
        "\n" +
        "## PASSO A PASSO\n" +
        "\n" +
        "1. **Entre no Meu INSS.**\n" +
        "   Abra `www.gov.br`, toque em **Entrar** e procure o nome **Meu INSS**. Coloque seu CPF e sua senha.\n" +
        "\n" +
        "2. **Procure o seu benefício.**\n" +
        "   No canto esquerdo da tela, aparecem os benefícios em uma lista. Toque no nome da aposentadoria, da pensão ou do benefício que você recebe.\n" +
        "\n" +
        "3. **Toque no benefício que você quer.**\n" +
        "   Abre um cartão com o nome dele. Toque em **Carnês**. É aí que ficam as parcelas de cada mês.\n" +
        "\n" +
        "4. **Escolha o mês.**\n" +
        "   Toque no mês que você quer pagar. Se quiser o ano inteiro, toque em **Emitir todos** ou em **ano todo**.\n" +
        "\n" +
        "5. **Baixe ou imprima o boleto.**\n" +
        "   Toque em **Emitir carnê**. Abre um PDF. Você pode baixar no celular ou mandar para o e-mail e imprimir no computador.\n" +
        "\n" +
        "6. **Pague no banco ou na lotérica.**\n" +
        "   Leve o boleto impresso, ou digite o código de barras no aplicativo do seu banco. Também dá para pagar pelo Pix, se o banco mostrar essa opção.\n" +
        "\n" +
        "## SE DER PROBLEMA\n" +
        "\n" +
        "- Se o carnê não aparecer, é sinal de que o mês já foi pago.\n" +
        "- Se aparecer \"sem débitos\", a cobrança ainda não foi gerada. Espere alguns dias e volte.\n" +
        "- Se o PDF não abrir, tente baixar de novo ou tire uma foto dele com o celular.\n" +
        "\n" +
        "## ONDE ISSO FICA\n" +
        "\n" +
        "`https://www.meuinss.gov.br`\n" +
        "\n" +
        "Você quer o boleto de qual mês? E vai pagar no banco ou pelo aplicativo do banco?",
    },

    {
      teste: /cart[aã]o sus|\bsus\b|consulta|agendar|ubs|unidade b[aá]sica/i,
      texto:
        "Entendi. Vamos cuidar do seu Cartão SUS. Ele é o cartão que dá direito à consulta e aos remédios de graça.\n" +
        "\n" +
        "## PASSO A PASSO\n" +
        "\n" +
        "1. **Abra o site do Ministério da Saúde.**\n" +
        "   Digite `www.gov.br` no navegador. Depois procure o nome **Saúde** e toque nele.\n" +
        "\n" +
        "2. **Entre com sua conta do gov.br.**\n" +
        "   Toque em **Entrar** no canto da direita. Use o mesmo CPF e a mesma senha que você já criou.\n" +
        "\n" +
        "3. **Vá até o Cartão SUS.**\n" +
        "   No menu do lado esquerdo, procure **Cartão SUS** e toque nesse nome.\n" +
        "\n" +
        "4. **Veja os dados do seu cartão.**\n" +
        "   Aparecem o número do cartão, o nome de quem ele pertence e a validade. Se aparecer a palavra **Válido** com a cor verde, está tudo certo.\n" +
        "\n" +
        "5. **Se precisar de um cartão novo, peça a segunda via.**\n" +
        "   Toque em **Solicitar emissão de cartão** ou em **Segunda via**. Leve um documento com foto, como RG ou CPF, até a unidade de saúde mais perto de casa.\n" +
        "\n" +
        "## SE DER PROBLEMA\n" +
        "\n" +
        "- Se você não tem o cartão em mãos, pode usar o número do Cartão SUS que está anotado em qualquer papel antigo.\n" +
        "- Se o cartão estiver com a validade vencida, não precisa ter medo. Ele continua valendo para a consulta.\n" +
        "- Se aparecer \"cartão não encontrado\", confirme se o CPF está com 11 números, sem ponto.\n" +
        "\n" +
        "## ONDE ISSO FICA\n" +
        "\n" +
        "`https://www.gov.br/saude` - site oficial do Ministério da Saúde.\n" +
        "\n" +
        "Você já tem o cartão em mãos ou ele está perdido?",
    },
  ];

  var PADRAO =
    "Entendi. Vou te ajudar com isso, calma que a gente vai por partes.\n" +
    "\n" +
    "## PASSO A PASSO\n" +
    "\n" +
    "1. **Abra o site do governo.**\n" +
    "   Digite `www.gov.br` no navegador do celular ou do computador. É o site oficial do governo brasileiro.\n" +
    "\n" +
    "2. **Aperte o botão \"Entrar\".**\n" +
    "   Ele fica no canto da direita da tela, bem em cima.\n" +
    "\n" +
    "3. **Coloque seu CPF e sua senha.**\n" +
    "   Se você não tiver senha ainda, aperte **Esqueci minha senha** e escolha receber um código no seu e-mail.\n" +
    "\n" +
    "4. **Procure o serviço que você precisa.**\n" +
    "   Depois de entrar, use a caixa de busca lá em cima e digite o que você quer, com poucas palavras. Por exemplo: `segunda via` ou `meu benefício`.\n" +
    "\n" +
    "## SE DER PROBLEMA\n" +
    "\n" +
    "- Se a página ficar muito carregada, feche e abra o site de novo.\n" +
    "- Se aparecer aviso de erro, troque a senha e tente outra vez.\n" +
    "- Se preferir, você pode ir presencialmente. Leve documento com foto e chegue cedo.\n" +
    "\n" +
    "## ONDE ISSO FICA\n" +
    "\n" +
    "`https://www.gov.br` - o único site oficial. Desconfie de sites parecidos.\n" +
    "\n" +
    "Me conta com mais detalhe o que você precisa fazer? Assim eu te dou o passo a passo certinho para o seu caso.";

  window.respostasDemo = {
    buscar: function (pergunta) {
      for (var i = 0; i < RESPOSTAS.length; i++) {
        if (RESPOSTAS[i].teste.test(pergunta)) return RESPOSTAS[i].texto;
      }
      return PADRAO;
    },
  };
})();
