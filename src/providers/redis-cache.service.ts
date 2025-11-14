import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis, { Cluster } from 'ioredis'

type RedisClient = Redis | Cluster

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisCacheService.name)
  private client?: RedisClient | null
  private initializing?: Promise<RedisClient | null>

  constructor(private readonly configService: ConfigService) {}

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient()
    if (client == null) {
      return null
    }

    try {
      const value = await client.get(key)
      return value ? (JSON.parse(value) as T) : null
    } catch (error) {
      this.logger.warn(`Failed to read cache key ${key}: ${error.message}`)
      return null
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const client = await this.getClient()
    if (client == null) {
      return
    }

    try {
      await client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (error) {
      this.logger.warn(`Failed to set cache key ${key}: ${error.message}`)
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client && typeof (this.client as Redis).quit === 'function') {
      try {
        await (this.client as Redis).quit()
      } catch (error) {
        this.logger.warn(`Failed to close Redis connection: ${error.message}`)
      }
    }
  }

  private async getClient(): Promise<RedisClient | null> {
    if (this.client) {
      return this.client
    }
    if (this.initializing) {
      return this.initializing
    }

    this.initializing = this.createClient()
    this.client = await this.initializing
    this.initializing = undefined
    return this.client
  }

  private async createClient(): Promise<RedisClient | null> {
    const redisConfig = this.configService.get('redis')
    if (!redisConfig) {
      this.logger.warn('Redis configuration not found. Caching disabled.')
      return null
    }

    try {
      if (redisConfig.isCluster === true) {
        return new Cluster(
          [
            {
              host: redisConfig.host,
              port: redisConfig.port,
            },
          ],
          {
            redisOptions: {
              password: redisConfig.password,
            },
          },
        )
      }

      return new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
      })
    } catch (error) {
      this.logger.error('Failed to initialize Redis client', error.stack)
      return null
    }
  }
}
