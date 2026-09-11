// blame floppa for everything
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

function filterDuplicateDiacritics(arr) {
    const filtered = []

    arr.forEach(obj => {
        const name = obj.name;
        const feature = obj.feature;

        if (!filtered.some(d => d.name === name || d.feature === feature)) {
            filtered.push(obj);
        }
    });

    return filtered;
}

//SEPARATING SECTIONS

function getFeatureList(input) {
    let features = [];

    //get the features
    for (let i = 0; i < input.length; i++) {
        const line = input[i];

        if (/Feature/.test(line) && !line.startsWith("#")) {
            const matchMulti = line.trim().match(/^Feature\s+(?:\(syllable\)\s+)?([a-zA-Z0-9_]+)\s*\(([^)]*)\)$/);
            if (matchMulti) { //if it's multivalent
                const syllable = line.includes("(syllable)");
                const [, name, typesString] = matchMulti;
                name.trim();
                const types = typesString
                    .split(',')
                    .map(s => s.trim())
                    .filter(s => s.length > 0);
                if (types.some(item => item.startsWith("*"))) { //if there's smth like *cons
                    astIndex = types.findIndex(item => item.includes("*"));
                    types[astIndex] = types[astIndex].slice(1);
                    const asterisk = types[astIndex];
                    features.push({ name, types, asterisk, kind: "multivalent", line: i, syllable });

                }
                else {
                    features.push({ name, types, kind: "multivalent", line: i, syllable });
                }
            }
            else { //if it isn't
                const binaries = line.slice(7).split(",").map(f => f.trim());
                binaries.forEach(feature => {
                    const syllable = feature.includes("(syllable)");
                    let name = feature;
                    if (syllable) {
                        name = name.slice(10).trim();
                    }
                    if (name.startsWith("+")) { // Feature +long
                        name = name.slice(1);
                        features.push({
                            name,
                            types: ["-" + name, "+" + name],
                            asterisks: "-" + name,
                            kind: "univalent",
                            line: i,
                            syllable
                        });
                    }
                    else { // Feature syllabic
                        features.push({
                            name,
                            types: ["*" + name, "+" + name, "-" + name],
                            asterisks: "*" + name,
                            kind: "bivalent",
                            line: i,
                            syllable
                        });
                    }
                });
            }
        }
    }


    //weigh them
    const weightedFeatures = filterDuplicateFeatures(features);
    let largestFeatureLength = 2;
    for (let i = 1; i < features.length; i++) { //get largest feature
        if (features[i].types.length > largestFeatureLength) {
            largestFeatureLength = features[i].types.length;
        }
    }
    for (let i = 0; i < weightedFeatures.length; i++) {
        const feature = weightedFeatures[i];
        // feature.weight = largestFeatureLength ** (weightedFeatures.length - i - 1);
        feature.weight = i;
        feature.typeWeights = [];
        for (let j = 0; j < feature.types.length; j++) {
            // feature.typeWeights[j] = (largestFeatureLength - j - 1) * feature.weight;
            feature.typeWeights[j] = j + 1;
        }
    }

    return weightedFeatures;
}

function getSymbolsList(input) {
    const featuresList = getFeatureList(input).filter(f => f.kind !== "syllable");
    let symbols = [];
    for (let i = 0; i < input.length; i++) { //get all symbols
        const line = input[i];

        if (line.includes("Symbol") && !line.startsWith("#")) {
            const match = line.trim().match(/^Symbol\s+([^\s]+)\s+\[([^\]]*)\]$/);
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
    //assign features to them
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

function getDiacritics(input) {
    const featuresList = getFeatureList(input);
    const diacritics = []
    for (let i = 0; i < input.length; i++) {
        const line = input[i];
        if (line.startsWith("Diacritic")) {

            const match = line.trim().match(/^Diacritic\s+(.+?)\s*((?:\([^)]+\)\s*)*)\[([^\]]+)\]$/); // Diacritic ´ (floating) [+high]

            if (!match) throw new Error("Error at " + line);

            const name = match[1].trim();
            const typesPart = match[2];
            const feature = match[3].trim();

            const type = [...typesPart.matchAll(/\(([^)]+)\)/g)].map(m => m[1].trim()); // for stuff like (floating) (before)

            diacritics.push({ name, type, feature });
        }
    }
    return filterDuplicateDiacritics(diacritics).sort((a, b) => {
        function getIndex(x) { // get which feature it is referencing
            return featuresList.findIndex(f => f.types.includes(x.feature));
        }
        function getTypeIndex(x) { // get which type
            return featuresList[getIndex(x)].types.findIndex((t => x.feature == t));
        }
        let result = 0;
        if (getIndex(a) != getIndex(b)) {
            result = getIndex(a) - getIndex(b);
        }
        else {
            result = getTypeIndex(a) - getTypeIndex(b);
        };
        return result;
    });
}

