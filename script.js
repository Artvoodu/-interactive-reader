document.addEventListener("DOMContentLoaded", async () => {
    const textInput = document.getElementById("textInput");
    const textContainer = document.getElementById("text-container");
    const loadTextButton = document.getElementById("loadText");
    const clearInputButton = document.getElementById("clearInput");
    const resetTranslationsButton = document.getElementById("resetTranslations");
    const showKnownWordsButton = document.getElementById("showKnownWords");
    const knownWordsContainer = document.getElementById("known-words-container");
    const versionIndicator = document.createElement("div");

    const knownWordsURL = "https://raw.githubusercontent.com/artvoodu/interactive-reader/main/known_words.json"; // JSON-хранилище

    let knownWords = new Set();

    async function loadKnownWords() {
        try {
            const response = await fetch(knownWordsURL);
            if (!response.ok) throw new Error("Не удалось загрузить JSON.");
            const data = await response.json();
            knownWords = new Set(data.words);
        } catch (error) {
            console.error("Ошибка загрузки известных слов:", error);
        }
    }

    await loadKnownWords();

    // Добавляем индикатор версии
    versionIndicator.textContent = "Версия: 16";
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
            } else {
                span.textContent = original;
                span.dataset.originalText = original;
                span.dataset.translatedText = translation;
                span.addEventListener("click", toggleTranslation);
                span.addEventListener("mousedown", (e) => handleLongPress(e, span));
                span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
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

    function handleLongPress(event, word) {
        word.holdTimer = setTimeout(() => {
            if (!word.classList.contains("selected")) {
                word.classList.add("selected");
                addToWordBlock(word);
            }
        }, 500);
    }

    function addToWordBlock(wordElement) {
        const selectedWordsContainer = document.getElementById("selected-words");

        if ([...selectedWordsContainer.children].some(el => el.textContent === wordElement.dataset.originalText)) return;

        let wordSpan = document.createElement("span");
        wordSpan.className = "word selected";
        wordSpan.textContent = wordElement.dataset.originalText;

        wordSpan.addEventListener("mousedown", (e) => handleLongPressKnown(e, wordSpan));

        selectedWordsContainer.appendChild(wordSpan);
    }

    async function handleLongPressKnown(event, word) {
        word.holdTimer = setTimeout(async () => {
            if (word.classList.contains("known")) {
                word.classList.remove("known");
                word.classList.add("selected");
                word.style.backgroundColor = "black";
                await updateKnownWords(word.textContent.toLowerCase(), "remove");
            } else {
                word.classList.add("known");
                word.classList.remove("selected");
                word.style.backgroundColor = "yellow";
                await updateKnownWords(word.textContent.toLowerCase(), "add");
            }
        }, 500);
    }

    async function updateKnownWords(word, action) {
        try {
            const response = await fetch(knownWordsURL);
            if (!response.ok) throw new Error("Не удалось загрузить JSON.");
            const data = await response.json();

            if (action === "add") {
                if (!data.words.includes(word)) {
                    data.words.push(word);
                }
            } else if (action === "remove") {
                data.words = data.words.filter(w => w !== word);
            }

            localStorage.setItem("knownWords", JSON.stringify(data.words));
            console.log("Обновленный список известных слов:", data.words);

        } catch (error) {
            console.error("Ошибка обновления известных слов:", error);
        }
    }

    resetTranslationsButton.addEventListener("click", () => {
        document.querySelectorAll(".word").forEach(word => {
            word.classList.remove("translated", "selected", "known");
            word.textContent = word.dataset.originalText || word.textContent;
            word.style.backgroundColor = "";
            word.style.border = "";
            word.style.padding = "";
        });
        document.getElementById("selected-words").innerHTML = "";
    });

    showKnownWordsButton.addEventListener("click", async () => {
        await loadKnownWords();
        knownWordsContainer.innerHTML = "<h3>Выученные слова:</h3>";
        knownWords.forEach(word => {
            let span = document.createElement("span");
            span.className = "word ignored";
            span.textContent = word;
            knownWordsContainer.appendChild(span);
        });
    });
});
