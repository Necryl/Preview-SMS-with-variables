export function migrateVariables(inputText, prevPlaceholder, currPlaceholder, variableValues) {
    // Helper to escape regex special characters
    const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    const prevRegex = new RegExp(escapeRegExp(prevPlaceholder), 'g');
    const currRegex = new RegExp(escapeRegExp(currPlaceholder), 'g');

    const matches = [];

    // Find all old placeholders
    let match;
    while ((match = prevRegex.exec(inputText)) !== null) {
        matches.push({ type: 'old', index: match.index, length: match[0].length });
    }

    // Find all new placeholders (potential new variables)
    // We need to reset lastIndex if we reuse the regex, but here we created a new one.
    while ((match = currRegex.exec(inputText)) !== null) {
        matches.push({ type: 'new', index: match.index, length: match[0].length });
    }

    // Filter overlaps (prioritize 'old' placeholders as they were the active ones)
    const oldMatches = matches.filter(m => m.type === 'old');
    const newMatches = matches.filter(m => m.type === 'new');

    const validMatches = [...oldMatches];

    for (const newM of newMatches) {
        let isOverlapping = false;
        for (const oldM of oldMatches) {
            // Check if new match overlaps with any old match
            if (newM.index < oldM.index + oldM.length && newM.index + newM.length > oldM.index) {
                isOverlapping = true;
                break;
            }
        }
        if (!isOverlapping) {
            validMatches.push(newM);
        }
    }

    // Sort by index to determine order
    validMatches.sort((a, b) => a.index - b.index);

    const newVariableValues = {};

    Object.keys(variableValues).forEach(key => {
        const instance = variableValues[key];
        const oldData = instance.data || [];
        const newData = [];

        let oldDataIndex = 0;

        for (const m of validMatches) {
            if (m.type === 'old') {
                // Map existing data
                if (oldDataIndex < oldData.length) {
                    newData.push(oldData[oldDataIndex]);
                } else {
                    newData.push("");
                }
                oldDataIndex++;
            } else {
                // New variable found in text, initialize with empty
                newData.push("");
            }
        }

        // If there were more data points than matches (shouldn't happen if synced, but good to be safe),
        // we append them? No, if they aren't in the text, they are gone.
        // But wait, the standard logic appends extra empty strings if count > data.
        // Here we strictly map to matches.

        newVariableValues[key] = {
            ...instance,
            data: newData
        };
    });

    // Perform the text replacement
    const newInput = inputText.replaceAll(prevPlaceholder, currPlaceholder);

    return { newInput, newVariableValues };
}
