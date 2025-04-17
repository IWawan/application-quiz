/* Constantes des messages */
const CORRECT_ANSWER_MESSAGE = "Bonne réponse :D"
const WRONG_ANSWER_MESSAGE = "Mauvaise réponse :("
const END_QUIZ_MESSAGE = "Fin du quiz ! Bravo !"

/* Constantes des sons */
//const CORRECT_ANSWER_SOUND = new Audio('/static/audio/correct_answer_sound.mp3');
//const WRONG_ANSWER_SOUND = new Audio('/static/audio/wrong_answer_sound.mp3');
//const FIFTY_SOUND = new Audio('/static/audio/fifty_sound.mp3')

/* Constantes des éléments */
const xlsxInput = document.getElementById("xlsx-input");
const questionEl = document.getElementById("question");
const answersContainer = document.getElementById("answers");
const answerMessageContainer = document.getElementById("answer-message-container");
const messageContainer = document.getElementById("message-container");
const explanationContainer = document.getElementById("answer-explanation-container");
const nextBtn = document.getElementById("next-question-btn");
const backBtn = document.getElementById("back-to-menu-btn");
const skipBtn = document.getElementById("skip-question-btn");
const fiftyBtn = document.getElementById("fifty-btn");

let questions = [];
let currentQuestionIndex = 0;
let nbCorrectAnswers = 0;

