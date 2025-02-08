import { getDocs, addDoc, deleteDoc, query, where, doc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

  // Элементы для загрузки файла
  const fileUpload = document.getElementById("fileUpload");
  const loadFileButton = document.getElementById("loadFile");

  let knownWords = new Set();
  let selectedWords = new Set();

  // Индикатор версии
  versionIndicator.textContent = "Версия: 20";
  versionIndicator.style.position = "absolute";
  versionIndicator.style.top = "10px";
  versionIndicator.style.right = "10px";
  versionIndicator.style.background = "rgba(0,0,0,0.7)";
  versionIndicator.style.color = "white";
  versionIndicator.style.padding = "5px 10px";
  versionIndicator.style.borderRadius = "5px";
  document.body.appendChild(versionIndicator);

  // Подсказка в поле ввода
  textInput.value = "Hoy|сегодня es|есть un día|день hermoso|прекрасный.";
  textInput.style.color = "#888";
  textInput.addEventListener("focus", () => {
    if (
      textInput.value === "Hoy|сегодня es|есть un día|день hermoso|прекрасный."
    ) {
      textInput.value = "";
      textInput.style.color = "#000";
    }
  });

  // Обработчик кнопки "Показать текст"
  loadTextButton.addEventListener("click", () => {
    const text = textInput.value.trim();
    if (text) renderText(text);
  });

  // Обработчик кнопки "Очистить поле"
  clearInputButton.addEventListener("click", () => {
    textInput.value = "";
  });

  // Обработчик кнопки "Копировать выбранные слова"
  copyWordsButton.addEventListener("click", () => {
    const selectedWordsText = [...selectedWords].join(", ");
    navigator.clipboard.writeText(selectedWordsText).then(() => {
      alert("Слова скопированы!");
    });
  });

  translate10Button.addEventListener("click", () => translatePercentage(10));
  translate30Button.addEventListener("click", () => translatePercentage(30));
  translate50Button.addEventListener("click", () => translatePercentage(50));

  // Обработчик кнопки "Выученные слова" (включает/выключает блок)
  showKnownWordsButton.addEventListener("click", () => {
    if (
      knownWordsContainer.style.display === "none" ||
      knownWordsContainer.style.display === ""
    ) {
      knownWordsContainer.style.display = "block";
      updateKnownWordsUI();
    } else {
      knownWordsContainer.style.display = "none";
    }
  });

  // Обработчик кнопки "refresh" (сброс выделения и очищение выбранных слов)
  resetTranslationsButton.addEventListener("click", () => {
    document.querySelectorAll(".word").forEach((word) => {
      word.classList.remove("translated", "selected");
      if (word.dataset && word.dataset.originalText) {
        word.textContent = word.dataset.originalText;
      }
    });
    selectedWords.clear();
    updateSelectedWordsUI();
  });

  // Обработчик загрузки файла
  loadFileButton.addEventListener("click", () => {
    if (!fileUpload.files.length) {
      alert("Выберите файл для загрузки.");
      return;
    }
    const file = fileUpload.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const fileText = e.target.result;
      // Записываем содержимое файла в текстовое поле и рендерим его
      textInput.value = fileText;
      renderText(fileText);
    };
    reader.readAsText(file, "UTF-8");
  });

  // Загрузка выученных слов из Firestore
  async function loadKnownWords() {
    try {
      const querySnapshot = await getDocs(window.firebaseCollection);
      querySnapshot.forEach((docSnap) => {
        knownWords.add(docSnap.data().word);
      });
      updateKnownWordsUI();
      renderText(textInput.value.trim());
    } catch (error) {
      console.error(
        "Ошибка загрузки выученных слов из Firestore:",
        error
      );
    }
  }

  // Добавление слова в выученные (сохранение в Firestore)
  async function addToKnownWords(word) {
    try {
      await addDoc(window.firebaseCollection, { word: word });
      knownWords.add(word);
      updateKnownWordsUI();
      renderText(textInput.value.trim());
    } catch (error) {
      console.error("Ошибка при добавлении слова в Firestore:", error);
    }
  }

  // Удаление слова из выученных (удаление из Firestore)
  async function removeFromKnownWords(word) {
    try {
      const q = query(window.firebaseCollection, where("word", "==", word));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await deleteDoc(doc(window.firebaseDB, "known_words", document.id));
      });
      knownWords.delete(word);
      updateKnownWordsUI();
      renderText(textInput.value.trim());
    } catch (error) {
      console.error("Ошибка удаления слова из Firestore:", error);
    }
  }

  /* Функция renderText:
     - Текст разбивается на абзацы по переводу строки.
     - Если абзац содержит символ "|", он считается интерактивным и разбивается на слова.
       Каждое слово с разделителем "|" превращается в интерактивный элемент span.
       При этом, если слово уже сохранено (есть в knownWords) – ему сразу добавляется класс "known",
       а если оно также есть в выбранных (selectedWords) – добавляется класс "selected".
     - Если абзац не содержит "|" – выводится как обычный текстовый абзац.
  */
  function renderText(text) {
    textContainer.innerHTML = "";
    const paragraphs = text.split(/\r?\n/);
    paragraphs.forEach((paragraph) => {
      if (!paragraph.trim()) return; // пропускаем пустые строки
      const p = document.createElement("p");
      if (paragraph.includes("|")) {
        const words = paragraph.split(" ");
        words.forEach((wordPair) => {
          if (wordPair.includes("|")) {
            let [original, translation] = wordPair.split("|");
            if (!original || !translation) {
              p.appendChild(document.createTextNode(wordPair + " "));
            } else {
              let span = document.createElement("span");
              span.className = "word";
              const lowerOriginal = original.toLowerCase();
              if (knownWords.has(lowerOriginal)) {
                // Слово уже сохранено – отмечаем его как "known"
                span.textContent = original;
                span.classList.add("known");
              } else {
                span.textContent = original;
                span.dataset.originalText = original;
                span.dataset.translatedText = translation;
                // Обработчик клика для ПК
                span.addEventListener("click", toggleTranslation);
                // Mouse-события
                span.addEventListener("mousedown", (e) => {
                  span.holdTimer = setTimeout(() => {
                    handleLongPress(e, span, "text");
                  }, 500);
                });
                span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
                span.addEventListener("mouseleave", () => clearTimeout(span.holdTimer));
                // Touch-события
                span.addEventListener("touchstart", (e) => {
                  e.preventDefault();
                  span.touchLongPress = false;
                  span.holdTimer = setTimeout(() => {
                    span.touchLongPress = true;
                    handleLongPress(e, span, "text");
                  }, 500);
                }, { passive: false });
                span.addEventListener("touchend", (e) => {
                  clearTimeout(span.holdTimer);
                  if (!span.touchLongPress) {
                    toggleTranslation({ target: span });
                  }
                }, { passive: false });
              }
              // Если слово находится в выбранных, добавляем класс "selected"
              if (selectedWords.has(lowerOriginal)) {
                span.classList.add("selected");
              }
              p.appendChild(span);
              p.appendChild(document.createTextNode(" "));
            }
          } else {
            p.appendChild(document.createTextNode(wordPair + " "));
          }
        });
      } else {
        p.textContent = paragraph;
      }
      textContainer.appendChild(p);
    });
  }

  // Переключение между оригиналом и переводом
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

  // Функция для обработки долгого нажатия:
  // для текста – добавляем слово в выбранные,
  // для выбранного слова – добавляем его в выученные,
  // для выученного – удаляем слово.
  function handleLongPress(event, word, context) {
    if (context === "text") {
      addToSelectedWords(word.dataset.originalText.toLowerCase());
    } else if (context === "selected") {
      addToKnownWords(word.textContent.toLowerCase());
      selectedWords.delete(word.textContent.toLowerCase());
      updateSelectedWordsUI();
    } else if (context === "known") {
      removeFromKnownWords(word.textContent.toLowerCase());
    }
  }

  function addToSelectedWords(word) {
    if (!selectedWords.has(word)) {
      selectedWords.add(word);
      updateSelectedWordsUI();
      renderText(textInput.value.trim());
    }
  }

  // Обновление UI для выбранных слов
  function updateSelectedWordsUI() {
    const selectedContainer = document.getElementById("selected-words");
    selectedContainer.innerHTML = "";
    selectedWords.forEach((word) => {
      let span = document.createElement("span");
      span.className = "word selected";
      span.textContent = word;
      // Для ПК
      span.addEventListener("click", () => {
        selectedWords.delete(word);
        updateSelectedWordsUI();
        renderText(textInput.value.trim());
      });
      span.addEventListener("mousedown", (e) => {
        span.holdTimer = setTimeout(() => {
          handleLongPress(e, span, "selected");
        }, 500);
      });
      span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
      span.addEventListener("mouseleave", () => clearTimeout(span.holdTimer));
      // Для touch
      span.addEventListener("touchstart", (e) => {
        e.preventDefault();
        span.touchLongPress = false;
        span.holdTimer = setTimeout(() => {
          span.touchLongPress = true;
          handleLongPress(e, span, "selected");
        }, 500);
      }, { passive: false });
      span.addEventListener("touchend", (e) => {
        clearTimeout(span.holdTimer);
        if (!span.touchLongPress) {
          selectedWords.delete(word);
          updateSelectedWordsUI();
          renderText(textInput.value.trim());
        }
      }, { passive: false });
      selectedContainer.appendChild(span);
    });
  }

  // Обновление UI для выученных слов
  function updateKnownWordsUI() {
    knownWordsContainer.innerHTML = "<h3>Выученные слова:</h3>";
    knownWords.forEach((word) => {
      let span = document.createElement("span");
      span.className = "word known";
      span.textContent = word;
      // Для ПК
      span.addEventListener("mousedown", (e) => {
        span.holdTimer = setTimeout(() => {
          handleLongPress(e, span, "known");
        }, 500);
      });
      span.addEventListener("mouseup", () => clearTimeout(span.holdTimer));
      span.addEventListener("mouseleave", () => clearTimeout(span.holdTimer));
      // Для touch
      span.addEventListener("touchstart", (e) => {
        e.preventDefault();
        span.touchLongPress = false;
        span.holdTimer = setTimeout(() => {
          span.touchLongPress = true;
          handleLongPress(e, span, "known");
        }, 500);
      }, { passive: false });
      span.addEventListener("touchend", (e) => {
        clearTimeout(span.holdTimer);
      }, { passive: false });
      knownWordsContainer.appendChild(span);
    });
  }

  // Функция для перевода заданного процента слов
  function translatePercentage(percentage) {
    document.querySelectorAll(".word.translated").forEach((word) => {
      word.textContent = word.dataset.originalText;
      word.classList.remove("translated");
    });
    const words = document.querySelectorAll(".word:not(.known)");
    const wordsArray = Array.from(words);
    const wordsToTranslate = Math.floor(wordsArray.length * (percentage / 100));
    const shuffledWords = wordsArray.sort(() => Math.random() - 0.5);
    for (let i = 0; i < wordsToTranslate; i++) {
      const word = shuffledWords[i];
      if (word.dataset.translatedText) {
        word.textContent = word.dataset.translatedText;
        word.classList.add("translated");
      }
    }
  }

  await loadKnownWords();
});
