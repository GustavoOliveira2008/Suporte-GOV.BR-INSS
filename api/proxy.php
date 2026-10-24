<?php
/**
 * Guia Brasil - ponte para a API do Grok.
 *
 * Este arquivo é o único lugar onde a chave aparece, e ele roda no servidor.
 * O navegador nunca vê a chave: fala apenas com este arquivo.
 *
 * Para ativar a IA, copie api/config.exemplo.php para api/config.php e
 * coloque a sua chave ali. Assim a chave não corre risco de ser publicada.
 */

header('Content-Type: application/x-ndjson; charset=utf-8');
header('Cache-Control: no-store, no-transform');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* Resposta já streaming: sem buffer, senão o texto chega tudo de uma vez. */
ini_set('output_buffering', '0');
ini_set('zlib.output_compression', 'Off');
ini_set('implicit_flush', '1');
while (ob_get_level() > 0) {
    ob_end_flush();
}
ob_implicit_flush(true);

/** Manda um evento para a tela. Cada evento é uma linha só. */
function enviar(array $evento): void
{
    echo json_encode($evento, JSON_UNESCAPED_UNICODE) . "\n";
    flush();
}

/* ------------------------------------------------------------------ *
 * Configuração
 * ------------------------------------------------------------------ */

$config = is_file(__DIR__ . '/config.php') ? require __DIR__ . '/config.php' : [];
$chave  = trim((string) ($config['chave'] ?? getenv('XAI_API_KEY') ?: ''));
$modelo = trim((string) ($config['modelo'] ?? getenv('GROK_MODEL') ?: '')) ?: 'grok-4.7';

/**
 * A busca na internet é desligada por padrão no arquivo config.php.
 * Este filtro existe para o caso de ligá-la: a busca fica presa a sites
 * oficiais do governo. Assim o Guide nunca sugere site falso.
 */
$dominios = $config['dominios'] ?? [
    'gov.br',
    'meuinss.gov.br',
    'trabalho.gov.br',
    'saude.gov.br',
    'planalto.gov.br',
];
$dominios = is_array($dominios) ? array_slice(array_values(array_filter($dominios, 'is_string')), 0, 5) : [];

$buscaBruta = $config['busca'] ?? (getenv('GROK_SEARCH') ?: 'on');
$buscar     = in_array(strtolower((string) $buscaBruta), ['1', 'true', 'on', 'sim'], true);

/* ------------------------------------------------------------------ *
 * Mensagens de erro: pensadas para a pessoa, não para o programador
 * ------------------------------------------------------------------ */

function erroAmigavel(int $status, string $detalhe): string
{
    error_log('[guia-brasil] resposta ' . $status . ': ' . $detalhe);

    $erroDeChave = (bool) preg_match('/api\s*key|incorrect api key|unauthorized|authorization/i', $detalhe);
    $erroDePlano = (bool) preg_match('/insufficient|quota|billing|credit|spend/i', $detalhe);
    $erroDeModelo = stripos($detalhe, 'model') !== false
        && (bool) preg_match('/not found|does not exist|deprecat|no such model/i', $detalhe);

    if ($erroDeChave) {
        return 'A chave do Grok não foi aceita. Aviso ao responsável pelo site: '
            . 'a chave em api/config.php está inválida, vencida ou faltando.';
    }
    if ($erroDePlano) {
        return 'O serviço está sem crédito ou o plano não cobre este pedido. '
            . 'Aviso ao responsável pelo site: é preciso verificar a conta em console.x.ai.';
    }
    if ($erroDeModelo) {
        return 'Esse modelo do Grok não está disponível. Aviso ao responsável pelo site: '
            . 'o campo "modelo" em api/config.php precisa ser mudado para um nome que a conta possa usar.';
    }
    if ($status === 429) {
        return 'Muita gente usando ao mesmo tempo. Espere um minutinho e tente de novo.';
    }
    if ($status >= 500) {
        return 'O serviço do Grok está com problema agora. Tente de novo daqui a pouco.';
    }
    if ($status === 413) {
        return 'Sua mensagem ficou grande demais. Escreva um pouco menos e tente de novo.';
    }

    return 'Não consegui responder agora. Tente escrever sua mensagem de novo.';
}

/** Extrai a mensagem de dentro do JSON de erro que a API devolve. */
function detalheDoErro(string $bruto): string
{
    $dados = json_decode($bruto, true);
    if (!is_array($dados)) {
        return mb_substr(trim($bruto), 0, 300);
    }
    foreach (['error', 'message', 'detail'] as $campo) {
        if (isset($dados[$campo]) && is_string($dados[$campo])) {
            return $dados[$campo];
        }
        if (isset($dados[$campo]) && is_array($dados[$campo]) && isset($dados[$campo]['message'])) {
            return (string) $dados[$campo]['message'];
        }
    }
    return mb_substr($bruto, 0, 300);
}

