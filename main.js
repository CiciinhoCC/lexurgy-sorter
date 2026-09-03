//RANDOM FUNCTIONS
function sortByLength(array) {
    return array.sort((x, y) => y.length - x.length);
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
            if (types.some(item => item.startsWith("*"))) { //if there's smth like *cons
                astIndex = types.findIndex(item => item.includes("*"));
                types[astIndex] = types[astIndex].slice(1);
                const asterisk = types[astIndex];
                features.push({ name, types, asterisk });

            }
            else {
                features.push({ name, types });
            }
        }
    }

    return features;
}

function getSymbolsList(input) {
    const featuresList = getFeatureList(input);
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
            symbols.push({ name, features });
        };
    }

    let symbolsMatrix = [];

    for (let i = 0; i < symbols.length; i++) {
        const symbol = symbols[i];
        const matrix = { name: symbol.name, features: {} };

        for (let j = 0; j < symbol.features.length; j++) { //all features in a symbol
            const symbolFeature = symbol.features[j];
            for (let k = 0; k < featuresList.length; k++) { //all the features
                const typeFeature = featuresList[k];
                const set2 = new Array(typeFeature);
                const hasOverlap = symbol.features.some(element => typeFeature.types.includes(element))
                if (!hasOverlap) { //feature not on symbol
                    if(typeFeature.asterisk){
                        matrix.features[typeFeature.name] = typeFeature.asterisk; // get the one with the *
                    }
                    else {
                        matrix.features[typeFeature.name] = ""; // put in nothing
                    }
                }
                if (typeFeature.types.includes(symbolFeature)) {
                    matrix.features[typeFeature.name] = symbolFeature;
                }
            }
        }
        symbolsMatrix.push(matrix);
    }

    return [featuresList, symbolsMatrix];
}

function sortSymbols(input) {
    const [featuresList, symbolsMatrix] = getSymbolsList(input);
    const sortedSymbols = symbolsMatrix;

    //weighted values of matrix
    const weightedFeatures = featuresList;
    const largestFeatureLength = featuresList.sort((a,b) => {return b.types.length - a.types.length})[0].length;




    sortedSymbols.sort((a,b) => {




    })

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
    console.log(getSymbolsList(inputList));

    return ":P";

}