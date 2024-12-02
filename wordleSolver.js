//This program automatically guesses the word that is expected to give the most information
//To activate, call autoPlay() from the console. Use autoPlay(true) to run it with hard mode rules

//Previous guesses are remembered and stored here
let cache = {};

let remainingWords = wordList;
let guessResults = "";

function autoPlay(hard = false) {
    if (wordReady()) {
        let guess;
        if (cache[guessResults])
            guess = cache[guessResults];
        else if (remainingWords.length == 1)
            guess = remainingWords[0];
        else
            guess = getBestWord(hard);
        cache[guessResults] = guess;
        for (let i = 0; i < 5; i++) backspace(); //Clear the existing word
        for (let letter of guess) addLetter(letter);
        guessWord();
    }
    setTimeout(() => autoPlay(hard), 100);
}

//Get the words that are still potential solutions
function updateRemainingWords(guess) {
    let result = "";

    for (let i in guess) {
        let box = document.getElementById(`r${guessed}c${i}`);
        if (box.style.background == "var(--color-green)") result += "G";
        else if (box.style.background == "var(--color-yellow)") result += "Y";
        else if (box.style.background == "gray") result += "g";
    }
    guessResults += guess + "," + result + ";";

    remainingWords = remainingWords.filter(word => {
        for (let i in guess) {
            if (result[i] == "G" && word[i] != guess[i]) {
                return false;
            } else if (result[i] == "Y") {
                if (!word.includes(guess[i]) || word[i] == guess[i]) return false;
                let minInstancesOfLetter = 0;
                for (let j in guess) if (guess[j] == guess[i] && result[j] != "g") minInstancesOfLetter++;
                let instancesInWord = 0;
                for (let j in word) if (word[j] == guess[i]) instancesInWord++;
                if (instancesInWord < minInstancesOfLetter) return false;
            } else if (result[i] == "g" && word.includes(guess[i])) {
                if (word[i] == guess[i]) return false;
                let maxInstancesOfLetter = 0;
                for (let j in guess) if (guess[j] == guess[i] && result[j] != "g") maxInstancesOfLetter++;
                let instancesInWord = 0;
                for (let j in word) if (word[j] == guess[i]) instancesInWord++;
                if (instancesInWord > maxInstancesOfLetter) return false;
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
                    resultCode += "G";
                    greenList.push(j);
                } else if (word.includes(guess[j]) && !allGreen && !tooMany) {
                    resultCode += "Y";
                } else {
                    resultCode += "g";
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