/**
 * Diz se vale a pena tentar de novo.
 *
 * Chave errada, cota estourada e problema de permissão não melhoram
 * mudando o formato do pedido. Já um pedido malformado pode melhorar
 * quando a gente simplifica, então nesse caso a gente tenta.
 */
function valeTentarDeNovo(int $status, string $detalhe): bool
{
    if (in_array($status, [0, 401, 402, 403, 429], true)) {
        return false;
    }
    $problemaDaConta = '/api\s*key|incorrect api key|unauthorized|authorization|permission|'
        . 'insufficient|quota|billing|credit|spend/i';
    return !preg_match($problemaDaConta, $detalhe);
}

/* ------------------------------------------------------------------ *
 * Consulta o servidor: o navegador pergunta se a IA está ligada
 * ------------------------------------------------------------------ */

if (isset($_GET['status'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'modo' => $chave !== '' ? 'grok' : 'demo'], JSON_UNESCAPED_UNICODE);
    exit;
}

/* ------------------------------------------------------------------ *
 * O que a pessoa escreveu
 * ------------------------------------------------------------------ */

$limiteCaracteres = 4000;
$limiteHistorico  = 20;

$entrada    = json_decode((string) file_get_contents('php://input'), true);
$mensagens  = is_array($entrada['messages'] ?? null) ? $entrada['messages'] : [];

