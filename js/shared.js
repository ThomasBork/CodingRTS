var unitTypes = {
    builder: {
        name: "Builder",
        price: 1000,
        life: 1000,
        armor: 5,
        speed: 0,
        damage: 0,
        range: 0,
        visionRange: 1200,
        builds: ["builder", "warrior", "archer"],
        income: 50
    },
    warrior: {
        name: "Warrior",
        price: 150,
        life: 400,
        armor: 2,
        speed: 100,
        damage: 20,
        range: 50,
        visionRange: 800,
        builds: [],
        income: 0
    },
    archer: {
        name: "Archer",
        price: 100,
        life: 150,
        armor: 0,
        speed: 125,
        damage: 20,
        range: 500,
        visionRange: 800,
        builds: [],
        income: 0
    }
};

var ACTION_TYPE = {
    WAIT: "Wait",
    MOVE: "Move",
    ATTACK: "Attack",
    BUILD: "Build"
};

var MESSAGE_TYPE = {
    INITIALIZE_WORKER: "Initialize worker",
    UPDATE_ACTIONS: "Update actions",
    START_TURN: "Start turn",
    GAME_OVER: "Game over"
};

var Utils = {
    isJSON: (string) => {
        try {
            JSON.parse(string);
        } catch (e) {
            return false;
        }
        return true;
    }
}