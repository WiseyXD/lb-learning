import { Hono } from 'hono'
const app = new Hono()

app.get('/', (c) => c.text('Halo from server3!'))

export default {
    port: 3003,
    fetch: app.fetch,
}
