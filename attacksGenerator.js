const makeIsMethod = letter => c => (c.abilities.indexOf(letter) > -1)

const isDefender = makeIsMethod('G');
const isDeathtouch = makeIsMethod('L');
const isHaste = makeIsMethod('C');
const isTrample = makeIsMethod('B');
const isWard = makeIsMethod('W');

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

const generateAttacks = (myUnits, enemyUnits) => {
    const base = enemyUnits + 1;
    const number = parseInt(Array(myUnits).fill(base - 1).join(''), base);
    return Array(number).fill(1).map((el, i) => pad(i.toString(base), myUnits));
}

const alive = c => c.defense > 0;

const bake = state => (
    {
        ...state,
        my: state.my.filter(alive),
        enemy: state.enemy.filter(alive),
    }
);

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
        console.log(`Steps simulated: ${this.stepsSimulated}`);
        console.log(`Cached states: ${Object.keys(this.stateCache).length}`);
    }

    generateAttacks() {
        const myUnits = this.myField.length;
        const enemyUnits = this.enemyField.length;

        const base = enemyUnits + 1;
        const number = parseInt(Array(myUnits).fill(enemyUnits).join(''), base) + 1;
        this.plans = Array(number).fill(1).map((el, i) => pad(i.toString(base), myUnits));
    }

    prunePlans() {
        var defenderPositions = new Set();
        this.enemyField.forEach((c, i) => {
            if (isDefender(c)) defenderPositions.add((i + 1).toString());
        });

        if (defenderPositions.size > 0) {
            this.plans = this.plans.filter(plan => defenderPositions.has(plan.slice(0, 1)));
        }
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

                const excessDamage = (isTrample(attacker) && !isWard(target)) ? Math.max(attacker.attack - target.defense, 0) : 0;
                var targetHp = isDeathtouch(attacker) ? 0 : target.defense - attacker.attack;
                if (isWard(target)) {
                    targetHp = target.defense;
                }
                
                var attackerHp = isDeathtouch(target) ? 0 : attacker.defense - target.attack;
                if (isWard(attacker)) {
                    attackerHp = attacker.defense;
                }

                const newState = {
                    ...state,
                    my: [
                        ...state.my.slice(0, i),
                        {
                            ...attacker,
                            defense: isDeathtouch(target) ? 0 : attacker.defense - target.attack,
                            abilities: (target.attack > 0) ? attacker.abilities.replace(/W/g, '.') : attacker.abilities,
                        },
                        ...state.my.slice(i + 1),
                    ],
                    enemy: [
                        ...state.enemy.slice(0, j),
                        {
                            ...target,
                            defense: targetHp,
                            abilities: (attacker.attack > 0) ? target.abilities.replace(/W/g, '.') : target.abilities,
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

const evaluateState = state => {
    const ratingFormula = (acc, c) => (acc + parseInt(c.attack, 10) + parseInt(c.defense, 10) / 2);
    const myUnitsRating = state.my.reduce(ratingFormula, state.myHp * 5);
    const enemyUnitsRating = state.enemy.reduce(ratingFormula, state.enemyHp * 5);
    
    const bonus = (state.enemyHp <= 0) ? 1000 : 0;

    return myUnitsRating - enemyUnitsRating + bonus;
}

module.exports = {
    generateAttacks,
    FightSim,
    alive,
    evaluateState,
}
