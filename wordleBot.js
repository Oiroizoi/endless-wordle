//To activate, call autoPlay() from the console. Use autoPlay(true) to run it with hard mode rules

let remainingWords = wordList;

function autoPlay(hard = false) {
    if (wordReady()) {
        let guess = (remainingWords.length == 1) ? remainingWords[0] : getBestWord(hard);
        for (let i = 0; i < 5; i++) backspace(); //Clear the existing word
        for (let letter of guess) addLetter(letter);
        guessWord();
    }
    setTimeout(() => autoPlay(hard), 101);
}

//Get the words that are still potential solutions
function updateRemainingWords(guess) {
    remainingWords = remainingWords.filter(word => {
        let boxes = [];
        for (let i in guess) boxes.push(document.getElementById(`r${guessed}c${i}`));

        checkLoop: for (let i in guess) {
            if (boxes[i].style.background == "var(--color-green)" && word[i] != guess[i])
                return false;
            else if (boxes[i].style.background == "var(--color-yellow)" && (!word.includes(guess[i]) || word[i] == guess[i]))
                return false;
            else if (boxes[i].style.background == "gray" && word.includes(guess[i])) {
                if (word[i] == guess[i]) return false;
                for (let j in guess) if (guess[j] == guess[i] && boxes[j].style.background != "gray") continue checkLoop;
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
    //Prioritize words that are valid answers
    if (!hard) for (i in expectedInfo) {
        if (expectedInfo[i] == highestE && remainingWords.includes(wordList[i]))
            return wordList[i];
    }
    return guessList[expectedInfo.indexOf(highestE)];
};