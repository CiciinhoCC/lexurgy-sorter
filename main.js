function filterDuplicateSymbols(arr) {
  const map = new Map();
  
  arr.forEach(obj => {
    const name = obj.name;
    const keyCount = Object.keys(obj.features).length;
    
    if (!map.has(name) || keyCount > Object.keys(map.get(name).features).length) {
      map.set(name, obj);
    }
  });
  
  return Array.from(map.values());
}

function filterDuplicateFeatures(arr) {
  const filtered = []
  
  arr.forEach(obj => {
    const name = obj.name;
    const keyCount = obj.types.length;
    
    if (!filtered.some(f => f.name === obj.name)) {
      filtered.push(obj);
    }
    else {
        filtered[filtered.findIndex(f => f.name === obj.name)].types = 
            [... new Set([...filtered[filtered.findIndex(f => f.name === obj.name)].types, ...obj.types])];
    }
  });
  
  return filtered;
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

    //get the features
    for (let i = 0; i < input.length; i++) {
        const line = input[i];

        if (/Feature/.test(line) && !/(?<!\\)\+/.test(line)) { //doesn't add stuff like Feature +long
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


    //weigh them
    const weightedFeatures = filterDuplicateFeatures(features);
    let largestFeatureLength = 10;
    console.log(largestFeatureLength);
    for (let i = 1; i < features.length; i++) {
        if (features[i].types.length > largestFeatureLength) {
            largestFeatureLength = features[i].types.length;
        }
    }
    for (let i = 0; i < weightedFeatures.length; i++) {
        const feature = weightedFeatures[i];
        feature.weight = largestFeatureLength ** (weightedFeatures.length - i - 1);
        feature.typeWeights = [];
        for (let j = 0; j < feature.types.length; j++) {
            const type = feature.types[j];
            feature.typeWeights[j] = (largestFeatureLength - j - 1) * feature.weight;
        }
    }

    return weightedFeatures;
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
                    if (typeFeature.asterisk) {
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

    return filterDuplicateSymbols(symbolsMatrix);
}

function sortSymbols(input) {
    const symbolsMatrix = getSymbolsList(input);
    const featuresList = getFeatureList(input);

    //put all the weights in a list cus it's easier
    const weightList = {};

    for (let i = 0; i < featuresList.length; i++) {
        const feature = featuresList[i];
        for (let j = 0; j < feature.types.length; j++) {
            weightList[feature.types[j]] = feature.typeWeights[j]
        }
    }

    console.log(weightList)

    // weigh all the symbols

    for (let i = 0; i < symbolsMatrix.length; i++) {
        const symbol = symbolsMatrix[i];
        let weight = 0;
        for (let j = 0; j < featuresList.length; j++) {
            const feature = featuresList[j];
            if (symbol.features[feature.name]) {
                weight += weightList[symbol.features[feature.name]];
            }
        }
        symbol.weight = weight;
    }

    const sortedSymbols = symbolsMatrix.sort((a, b) => b.weight - a.weight);

    return sortedSymbols;
}

function lexurgyOutput(input) {
    const featuresList = getFeatureList(input);
    const symbolsList = sortSymbols(input);

    const featureNames = featuresList.map(f => f.name); // array of feature names in order
    const asterisks = featuresList // array of all asterisked features
        .filter(f => f.asterisk)
        .map(f => f.asterisk);

    let output = "";

    // features definitions
    for (let i = 0; i < featuresList.length; i++) {
        const feature = featuresList[i];
        const featureTypes = feature.types;
        if(feature.asterisk) {
            featureTypes[featureTypes.indexOf(feature.asterisk)] = "*" + feature.asterisk
        }
        let line = `Feature ${feature.name} (${featureTypes.join(", ").trim().replace(/\s+/g, ' ')}) \n`;
        output += line;
    }

    output += "\n"

    // symbols definitions
    for (let i = 0; i < symbolsList.length; i++) {
        const symbol = symbolsList[i];
        const symbolFeatures = featureNames
            .filter(f => symbol.features[f] && !asterisks.includes(symbol.features[f]))
            .map(f => symbol.features[f]);
        let line = `Symbol ${symbol.name} [${symbolFeatures.join(" ").trim().replace(/\s+/g, ' ')}] \n`
        output += line;
    }

    return output;
}

//THE OUTPUT

function result(input) {
    const inputList = input.split("\n");
    // if (input.includes(":") && !input.includes("\:")) {
    //     return "Put in just the definitions, not the sound changes";
    // }
    // if (!(input.includes("Feature") || input.includes("Symbol"))) {
    //     return "You're not defining anything";
    // }
    // if (input.includes("Diacritic") || input.includes("+")) {
    //     return "I haven't figured out sorting diacritics yet. Please don't input them";
    // }

    // console.log(getFeatureList(inputList));
    // console.log(getSymbolsList(inputList));
    console.log(sortSymbols(inputList));

    return lexurgyOutput(inputList);

}