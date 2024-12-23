# News Manager Project

This is my first project based on Angular, called **News Manager Project**. The goal of this project is to develop a newspaper web application with common functionalities needed to publish and manage a newspaper site.

## Features

The main features of this application include:
- Display articles on the main page
- Show detailed views for individual articles
- Filter articles based on categories
- Integrate and display the newspaper's Twitter timeline
- Create and update article contents
- Delete articles as needed
- Desktop application support using Electron

This project serves as a simplified version of well-known newspaper websites like [The New York Times](https://www.nytimes.com/) or [The Guardian](https://www.theguardian.com/).

## Demo

You can view the live demo of the project at [https://news.miever.net/](https://news.miever.net/).

## Project Setup

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.4.

### Development Server

To start the development server, run the following command:

```bash
ng serve
```

### Development with Electron

To develop the desktop application with Electron, use:

```bash
npm run electron:serve
```

This will:
1. Start the Angular development server.
2. Launch the Electron application pointing to the Angular development server.

#### Desktop Application

To build the desktop application for Windows, macOS, and Linux, use:

```bash
npm run dist
```

The output will be located in the `release/` directory.

---

## Features of the Desktop Application

1. **Native System Notifications**:
   - The desktop app uses Electron's `Notification` API to display native system notifications.

2. **Cross-Platform Support**:
   - Supports Windows, macOS, and Linux out of the box, packaged using `electron-builder`.

3. **State Persistence**:
   - Uses `electron-store` to save user preferences and session data locally.
