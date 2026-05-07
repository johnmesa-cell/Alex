# Express TypeScript OpenAI Project

This project is a Node.js application built with Express and TypeScript, designed to provide AI functionalities using the OpenAI API. The application follows the Controller-Service pattern, ensuring a clean separation of concerns.

## Project Structure

```
express-ts-openai
├── src
│   ├── config
│   │   └── index.ts          # Configuration settings and environment variable loading
│   ├── controllers
│   │   └── ai.controller.ts   # Controller for handling AI-related requests
│   ├── interfaces
│   │   └── index.ts          # Interfaces for request and response types
│   ├── routes
│   │   └── ai.routes.ts      # Routes for AI-related endpoints
│   ├── services
│   │   └── openai.service.ts  # Service for interacting with OpenAI API
│   └── app.ts                # Entry point of the application
├── .env                       # Environment variables
├── package.json               # NPM configuration file
├── tsconfig.json             # TypeScript configuration file
└── README.md                  # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd express-ts-openai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory and add your OpenAI API key and any other necessary configuration settings.

4. **Run the application:**
   ```bash
   npm run start
   ```

## Usage

- The application exposes AI-related endpoints that can be accessed via HTTP requests. The main functionality is provided through the `getMedicalGuidance` method in the `OpenAIService`, which interacts with the OpenAI GPT-4 model.

- Ensure to follow the ethical guidelines and clarity in responses as specified in the system prompt used in the service.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for more details.