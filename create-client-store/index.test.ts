import { map, STORE_UNMOUNT_DELAY } from 'nanostores'
import { delay } from 'nanodelay'

import { Client, createClientStore } from '../index.js'

it('creates client from user ID', async () => {
  let user = map<{ userId?: string; enabled: boolean }>({
    userId: '1',
    enabled: true
  })

  let events: string[] = []
  let clientStore = createClientStore(user, ({ userId, enabled }) => {
    if (!enabled) return undefined
    return {
      nodeId: userId,
      start() {
        events.push(`${userId} start`)
      },
      destroy() {
        events.push(`${userId} destroy`)
      }
    } as Client
  })

  let unbind = clientStore.listen(() => {})

  expect(events).toEqual(['1 start'])
  expect(clientStore.get()?.nodeId).toBe('1')

  user.setKey('userId', '2')
  expect(events).toEqual(['1 start', '1 destroy', '2 start'])
  expect(clientStore.get()?.nodeId).toBe('2')

  user.setKey('enabled', false)
  expect(events).toEqual(['1 start', '1 destroy', '2 start'])

  user.setKey('userId', '3')
  expect(events).toEqual(['1 start', '1 destroy', '2 start', '2 destroy'])
  expect(clientStore.get()).toBeUndefined()

  user.set({ enabled: true, userId: '4' })
  expect(events).toEqual([
    '1 start',
    '1 destroy',
    '2 start',
    '2 destroy',
    '4 start'
  ])
  expect(clientStore.get()?.nodeId).toBe('4')

  user.setKey('userId', undefined)
  expect(events).toEqual([
    '1 start',
    '1 destroy',
    '2 start',
    '2 destroy',
    '4 start',
    '4 destroy'
  ])
  expect(clientStore.get()).toBeUndefined()

  user.setKey('userId', '5')
  unbind()
  await delay(STORE_UNMOUNT_DELAY)
  expect(user.lc).toBe(0)
  expect(events).toEqual([
    '1 start',
    '1 destroy',
    '2 start',
    '2 destroy',
    '4 start',
    '4 destroy',
    '5 start',
    '5 destroy'
  ])
  expect(clientStore.get()).toBeUndefined()
})
