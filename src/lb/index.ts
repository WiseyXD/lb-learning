import { Hono } from 'hono'

const app = new Hono()
app.get('/', (c) => c.text('Halo from Load balancer!'))
const ports = [3001, 3002, 3003];

const randomIndex = () => {
    const numberOfServers = ports.length;
    const random = Math.random();
    const index = Math.floor(numberOfServers * random);
    return index;
}

app.get('/request', async (c) => {
    // redirect to random servers
    const foundIndex = randomIndex();
    const selectedPort = ports[foundIndex];
    console.log(selectedPort);
    const response = await fetch(`http://localhost:${selectedPort}`);
    const data = await response.text();
    console.log(data)
    return c.text(data);
})

export default {
    port: 3000,
    fetch: app.fetch,
}
