//RANDOM FUNCTIONS
function sortByLength(array) {
    return array.sort((x, y) => y.length - x.length);
}
function longest(arr) {
    let lgth = 0;
    let longest;
    for (let i = 0; i < arr.length; i++) {
        if (arr[i].length > lgth) {
            lgth = arr[i].length;
            longest = arr[i];
        }
    }
    return longest;
}
function purge(arr, purge) {
    purgedArr = [];
    for (let i = 0; i < arr.length; i++) {
        const elem = arr[i];
        if (!elem.startsWith(purge)) {
            purgedArr.push(elem);
        }
    }
    return purgedArr;
}
String.prototype.isIn = (str) => {
    return findSuffix(this, str) == this;
}
function transpose(matrix) {
    let [row] = matrix
    return row.map((value, column) => matrix.map(row => row[column]))
}

/* HOW TO SORT STUFF
- get the definitions and sort them in a hierarchy
- make a list of all the symbols and turn them into lil objects
- sort them by those hierarchies
- redo all of the lexurgy

*/

//SEPARATING SECTIONS

function getFeatureList(input) {
    let features = [];

    for (let i = 0; i < input.length; i++) {
        const line = input[i];

        if (line.includes("Feature")) {
            const match = line.trim().match(/^Feature\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)$/);
            if (!match) {
                throw new Error("Error at: '" + line + "'");
            }
            const [, name, typesString] = match;
            const types = typesString
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
            features.push({ name, types });
        }
    }

    return features;
}

function getSymbolsList(input) {
    const features = getFeatureList(input);
    let symbols = [];
    for (let i = 0; i < input.length; i++) {
        const line = input[i];

        if (line.includes("Symbol")) {
            const match = line.match(/^Symbol\s+([^\s]+)\s+\[([^\]]*)\]$/);
            if (!match) {
                throw new Error("Error at: '" + line + "'");
            }
            const [, name, featuresString] = match;

            const features = featuresString
                .split(/\s+/)
                .filter(s => s.length > 0);
            symbols.push({name,features});
        };
    }

    let symbolsMatrix = [];

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const matrix = {name: symbol.name};
        
    }

    return symbols;
}

//THE OUTPUT

function result(input) {
    const inputList = input.split("\n");
    if (input.includes(":") && !input.includes("\:")) {
        return "Put in just the definitions, not the sound changes";
    }
    if (!(input.includes("Feature") || input.includes("Symbol"))) {
        return "You're not defining anything";
    }
    if (input.includes("Diacritic") || input.includes("+")) {
        return "I haven't figured out sorting diacritics yet. Please don't input them";
    }

    console.log(getFeatureList(inputList));
    console.log(getSymbolsList(inputList))

    return ":P";

}