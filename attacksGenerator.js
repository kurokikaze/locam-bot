const makeIsMethod = letter => c => (c.abilities.indexOf(letter) > -1)

const isDefender = makeIsMethod('G');
const isDeathtouch = makeIsMethod('L');
const isHaste = makeIsMethod('C');
const isTrample = makeIsMethod('B');
const isWard = makeIsMethod('W');

const EMPTY_ABILITY_SLOT = '';

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const alive = c => c.defense > 0;

const bake = state => (
    {
        ...state,
        my: state.my.filter(alive),
        enemy: state.enemy.filter(alive),
    }
);

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function applyAttack(attacker, target) {
    var damageDealtToTarget = attacker.attack;

    if (isWard(target)) {
        damageDealtToTarget = 0;
    }

    const excessDamage = isTrample(attacker) ? Math.max(damageDealt - target.defense, 0) : 0;
    const targetHp = (isDeathtouch(attacker) && damageDealt > 0) ? 0 : target.defense - damageDealtToTarget;

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

function applyRedCard(card, target) {
    const targetAbilities = new Set(target.abilities);
    const cardAbilities = new Set(card.abilities);

    return {
        ...target,
        attack: target.attack + card.attack,
        defense: target.attack + card.defense,
        abilities: [...targetAbilities].filter(x => !cardAbilities.has(x)).join(''),
    }
}

function applyGreenCard(card, target) {
    const targetAbilities = new Set(target.abilities);
    const cardAbilities = new Set(card.abilities);

    return {
        ...target,
        attack: target.attack + card.attack,
        defense: target.attack + card.defense,
        abilities: new Set([...targetAbilities, ...cardAbilities]).join(''),
    }
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
            this.enemyField.map
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

        if (this.stateCache[plan.slice(0, 1)] && this.cacheLevel >= 1) {
            initialState = this.stateCache[plan.slice(0, 1)];
            initialPlan = planSteps.slice(1);
            this.positionSkip = 1;
        }

        if (this.stateCache[plan.slice(0, 2)] && this.cacheLevel >= 2) {
            initialState = this.stateCache[plan.slice(0, 2)];
            initialPlan = planSteps.slice(2);
            this.positionSkip = 2;
        }

        if (this.stateCache[plan.slice(0, 3)] && this.cacheLevel >= 3) {
            initialState = this.stateCache[plan.slice(0, 3)];
            initialPlan = planSteps.slice(3);
            this.positionSkip = 3;
        }

        if (this.stateCache[plan.slice(0, 4)] && this.cacheLevel >= 4) {
            initialState = this.stateCache[plan.slice(0, 4)];
            initialPlan = planSteps.slice(4);
            this.positionSkip = 4;
        }

        if (this.stateCache[plan.slice(0, 5)] && this.cacheLevel === 5) {
            initialState = this.stateCache[plan.slice(0, 5)];
            initialPlan = planSteps.slice(5);
            this.positionSkip = 5;
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
                        enemyHp: (state.enemyHp - this.myAttacks[i]),
                        path,
                    };
                    this.stateCache[path] = newState;

                    return newState;
                }
            } else {
                const j = step - 1;
                const target = state.enemy[j];

                if (defendersPresent && !isDefender(target)) {
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

                var damageDealt = attacker.attack;

                if (isWard(target)) {
                    damageDealt = 0;
                }

                const excessDamage = isTrample(attacker) ? Math.max(damageDealt - target.defense, 0) : 0;
                const targetHp = (isDeathtouch(attacker) && damageDealt > 0) ? 0 : target.defense - damageDealt;

                var damageDealtToUs = target.attack;
                
                if (isWard(attacker)) {
                    damageDealt = 0;
                }

                const excessDamageToUs = isTrample(target) ? Math.max(damageDealtToUs - attacker.defense, 0) : 0;
                const attackerHp = (isDeathtouch(target) && damageDealtToUs > 0) ? 0 : attacker.defense - damageDealtToUs;

                const newState = {
                    ...state,
                    my: [
                        ...state.my.slice(0, i),
                        {
                            ...attacker,
                            defense: attackerHp,
                            abilities: (target.attack > 0) ? attacker.abilities.replace(/W/g, EMPTY_ABILITY_SLOT) : attacker.abilities,
                        },
                        ...state.my.slice(i + 1),
                    ],
                    enemy: [
                        ...state.enemy.slice(0, j),
                        {
                            ...target,
                            defense: targetHp,
                            abilities: (attacker.attack > 0) ? target.abilities.replace(/W/g, EMPTY_ABILITY_SLOT) : target.abilities,
                        },
                        ...state.enemy.slice(j + 1),
                    ],
                    enemyHp: state.enemyHp - excessDamage,
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

const hpPointWeight = 1.8;
const defensePointWeight = 0.5;

const evaluateState = state => {
    const ratingFormula = (acc, c) => (acc + c.attack + c.defense * defensePointWeight);
    const myUnitsRating = state.my.reduce(ratingFormula, state.myHp * hpPointWeight);
    const enemyUnitsRating = state.enemy.reduce(ratingFormula, state.enemyHp * hpPointWeight);
    const bonus = (state.enemyHp <= 0) ? 1000 : 0;

    return myUnitsRating - enemyUnitsRating + bonus;
}

const abilitiesIntersect = card1 => card2 => {
    const card1Abilities = card1.abilities.split('');
    const card2Abilities = card2.abilities.split('');
    return (card1Abilities.filter(a => card2Abilities.includes(a)).length > 0);
}

module.exports = {
    FightSim,
    alive,
    evaluateState,
    abilitiesIntersect,
    applyAttack,
    applyRedCard,
    applyGreenCard,
    EMPTY_ABILITY_SLOT,
}
