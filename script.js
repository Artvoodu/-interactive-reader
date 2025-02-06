document.addEventListener("DOMContentLoaded", async () => {
    const textInput = document.getElementById("textInput");
    const textContainer = document.getElementById("text-container");
    const loadTextButton = document.getElementById("loadText");
    const clearInputButton = document.getElementById("clearInput");
    const resetTranslationsButton = document.getElementById("resetTranslations");
    const showKnownWordsButton = document.getElementById("showKnownWords");
    const knownWordsContainer = document.getElementById("known-words-container");
    const versionIndicator = document.createElement("div");

    let knownWords = new Set(JSON.parse(localStorage.getItem("knownWords")) || []);

    // Добавляем индикатор версии
    versionIndicator.textContent = "Версия: 17";
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
            word.remove();
            addToKnownWords(word.textContent.toLowerCase());
        }, 500);
    }

    function addToKnownWords(word) {
        knownWords.add(word);
        localStorage.setItem("knownWords", JSON.stringify([...knownWords]));
        console.log("Добавлено в выученные:", word);
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
        knownWordsContainer.innerHTML = "<h3>Выученные слова:</h3>";
        knownWords.forEach(word => {
            let span = document.createElement("span");
            span.className = "word ignored";
            span.textContent = word;
            knownWordsContainer.appendChild(span);
        });
    });
});
