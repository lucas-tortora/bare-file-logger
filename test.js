const test = require('brittle')
const path = require('bare-path')
const fs = require('bare-fs')

const FileLog = require('.')

test('basic', async (t) => {
  const log = new FileLog(path.join(await t.tmp(), 'test.log'))
  t.teardown(() => log.close())

  await t.execution(() => log.debug('This is a debug log'))
  await t.execution(() => log.info('This is an info log'))
  await t.execution(() => log.warn('This is a warning log'))
  await t.execution(() => log.error('This is an error log'))
})

test('rotate - renames file when maxSize is reached', async (t) => {
  t.plan(5)

  const tmp = await t.tmp()
  const logPath = path.join(tmp, 'test.log')
  const rotatedPath = path.join(tmp, 'test.log.1')

  const log = new FileLog(logPath, {
    maxSize: 50,
    rotateInterval: 100,
    rotate() {
      return rotatedPath
    }
  })
  t.teardown(() => log.close())

  log.once('rotate', (originalPath, destPath) => {
    t.is(originalPath, logPath, 'event has original path')
    t.is(destPath, rotatedPath, 'event has rotated path')
  })

  for (let i = 0; i < 5; i++) {
    log.info('filling up the log file with data')
  }

  await new Promise((resolve) => setTimeout(resolve, 200))

  t.ok(fs.existsSync(rotatedPath), 'rotated file exists')
  t.ok(fs.statSync(rotatedPath).size > 0, 'rotated file has content')
  t.is(fs.statSync(logPath).size, 0, 'new log file is empty')
})

test('rotate - does nothing when rotate returns falsy', async (t) => {
  t.plan(2)

  const tmp = await t.tmp()
  const logPath = path.join(tmp, 'test.log')

  let sizeBefore = 0

  const log = new FileLog(logPath, {
    maxSize: 50,
    rotateInterval: 100,
    rotate() {
      sizeBefore = fs.statSync(logPath).size
      t.pass('rotate was called')
      log.close()
      return null
    }
  })
  t.teardown(() => log.close())

  for (let i = 0; i < 5; i++) {
    log.info('filling up the log file with data')
  }

  await new Promise((resolve) => setTimeout(resolve, 200))

  t.is(fs.statSync(logPath).size, sizeBefore, 'file was not modified')
})

test('rotate - does not call rotate when under threshold', async (t) => {
  t.plan(1)

  const tmp = await t.tmp()
  const logPath = path.join(tmp, 'test.log')

  const log = new FileLog(logPath, {
    maxSize: 100000,
    rotateInterval: 100,
    rotate() {
      t.fail('rotate should not be called')
      return path.join(tmp, 'test.log.1')
    }
  })
  t.teardown(() => log.close())

  log.info('short')

  await new Promise((resolve) => setTimeout(resolve, 200))

  t.pass('rotate was not called')
})

test('truncate - truncates file when maxSize is reached', async (t) => {
  t.plan(2)

  const tmp = await t.tmp()
  const logPath = path.join(tmp, 'test.log')

  const log = new FileLog(logPath, {
    maxSize: 50,
    rotateInterval: 100
  })
  t.teardown(() => log.close())

  log.once('rotate', () => {
    t.pass('rotated')
  })

  for (let i = 0; i < 5; i++) {
    log.info('filling up the log file with data')
  }

  await new Promise((resolve) => setTimeout(resolve, 200))

  t.is(fs.statSync(logPath).size, 0, 'new log file is empty')
})
