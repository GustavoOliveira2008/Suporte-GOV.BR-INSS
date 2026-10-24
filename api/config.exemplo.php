<?php
/**
 * Coloque aqui a sua chave do Grok.
 *
 * Como usar:
 *   1. Copie este arquivo e renomeie para  config.php
 *      (ou: clique com o botão direito e escolha "Copiar" -> "config.php")
 *   2. Troque 'COLE_SUA_CHAVE_AQUI' pela chave criada em https://console.x.ai
 *   3. Salve
 *
 * Este arquivo roda no servidor, então a chave NÃO vai para o navegador.
 */

return [
    'chave'  => 'COLE_SUA_CHAVE_AQUI',

    // Modelo usado. Confira os nomes disponíveis em https://docs.x.ai
    'modelo' => 'grok-4.7',

    // Consulta a internet durante a resposta.
    'busca'  => true,

    /*
     * Quando a busca está ligada, ela fica presa só nestes sites oficiais.
     * É uma proteção contra site falso, e o limite é de 5 endereços.
     * Coloque [] para a busca usar a internet toda.
     */
    'dominios' => [
        'gov.br',
        'meuinss.gov.br',
        'trabalho.gov.br',
        'saude.gov.br',
        'planalto.gov.br',
    ],
];