/* Randomise un array */
function shuffleArray(array)
{
  for (let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

/* ============ Import XLSX ============ */
if (xlsxInput)
{
  xlsxInput.addEventListener("change", function (e)
  {
    const file = e.target.files[0];

    if (file)
    {
      loadQuestionsFromXLSX(file);
    }
  });
}

function loadQuestionsFromXLSX(file)
{
  const reader = new FileReader();

  reader.onload = function (event)
  {
    const data = new Uint8Array(event.target.result);
    const workbook = XLSX.read(data, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet);

    questions = json.map(q =>
    ({
      type: q.Type,
      question: q.Question,
      answers: q.Réponses ? q.Réponses.split(",").map(r => r.trim()) : [],
      correct: parseInt(q.Correcte) - 1,
      explanation: q.Explication || "",
      resource: q.Ressource ? `/resources/${q.Ressource}` : null,
      displayTime: q.Durée_image_mémo ? parseInt(q.Durée_image_mémo * 1000) : undefined
    }));

    questions = shuffleArray(questions);
    startQuiz();
  };

  reader.readAsArrayBuffer(file);
}

// Charge un thème préenregistré
function loadTheme(theme)
{
  const script = document.createElement("script");
  script.src = `../static/questions_theme/questions_${theme}.js`;

  script.onload = () =>
  {
    questions = window.loadedQuestions;
    questions = shuffleArray(questions);
    startQuiz();
  };

  document.body.appendChild(script);
  backBtn.style.display="inline-block"
}

// Compmence le quiz
function startQuiz()
{
  backBtn.style.display = "inline-block";
  skipBtn.style.display = "inline-block";
  nextBtn.textContent = "Question suivante ➡";
  document.getElementById("start-screen").style.display = "none";
  document.getElementById("quiz-screen").style.display = "block";
  currentQuestionIndex = 0;
  nbCorrectAnswers = 0;

  // Cache le bouton 50/50
  fiftyBtn.style.display = "none";
  fiftyBtn.disabled = true;

  showQuestion();
}

// Affiche les questions
function showQuestion()
{
  const questionData = questions[currentQuestionIndex];

  // Afficher le numéro de la question actuelle sur le total
  document.getElementById("current-question-number").textContent = currentQuestionIndex + 1;
  document.getElementById("total-questions-number").textContent = questions.length;
  
  questionEl.innerHTML = questionData.question;
  answersContainer.innerHTML = "";

  answerMessageContainer.style.display = "none";

  // Gestion de chaque type de question
  switch (questionData.type)
  {
    // Question de type QCM
    case "qcm":
      displayQCMQuestion(questionData);
      break;
      
    // Question de type vrai ou faux
    case "vrai-faux":
      displayTrueFalseQuestion(questionData);
      break;
    
      // Question de type vidéo
      case "video":
        displayVideoQuestion(questionData);
        break;

      // Question de type image QCM
      case "image-qcm":
        displayImageQCM(questionData);
        break;

      // Question de type image vrai ou faux
      case "image-vrai-faux":
        displayImageTrueFalse(questionData);
        break

      // Question de type image memo
      case "image-memo":
        displayImageMemoQuestion(questionData);
        break;
    
      default:
        displayQCMQuestion(questionData);
        break;
  }
}  

// Affiche les questions du QCM
function displayQCMQuestion(questionData)
{
  questionData.answers.forEach((answer, index) =>
  {
    const btn = document.createElement("button");
    btn.textContent = answer;
    btn.className = "answer-btn";
    btn.onclick = () => checkQCMAnswer(index);
    answersContainer.appendChild(btn);

    // Affiche le bouton 50/50
    fiftyBtn.style.display = "inline-block";
    fiftyBtn.classList.remove("desactivated-btn");
    fiftyBtn.classList.add("help-btn");
    fiftyBtn.disabled = false;
    fiftyBtn.onclick = () => fifty(questionData.correct); 
  });
}

// Affiche les questions du Vrai ou Faux
function displayTrueFalseQuestion(questionData)
{
  questionEl.innerHTML = "<span class='true-label'>Vrai</span> ou <span class='false-label'>Faux</span> ? <br>" + questionData.question;

  // Cache le bouton 50/50
  fiftyBtn.style.display = "none";
  fiftyBtn.disabled = true;

  // Création du bouton "Vrai"
  const btn_true = document.createElement("button");
  btn_true.textContent = "Vrai";
  btn_true.className = "answer-btn";
  btn_true.id = "true-btn";
  btn_true.onclick = () => checkTrueFalseAnswer(0, questionData.correct);
  answersContainer.appendChild(btn_true);

  // Création du bouton "Faux"
  const btn_false = document.createElement("button");
  btn_false.textContent = "Faux";
  btn_false.className = "answer-btn";
  btn_false.id = "false-btn";
  btn_false.onclick = () => checkTrueFalseAnswer(1, questionData.correct);
  answersContainer.appendChild(btn_false);
}

// Affiche les questions de la vidéo
function displayVideoQuestion(questionData)
{
  const video = document.createElement("video");
  video.id = "video";
  video.src = questionData.resource;
  video.controls = false;
  video.autoplay = true;
  video.width = 400;
  video.style.margin = "auto";
  video.style.borderRadius = "12px";
  questionEl.appendChild(video);
  displayQCMQuestion(questionData);  
  video.play();
}

// Affiche l'image
function displayImage(questionData)
{
  const image = document.createElement("img");
  image.src = questionData.resource;
  image.alt = "Image";
  image.id = "image";

  image.style.display = "block";
  image.style.margin = "auto";
  image.style.borderRadius = "12px";
  image.style.maxWidth = "80%";  
  image.style.maxHeight = "400px";  
  image.style.minWidth = "300px";   
  image.style.objectFit = "contain";
  
  questionEl.appendChild(image);
}

// Affiche la question image QCM
function displayImageQCM(questionData)
{
  displayQCMQuestion(questionData); 
  displayImage(questionData)
}

// Affiche la question image Vrai ou Faux
function displayImageTrueFalse(questionData)
{
  displayTrueFalseQuestion(questionData);  
  displayImage(questionData)
}

// Affiche les questions du image memo
function displayImageMemoQuestion(questionData)
{
  questionEl.textContent = "Observez bien cette image";
  answersContainer.innerHTML = "";

  displayImage(questionData)

  // Attendre
  setTimeout(() =>
  {
    image.remove();

    // Affiche la question
    questionEl.innerHTML = questionData.question;

    // Affiche les réponses
    displayQCMQuestion(questionData);
  }, questionData.displayTime || 5000); // Valeur par défaut 5s
}

// Vérifie les réponses du QCM
function checkQCMAnswer(selectedIndex)
{
  const questionData = questions[currentQuestionIndex];
  const buttons = document.querySelectorAll(".answer-btn");

  // Désactive le bouton 50 / 50
  fiftyBtn.disabled = true;
  fiftyBtn.classList.remove("help-btn");
  fiftyBtn.classList.add("desactivated-btn");

  buttons.forEach((btn, index) =>
  {
    if (index === questionData.correct)
    {
      btn.classList.add("correct");
    }
    else if (index === selectedIndex)
    {
      btn.classList.add("wrong");
    }

    // Désactiver les boutons après le choix
    btn.disabled = true;
  });

  if (selectedIndex === questionData.correct)
  {
    // Bonne réponse 
    //CORRECT_ANSWER_SOUND.play()
    console.log("Bonne réponse !");
    nbCorrectAnswers++;
    
    messageContainer.textContent = CORRECT_ANSWER_MESSAGE;
    messageContainer.className = "correct-message";
  }
  else
  {
    // Mauvaise réponse 
    //WRONG_ANSWER_SOUND.play()
    console.log("Mauvaise réponse !");

    messageContainer.textContent = WRONG_ANSWER_MESSAGE;
    messageContainer.className = "wrong-message";
  }

  // Affiche l'explication de la réponse
  explanationContainer.textContent = questionData.explanation;

  answerMessageContainer.style.display = "block";
  messageContainer.style.display = "block";
  explanationContainer.style.display = "block";

  // Affiche le bouton "question suivante"
  nextBtn.style.display = "inline-block";
}

// Vérifie les réponses du Vrai ou Faux
function checkTrueFalseAnswer(selectedIndex, correctIndex)
{
  const questionData = questions[currentQuestionIndex];
  const trueBtn = document.getElementById("true-btn");
  const falseBtn = document.getElementById("false-btn");
  
    // Appliquer les classes de style en fonction de la bonne ou mauvaise réponse
    if (selectedIndex === correctIndex) // Si la réponse est correcte
    {
      // Appliquer la classe "correct"
      if (selectedIndex === 0) // "Vrai"
      { 
        trueBtn.classList.add("correct");
      }
      else // "Faux"
      { 
        falseBtn.classList.add("correct");
      }

      // Bonne réponse 
      //CORRECT_ANSWER_SOUND.play()
      console.log("Bonne réponse !");
      nbCorrectAnswers++;
      
      messageContainer.textContent = CORRECT_ANSWER_MESSAGE;
      messageContainer.className = "correct-message";
    }
    else // Si la réponse est incorrecte
    {
      // Appliquer la classe "wrong"
      if (selectedIndex === 0) // "Vrai"
      {
        trueBtn.classList.add("wrong");
      }
      else // "Faux"
      { 
        falseBtn.classList.add("wrong");
      }
      
      // Appliquer la classe "correct" sur le bon bouton afin de le changer de couleur
      if (correctIndex === 0) // Si la bonne réponse est "Vrai"
      { 
        trueBtn.classList.add("correct");
      }
      else // Si la bonne réponse est "Faux"
      { 
        falseBtn.classList.add("correct");
      }

      // Mauvaise réponse 
      //WRONG_ANSWER_SOUND.play()
      console.log("Mauvaise réponse !");

      messageContainer.textContent = WRONG_ANSWER_MESSAGE;
      messageContainer.className = "wrong-message";
    }
  
  // Désactiver les boutons après le choix
  trueBtn.disabled = true;
  falseBtn.disabled = true;

  // Affiche l'explication de la réponse
  explanationContainer.textContent = questionData.explanation;

  answerMessageContainer.style.display = "block";
  messageContainer.style.display = "block";
  explanationContainer.style.display = "block";
  
  // Affiche le bouton "question suivante"
  nextBtn.style.display = "inline-block";
}

// Retire 2 réponses fausses
function fifty(correctIndex)
{
  const buttons = Array.from(document.querySelectorAll(".answer-btn"));
  const wrongButtons = buttons.filter((_, index) => index !== correctIndex);

  // Mélange les mauvaises réponses et garde 2 à retirer
  shuffleArray(wrongButtons).slice(0, 2).forEach(btn =>
  {
    btn.disabled = true;
    btn.classList.add("desactivated");
  });

  // Désactive le bouton
  //CORRECT_ANSWER_SOUND.play()
  console.log("50 / 50 !");

  // Désactive le bouton
  fiftyBtn.disabled = true;
  fiftyBtn.classList.remove("help-btn");
  fiftyBtn.classList.add("desactivated-btn");
}

// Question suivante
function goToNextQuestion()
{
  nextBtn.style.display = "none";
  messageContainer.style.display = "none";
  explanationContainer.style.display = "none";

  // Cache le bouton 50/50
  fiftyBtn.style.display = "none";
  fiftyBtn.disabled = true;

  // Supprimer une ancienne vidéo ou image si présente
  const existingVideo = document.getElementById("video");
  if (existingVideo) existingVideo.remove();
  const existingImage = document.getElementById("image");
  if (existingImage) existingImage.remove();

  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length)
  {
    if (currentQuestionIndex === questions.length - 1)
    {
      nextBtn.textContent = "Résultats ➡";
    }

    showQuestion();
  }
  else
  {
    const totalQuestions = questions.length;
    const percentage = Math.round((nbCorrectAnswers / totalQuestions) * 100);

    questionEl.innerHTML =
    `
      ${END_QUIZ_MESSAGE}<br><br>
      Vous avez eu 
      <span class="correct-answers-label">${nbCorrectAnswers}</span> 
      bonne${nbCorrectAnswers > 1 ? "s" : ""} réponse${nbCorrectAnswers > 1 ? "s" : ""} 
      sur 
      <span class="total-answers-label">${totalQuestions}</span><br>
      Score : <span class="percentage-label">${percentage}%</span>
    `;

    document.getElementById("answers").innerHTML = "";
    document.getElementById("answer-explanation-container").style.display = "none";
    document.getElementById("next-question-btn").style.display = "none";
    document.getElementById("skip-question-btn").style.display = "none";
    document.getElementById("back-to-menu-btn").style.display = "inline-block";
  }
}
  
// Retourne au menu
function backToMenu()
{
  document.getElementById("quiz-screen").style.display = "none";
  document.getElementById("back-to-menu-btn").style.display = "none";
  document.getElementById("start-screen").style.display = "block";
}  