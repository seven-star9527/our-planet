import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma
export { PrismaClient } // 导出 PrismaClient 类型，用于类型定义

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
