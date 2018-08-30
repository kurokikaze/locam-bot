/* Evaluation code */

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const alive = c => c.defense > 0;

const EMPTY_ABILITY_SLOT = '-';
const hpPointWeight = 1.8;
const defensePointWeight = 0.5;


const bake = state => (
    {
        ...state,
        my: state.my.filter(alive),
        enemy: state.enemy.filter(alive),
    }
);

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
     
    return sets[$n][totalCost];
}

const cardType = {
    creature: 0,
    greenItem: 1,
    redItem: 2,
    blueItem: 3,
};

const cards = {
    royalHelm: 118,
    staffOfSuppression: 142,
    pierceArmor: 143,
};

const getIsCard = cardNum => c => c.number === cardNum;

const isPierceArmor = getIsCard(cards.pierceArmor);
const isStaffOfSuppression = getIsCard(cards.staffOfSuppression);
const isRoyalHelm = getIsCard(cards.royalHelm);

const isGuardRemover = c => c.number === cards.pierceArmor || c.number === cards.staffOfSuppression;

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

const isCreature = c => c.type === cardType.creature;
const isGreenItem = c => c.type === cardType.greenItem;
const isRedItem = c => c.type === cardType.redItem;

const bombs = [89, 120, 139, 142, 143, 148, 151];
const aggro = [5, 10, 11, 13, 16, 26, 31, 35, 42, 45, 66, 68, 72, 89, 123, 131, 137];

const isBomb = c => (bombs.indexOf(c.number) > -1);
const isAggro = c => (aggro.indexOf(c.number) > -1);

const millisecondsToCalculate = 95;

const abilitiesIntersect = card1 => card2 => {
    const card1Abilities = card1.abilities.split('');
    const card2Abilities = card2.abilities.split('');
    return (card1Abilities.filter(a => card2Abilities.includes(a)).length > 0);
}

function applyAttack(attacker, target) {
    var damageDealtToTarget = attacker.attack;

    if (isWard(target)) {
        damageDealtToTarget = 0;
    }

    const excessDamage = isTrample(attacker) ? Math.max(damageDealtToTarget - target.defense, 0) : 0;
    const targetHp = (isDeathtouch(attacker) && damageDealtToTarget > 0) ? 0 : target.defense - damageDealtToTarget;

    var damageDealtToAttacker = target.attack;
    
    if (isWard(attacker)) {
        damageDealt = 0;
    }

    const excessDamageToUs = isTrample(target) ? Math.max(damageDealtToAttacker - attacker.defense, 0) : 0;
    const attackerHp = (isDeathtouch(target) && damageDealtToUs > 0) ? 0 : attacker.defense - damageDealtToAttacker;

    return {
        attacker: {
            ...attacker,
            defense: attackerHp,
            abilities: (target.attack > 0) ? attacker.abilities.replace(/W/g, EMPTY_ABILITY_SLOT) : attacker.abilities,
        },
        target: {
            ...target,
            defense: targetHp,
            abilities: (attacker.attack > 0) ? target.abilities.replace(/W/g, EMPTY_ABILITY_SLOT) : target.abilities,
        },
        excessDamage,
        excessDamageToUs
    };
}

class FightSim {
    constructor(myField, enemyField, myHp = 10, enemyHp = 10) {
        this.myField = myField;
        this.enemyField = enemyField;
        this.myHp = myHp;
        this.enemyHp = enemyHp;

        this.plans = [];
        this.stateCache = {};
        this.cacheLevel = 5;
        this.stepsSimulated = 0;

        this.positionSkip = 0;

        this.bestPlan = null;
        this.bestPlanScore = -1000;

        this.generateAttacks();
    }

    printState() {
        const log = console ? console.log : printErr;
        log(`Steps simulated: ${this.stepsSimulated}`);
        log(`Cached states: ${Object.keys(this.stateCache).length}`);
    }

    generateAttacks() {
        const myUnits = this.myField.length;
        const enemyUnits = this.enemyField.length;

        const base = enemyUnits + 1;
        const number = parseInt(Array(myUnits).fill(enemyUnits).join(''), base) + 1;
        this.plans = Array(number).fill(1).map((el, i) => pad(i.toString(base), myUnits));
    }

    addFullPlans() {
        const unitAttacks = this.myField.map(unit => {
            this.enemyField.map()
        })
    }

