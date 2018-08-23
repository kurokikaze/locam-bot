function knapSack(totalCost, utility, costs) {
    const $n = costs.length;
    const solutions = []; // of arrays
    const sets = [];
     
    // Build table K[][] in
    // bottom up manner
    for ($i = 0; $i <= $n; $i++)
    {
        for ($w = 0; $w <= totalCost; $w++)
        {
            if (!solutions[$i]) solutions[$i] = [];
            if (!sets[$i]) sets[$i] = [];

            const itemId = $i - 1;

            if ($i == 0 || $w == 0) {
                // в начальной ячейке всегда 0
                solutions[$i][$w] = 0;
                sets[$i][$w] = [];
            } else if (costs[itemId] <= $w) {
                const oldUtility = solutions[itemId][$w];
                const newUtility = utility[itemId] + solutions[itemId][$w - costs[itemId]];

                solutions[$i][$w] = Math.max(newUtility, oldUtility);
                sets[$i][$w] = newUtility > oldUtility ? [...sets[itemId][$w - costs[itemId]], itemId]: sets[itemId][$w];
            } else {
                solutions[$i][$w] = solutions[itemId][$w];
                sets[$i][$w] = sets[itemId][$w];
            }
        }
    }
    console.debug(sets);
     
    return sets[$n][totalCost];
}

module.exports = knapSack;