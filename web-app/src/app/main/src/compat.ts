// web-app/src/app/main/src/compat.ts
// eslint-disable-next-line import/no-unassigned-import
/**
 * 为通过 HTTP 或旧浏览器访问时缺失的 Web Crypto API 提供兼容实现。
 * 部分第三方库会直接调用 crypto.randomUUID()；此处必须在业务代码前执行。
 */
function createRandomUuid(): string {
  const bytes = new Uint8Array(16)
  const cryptoApi = globalThis.crypto

  if (cryptoApi?.getRandomValues) {
    cryptoApi.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  // RFC 4122 version 4 UUID
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function installCryptoRandomUuidPolyfill() {
  const cryptoApi = globalThis.crypto
  if (cryptoApi?.randomUUID) return

  if (cryptoApi) {
    Object.defineProperty(cryptoApi, 'randomUUID', {
      configurable: true,
      value: createRandomUuid,
    })
    return
  }

  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { randomUUID: createRandomUuid },
  })
}

installCryptoRandomUuidPolyfill()
