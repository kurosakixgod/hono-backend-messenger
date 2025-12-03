import { argon2id, hash, verify } from 'argon2'

export async function hashPassword(password: string): Promise<string> {
  try {
    const passwordHash = await hash(password, {
      type: argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    })
    return passwordHash
  }
  catch {
    throw new Error('Ошибка при хешировании пароля')
  }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await verify(hash, password)
  }
  catch {
    return false
  }
}