    prunePlans() {
        var defenderPositions = new Set();
        this.enemyField.forEach((c, i) => {
            if (isDefender(c)) defenderPositions.add((i + 1).toString());
        });

        if (defenderPositions.size > 0) {
            const defLine = [ ...defenderPositions].join('');
            const tester = new RegExp(`[^${defLine}][${defLine}]`);

            this.plans = this.plans
                .filter(plan => defenderPositions.has(plan.slice(0, 1)))
                .filter(plan => !tester.test(plan));
        }
    }

    shufflePlans() {
        shuffleArray(this.plans);
    }
    
    simulateFight(plan) {
        const planSteps = plan.split('');

        this.myAttacks = this.myField.map(c => c.attack);
        this.enemyDefenders = this.enemyField.filter(isDefender);

        const state = {
            myHp: this.myHp,
            enemyHp: this.enemyHp,
            
            my: [...this.myField],
            enemy: [...this.enemyField],
            path: '',
        }

        var initialState = state;
        var initialPlan = planSteps;

        this.positionSkip = 0;

        for (var level = 1; level <= this.cacheLevel; level++) {
            if (this.stateCache[plan.slice(0, level)]) {
                initialState = this.stateCache[plan.slice(0, level)];
                initialPlan = planSteps.slice(level);
                this.positionSkip = level;
            }
        }

        const finalState = initialPlan.reduce((state, step, index, arr) => {
            // Если мы начинаем с обрезанной строки и состояния, на 0 индексе
            // у нас уже не первая крича
            const i = index + this.positionSkip;
            this.stepsSimulated++;
            const attacker = state.my[i];
            const defendersPresent = state.enemy.filter(isDefender).filter(alive).length > 0;
            const path = state.path + step;

            // С нулевой атакой тут делать нечего
            if (this.myAttacks[i] == 0) {
                const newState = {
                    ...state,
                    path,
                };
                this.stateCache[path] = newState;
                return newState;
            }
            
            if (step == 0) {
                // Если есть провокаторы, атака в игрока не проходит
                if (defendersPresent) {
                    /* Break search */
                    arr.splice(0);
                    const newState = {
                        ...state,
                        path,
                    };
                    this.stateCache[path] = newState;
                    return newState;
                } else {
                    const newState = {
                        ...state,
                        enemyHp: state.enemyHp - attacker.attack,
                        path,
                    };
                    this.stateCache[path] = newState;

                    return newState;
                }
            } else {
                const j = step - 1;
                const target = state.enemy[j];
                const attackResult = applyAttack(attacker, target);
                if (defendersPresent && !isDefender(target)) {
                    /* Break search */
                    arr.splice(0);
                    const newState = {
                        ...state,
                        path,
                    };
                    this.stateCache[path] = newState;
                    return newState;
                }

                if (target.defense <= 0)  {
                    const newState = {
                        ...state,
                        path,
                    };
                    this.stateCache[path] = newState;
                    return newState;
                }

                const newState = {
                    ...state,
                    my: [
                        ...state.my.slice(0, i),
                        attackResult.attacker,
                        ...state.my.slice(i + 1),
                    ],
                    enemy: [
                        ...state.enemy.slice(0, j),
                        attackResult.target,
                        ...state.enemy.slice(j + 1),
                    ],
                    enemyHp: state.enemyHp - attackResult.excessDamage,
                    path,
                };

                this.stateCache[path] = newState;
                return newState;
            }
        }, initialState);

        const finalScore = evaluateState(bake(finalState));

        if (finalScore > this.bestPlanScore) {
            this.bestPlan = plan;
            this.bestPlanScore = finalScore;
        }
        return finalState;
    }
}

const evaluateState = state => {
    const ratingFormula = (acc, c) => (acc + c.attack + c.defense * defensePointWeight);
    const myUnitsRating = state.my.reduce(ratingFormula, state.myHp * hpPointWeight);
    const enemyUnitsRating = state.enemy.reduce(ratingFormula, state.enemyHp * hpPointWeight);
    const bonus = (state.enemyHp <= 0) ? 1000 : 0;

    return myUnitsRating - enemyUnitsRating + bonus;
}
// game loop

const makeIsMethod = letter => c => (c.abilities.indexOf(letter) > -1)

const isDefender = makeIsMethod('G');
const isDeathtouch = makeIsMethod('L');
const isHaste = makeIsMethod('C');
const isWard = makeIsMethod('W');
const isTrample = makeIsMethod('B');
const getValue = c => {
    if (isCreature(c) || isGreenItem(c)) { // Bombs / Tricks
        return ((c.attack + c.defense / 2 + c.cardDraw * 5) / c.cost + (isDefender(c) ? 0.2 : 0));
    } else if (c.type === 2 && c.defense < 0) {
        return 100;  // Removal
    } else {
        return 1;
    }
}