function sortSymbols(input) {
    const symbolsMatrix = getSymbolsList(input);
    const featuresList = getFeatureList(input);

    //put all the weights in a list cus it's easier
    const weightList = {};

    for (let i = 0; i < featuresList.length; i++) {
        const feature = featuresList[i];
        for (let j = 0; j < feature.types.length; j++) {
            weightList[feature.types[j]] = { index: feature.weight, id: feature.typeWeights[j] }
        }
    }

    // weigh all the symbols

    for (let i = 0; i < symbolsMatrix.length; i++) {
        const symbol = symbolsMatrix[i];
        let weight = [];
        for (let j = 0; j < featuresList.length; j++) {
            const feature = featuresList[j];
            const featureType = symbol.features[feature.name]
            if (featureType) {
                weight[weightList[featureType].index] = weightList[featureType].id;
            }
        }
        symbol.weight = weight;
    }

    const sortedSymbols = symbolsMatrix.sort((a, b) => {
        const len = Math.min(a.weight.length, b.weight.length);
        for (let i = 0; i < len; i++) {
            const aw = a.weight[i] ?? 0;
            const bw = b.weight[i] ?? 0;
            if (aw !== bw) return aw - bw;
        }
        return a.weight.length - b.weight.length;
    });

    return sortedSymbols;
}

function lexurgyOutput(input) {
    const featuresList = getFeatureList(input);
    const symbolsList = sortSymbols(input);
    const diacriticsList = getDiacritics(input)

    const featureNames = featuresList.map(f => f.name); // array of feature names in order
    const multivalents = featuresList.filter(f => f.kind === "multivalent");
    const asterisks = featuresList // array of all asterisked features
        .filter(f => f.asterisk)
        .map(f => f.asterisk);

    let output = "";


    // features definitions
    for (let i = 0; i < featuresList.length; i++) {
        const feature = featuresList[i];
        const featureTypes = feature.types;
        if (feature.kind === "multivalent") {
            if (feature.asterisk) {
                featureTypes[featureTypes.indexOf(feature.asterisk)] = "*" + feature.asterisk
            }
            output += `Feature ${feature.syllable ? "(syllable) " : ""}${feature.name} (${featureTypes.join(", ").trim().replace(/\s+/g, ' ')}) \n`;

        }
        else {
            if (featuresList[i - 1] && feature.line !== featuresList[i - 1].line || i == 0) {
                output += "Feature ";
            }
            if (feature.syllable) {
                output += "(syllable) ";
            }
            if (feature.kind == "bivalent") {
                output += feature.name;
            }
            if (feature.kind == "univalent") {
                output += `+${feature.name}`;
            }
            if (featuresList[i + 1] && feature.line == featuresList[i + 1].line) {
                output += ", "
            }
            else {
                output += "\n"
            }
        }
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

    output += "\n"

    // diacritics

    for (let i = 0; i < diacriticsList.length; i++) {
        const diacritic = diacriticsList[i];
        let par = " ";
        if (diacritic.type != []) {
            for (let i = 0; i < diacritic.type.length; i++) {
                const type = diacritic.type[i];
                par += `(${type}) `
            }
        }
        // const fea = featuresList[featuresList.findIndex(f => f.name === diacritic.feature)].kind == "univalent" ? "+" + diacritic.feature : diacritic.feature;
        const fea = diacritic.feature;
        output += `Diacritic ${diacritic.name} ${par}[${fea}]\n`
    }

    return output;
}

//THE OUTPUT

function result(input) {
    const inputList = input.split("\n");
    return lexurgyOutput(inputList);
}