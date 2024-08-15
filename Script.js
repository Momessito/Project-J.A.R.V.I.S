const apiKey = 'sk-VEZyabH198hrKUELb9xkOnuTwbCklG7YmrbjtGPGshT3BlbkFJ4rqHVL5duGK3o1URvThca2aHKNR3Lxa5i1RL3YK5cA'; // Substitua com sua chave de API

// Função para obter a hora atual
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Função para obter o clima atual usando a API OpenWeatherMap
async function getWeather() {
    const apiKey = "ca564d5e39a8668fcde3613cf639e950"; // Substitua pela sua chave de API
    const city = "São Paulo"; // Substitua pela sua cidade
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`;

    try {
        const response = await fetch(url);
        const weatherData = await response.json();
        const description = weatherData.weather[0].description;
        const temperature = weatherData.main.temp;
        return `O clima em ${city} é de ${description} com temperatura de ${temperature}°C.`;
    } catch (error) {
        return "Não foi possível obter as informações do clima no momento.";
    }
}

// Função para listar e escolher a voz masculina brasileira
function getVoice() {
    return new Promise((resolve) => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
            window.speechSynthesis.onvoiceschanged = function() {
                const updatedVoices = window.speechSynthesis.getVoices();
                const maleVoice = updatedVoices.find(voice => 
                    voice.lang === 'pt-BR' && voice.name.toLowerCase().includes('male')
                );
                resolve(maleVoice);
            };
        } else {
            const maleVoice = voices.find(voice => 
                voice.lang === 'pt-BR' && voice.name.toLowerCase().includes('male')
            );
            resolve(maleVoice);
        }
    });
}

// Função para sintetizar e reproduzir a fala
async function speak(text) {
    const voice = await getVoice();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'pt-BR';

    // Ajuste da taxa de fala (mais rápido)
    utterance.rate = 1.5; // 1 é a velocidade padrão, ajuste conforme necessário (0.1 - 10)

    // Seleciona a voz masculina se disponível
    if (voice) {
        utterance.voice = voice;
    } else {
        console.warn("Nenhuma voz masculina brasileira encontrada. Usando voz padrão.");
    }

    window.speechSynthesis.speak(utterance);
}

// Função para obter resposta do ChatGPT
async function getChatGPTResponse(prompt) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    };
    const body = JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150
    });

    try {
        const response = await fetch(url, { method: 'POST', headers, body });
        const data = await response.json();
        return data.choices[0].message.content.trim();
    } catch (error) {
        return "Não foi possível obter uma resposta do Jarvis no momento.";
    }
}

// Função principal do Jarvis
let isActive = false;

async function jarvisResponse(prompt) {
    if (!isActive) return;

    const currentTime = getCurrentTime();
    const weather = await getWeather();

    const responseText = `Sistema online, senhor. A hora atual é ${currentTime}. ${weather} Agora, o que posso fazer por você?`;
    console.log(responseText);
    speak(responseText);

    // Aguardar próximo comando
    const chatGPTResponse = await getChatGPTResponse(prompt);
    console.log("ChatGPT:", chatGPTResponse);
    speak(chatGPTResponse);
}

// Função para detectar a palavra "iniciar" ou "desligar"
function detectSpeech() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onstart = function() {
        console.log("Sistema de reconhecimento de voz iniciado. Diga 'iniciar' para ativar ou 'desligar' para parar.");
    };

    recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
        Alert("Você disse: " + transcript);

        if (transcript === "iniciar") {
            console.log("Comando 'iniciar' detectado.");
            isActive = true;
            jarvisResponse(transcript);
        } else if (transcript === "desligar") {
            console.log("Comando 'desligar' detectado.");
            isActive = false;
            speak("Sistema desligado.");
        }
    };

    recognition.onerror = function(event) {
        console.error("Erro no reconhecimento de voz: " + event.error);
    };

    recognition.onend = function() {
        console.log("Reconhecimento de voz encerrado. Reiniciando...");
        recognition.start(); // Reinicia o reconhecimento para manter a escuta ativa
    };

    recognition.start();
}

// Adiciona um manipulador de evento para o botão de iniciar
document.getElementById('start-button').addEventListener('click', () => {
    const audio = document.getElementById('start-audio');
    if (audio) {
        audio.play().catch(error => {
            console.error("Erro ao tentar tocar o áudio: ", error);
        });
    }

    // Esconder o popup após o clique
    document.getElementById('login-popup').style.display = 'none';
});

// Iniciar detecção de fala
detectSpeech();
