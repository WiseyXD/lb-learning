import { Hono } from 'hono'

const app = new Hono()
app.get('/', (c) => c.text('Halo from server2!'))

export default {
    port: 3002,
    fetch: app.fetch,
} 
