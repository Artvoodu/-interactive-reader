document.addEventListener("DOMContentLoaded", async () => {
    const textInput = document.getElementById("textInput");
    const textContainer = document.getElementById("text-container");
    const loadTextButton = document.getElementById("loadText");
    const clearInputButton = document.getElementById("clearInput");
    const resetTranslationsButton = document.getElementById("resetTranslations");
    const showKnownWordsButton = document.getElementById("showKnownWords");
    const knownWordsContainer = document.getElementById("known-words-container");
    const copyWordsButton = document.getElementById("copyWords");
    const translate10Button = document.getElementById("translate10");
    const translate30Button = document.getElementById("translate30");
    const translate50Button = document.getElementById("translate50");
    const versionIndicator = document.createElement("div");

    let knownWords = new Set(JSON.parse(localStorage.getItem("knownWords")) || []);
    let selectedWords = new Set();

    // Добавляем индикатор версии
    versionIndicator.textContent = "Версия: 20";
    versionIndicator.style.position = "absolute";
    versionIndicator.style.top = "10px";
    versionIndicator.style.right = "10px";
    versionIndicator.style.background = "rgba(0,0,0,0.7)";
    versionIndicator.style.color = "white";
    versionIndicator.style.padding = "5px 10px";
    versionIndicator.style.borderRadius = "5px";
    document.body.appendChild(versionIndicator);

    loadTextButton.addEventListener("click", () => {
        const text = textInput.value.trim();
        if (text) {
            renderText(text);
        }
    });

    clearInputButton.addEventListener("click", () => {
        textInput.value = "";
    });

    copyWordsButton.addEventListener("click", () => {
        const selectedWordsText = [...selectedWords].join(", ");
        navigator.clipboard.writeText(selectedWordsText).then(() => {
            alert("Слова скопированы в буфер обмена!");
        });
    });

    translate10Button.addEventListener("click", () => translatePercentage(10));
    translate30Button.addEventListener("click", () => translatePercentage(30));
    translate50Button.addEventListener("click", () => translatePercentage(50));

    async function renderText(text) {
        textContainer.innerHTML = "";
        const words = text.split(" ");
        words.forEach((pair) => {
            let [original, translation] = pair.split("|");
            let span = document.createElement("span");
            span.className = "word";

            if (knownWords.has(original.toLowerCase())) {
                span.textContent = original;
                span.classList.add("ignored");
                span.style.marginRight = "5px";
            } else {
                span.textContent = original;
                span.dataset.originalText = original;
                span.dataset.translatedText = translation;
                span.addEventListener("click", toggleTranslation);
                span.addEventListener("mousedown", (e) => handleLongPress(e, span, "text"));
                span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
            }

            if (selectedWords.has(original.toLowerCase())) {
                span.classList.add("selected");
            }

            textContainer.appendChild(span);
        });
    }

    function toggleTranslation(event) {
        const word = event.target;
        if (word.classList.contains("translated")) {
            word.textContent = word.dataset.originalText;
            word.classList.remove("translated");
        } else {
            word.textContent = word.dataset.translatedText;
            word.classList.add("translated");
        }
    }

    function handleLongPress(event, word, context) {
        word.holdTimer = setTimeout(() => {
            if (context === "text") {
                addToSelectedWords(word.dataset.originalText.toLowerCase());
            } else if (context === "selected") {
                addToKnownWords(word.textContent.toLowerCase());
            } else if (context === "known") {
                removeFromKnownWords(word.textContent.toLowerCase());
            }
        }, 500);
    }

    function addToSelectedWords(word) {
        if (!selectedWords.has(word)) {
            selectedWords.add(word);
            updateSelectedWordsUI();
            renderText(textInput.value.trim());
        }
    }

    function addToKnownWords(word) {
        knownWords.add(word);
        localStorage.setItem("knownWords", JSON.stringify([...knownWords]));
        updateKnownWordsUI();
        renderText(textInput.value.trim());
    }

    function updateSelectedWordsUI() {
        const selectedContainer = document.getElementById("selected-words");
        selectedContainer.innerHTML = "<h3>Выбранные слова:</h3>";
        selectedWords.forEach(word => {
            let span = document.createElement("span");
            span.className = "word selected";
            span.textContent = word;
            span.addEventListener("mousedown", (e) => handleLongPress(e, span, "selected"));
            span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
            selectedContainer.appendChild(span);
        });
    }

    function updateKnownWordsUI() {
        knownWordsContainer.innerHTML = "<h3>Выученные слова:</h3>";
        knownWords.forEach(word => {
            let span = document.createElement("span");
            span.className = "word ignored";
            span.textContent = word;
            span.addEventListener("mousedown", (e) => handleLongPress(e, span, "known"));
            span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
            knownWordsContainer.appendChild(span);
        });
    }

    function removeFromKnownWords(word) {
        knownWords.delete(word);
        localStorage.setItem("knownWords", JSON.stringify([...knownWords]));
        updateKnownWordsUI();
        renderText(textInput.value.trim());
    }

    resetTranslationsButton.addEventListener("click", () => {
        document.querySelectorAll(".word").forEach(word => {
            word.classList.remove("translated", "selected", "known");
            word.textContent = word.dataset.originalText || word.textContent;
            word.style.backgroundColor = "";
            word.style.border = "";
            word.style.padding = "";
        });
        selectedWords.clear();
        updateSelectedWordsUI();
    });

    showKnownWordsButton.addEventListener("click", () => {
        updateKnownWordsUI();
    });

    function translatePercentage(percentage) {
        const words = document.querySelectorAll(".word:not(.ignored)");
        const wordsArray = Array.from(words);
        const wordsToTranslate = Math.floor(wordsArray.length * (percentage / 100));

        // Перемешиваем массив слов случайным образом
        const shuffledWords = wordsArray.sort(() => Math.random() - 0.5);

        // Переводим только необходимое количество слов
        for (let i = 0; i < wordsToTranslate; i++) {
            const word = shuffledWords[i];
            word.textContent = word.dataset.translatedText;
            word.classList.add("translated");
        }
    }
});