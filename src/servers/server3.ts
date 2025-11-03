import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Halo from server3!'))

app.get('/health', (c) => {
    return c.json({ isHealthy: Math.random() < 0.5 })
})

export default {
    port: 3003,
    fetch: app.fetch,
}
