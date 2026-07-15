import { Router } from 'express'
import { flowRepository } from '../repositories/flowRepository.js'
import { requireAuth } from '../auth/session.js'

const router = Router()

// Every flow route is authenticated and scoped to the current user.
router.use(requireAuth)

router.get('/', async (req, res) => {
  res.json(await flowRepository.list(req.user.id))
})

router.get('/:id', async (req, res) => {
  const flow = await flowRepository.get(req.user.id, req.params.id)
  if (!flow) return res.status(404).json({ error: 'not found' })
  res.json(flow)
})

router.post('/', async (req, res) => {
  const flow = await flowRepository.upsert(req.user.id, req.body)
  res.status(201).json(flow)
})

router.put('/:id', async (req, res) => {
  const flow = await flowRepository.upsert(req.user.id, { ...req.body, id: req.params.id })
  res.json(flow)
})

router.delete('/:id', async (req, res) => {
  await flowRepository.remove(req.user.id, req.params.id)
  res.status(204).end()
})

export default router
