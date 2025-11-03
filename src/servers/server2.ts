import { Hono } from 'hono'

const app = new Hono()
app.get('/', (c) => c.text('Halo from server2!'))


app.get('/health', (c) => {
    return c.json({ isHealthy: Math.random() < 0.5 })
})

export default {
    port: 3002,
    fetch: app.fetch,
} 
