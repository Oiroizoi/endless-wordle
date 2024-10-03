//This program automatically guesses the word that is expected to give the most information
//To activate, call autoPlay() from the console. Use autoPlay(true) to run it with hard mode rules

//Previous guesses are remembered and stored here
let bestWords = {};

let remainingWords = wordList;
let guessResults = "";

function autoPlay(hard = false) {
    if (wordReady()) {
        let guess;
        if (bestWords[guessResults])
            guess = bestWords[guessResults];
        else if (remainingWords.length == 1)
            guess = remainingWords[0];
        else
            guess = getBestWord(hard);
        bestWords[guessResults] = guess;
        for (let i = 0; i < 5; i++) backspace(); //Clear the existing word
        for (let letter of guess) addLetter(letter);
        guessWord();
    }
    setTimeout(() => autoPlay(hard), 101);
}

//Get the words that are still potential solutions
function updateRemainingWords(guess) {
    let result = "";

    for (let i in guess) {
        let box = document.getElementById(`r${guessed}c${i}`);
        if (box.style.background == "var(--color-green)") result += "g";
        else if (box.style.background == "var(--color-yellow)") result += "y";
        else if (box.style.background == "gray") result += "G";
    }
    guessResults += guess + "," + result + ";";

    remainingWords = remainingWords.filter(word => {
        checkLoop: for (let i in guess) {
            if (result[i] == "g" && word[i] != guess[i])
                return false;
            else if (result[i] == "y" && (!word.includes(guess[i]) || word[i] == guess[i]))
                return false;
            else if (result[i] == "G" && word.includes(guess[i])) {
                if (word[i] == guess[i]) return false;
                for (let j in guess) if (guess[j] == guess[i] && result[j] != "G") continue checkLoop;
                return false;
            }
        }
        return true;
    });
}

function getBestWord(hard) {
    let guessList = hard ? remainingWords : wordList;

    let expectedInfo = [];
    guessList.forEach((guess, i) => {
        let possibleResults = {};

        //Find how likely each combination of green/yellow/gray is for this word
        remainingWords.forEach(word => {
            let resultCode = "";

            let greenList = guess.split("").filter((letter, i) => letter == word[i]);

            for (let j = 0; j < guess.length; j++) {
                let instancesOfLetter = word.split("").filter(letter => letter == guess[j]);
                let instancesGreen = greenList.filter(letter => letter == guess[j]);
                let allGreen = instancesGreen.length == instancesOfLetter.length;
                let instancesFound = guess.slice(0, j).split("").filter(letter => letter == guess[j]);
                let tooMany = instancesFound.length >= instancesOfLetter.length;

                if (guess[j] == word[j]) {
                    resultCode += "g";
                    greenList.push(j);
                } else if (word.includes(guess[j]) && !allGreen && !tooMany) {
                    resultCode += "y";
                } else {
                    resultCode += "G";
                }
            }

            if (!possibleResults[resultCode])
                possibleResults[resultCode] = 0;
            possibleResults[resultCode]++;
        });

        let entropy = 0;
        for (let result in possibleResults) {
            let prob = possibleResults[result] / remainingWords.length;
            entropy += prob * -Math.log2(prob);
        }
        expectedInfo[i] = entropy;

        console.log(guess, entropy);
    });

    let highestE = Math.max(...expectedInfo);
    if (!hard) {
        //On the last guess, always choose a valid answer
        if (guessed == 5) {
            let remainingE = expectedInfo.filter((e, i) => remainingWords.includes(wordList[i]));
            return remainingWords[remainingE.indexOf(Math.max(...remainingE))];
        }

        //Prioritize words that are valid answers
        for (i in expectedInfo) {
            if (expectedInfo[i] == highestE && remainingWords.includes(wordList[i]))
                return wordList[i];
        }
    }
    return guessList[expectedInfo.indexOf(highestE)];
};