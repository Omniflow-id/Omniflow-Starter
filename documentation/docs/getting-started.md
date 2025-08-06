# Getting Started

This guide will help you set up and run Omniflow-Starter on your local development environment.

## Prerequisites

- Node.js 16+ 
- MySQL 5.7+ or 8.0+
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd omniflow-starter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.example .env
   ```

4. **Configure your .env file**
   ```env
   # Database (Required)
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=omniflow_starter
   
   # Session (Required)
   SESSION_KEY=your-very-long-random-secret-key
   
   # Application
   NODE_ENV=development
   PORT=1234
   ```

5. **Create database**
   ```sql
   CREATE DATABASE omniflow_starter;
   ```

6. **Run database migrations**
   ```bash
   npx knex migrate:latest
   ```

7. **Seed the database** (optional for development)
   ```bash
   npx knex seed:run
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:1234`

## Default Login Credentials

After running the seeder, you can login with these accounts:

- **Admin**: admin@omniflow.id / Admin12345.
- **Manager**: manager@omniflow.id / Manager12345.
- **User**: user@omniflow.id / User12345.

## Optional Features Setup

### Redis Caching
```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### RabbitMQ Job Queue
```env
RABBITMQ_ENABLED=true
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
```

### Email Notifications
```env
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
DEV_2FA_BYPASS=true
```

### S3 File Storage
```env
S3_ENABLED=true
S3_ENDPOINT_URL=https://s3.amazonaws.com
S3_ACCESS_KEY=your-access-key
S3_SECRET_KEY=your-secret-key
S3_BUCKET_NAME=your-bucket
```

## Development Workflow

1. **Code formatting**: `npm run format`
2. **Code linting**: `npm run lint`
3. **Database migrations**: `npx knex migrate:make migration_name`
4. **Database rollback**: `npx knex migrate:rollback`

## Common Issues

### Database Connection Error
- Check MySQL is running
- Verify database credentials in .env
- Ensure database exists

### Port Already in Use
- Change PORT in .env file
- Or kill the process using the port

### Session Issues
- Ensure SESSION_KEY is set in .env
- Clear browser cookies and restart server

## Next Steps

- Explore the [API Documentation](api.md)
- Learn about [Configuration](configuration.md)
- Check out [Architecture](architecture.md)