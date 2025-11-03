import { sleep } from 'bun';
import { Hono } from 'hono'

const app = new Hono()
const ports = [3001, 3002, 3003];
let counter = 0;

const servers = [
    { port: 3001, weight: 1 },
    { port: 3002, weight: 2 },
    { port: 3003, weight: 3 },
];

let weightedList = servers.flatMap(s => Array(s.weight).fill(s.port));
let currentIndex = 0;


const randomIndex = (array: number[]) => {
    const numberOfServers = array.length;
    const random = Math.random();
    const index = Math.floor(numberOfServers * random);
    return index;
}


app.get('/', (c) => c.text('Halo from Load balancer!'))

app.get('/random', async (c) => {
    const foundIndex = randomIndex(ports);
    const selectedPort = ports[foundIndex];
    console.log(selectedPort);
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    console.log(data)
    return c.text(data);
})

app.get('/round-robin', async (c) => {
    const selectedPort = ports[counter % ports.length];
    counter++;
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    return c.text(data);
})

app.get('/weighted', async (c) => {
    const selectedPort = weightedList[currentIndex];
    currentIndex = (currentIndex + 1) % weightedList.length;
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    return c.text(data);
})

app.get("/health-brute-force", async (c) => {
    let isHealthy = false;
    let selectedPort;
    let i = 0;
    while (i < servers.length) {
        selectedPort = servers[i]?.port!;
        isHealthy = await checkHealth(selectedPort);
        console.log(`Server ${i + 1} isHealthy ? ${isHealthy}`)
        if (isHealthy) {
            break;
        }
        i++;
    }
    if (!isHealthy) {
        return c.text("Error all the server are crashed.")
    }
    console.log("fetching from healthy server " + selectedPort)
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    return c.text(data);

})

const availablePorts = <number[]>[];

app.get('/heatlh-dynamic', async (c) => {
    const foundIndex = randomIndex(availablePorts);
    const foundPort = availablePorts[foundIndex]
    if (!foundPort) {
        return c.text('No servers are up right now , send the request again!')
    }
    console.log("port to hit", foundPort)
    const response = await fetch(`http://localhost:${foundPort}`)
    const data = await response.text();
    return c.text(data);

})

// polling funtion to check health of all the server
async function checkEachServer() {
    let i = 0;
    while (true) {
        if (i > 2) {
            i = 0;
        }
        let currentPort = servers[i]?.port!;
        const isHealthy = await checkHealth(currentPort)
        if (isHealthy) {
            if (!availablePorts.includes(currentPort)) {
                availablePorts.push(currentPort)
            }
        }
        else {
            if (availablePorts.includes(currentPort)) {
                const indexToBeRemoved = availablePorts.indexOf(currentPort);
                if (indexToBeRemoved > -1) {
                    availablePorts.splice(indexToBeRemoved, 1)
                }
            }
        }
        i++;
        console.log("currently availablePorts are: ", availablePorts)
        await sleep(2000)
    }
}

async function checkHealth(port: number) {
    const response = await fetch(
        `http://localhost:${port}/health`
    )
    const data = (await response.json()) as { isHealthy?: boolean };
    return Boolean(data.isHealthy);
}

checkEachServer();

export default {
    port: 3000,
    fetch: app.fetch,
}