while (true) {
    const players = [];

    for (var i = 0; i < 2; i++) {
        var inputs = readline().split(' ');
        var health = parseInt(inputs[0]);
        var mana = parseInt(inputs[1]);
        var deck = parseInt(inputs[2]);
        var rune = parseInt(inputs[3]);
        players.push({
            health,
            mana,
            deck,
            rune
        });
    }
    var enemyHand = parseInt(readline());
    var cardCount = parseInt(readline());
    
    const myHand = [];
    var myField = [];
    var enemyField = [];
    
    for (var i = 0; i < cardCount; i++) {
        var inputs = readline().split(' ');
        var seq = i;
        var number = parseInt(inputs[0]);
        var instanceId = parseInt(inputs[1]);
        var location = parseInt(inputs[2]);
        var type = parseInt(inputs[3]);
        var cost = parseInt(inputs[4]);
        var attack = parseInt(inputs[5]);
        var defense = parseInt(inputs[6]);
        var abilities = inputs[7].replace(/-/g, '');
        var myHealthChange = parseInt(inputs[8]);
        var opponentHealthChange = parseInt(inputs[9]);
        var cardDraw = parseInt(inputs[10]);
        
        const card = {
            number,
            seq,
            instanceId,
            type,
            cost,
            attack,
            defense,
            abilities,
            cardDraw
        };
        switch (location) {
            case 0:
                myHand.push(card);
                break;
            case 1:
                myField.push({ ...card, ready: true});
                break;
            case -1:
                enemyField.push(card);
                break;
        }
    }

    const start = (new Date()).getTime();

    if (players[0].mana === 0) {
        // Bombs
        if (myHand.filter(isBomb).length > 0) {
            const bombValues = myHand.filter(isBomb).sort((c1, c2) => (getValue(c1) < getValue(c2)));
            print(`PICK ${bombValues[0].seq}`);
        // Aggro
        } else if (myHand.filter(isAggro).length > 0) {
            const aggroValues = myHand.filter(isAggro).sort((c1, c2) => (getValue(c1) < getValue(c2)));
            print(`PICK ${aggroValues[0].seq}`);
        } else {
            const values = myHand.sort((c1, c2) => (getValue(c1) < getValue(c2)));
            print(`PICK ${values[0].seq}`);
        }
    } else {
        var actions = [];
        var manaLeft = players[0].mana;
        
        var enemyDefenders = enemyField.filter(isDefender);
        const enemyTargets = enemyField.filter(c => isDefender(c) || (c.attack / c.defense >= 3));
        const minDefense = enemyTargets.reduce((acc, d) => Math.min(acc, d.defense), 100);

        if (enemyDefenders.length > 0 && myHand.filter(isGuardRemover).length > 0) {
            const pierceArmorCard = myHand.filter(isGuardRemover)[0];
            const targetDefender = enemyDefenders.sort((c1, c2) => c2.defense - c1.defense)[0];
            actions.push(`USE ${pierceArmorCard.instanceId} ${targetDefender.instanceId}`);
            enemyDefenders = enemyField.filter(isDefender).filter(c => c.instanceId != targetDefender.instanceId);
        }
        
        const playableRemoval = myHand.filter(isRedItem).filter(c => (c.cost <= manaLeft && (minDefense + c.defense <= 0)));
        if (enemyTargets.length > 0 && playableRemoval.length > 0) {
            const playedRemoval = playableRemoval[0];
            const removedCreature = enemyTargets.filter(d => (d.defense + playedRemoval.defense <= 0))[0];

            actions.push(`USE ${playedRemoval.instanceId} ${removedCreature.instanceId}`);
            enemyField = enemyField.map(c => c.instanceId === removedCreature.instanceId ? { ...c, defense: c.defense + playedRemoval.defense} : c).filter(alive);
            enemyDefenders = enemyField.filter(isDefender);
            manaLeft -= playedRemoval.cost;
        }

        const playable = myHand.filter(isCreature).filter(c => c.cost <= manaLeft).sort((c1, c2) => c1.attack > c2.attack);

        printErr(`Playable creatures: ${playable.length}, DPW: ${defensePointWeight}`);

        if (playable.length > 0) {
            if (playable.length > 1) {
                const utilities = playable.map(c => 
                    (
                        c.attack + 
                        c.defense * defensePointWeight + 
                        (c.attributes ? c.attributes.length : 0)
                    )
                );
                const costs = playable.map(c => c.cost);
                const bestSet = knapSack(manaLeft, utilities, costs);

                const summonCommands = bestSet.map(i => `SUMMON ${playable[i].instanceId}`);
                const totalSummonCost = bestSet.reduce((acc, i) => acc + playable[i].cost, 0);
                const summonedCreatures = bestSet.map(i => playable[i]).map(c => ({...c, ready: isHaste(c)}));

                actions = actions.concat(summonCommands);
                myField = myField.concat(summonedCreatures);
                manaLeft -= totalSummonCost;
            } else {
                actions.push(`SUMMON ${playable[0].instanceId}`);
                manaLeft -= playable[0].cost;
            }
        }

        const greenItems = myHand.filter(isGreenItem).filter(c => c.cost <= manaLeft);
        printErr(`${greenItems.length} green items`);
        if (greenItems.length > 0 && myField.length > 0) {
            const greenItem = greenItems[0];
            printErr(`${greenItem.abilities} abilities`);
            const checker = abilitiesIntersect(greenItem);
            const recipients = myField.filter(c => !checker(c));
            printErr(`${recipients.length} recipients`);

            if (recipients.length > 0) {
                if (greenItem.defense > 0 && recipients.filter(isDefender).length > 0) {
                    actions.push(`USE ${greenItem.instanceId} ${recipients.filter(isDefender)[0].instanceId}`);
                } else {
                    actions.push(`USE ${greenItem.instanceId} ${recipients[0].instanceId}`);
                }
                manaLeft -= greenItem.cost;
            }
        }
        
        const redItems = myHand.filter(isRedItem).filter(c => c.cost <= manaLeft && c.defense < 0);
        if (redItems.length > 0 && enemyField.length > 0) {
            const redItem = redItems[0];
            const target = (enemyDefenders.length > 0) ? enemyDefenders[0] : enemyField[0];
            actions.push(`USE ${redItem.instanceId} ${target.instanceId}`);
            enemyField = enemyField.map(c => c.instanceId === target.instanceId ? { ...c, defense: c.defense + redItem.defense} : c).filter(alive);
            enemyDefenders = enemyField.filter(isDefender);
        }
        
        const burnItems = myHand.filter(c => c.type === 3).filter(c => c.cost <= manaLeft && c.defense < 0);
        if (burnItems.length > 0 && enemyField.length > 0) {
            const burnItem = burnItems[0];
            const target = (enemyDefenders.length > 0) ? enemyDefenders[enemyDefenders.length - 1] : enemyField[0];
            actions.push(`USE ${burnItem.instanceId} ${target.instanceId}`);
            enemyField = enemyField.map(c => c.instanceId === target.instanceId ? { ...c, defense: c.defense + burnItem.defense} : c).filter(alive);
            enemyDefenders = enemyField.filter(isDefender);
        }

        const royalHelm = myHand.find(isRoyalHelm);
        if (royalHelm && myField.length > 0) {
            if (myField.filter(isDefender).length > 0) {
                actions.push(`USE ${royalHelm.instanceId} ${myField.filter(isDefender)[0].instanceId}`);
            } else {
                const bigBad = myField.sort((c1, c2) => c2.attack - c1.attack)[0];
                actions.push(`USE ${royalHelm.instanceId} ${bigBad.instanceId}`);
                myField = myField.map(c => c.instanceId === bigBad.instanceId ? {...c, defense: c.defense + royalHelm.defense} : c);
            }
        }

        const attackers = myField.filter(c => (c.attack > 0 && c.ready)).sort((c1,c2) => c2.abilities.length - c1.abilities.length);

        if (attackers.length > 0) {
            if (enemyDefenders.length > 0) {
                const sim = new FightSim(attackers, enemyField, players[0].health, players[1].health);
                
                sim.prunePlans();
                sim.shufflePlans();
                sim.plans.every(plan => {
                    sim.simulateFight(plan);
                    const time = (new Date()).getTime();

                    return time <= (start + millisecondsToCalculate);
                });
                const goodPlan = sim.bestPlan.split('').map(a => parseInt(a, 10));

                actions = actions.concat(attackers.map((attacker, i) => {
                    const attackTarget = (goodPlan[i] > 0 && enemyField[goodPlan[i] - 1]) ? enemyField[goodPlan[i] - 1].instanceId : '-1';
                    return `ATTACK ${attacker.instanceId} ${attackTarget}`;
                }));
            } else {
                actions = actions.concat(attackers.map(a => `ATTACK ${a.instanceId} -1`));
            }
        }
        
        if (actions.length > 0) {
            print(actions.filter(Boolean).join(';'));
        } else {
            print('PASS');
        }
    }
}