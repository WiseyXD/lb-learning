import { sleep } from 'bun';
import { Hono } from 'hono'

const app = new Hono()
const ports = [3001, 3002, 3003];
let counter = 0;

let maxCounterFor3 = 3;
let maxCounterFor2 = 2;
let maxCounterFor1 = 1;

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
    // redirect to random servers
    const foundIndex = randomIndex(ports);
    const selectedPort = ports[foundIndex];
    console.log(selectedPort);
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    console.log(data)
    return c.text(data);
})

app.get('/round-robin', async (c) => {
    // if (counter == 0) {
    //     const response = await fetch('http://localhost:3001');
    //     const data = await response.text();
    //     console.log(data)
    //     counter++;
    //     return c.text(data);
    // }
    // else if (counter == 1) {

    //     const response = await fetch('http://localhost:3002');
    //     const data = await response.text(); console.log(data) counter++;
    //     return c.text(data);
    // }
    // else {
    //     const response = await fetch('http://localhost:3003');
    //     const data = await response.text();
    //     console.log(data)
    //     counter = 0;
    //     return c.text(data);
    // }
    //
    // best 

    const selectedPort = ports[counter % ports.length];
    counter++;
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    return c.text(data);

})

app.get('/weighted', async (c) => {
    // lets say server 1 can sserver 3 , server2 => 2 ,server1 => 1
    // if (maxCounterFor3 < 1) {
    //     if (maxCounterFor2 < 1) {
    //         if (maxCounterFor1 < 1) {
    //             maxCounterFor1 = 1;
    //             maxCounterFor2 = 2;
    //             maxCounterFor3 = 3;
    //             return c.text("All servers are occupied !");

    //         }
    //         else {
    //             const response = await fetch('http://localhost:3001');
    //             const data = await response.text();
    //             maxCounterFor1--;
    //             return c.text(data);
    //         }
    //     }
    //     else {
    //         const response = await fetch('http://localhost:3002');
    //         const data = await response.text();
    //         maxCounterFor2--;
    //         return c.text(data);
    //     }
    // } else {
    //     const response = await fetch('http://localhost:3003');
    //     const data = await response.text();
    //     maxCounterFor3--;
    //     return c.text(data);
    // }

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
    /*here we have to firstly keep on check the health of each server and then dynamically add them to the pool of server that are available to server
     * we can create a new setTimeout function that starts when the server start and keep on checking the servers and the dynamically set the available server in an new array
     * the crashed server must be pinged again after 10 seconds*/
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
    const data = await response.json();
    return data.isHealthy!;
}

checkEachServer();

export default {
    port: 3000,
    fetch: app.fetch,
}
