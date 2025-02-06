document.addEventListener("DOMContentLoaded", async () => {
    const textInput = document.getElementById("textInput");
    const textContainer = document.getElementById("text-container");
    const loadTextButton = document.getElementById("loadText");
    const clearInputButton = document.getElementById("clearInput");
    const resetTranslationsButton = document.getElementById("resetTranslations");
    const showKnownWordsButton = document.getElementById("showKnownWords");
    const knownWordsContainer = document.getElementById("known-words-container");

    const knownWordsURL = "https://raw.githubusercontent.com/artvoodu/interactive-reader/main/known_words.json"; // JSON-хранилище на GitHub

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

        wordSpan.addEventListener("click", (e) => openActionMenu(e, wordSpan));

        selectedWordsContainer.appendChild(wordSpan);
    }

    function openActionMenu(event, word) {
        event.preventDefault();

        const menu = document.createElement("div");
        menu.className = "action-menu";
        menu.style.position = "absolute";
        menu.style.top = `${event.clientY}px`;
        menu.style.left = `${event.clientX}px`;
        menu.style.background = "#fff";
        menu.style.border = "1px solid #ccc";
        menu.style.padding = "5px";
        menu.style.boxShadow = "2px 2px 5px rgba(0,0,0,0.2)";
        menu.style.zIndex = "1000";

        const deleteOption = document.createElement("div");
        deleteOption.textContent = "🗑 Удалить из блока";
        deleteOption.style.cursor = "pointer";
        deleteOption.onclick = () => {
            word.remove();
            menu.remove();
        };

        const learnOption = document.createElement("div");
        learnOption.textContent = "📚 Добавить в выученные";
        learnOption.style.cursor = "pointer";
        learnOption.onclick = async () => {
            word.classList.add("known");
            word.style.backgroundColor = "yellow";
            await updateKnownWords(word.textContent.toLowerCase(), "add");
            menu.remove();
        };

        menu.appendChild(deleteOption);
        menu.appendChild(learnOption);
        document.body.appendChild(menu);

        document.addEventListener("click", () => menu.remove(), { once: true });
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
