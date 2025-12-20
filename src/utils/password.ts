export async function hashPassword(password: string): Promise<string> {
  try {
    const passwordHash = await Bun.password.hash(password, {
      algorithm: 'argon2id',
      memoryCost: 2 ** 16,
      timeCost: 3,

    })
    return passwordHash
  }
  catch {
    throw new Error('Ошибка при хешировании пароля')
  }
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash)
  }
  catch {
    return false
  }
}
