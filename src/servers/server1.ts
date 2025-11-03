import { Hono } from 'hono'

const app = new Hono()
app.get('/', (c) => {
    console.log('server1 clicked')
    return c.text('Halo from server1!')
});

app.get('/health', (c) => {
    return c.json({ isHealthy: Math.random() < 0.5 })
})

export default {
    port: 3001,
    fetch: app.fetch,

}
