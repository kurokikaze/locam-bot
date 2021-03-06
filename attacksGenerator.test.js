const {
    FightSim,
    alive,
    evaluateState,
    abilitiesIntersect,
    applyAttack,
    applyRedCard,
    applyGreenCard,
    EMPTY_ABILITY_SLOT,
} = require('./attacksGenerator');

const EMPTY_ABILITIES = (new Array(6)).fill(EMPTY_ABILITY_SLOT).join('');

const card = (pt, abilities) => {
    const ptParts = pt.split('/');
    return {
        name: 'Card ' + pt,
        attack: parseInt(ptParts[0], 10),
        defense: parseInt(ptParts[1], 10),
        abilities: abilities || EMPTY_ABILITIES,
    }
}

global.test = true;

const bake = state => (
    {
        ...state,
        my: state.my.filter(alive),
        enemy: state.enemy.filter(alive),
    }
)

describe('applyAttack tests', () => {
    it('правильный расчёт простого боя', () => {
        const attacker = card('1/3');
        const target = card('2/2');
        const result = applyAttack(attacker, target);

        const expectedResult = {
            attacker: {
                name: 'Card 1/3',
                attack: 1,
                defense: 1,
                abilities: EMPTY_ABILITIES,
            },
            target: {
                name: 'Card 2/2',
                attack: 2,
                defense: 1,
                abilities: EMPTY_ABILITIES,
            },
            excessDamage: 0,
            excessDamageToUs: 0,
        }

        expect(result).toEqual(expectedResult);
    });
});

