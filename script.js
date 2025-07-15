function isQuestionRelatedToGame(game, question) {
  question = question.toLowerCase();

  const keywords = {
    valorant: ["valorant", "agente", "riot", "vandal", "spike", "brimstone", "bind", "ascent"],
    lol: ["league", "lol", "champion", "summoner", "aram", "mid", "jungler", "adc", "rito", "runeterra"],
    csgo: ["cs", "csgo", "counter", "terrorist", "dust2", "mirage", "inferno", "smoke", "flash"]
  };

  return keywords[game]?.some(keyword => question.includes(keyword)) || false;
}

const apiKeyInput = document.getElementById('apiKey')
const gameSelect = document.getElementById('gameSelect')
gameSelect.addEventListener("change", () => {
  document.body.className = ""; // Remove tema anterior
  const selectedGame = gameSelect.value;
  if (selectedGame) {
    document.body.classList.add(`${selectedGame}-theme`);
  }
});

const questionInput = document.getElementById('questionInput')
const askButton = document.getElementById('askButton')
const aiResponse = document.getElementById('aiResponse')
const form = document.getElementById('form')

const markdownToHTML = (text) => {
    const converter = new showdown.Converter()
    return converter.makeHtml(text)
}

const perguntarAI = async (question, game, apiKey) => {
    const model = "gemini-2.0-flash"
    const geminiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    const pergunta = `
        ## Especialidade
        Você é um especialista assistente de meta para o jogo ${game}

        ## Tarefa
        Você deve responder as perguntas do usuário com base no seu conhecimento do jogo, estratégias, build e dicas

        ## Regras
        - Se você não sabe a resposta, responda com 'Não sei' e não tente inventar uma resposta.
        - Se a pergunta não está relacionada ao jogo, responda com 'Essa pergunta não está relacionada ao jogo'.
        - Considere a data atual ${new Date().toLocaleDateString()}
        - Faça pesquisas atualizadas sobre o patch atual, baseado na data atual, para dar uma resposta coerente.
        - Nunca responda itens que você não tenha certeza de que existe no patch atual.

        ## Resposta
        - Economize na resposta, seja direto e responda no máximo 500 caracrteres. 
        - Responda em markdown.
        - Não precisa fazer nenhuma saudação ou despedida, apenas responda o que o usuário está querendo.

        ## Exemplo de resposta
        Pergunta do usuário: Melhor build rengar jungle
        Resposta: A build mais atual é: \n\n *Itens:**\n\n coloque os itens aqui.\n\n**

        ---
        Aqui está a pergunta do usuário: ${question}

    `
    const contents = [{
        role: "user",
        parts: [{
            text: pergunta
        }]
    }]

    const tools = [{
        google_search: {}
    }]

    const response = await fetch(geminiURL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
         },
         body: JSON.stringify({
            contents,
            tools
         })
    })

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
}

const enviarFormulario = async (event) => {
    event.preventDefault()
    const apiKey = apiKeyInput.value
    const game = gameSelect.value
    const question = questionInput.value

    if (apiKey == '' || game == '' || question == '') {
        alert ('Por favor, preencha todos os campos')
        return
    }

     // VALIDAÇÃO da pergunta x jogo
    if (!isQuestionRelatedToGame(game, question)) {
        aiResponse.classList.remove("hidden");
        aiResponse.querySelector('.response-content').innerHTML = "<p>A pergunta não está relacionada ao jogo selecionado.</p>";
        return;
    }

    askButton.disabled = true
    askButton.textContent = 'Perguntando...'
    askButton.classList.add('loading')

    try {
      const text = await perguntarAI (question, game, apiKey)
      aiResponse.querySelector('.response-content').innerHTML = markdownToHTML(text)
      aiResponse.classList.remove('hidden')
    } catch(error) {
        console.log('Erro: ', error)
    } finally {
      askButton.disabled = false
      askButton.textContent = 'Perguntar'
      askButton.classList.remove('loading')
    }

const placeholders = [
  "Ex: Melhor agente pra Icebox?",
  "Ex: Build mais forte do patch?",
  "Ex: Counter de Yoru no Valorant?",
  "Ex: Rota ideal pro Lee Sin jungle?",
  "Ex: Melhor arma custo-benefício no CS?"
]

questionInput.placeholder = placeholders[Math.floor(Math.random() * placeholders.length)]

}
form.addEventListener('submit', enviarFormulario) 

