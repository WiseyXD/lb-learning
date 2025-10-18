import { Hono } from 'hono'

const app = new Hono()
const ports = [3001, 3002, 3003];
let counter = 0;


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
    if (counter == 0) {
        const response = await fetch('http://localhost:3001');
        const data = await response.text();
        console.log(data)
        counter++;
        return c.text(data);
    }
    else if (counter == 1) {

        const response = await fetch('http://localhost:3002');
        const data = await response.text();
        console.log(data)
        counter++;
        return c.text(data);
    }
    else {
        const response = await fetch('http://localhost:3003');
        const data = await response.text();
        console.log(data)
        counter = 0;
        return c.text(data);
    }
})

app.get('/weighted', (c) => {

})

export default {
    port: 3000,
    fetch: app.fetch,
}
