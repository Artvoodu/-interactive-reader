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
            showContextMenu(event, word);
        }, 500);
    }

    function showContextMenu(event, word) {
        document.querySelectorAll(".action-menu").forEach(menu => menu.remove());

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
        menu.style.borderRadius = "5px";
        menu.style.display = "flex";
        menu.style.flexDirection = "column";
        menu.style.gap = "5px";

        const addToSelected = document.createElement("button");
        addToSelected.textContent = "📋 Добавить в Выбранные";
        addToSelected.style.cursor = "pointer";
        addToSelected.style.padding = "5px";
        addToSelected.style.border = "none";
        addToSelected.style.background = "#f0f0f0";
        addToSelected.style.borderRadius = "3px";
        addToSelected.onclick = () => {
            addToSelectedWords(word.textContent.toLowerCase());
            menu.remove();
        };

        const addToKnown = document.createElement("button");
        addToKnown.textContent = "📚 Добавить в Выученные";
        addToKnown.style.cursor = "pointer";
        addToKnown.style.padding = "5px";
        addToKnown.style.border = "none";
        addToKnown.style.background = "#f0f0f0";
        addToKnown.style.borderRadius = "3px";
        addToKnown.onclick = () => {
            addToKnownWords(word.dataset.originalText.toLowerCase());
            menu.remove();
        };

        menu.appendChild(addToSelected);
        menu.appendChild(addToKnown);
        document.body.appendChild(menu);

        event.stopPropagation();

        document.addEventListener("click", (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true });
    }

    function addToSelectedWords(word) {
        if (!selectedWords.has(word)) {
            selectedWords.add(word);
            updateSelectedWordsUI();
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
        selectedContainer.innerHTML = "";
        selectedWords.forEach(word => {
            let span = document.createElement("span");
            span.className = "word selected";
            span.textContent = word;
            span.addEventListener("click", () => {
                selectedWords.delete(word);
                updateSelectedWordsUI();
            });
            selectedContainer.appendChild(span);
        });
    }

    function updateKnownWordsUI() {
        knownWordsContainer.innerHTML = "<h3>Выученные слова:</h3>";
        let wordsArray = [...knownWords];
        knownWordsContainer.textContent += " " + wordsArray.join(", ");
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
        document.querySelectorAll(".ignored").forEach(word => {
            word.addEventListener("click", () => removeFromKnownWords(word.textContent));
        });
    });

    function translatePercentage(percentage) {
        const words = document.querySelectorAll(".word:not(.ignored)");
        const wordsToTranslate = Math.floor(words.length * (percentage / 100));
        let translatedCount = 0;

        words.forEach(word => {
            if (translatedCount < wordsToTranslate && !word.classList.contains("translated")) {
                word.textContent = word.dataset.translatedText;
                word.classList.add("translated");
                translatedCount++;
            }
        });
    }
});