describe('FightSim tests', () => {
    it('должен правильно симулировать бой', () => {
        const myField = [card('1/1'), card('1/1')];
        const enemyField = [card('2/1', 'A'), card('2/1', 'B'), card('2/1', 'C')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('12');

        expect(result.my.filter(alive).length).toEqual(0);
        expect(result.enemy.filter(alive).length).toEqual(1);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(10);
    });

    it('концентрированная атака', () => {
        const myField = [card('1/1'), card('1/1'), card('1/1')];
        const enemyField = [card('1/1'), card('12/3'), card('1/1')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('222');

        expect(result.my.filter(alive).length).toEqual(0);
        expect(result.enemy.filter(alive).length).toEqual(2);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(10);
    });

    it('атака в противника', () => {
        const myField = [card('1/1'), card('1/1'), card('1/1')];
        const enemyField = [card('1/1'), card('1/1'), card('1/1')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('000');

        expect(result.my.filter(alive).length).toEqual(3);
        expect(result.enemy.filter(alive).length).toEqual(3);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(7);
    });

    it('атака в противника не проходит если есть дефендер', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1')];
        const enemyField = [card('1/1', 'G')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('000');

        expect(result.my.filter(alive).length).toEqual(3);
        expect(result.enemy.filter(alive).length).toEqual(1);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(10);
    });

    it('атака в существ противника не проходит если есть дефендер', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1')];
        const enemyField = [card('1/1', 'G'), card('1/4')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('222');

        expect(result.my.filter(alive).length).toEqual(3);
        expect(result.enemy.filter(alive).length).toEqual(2);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(10);
    });

    it('атака в противника проходит если убрать дефендера', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1')];
        const enemyField = [card('1/1', 'G')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('100');

        expect(result.my.filter(alive).length).toEqual(2);
        expect(result.enemy.filter(alive).length).toEqual(0);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(0);
    });

    it('атака в существ противника проходит если убрать дефендера', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1')];
        const enemyField = [card('0/4'), card('1/1', 'G'), card('0/4')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('213');

        expect(result.my.filter(alive).length).toEqual(2);
        expect(result.enemy.filter(alive).length).toEqual(0);

        expect(result.myHp).toEqual(10);
        expect(result.enemyHp).toEqual(10);
    });

    it('смертельное касание работает', () => {
        const myField = [card('1/1', 'L')];
        const enemyField = [card('5/5', 'G')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('1');

        expect(result.my.filter(alive).length).toEqual(0);
        expect(result.enemy.filter(alive).length).toEqual(0);
    });

    it('пробивной удар работает', () => {
        const myField = [card('5/1', 'B')];
        const enemyField = [card('0/2', 'G')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('1');

        expect(result.enemy.filter(alive).length).toEqual(0);
        expect(result.enemyHp).toEqual(7);
    });

    it('вард работает', () => {
        const myField = [card('2/2')];
        const enemyField = [card('0/2', 'W')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('1');

        expect(result.enemy.filter(alive).length).toEqual(1);
        expect(result.enemy.filter(alive)[0].abilities).toEqual(EMPTY_ABILITY_SLOT);
    });

    it('lethal в ward не убивает его', () => {
        const myField = [card('1/1', 'L')];
        const enemyField = [card('0/2', 'W')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('1');

        expect(result.enemy.filter(alive).length).toEqual(1);
        expect(result.enemy.filter(alive)[0].abilities).toEqual(EMPTY_ABILITY_SLOT);
    });

    it('breakthrough в ward не проносит урон в игрока', () => {
        const myField = [card('6/1', 'B')];
        const enemyField = [card('0/2', 'W')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('1');

        expect(result.enemy.filter(alive).length).toEqual(1);
        expect(result.enemy.filter(alive)[0].abilities).toEqual(EMPTY_ABILITY_SLOT);
        expect(result.enemyHp).toEqual(10);
    });

    it('расчёт заполняет кеш состояний', () => {
        const myField = [card('2/1'), card('1/1'), card('1/2')];
        const enemyField = [card('0/4'), card('1/1'), card('0/4')];
        const sim = new FightSim(myField, enemyField);
        const result = sim.simulateFight('213');

        expect(Object.keys(sim.stateCache).length).toEqual(3);
        expect(sim.stateCache['213']).toEqual(result);
    });

    it('генерация планов срабатывает при загрузке полей', () => {
        const myField = [card('2/1'), card('1/1'), card('1/2')];
        const enemyField = [card('0/4'), card('1/1'), card('0/4')];
        const sim = new FightSim(myField, enemyField);
        const plans = sim.plans;

        expect(plans.length).toEqual(64);
    });

    it('прунинг планов убирает лишние', () => {
        const myField = [card('2/1'), card('1/1'), card('1/2')];
        const enemyField = [card('0/4'), card('1/1', 'G'), card('0/4')];
        const sim = new FightSim(myField, enemyField);

        expect(sim.plans.length).toEqual(64);

        sim.prunePlans();

        expect(sim.plans.length).toEqual(13);
    });

    it('вынос атакующих вместо атаки в игрока', () => {
        const myField = [card('1/1')];
        const enemyField = [card('3/1')];
        const sim = new FightSim(myField, enemyField, 10, 10);
        const chargeState = bake(sim.simulateFight('0'));

        const chargeValue = evaluateState(chargeState);

        // expect(chargeValue).toEqual(-1.1999999999999993);

        const attackState = bake(sim.simulateFight('1'));
        const attackValue = evaluateState(attackState);

        expect(attackValue).toEqual(0);

        expect(attackValue).toBeGreaterThan(chargeValue);
    });

    it('правильно определяет пересечение свойств', () => {
        const c1 = {
            abilities: 'ABC',
        };
        const c2 = {
            abilities: 'CDE',
        };
        const c3 = {
            abilities: 'NDE',
        }

        expect(abilitiesIntersect(c1)(c2)).toEqual(true);
        expect(abilitiesIntersect(c2)(c3)).toEqual(true);
        expect(abilitiesIntersect(c1)(c3)).toEqual(false);
    });

    it('прунинг планов учитывает всех защитников', () => {
        const myField = [card('2/1'), card('1/1'), card('1/2')];
        const enemyField = [card('0/4'), card('1/1', 'G'), card('0/4', 'G')];
        const sim = new FightSim(myField, enemyField);

        expect(sim.plans.length).toEqual(64);

        sim.prunePlans();

        expect(sim.plans.length).toEqual(24);
    });

    it('долгий расчёт', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1'), card('1/4'), card('1/1'), card('1/1')];
        const enemyField = [card('0/4'), card('0/4'), card('1/1', 'G'), card('1/1', 'G'), card('0/4')];
        const sim = new FightSim(myField, enemyField);

        sim.prunePlans();

        const outcomes = sim.plans.map(plan => sim.simulateFight(plan));

        const optimalPlan = '340000';
        expect(sim.bestPlan).toEqual(optimalPlan);
    });

    it('странная ситуация', () => {
        const myField = [card('2/3', 'G')];
        const enemyField = [card('1/2', 'G'), card('2/2')];
        const sim = new FightSim(myField, enemyField);

        expect(sim.plans).toEqual(['0', '1', '2']);

        sim.prunePlans();

        expect(sim.plans).toEqual(['1']);

        const outcomes = sim.plans.map(plan => sim.simulateFight(plan));
       
        const optimalPlan = '1';
        expect(sim.bestPlan).toEqual(optimalPlan);
    });

    it('уровни кеша', () => {
        const myField = [card('2/3', 'G')];
        const enemyField = [card('1/2', 'G'), card('2/2')];
        const sim = new FightSim(myField, enemyField);

        expect(sim.plans).toEqual(['0', '1', '2']);

        sim.prunePlans();

        expect(sim.plans).toEqual(['1']);

        const outcomes = sim.plans.map(plan => sim.simulateFight(plan));
       
        const optimalPlan = '1';
        expect(sim.bestPlan).toEqual(optimalPlan);
    });

    it('уровни кеширования не влияют на результат симуляции', () => {
        const myField = [card('5/1'), card('5/1'), card('5/1'), card('1/4'), card('1/1'), card('1/1')];
        const enemyField = [card('0/4'), card('0/4'), card('1/1', 'G'), card('1/1', 'G'), card('0/4')];

        const optimalPlan = '340000';

        const simCache0 = new FightSim(myField, enemyField);
        simCache0.cacheLevel = 0;
        const sim0results = simCache0.plans.map(plan => simCache0.simulateFight(plan));

        expect(simCache0.bestPlan).toEqual(optimalPlan);

/*        const simCache1 = new FightSim(myField, enemyField);
        simCache1.cacheLevel = 1;
        const sim1results = simCache1.plans.map(plan => simCache1.simulateFight(plan));

        expect(simCache0.bestPlan).toEqual(optimalPlan);
        expect(sim0results).toEqual(sim1results);

        const simCache2 = new FightSim(myField, enemyField);
        simCache2.cacheLevel = 2;
        simCache2.plans.map(plan => simCache2.simulateFight(plan));

        expect(simCache2.bestPlan).toEqual(optimalPlan);

        const simCache3 = new FightSim(myField, enemyField);
        simCache3.cacheLevel = 3;
        simCache3.plans.map(plan => simCache3.simulateFight(plan));

        expect(simCache3.bestPlan).toEqual(optimalPlan);

        const simCache4 = new FightSim(myField, enemyField);
        simCache4.cacheLevel = 4;
        simCache4.plans.map(plan => simCache4.simulateFight(plan));

        expect(simCache4.bestPlan).toEqual(optimalPlan); */

        const simCache5 = new FightSim(myField, enemyField);
        simCache5.cacheLevel = 5;
        simCache5.plans.map(plan => simCache5.simulateFight(plan));

        expect(simCache5.bestPlan).toEqual(optimalPlan);
    });
});