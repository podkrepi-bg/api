import { Logger } from '@nestjs/common'
import { IoAdapter } from '@nestjs/platform-socket.io'
import { createAdapter } from '@socket.io/postgres-adapter'
import { Pool } from 'pg'
import { ServerOptions } from 'socket.io'

const { DB_PORT, DB_USER, DB_PASS, DB_HOST } = process.env

export class PostgresIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>

  async connectToPostgres(): Promise<void> {
    const pool = new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: 'postgres',
      password: DB_PASS || 'postgrespass',
      port: Number(DB_PORT) || 5432,
    })

    await pool.connect()

    await pool
      .query(
        `
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`,
      )
      .then(() => {
        Logger.log('Table socket_io_attachments is ready')
      })

    this.adapterConstructor = createAdapter(pool)
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options)
    server.adapter(this.adapterConstructor)
    return server
  }
}
