# Backend - Align Designs Platform

NestJS backend for Align Designs Platform.

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
# Install dependencies (from root)
pnpm install

# Or install only for backend
pnpm --filter backend install
```

## Compile and run the project

```bash
# From root
pnpm dev:backend          # development
pnpm build:backend        # build

# Or from backend directory
pnpm dev                  # development
pnpm build                # build
pnpm start:prod           # production mode
```

## Run tests

```bash
# From root
pnpm --filter backend test        # unit tests
pnpm --filter backend test:e2e    # e2e tests
pnpm --filter backend test:cov    # test coverage

# Or from backend directory
pnpm test
pnpm test:e2e
pnpm test:cov
```

## Security Considerations

### Rate Limiting in Clustered Environments

**IMPORTANT**: The current implementation uses in-memory rate limiting via `@nestjs/throttler`. This works correctly for **single-instance deployments** but has limitations in **multi-instance/clustered environments**.

#### Limitation

In a clustered environment (multiple Node.js processes or containers), each instance maintains its own rate limit counter in memory. This means:

- Rate limits are **per instance**, not global across all instances
- An attacker could potentially bypass rate limits by distributing requests across multiple instances
- Example: With a limit of 10 requests/minute and 3 instances, an attacker could make 30 requests/minute total

#### Solutions for Production Clusters

For production deployments with multiple instances, implement one of these solutions:

1. **Redis-based Rate Limiting** (Recommended)
   ```bash
   pnpm add @nestjs/throttler-storage-redis ioredis
   ```

   Update `app.module.ts`:
   ```typescript
   import { ThrottlerStorageRedisService } from '@nestjs/throttler-storage-redis';
   import Redis from 'ioredis';

   @Module({
     imports: [
       ThrottlerModule.forRoot({
         throttlers: [{ ttl: 60000, limit: 10 }],
         storage: new ThrottlerStorageRedisService(new Redis({
           host: 'localhost',
           port: 6379,
         })),
       }),
     ],
   })
   ```

2. **Nginx/HAProxy Rate Limiting**
   - Configure rate limiting at the reverse proxy level
   - Provides protection before requests reach your application
   - See: [Nginx rate limiting](https://www.nginx.com/blog/rate-limiting-nginx/)

3. **API Gateway**
   - Use cloud-based API gateways (AWS API Gateway, Azure APIM, etc.)
   - Provides centralized rate limiting across all instances

#### Current Configuration

The application currently uses in-memory storage and is suitable for:
- Development environments
- Single-instance production deployments
- Small-scale applications

For high-availability production deployments with load balancing, **you must implement Redis-based rate limiting or use a reverse proxy/API gateway**.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
pnpm add -g @nestjs/mau
mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
