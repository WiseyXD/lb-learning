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


const randomIndex = () => {
    const numberOfServers = ports.length;
    const random = Math.random();
    const index = Math.floor(numberOfServers * random);
    return index;
}


app.get('/', (c) => c.text('Halo from Load balancer!'))

app.get('/random', async (c) => {
    // redirect to random servers
    const foundIndex = randomIndex();
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

export default {
    port: 3000,
    fetch: app.fetch,
}
