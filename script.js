import { getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
    const textInput = document.getElementById("textInput");
    const textContainer = document.getElementById("text-container");
    const loadTextButton = document.getElementById("loadText");
    const clearInputButton = document.getElementById("clearInput");
    const resetTranslationsButton = document.getElementById("resetTranslations");

    let knownWords = new Set();

    async function loadKnownWords() {
        knownWords.clear();
        const snapshot = await getDocs(window.firebaseCollection);
        snapshot.forEach(doc => knownWords.add(doc.data().word.toLowerCase()));
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

            if (knownWords.has(original.toLowerCase())) {
                span.textContent = original + " ";
                span.className = "word ignored";
            } else {
                span.textContent = original;
                span.dataset.originalText = original;
                span.dataset.translatedText = translation;
                span.className = "word";
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

        wordSpan.addEventListener("click", async () => {
            wordSpan.remove();
            wordElement.classList.remove("selected");
        });

        selectedWordsContainer.appendChild(wordSpan);
    }

    async function handleLongPressKnown(event, word) {
        word.holdTimer = setTimeout(async () => {
            if (word.classList.contains("known")) {
                word.classList.remove("known");
                word.style.backgroundColor = "black";
                await deleteDoc(doc(window.firebaseDB, "known_words", word.textContent.toLowerCase()));
                knownWords.delete(word.textContent.toLowerCase());
            } else {
                word.classList.add("known");
                word.style.backgroundColor = "yellow";
                await addDoc(window.firebaseCollection, { word: word.textContent.toLowerCase() });
                knownWords.add(word.textContent.toLowerCase());
            }
        }, 500);
    }

    resetTranslationsButton.addEventListener("click", () => {
        document.querySelectorAll(".word").forEach(word => {
            word.classList.remove("translated", "selected", "known");
            word.textContent = word.dataset.originalText || word.textContent;
            word.style.backgroundColor = "";
        });
        document.getElementById("selected-words").innerHTML = "";
    });
});