$limpas = [];
foreach ($mensagens as $mensagem) {
    if (!is_array($mensagem)) {
        continue;
    }
    $papel = ($mensagem['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
    $texto = trim((string) ($mensagem['content'] ?? ''));
    if ($texto === '') {
        continue;
    }
    $limpas[] = ['role' => $papel, 'content' => $texto];
}
$limpas = array_slice($limpas, -$limiteHistorico);

$total = 0;
foreach ($limpas as $mensagem) {
    $total += mb_strlen($mensagem['content']);
}
if ($total > $limiteCaracteres) {
    $limpas = [];
    foreach (array_reverse($mensagens) as $mensagem) {
        if (!is_array($mensagem)) {
            continue;
        }
        $papel = ($mensagem['role'] ?? '') === 'assistant' ? 'assistant' : 'user';
        $texto = trim((string) ($mensagem['content'] ?? ''));
        if ($texto === '' || $total + mb_strlen($texto) > $limiteCaracteres) {
            continue;
        }
        array_unshift($limpas, ['role' => $papel, 'content' => $texto]);
        $total += mb_strlen($texto);
    }
    $limpas = array_slice($limpas, -$limiteHistorico);
}

if (!$limpas || ($limpas[0]['role'] !== 'user' && count($limpas) < 2)) {
    http_response_code(400);
    enviar(['t' => 'error', 'v' => 'Mensagem inválida. Escreva seu problema e toque em Enviar.']);
    exit;
}

/* ------------------------------------------------------------------ *
 * Consulta o servidor: o navegador pergunta se a IA está ligada
 * ------------------------------------------------------------------ */

if (isset($_GET['status'])) {
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['ok' => true, 'modo' => $chave !== '' ? 'grok' : 'demo'], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($chave === '') {
    enviar(['t' => 'error', 'v' => 'A chave do Grok ainda não foi cadastrada. '
        . 'O responsável pelo site precisa criar o arquivo api/config.php.']);
    exit;
}

$instrucoes = require __DIR__ . '/instrucoes.php';

/* ------------------------------------------------------------------ *
 * Monta os pedidos
 * ------------------------------------------------------------------ */

/**
 * Endpoint novo da xAI, o único que aceita busca na internet hoje.
 * A busca antiga (live_search) foi descontinuada.
 */
function montarRespostas(array $historico, string $instrucoes, string $modelo, array $dominios): array
{
    $corpo = [
        'model'        => $modelo,
        'stream'       => true,
        'instructions' => $instrucoes,
        'input'        => array_map(static function (array $m): array {
            return ['role' => $m['role'], 'content' => $m['content']];
        }, $historico),
    ];

    if ($dominios) {
        $corpo['tools'] = [[
            'type'    => 'web_search',
            'filters' => ['allowed_domains' => $dominios],
        ]];
    }

    return ['https://api.x.ai/v1/responses', json_encode($corpo, JSON_UNESCAPED_UNICODE)];
}

/**
 * Endpoint antigo, sem busca. Serve de reserva caso a conta não possa
 * usar o endpoint novo.
 */
function montarChat(array $historico, string $instrucoes, string $modelo, array $dominios = []): array
{
    $comSistema = array_merge(
        [['role' => 'system', 'content' => $instrucoes]],
        array_map(static function (array $m): array {
            return ['role' => $m['role'], 'content' => $m['content']];
        }, $historico)
    );

    $corpo = [
        'model'    => $modelo,
        'stream'   => true,
        'messages' => $comSistema,
    ];

    return ['https://api.x.ai/v1/chat/completions', json_encode($corpo, JSON_UNESCAPED_UNICODE)];
}

/* ------------------------------------------------------------------ *
 * Envia o pedido e repassa o texto, pedacinho por pedacinho
 * ------------------------------------------------------------------ */

/**
 * Não manda o evento de erro: devolve status e mensagem para quem chamou
 * decidir. Isso importa porque ainda pode haver nova tentativa.
 */
function repassar(string $url, string $corpoRequisicao, string $chave): array
{
    $contexto = stream_context_create([
        'http' => [
            'method'        => 'POST',
            'header'        => "Content-Type: application/json\r\nAuthorization: Bearer $chave",
            'content'       => $corpoRequisicao,
            'timeout'       => 90,
            'ignore_errors' => true,
        ],
        'ssl' => ['verify_peer' => true, 'verify_peer_name' => true],
    ]);

    $fluxo = @fopen($url, 'rb', false, $contexto);
    if ($fluxo === false) {
        error_log('[guia-brasil] não consegui abrir a conexão com a api.x.ai');
        return [0, 'Não consegui falar com o serviço agora. Pode ser a internet. '
            . 'Espere um instante e tente de novo.', false, 'falha de conexão'];
    }

    $status = 0;
    if (isset($http_response_header[0])
        && preg_match('#HTTP/\S+\s+(\d{3})#', $http_response_header[0], $achou)) {
        $status = (int) $achou[1];
    }

    if ($status < 200 || $status >= 300) {
        $corpo = stream_get_contents($fluxo);
        fclose($fluxo);
        $detalhe = detalheDoErro((string) $corpo);
        return [$status, erroAmigavel($status, $detalhe), false, $detalhe];
    }

    $mandouAlgo = false;
    while (($linha = fgets($fluxo)) !== false) {
        $linha = trim($linha);
        if ($linha === '' || strpos($linha, 'data:') !== 0) {
            continue;
        }

        $dados = trim(substr($linha, 5));
        if ($dados === '[DONE]') {
            break;
        }

        $parte = json_decode($dados, true);
        if (!is_array($parte)) {
            continue;
        }

        // Endpoint novo: eventos como response.output_text.delta
        if (isset($parte['type']) && $parte['type'] === 'response.output_text.delta'
            && is_string($parte['delta'] ?? null) && $parte['delta'] !== '') {
            $mandouAlgo = true;
            enviar(['t' => 'token', 'v' => $parte['delta']]);
            continue;
        }

        // Endpoint antigo: choices[].delta.content
        $texto = $parte['choices'][0]['delta']['content'] ?? null;
        if (is_string($texto) && $texto !== '') {
            $mandouAlgo = true;
            enviar(['t' => 'token', 'v' => $texto]);
        }
    }
    fclose($fluxo);

    if (!$mandouAlgo) {
        return [502, 'A resposta veio vazia. Por favor, tente escrever de novo.', false, 'resposta vazia'];
    }
    return [200, '', true, ''];
}

/* ------------------------------------------------------------------ *
 * Tenta, tenta de novo, tenta mais simples
 * ------------------------------------------------------------------ */

$tentativas = [
    ['montarRespostas', $dominios],
    ['montarRespostas', []],
    ['montarChat', []],
];

$mandouTexto    = false;
$ultimoStatus   = 0;
$ultimaMensagem = '';

foreach ($tentativas as [$montador, $extra]) {
    list($url, $corpo) = $montador($limpas, $instrucoes, $modelo, $extra);

    list($status, $mensagem, $mandouAlgo, $detalhe) = repassar($url, $corpo, $chave);

    $mandouTexto    = $mandouTexto || $mandouAlgo;
    $ultimoStatus   = $status;
    $ultimaMensagem = $mensagem;

    if ($status === 200) {
        break;
    }

    // Texto já apareceu na tela: repetir entregaria a resposta duas vezes.
    if ($mandouTexto) {
        break;
    }

    if (!valeTentarDeNovo($status, $detalhe)) {
        error_log('[guia-brasil] parou de tentar (HTTP ' . $status . '): problema da conta, não do pedido');
        break;
    }

    error_log('[guia-brasil] tentativa falhou (HTTP ' . $status . '), simplificando o pedido');
}

if ($ultimoStatus === 200) {
    enviar(['t' => 'done']);
} else {
    enviar(['t' => 'error', 'v' => $ultimaMensagem]);
}
