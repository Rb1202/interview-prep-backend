# Interview Prep AI Backend

Express and MongoDB API for the Interview Prep AI app.

## Features

- JWT authentication with HTTP-only cookie support
- Protected user profile, session, question and image upload routes
- Session ownership checks for private data
- Gemini-powered interview question and explanation generation
- Avatar upload validation with file type and size limits

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in the values.

3. Start the API:

```bash
npm run dev
```

## Environment Variables

- `PORT`: API port, defaults to `5000`
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret used to sign auth tokens
- `GEMINI_API_KEY`: Google Gemini API key
- `CLIENT_URL`: Allowed frontend origins, comma-separated for multiple URLs
- `NODE_ENV`: Set to `production` in deployment
